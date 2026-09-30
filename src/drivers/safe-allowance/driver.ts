import type { ErrorCode } from "../../core/errors.js";
import type {
  PaymentPayload,
  PaymentRequirements,
  SettlementResponse,
} from "../../core/types.js";
import type {
  Capabilities,
  PreparedSettlement,
  RequirementsContext,
  SettlementDriver,
  VerifyResult,
} from "../types.js";
import { encodeExecuteAllowanceTransfer } from "./abi.js";
import { JsonRpc, fromHex, toHex } from "./rpc.js";
import { addressFromPrivateKey, signTransaction } from "./tx.js";

export interface SafeAllowanceConfig {
  /** CAIP-2, e.g. eip155:11155111. */
  network: string;
  chainId: bigint;
  rpcUrl: string;
  /** AllowanceModule deployment. */
  moduleAddress: string;
  /** The Safe holding the funds. */
  safeAddress: string;
  /** ERC-20 being paid out. */
  tokenAddress: string;
  /** Delegate key. This is why the driver declares needsSecret. */
  delegatePrivateKey: string;
  /** Fallback when estimation is unavailable. */
  gasLimit?: bigint;
}

const CAPABILITIES: Capabilities = {
  offlineVerify: true,
  needsGas: true,
  // CI holds the delegate key, so this cannot register in tier 0 (I3).
  needsSecret: true,
  // XOps never holds funds; the Safe pays the recipient directly (I2).
  custodial: false,
  /**
   * Honestly false. On the `msg.sender == delegate` path the module checks
   * caller identity only — the nonce is consumed as signed-hash input and never
   * compared against a stored value, so an identical second call transfers
   * again while the allowance has headroom. I9 therefore requires a ledger.
   */
  nativeReplayProtection: false,
};

export const SAFE_ALLOWANCE_SCHEME = "allowance";

interface PreparedRaw {
  raw: string;
  to: string;
  amount: string;
}

export class SafeAllowanceDriver implements SettlementDriver {
  readonly id = "safe-allowance/eip155";
  readonly capabilities = CAPABILITIES;

  private readonly rpc: JsonRpc;
  private readonly delegate: string;

  constructor(private readonly config: SafeAllowanceConfig) {
    this.rpc = new JsonRpc(config.rpcUrl);
    this.delegate = addressFromPrivateKey(config.delegatePrivateKey);
  }

  supports(network: string, scheme: string): boolean {
    return network === this.config.network && scheme === SAFE_ALLOWANCE_SCHEME;
  }

  buildRequirements(ctx: RequirementsContext): PaymentRequirements {
    return {
      scheme: SAFE_ALLOWANCE_SCHEME,
      network: ctx.intent.network,
      amount: ctx.intent.amount,
      asset: ctx.intent.asset,
      payTo: ctx.target.address,
      maxTimeoutSeconds: 300,
      extra: { safe: this.config.safeAddress, delegate: this.delegate },
    };
  }

  /**
   * There is no counterparty signature to check here — the delegate's authority
   * is the allowance itself, enforced on-chain. Verification is a shape check so
   * a malformed requirement fails before a transaction is built.
   */
  verify(_p: PaymentPayload, r: PaymentRequirements): Promise<VerifyResult> {
    if (r.scheme !== SAFE_ALLOWANCE_SCHEME || r.network !== this.config.network) {
      return Promise.resolve({ isValid: false, reason: "DOMAIN_MISMATCH" as ErrorCode });
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(r.payTo)) {
      return Promise.resolve({ isValid: false, reason: "RECIPIENT_MISMATCH" as ErrorCode });
    }
    if (!/^[0-9]+$/.test(r.amount) || BigInt(r.amount) === 0n) {
      return Promise.resolve({ isValid: false, reason: "AMOUNT_MISMATCH" as ErrorCode });
    }
    return Promise.resolve({ isValid: true, payer: this.config.safeAddress });
  }

  /**
   * Signs. Reads chain state — a nonce and a fee estimate — but writes nothing,
   * so no funds can move here. That is the property that lets the caller record
   * the resulting hash before anything becomes irreversible.
   */
  async prepare(_p: PaymentPayload, r: PaymentRequirements): Promise<PreparedSettlement> {
    const data = encodeExecuteAllowanceTransfer({
      safe: this.config.safeAddress,
      token: this.config.tokenAddress,
      to: r.payTo,
      amount: r.amount,
      delegate: this.delegate,
      // msg.sender is the delegate, so no signature is needed. This path has no
      // replay protection, which is why nativeReplayProtection is false.
      signature: "0x",
    });

    const [pendingHex, latestHex, feeHex, tipHex] = await Promise.all([
      this.rpc.hex("eth_getTransactionCount", [this.delegate, "pending"]),
      this.rpc.hex("eth_getTransactionCount", [this.delegate, "latest"]),
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
          `Delegate ${this.delegate} has ${pending - latest} transaction(s) in flight ` +
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
    const call = { from: this.delegate, to: this.config.moduleAddress, data };
    await this.rpc.call("eth_call", [call, "latest"]).catch((err: unknown) => {
      throw Object.assign(
        new Error(`simulation reverted: ${err instanceof Error ? err.message : String(err)}`),
        { code: "SIMULATION_REVERT" satisfies ErrorCode },
      );
    });

    // No guessed fallback. The simulation just passed, so a failed estimate is
    // an RPC problem, and a guessed limit that is too low reverts on-chain,
    // burns gas, and leaves a recorded attempt that needs a `round` bump.
    // Nothing is recorded yet, so aborting here costs nothing.
    const gasLimit =
      this.config.gasLimit ??
      (await this.rpc
        .hex("eth_estimateGas", [call])
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
        to: this.config.moduleAddress,
        value: 0n,
        data,
      },
      this.config.delegatePrivateKey,
    );

    const raw: PreparedRaw = { raw: signed.raw, to: r.payTo, amount: r.amount };
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
        return {
          success: false,
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
