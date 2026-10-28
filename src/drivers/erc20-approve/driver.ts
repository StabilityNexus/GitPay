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
import { EvmSender } from "../evm/sender.js";
import { encodeTransferFrom } from "./abi.js";

export interface Erc20ApproveConfig {
  /** CAIP-2, e.g. eip155:11155111. */
  network: string;
  chainId: bigint;
  rpcUrl: string;
  /** The ordinary wallet holding the funds — MetaMask, Rabby, a hardware wallet. */
  payerAddress: string;
  /** ERC-20 being paid out. The payer approved the delegate on this contract. */
  tokenAddress: string;
  /** Key of the address the payer approved. This is why the driver declares needsSecret. */
  delegatePrivateKey: string;
  /** Fallback when estimation is unavailable. */
  gasLimit?: bigint;
}

const CAPABILITIES: Capabilities = {
  offlineVerify: true,
  needsGas: true,
  // CI holds the delegate key, so this cannot register in tier 0 (I3).
  needsSecret: true,
  // GitPay never holds funds; the token moves from the payer's wallet straight
  // to the recipient in one call (I2).
  custodial: false,
  /**
   * False. `transferFrom` has no nonce at all: an identical second call moves
   * the tokens again while the approval has headroom. I9 therefore requires a
   * ledger.
   */
  nativeReplayProtection: false,
};

export const ERC20_APPROVE_SCHEME = "approve";

/**
 * Pays from an ordinary wallet that has called `approve(delegate, N)` on the
 * token. No Safe, no module, no contract of ours: the token's own allowance is
 * the authorization, and the chain enforces it.
 *
 * The bound differs from the Safe's in one way that matters. An ERC-20
 * allowance does not reset, so a leaked delegate key can spend what is left of
 * it exactly once — and the maintainer has to top it up when it runs out.
 */
export class Erc20ApproveDriver implements SettlementDriver {
  readonly id = "erc20-approve/eip155";
  readonly capabilities = CAPABILITIES;

  private readonly sender: EvmSender;

  constructor(private readonly config: Erc20ApproveConfig) {
    this.sender = new EvmSender({
      network: config.network,
      chainId: config.chainId,
      rpcUrl: config.rpcUrl,
      privateKey: config.delegatePrivateKey,
      gasLimit: config.gasLimit,
    });

    // The whole point of the approval is that CI holds a key that can spend
    // only what was approved. A delegate that IS the payer is the payout
    // wallet's own key in CI, with nothing on-chain bounding it.
    if (this.sender.address.toLowerCase() === config.payerAddress.toLowerCase()) {
      throw new Error(
        `The delegate key controls the payer ${config.payerAddress} itself. ` +
          "Create a separate delegate address, approve it from the payer wallet, " +
          "and put the delegate's key in CI instead.",
      );
    }
  }

  supports(network: string, scheme: string): boolean {
    return network === this.config.network && scheme === ERC20_APPROVE_SCHEME;
  }

  buildRequirements(ctx: RequirementsContext): PaymentRequirements {
    return {
      scheme: ERC20_APPROVE_SCHEME,
      network: ctx.intent.network,
      amount: ctx.intent.amount,
      asset: ctx.intent.asset,
      payTo: ctx.target.address,
      maxTimeoutSeconds: 300,
      extra: { payer: this.config.payerAddress, delegate: this.sender.address },
    };
  }

  /**
   * There is no counterparty signature to check here — the delegate's authority
   * is the token allowance itself, enforced on-chain. Verification is a shape
   * check so a malformed requirement fails before a transaction is built.
   */
  verify(_p: PaymentPayload, r: PaymentRequirements): Promise<VerifyResult> {
    if (r.scheme !== ERC20_APPROVE_SCHEME || r.network !== this.config.network) {
      return Promise.resolve({ isValid: false, reason: "DOMAIN_MISMATCH" as ErrorCode });
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(r.payTo)) {
      return Promise.resolve({ isValid: false, reason: "RECIPIENT_MISMATCH" as ErrorCode });
    }
    if (!/^[0-9]+$/.test(r.amount) || BigInt(r.amount) === 0n) {
      return Promise.resolve({ isValid: false, reason: "AMOUNT_MISMATCH" as ErrorCode });
    }
    return Promise.resolve({ isValid: true, payer: this.config.payerAddress });
  }

  /**
   * Signs. Reads chain state but writes nothing, so no funds can move here. The
   * simulation catches a spent allowance and an empty wallet for zero gas.
   */
  prepare(_p: PaymentPayload, r: PaymentRequirements): Promise<PreparedSettlement> {
    const data = encodeTransferFrom({ from: this.config.payerAddress, to: r.payTo, amount: r.amount });
    return this.sender.prepare({ to: this.config.tokenAddress, data }, refuseFalse);
  }

  /** The irreversible step. Everything before this can be abandoned safely. */
  broadcast(prepared: PreparedSettlement): Promise<SettlementResponse> {
    return this.sender.broadcast(prepared);
  }
}

/**
 * Some ERC-20s report failure by returning `false` instead of reverting. That
 * transaction would be mined with status 1 and read as a settled payout that
 * moved nothing. Tokens that return no data at all are accepted, as every
 * ERC-20 library accepts them.
 */
function refuseFalse(returned: string): void {
  if (/^0x0{64}$/.test(returned)) {
    throw Object.assign(new Error("simulation returned false: the token refused the transfer"), {
      code: "SIMULATION_REVERT" satisfies ErrorCode,
    });
  }
}
