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
import { encodeExecuteAllowanceTransfer } from "./abi.js";

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
  // GitPay never holds funds; the Safe pays the recipient directly (I2).
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

export class SafeAllowanceDriver implements SettlementDriver {
  readonly id = "safe-allowance/eip155";
  readonly capabilities = CAPABILITIES;

  private readonly sender: EvmSender;

  constructor(private readonly config: SafeAllowanceConfig) {
    this.sender = new EvmSender({
      network: config.network,
      chainId: config.chainId,
      rpcUrl: config.rpcUrl,
      privateKey: config.delegatePrivateKey,
      gasLimit: config.gasLimit,
    });
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
      extra: { safe: this.config.safeAddress, delegate: this.sender.address },
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

  /** Signs. Reads chain state but writes nothing, so no funds can move here. */
  prepare(_p: PaymentPayload, r: PaymentRequirements): Promise<PreparedSettlement> {
    const data = encodeExecuteAllowanceTransfer({
      safe: this.config.safeAddress,
      token: this.config.tokenAddress,
      to: r.payTo,
      amount: r.amount,
      delegate: this.sender.address,
      // msg.sender is the delegate, so no signature is needed. This path has no
      // replay protection, which is why nativeReplayProtection is false.
      signature: "0x",
    });
    return this.sender.prepare({ to: this.config.moduleAddress, data });
  }

  /** The irreversible step. Everything before this can be abandoned safely. */
  broadcast(prepared: PreparedSettlement): Promise<SettlementResponse> {
    return this.sender.broadcast(prepared);
  }
}
