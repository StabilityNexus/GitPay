import type { ErrorCode } from "../../core/errors.js";
import type { SettlementResponse } from "../../core/types.js";
import type { PreparedSettlement } from "../types.js";
import { JsonRpc, fromHex, toHex } from "./rpc.js";
import { addressFromPrivateKey, signTransaction } from "./tx.js";

export interface EvmSenderConfig {
  /** CAIP-2, e.g. eip155:11155111. */
  network: string;
  chainId: bigint;
  rpcUrl: string;
  /** The key CI holds. Whatever it is allowed to spend is the blast radius. */
  privateKey: string;
  /** Fallback when estimation is unavailable. */
  gasLimit?: bigint;
}

export interface EvmCall {
  /** Contract being called. */
  to: string;
  /** Hex calldata. */
  data: string;
}

interface PreparedRaw {
  raw: string;
}

/**
 * Signs and broadcasts one contract call from the key CI holds. Every EVM
 * driver settles this way; what differs between them is only which contract
 * is called and with what calldata, so that is all a driver supplies.
 */
export class EvmSender {
  readonly address: string;
  private readonly rpc: JsonRpc;

  constructor(private readonly config: EvmSenderConfig) {
    this.rpc = new JsonRpc(config.rpcUrl);
    this.address = addressFromPrivateKey(config.privateKey);
  }

  /**
   * Signs. Reads chain state — a nonce and a fee estimate — but writes nothing,
   * so no funds can move here. That is the property that lets the caller record
   * the resulting hash before anything becomes irreversible.
   *
   * `checkResult` sees the simulated return data and throws to refuse. It
   * exists for calls that can fail without reverting.
   */
  async prepare(
    call: EvmCall,
    checkResult?: (returned: string) => void,
  ): Promise<PreparedSettlement> {
    const [pendingHex, latestHex, feeHex, tipHex] = await Promise.all([
      this.rpc.hex("eth_getTransactionCount", [this.address, "pending"]),
      this.rpc.hex("eth_getTransactionCount", [this.address, "latest"]),
      this.rpc.hex("eth_gasPrice", []),
      this.rpc.hex("eth_maxPriorityFeePerGas", []).catch(() => toHex(1_500_000_000n)),
    ]);

    const pending = fromHex(pendingHex);
    const latest = fromHex(latestHex);

    /**
     * A transaction already in flight owns nonce `latest`. Signing `pending`
     * would queue behind it, and if the in-flight one never lands, every payout
     * after it is stuck too — silently, since each looks fine on its own.
     *
     * Refuse instead. This does not unstick anything, but it stops the queue
     * growing and names the nonce a human has to clear. Automatic replacement is
     * deliberately not attempted: the in-flight transaction may be a different
     * payout that is about to land, and replacing it would mean one contributor
     * silently never gets paid.
     */
    if (pending > latest) {
      throw Object.assign(
        new Error(
          `Delegate ${this.address} has ${pending - latest} transaction(s) in flight ` +
            `(nonce ${latest} is unconfirmed). Refusing to queue another payout behind it. ` +
            "Wait for it to confirm, or replace it from the delegate wallet using nonce " +
            `${latest} with a higher fee.`,
        ),
        { code: "RPC_UNAVAILABLE" satisfies ErrorCode },
      );
    }

    const gasPrice = fromHex(feeHex);
    const tip = fromHex(tipHex);

    // Simulate first. A revert caught here costs no gas and, crucially, happens
    // before anything is recorded or broadcast.
    const request = { from: this.address, to: call.to, data: call.data };
    const returned = await this.rpc
      .call<string>("eth_call", [request, "latest"])
      .catch((err: unknown) => {
        throw Object.assign(
          new Error(`simulation reverted: ${err instanceof Error ? err.message : String(err)}`),
          { code: "SIMULATION_REVERT" satisfies ErrorCode },
        );
      });
    checkResult?.(returned);

    // Empty return data is legitimate from a contract — the AllowanceModule and
    // no-return ERC-20s both give it — but it is also what any call to an
    // address with no code returns. A mistyped token or module address would
    // then mine as a successful no-op and be recorded as a settled payout.
    if (returned === "0x") {
      const code = await this.rpc.hex("eth_getCode", [call.to, "latest"]).catch((err: unknown) => {
        throw Object.assign(
          new Error(`code lookup failed: ${err instanceof Error ? err.message : String(err)}`),
          { code: "RPC_UNAVAILABLE" satisfies ErrorCode },
        );
      });
      if (code === "0x") {
        throw Object.assign(
          new Error(`no contract code at ${call.to} — check the address and the network`),
          { code: "SIMULATION_REVERT" satisfies ErrorCode },
        );
      }
    }

    // No guessed fallback. The simulation just passed, so a failed estimate is
    // an RPC problem, and a guessed limit that is too low reverts on-chain,
    // burns gas, and leaves a recorded attempt that needs a `round` bump.
    // Nothing is recorded yet, so aborting here costs nothing.
    const gasLimit =
      this.config.gasLimit ??
      (await this.rpc
        .hex("eth_estimateGas", [request])
        .then((hex) => (fromHex(hex) * 12n) / 10n)
        .catch((err: unknown) => {
          throw Object.assign(
            new Error(
              `gas estimation failed: ${err instanceof Error ? err.message : String(err)}`,
            ),
            { code: "RPC_UNAVAILABLE" satisfies ErrorCode },
          );
        }));

    const signed = signTransaction(
      {
        chainId: this.config.chainId,
        nonce: pending,
        maxPriorityFeePerGas: tip,
        maxFeePerGas: gasPrice * 2n + tip,
        gasLimit,
        to: call.to,
        value: 0n,
        data: call.data,
      },
      this.config.privateKey,
    );

    const raw: PreparedRaw = { raw: signed.raw };
    return { reference: signed.hash, raw };
  }

