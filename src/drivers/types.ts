import type {
  Intent,
  PaymentPayload,
  PaymentRequirements,
  PayoutTarget,
  SettlementResponse,
} from "../core/types.js";
import type { ErrorCode } from "../core/errors.js";

export interface Capabilities {
  offlineVerify: boolean;
  needsGas: boolean;
  needsSecret: boolean;
  custodial: boolean;
  /** The rail enforces exactly-once, or the driver does. Tier 0 refuses to settle without it. */
  nativeReplayProtection: boolean;
}

export interface VerifyResult {
  isValid: boolean;
  payer?: string;
  reason?: ErrorCode;
}

/**
 * `target` and `idempotencyKey` are passed in rather than derived from the intent:
 * core resolves the identity and emits the canonical key, and the driver turns
 * both into rail-specific values. Core never learns what the address means.
 */
export interface RequirementsContext {
  intent: Intent;
  target: PayoutTarget;
  idempotencyKey: string;
}

/**
 * A settlement that is signed but not yet broadcast.
 *
 * The split exists so the ledger can be written first. `reference` is the rail's
 * identifier for the transaction — on EVM the hash, which is fixed at signing
 * time and knowable before the network is touched. Recording it before broadcast
 * is what removes the window where funds move with nothing to show for it.
 */
export interface PreparedSettlement {
  reference: string;
  /** Opaque to everything above the driver. */
  raw: unknown;
}

export interface SettlementDriver {
  readonly id: string;
  readonly capabilities: Capabilities;
  supports(network: string, scheme: string): boolean;
  buildRequirements(ctx: RequirementsContext): PaymentRequirements;
  verify(p: PaymentPayload, r: PaymentRequirements): Promise<VerifyResult>;
  /** Signs. Must not touch the rail — nothing here may move funds. */
  prepare(p: PaymentPayload, r: PaymentRequirements): Promise<PreparedSettlement>;
  /** Broadcasts what `prepare` produced. This is the irreversible step. */
  broadcast(prepared: PreparedSettlement): Promise<SettlementResponse>;
}

/**
 * 0 — runs in the adopter's CI, holds nothing.
 * 1 — adopter-operated process with its own credentials.
 * 2 — a separate legal entity that may take custody.
 */
export type Tier = 0 | 1 | 2;