  /** The irreversible step. Everything before this can be abandoned safely. */
  async broadcast(prepared: PreparedSettlement): Promise<SettlementResponse> {
    const { raw } = prepared.raw as PreparedRaw;
    let nonceTooLow = false;

    try {
      await this.rpc.hex("eth_sendRawTransaction", [raw]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Already known to the network is not a failure — it is this exact
      // transaction, which is precisely what we wanted broadcast. A nonce that
      // is too low may also be this transaction, already mined, so it is
      // polled by its exact hash like the others.
      nonceTooLow = /nonce too low/i.test(message);
      if (!nonceTooLow && !/already known|known transaction/i.test(message)) {
        // The hash is returned even though the node refused it: the ledger
        // already records it, and it is what a human looks up to decide
        // whether to re-pay.
        return {
          success: false,
          transaction: prepared.reference,
          network: this.config.network,
          errorReason: classify(message),
        };
      }
    }

    // With no receipt for this hash, a nonce that was too low means a different
    // transaction used it, so this one can never land. That is a definite
    // answer, unlike an ordinary timeout.
    return this.awaitReceipt(prepared.reference, nonceTooLow ? "NONCE_CONFLICT" : "RPC_UNAVAILABLE");
  }

  private async awaitReceipt(hash: string, unconfirmed: ErrorCode): Promise<SettlementResponse> {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      // One failed poll is not an outcome. The transaction may already be out,
      // so keep polling rather than drop the hash on a transient error.
      const receipt = await this.rpc
        .call<{ status?: string } | null>("eth_getTransactionReceipt", [hash])
        .catch(() => null);

      if (receipt) {
        return receipt.status === "0x1"
          ? { success: true, transaction: hash, network: this.config.network }
          : {
              success: false,
              transaction: hash,
              network: this.config.network,
              errorReason: "SIMULATION_REVERT",
            };
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Broadcast but unconfirmed. Reported as a failure so nothing claims the
    // payout landed — but the hash is returned, and the caller's ledger entry
    // already holds it, so no retry can quietly pay twice.
    return {
      success: false,
      transaction: hash,
      network: this.config.network,
      errorReason: unconfirmed,
    };
  }
}

function classify(message: string): ErrorCode {
  if (/insufficient funds/i.test(message)) return "INSUFFICIENT_GAS";
  if (/revert/i.test(message)) return "SIMULATION_REVERT";
  return "RPC_UNAVAILABLE";
}
