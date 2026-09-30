import { VALID_BEFORE_WINDOW_SECONDS } from "../../../src/core/defaults.js";
import type {
  PaymentPayload,
  PaymentRequirements,
  SettlementResponse,
} from "../../../src/core/types.js";
import type {
  Capabilities,
  PreparedSettlement,
  RequirementsContext,
  SettlementDriver,
  VerifyResult,
} from "../../../src/drivers/types.js";

export const MOCK_NETWORK = "mock:ledger";
export const MOCK_SCHEME = "exact";

interface MockAuthorization {
  from: string;
  to: string;
  value: string;
  nonce: string;
}

const BASE_CAPABILITIES: Capabilities = {
  offlineVerify: true,
  needsGas: false,
  needsSecret: false,
  custodial: false,
  nativeReplayProtection: true,
};

/**
 * An in-memory SettlementDriver. It proves the same three things a second chain
 * would — the registry resolves (network × scheme), the x402 types carry no EVM
 * assumptions, and the whole path runs against a driver that has never heard of
 * a hash function — and it costs no faucet and no RPC to keep running.
 */
export class MockDriver implements SettlementDriver {
  readonly id: string;
  readonly capabilities: Capabilities;

  private readonly balances = new Map<string, bigint>();
  private readonly usedNonces = new Map<string, string>();
  private txCounter = 0;

  /** Test-only witness for "the driver was never reached". */
  settleCalls = 0;

  constructor(overrides: Partial<Capabilities> = {}, id = "mock/test") {
    this.id = id;
    this.capabilities = { ...BASE_CAPABILITIES, ...overrides };
  }

  fund(address: string, amount: bigint): void {
    this.balances.set(address, (this.balances.get(address) ?? 0n) + amount);
  }

  balanceOf(address: string): bigint {
    return this.balances.get(address) ?? 0n;
  }

  supports(network: string, scheme: string): boolean {
    return network === MOCK_NETWORK && scheme === MOCK_SCHEME;
  }

  buildRequirements(ctx: RequirementsContext): PaymentRequirements {
    return {
      scheme: ctx.intent.scheme,
      network: ctx.intent.network,
      amount: ctx.intent.amount,
      asset: ctx.intent.asset,
      payTo: ctx.target.address,
      maxTimeoutSeconds: VALID_BEFORE_WINDOW_SECONDS,
      extra: { nonce: this.toNonce(ctx.idempotencyKey) },
    };
  }

  /** The rail's replay token, derived from the canonical key. Lives in the driver. */
  private toNonce(idempotencyKey: string): string {
    return `mock-nonce:${idempotencyKey}`;
  }

  /** Stands in for the human signing in their own wallet. */
  authorize(from: string, r: PaymentRequirements): PaymentPayload {
    return {
      x402Version: 2,
      scheme: r.scheme,
      network: r.network,
      payload: {
        signature: `mock-sig:${from}`,
        authorization: {
          from,
          to: r.payTo,
          value: r.amount,
          nonce: String(r.extra?.["nonce"]),
        },
      },
    };
  }

  verify(p: PaymentPayload, r: PaymentRequirements): Promise<VerifyResult> {
    if (p.scheme !== r.scheme || p.network !== r.network) {
      return fail("DOMAIN_MISMATCH");
    }
    const auth = readAuthorization(p);
    if (!auth || typeof p.payload["signature"] !== "string") {
      return fail("SIGNER_MISMATCH");
    }
    if (auth.to !== r.payTo) return fail("RECIPIENT_MISMATCH");
    if (auth.value !== r.amount) return fail("AMOUNT_MISMATCH");
    if (p.payload["signature"] !== `mock-sig:${auth.from}`) return fail("SIGNER_MISMATCH");
    return Promise.resolve({ isValid: true, payer: auth.from });
  }

  /**
   * Signing is pure here, as it is on a real rail: the reference is fixed before
   * anything is broadcast, which is what lets the ledger be written first.
   */
  prepare(p: PaymentPayload, r: PaymentRequirements): Promise<PreparedSettlement> {
    this.txCounter += 1;
    return Promise.resolve({
      reference: `mocktx-${this.txCounter}`,
      raw: { payload: p, requirements: r },
    });
  }

  broadcast(prepared: PreparedSettlement): Promise<SettlementResponse> {
    const { payload: p, requirements: r } = prepared.raw as {
      payload: PaymentPayload;
      requirements: PaymentRequirements;
    };
    return this.settle(p, r, prepared.reference);
  }

  /** The rail's own behaviour, kept whole so the replay semantics stay readable. */
  private settle(
    p: PaymentPayload,
    r: PaymentRequirements,
    reference: string,
  ): Promise<SettlementResponse> {
    this.settleCalls += 1;

    const auth = readAuthorization(p);
    if (!auth) {
      return Promise.resolve({ success: false, network: r.network, errorReason: "SIGNER_MISMATCH" });
    }

    // I8: the rail rejecting a consumed nonce means the payout already happened.
    const original = this.usedNonces.get(auth.nonce);
    if (original) {
      return Promise.resolve({
        success: true,
        transaction: original,
        network: r.network,
        payer: auth.from,
        errorReason: "AUTH_ALREADY_USED",
      });
    }

    const value = BigInt(r.amount);
    if (this.balanceOf(auth.from) < value) {
      return Promise.resolve({
        success: false,
        network: r.network,
        payer: auth.from,
        errorReason: "INSUFFICIENT_BALANCE",
      });
    }

    this.balances.set(auth.from, this.balanceOf(auth.from) - value);
    this.balances.set(auth.to, this.balanceOf(auth.to) + value);

    this.usedNonces.set(auth.nonce, reference);

    return Promise.resolve({
      success: true,
      transaction: reference,
      network: r.network,
      payer: auth.from,
    });
  }
}

function readAuthorization(p: PaymentPayload): MockAuthorization | undefined {
  const auth = p.payload["authorization"];
  if (!auth || typeof auth !== "object") return undefined;
  const { from, to, value, nonce } = auth as Record<string, unknown>;
  if (
    typeof from !== "string" ||
    typeof to !== "string" ||
    typeof value !== "string" ||
    typeof nonce !== "string"
  ) {
    return undefined;
  }
  return { from, to, value, nonce };
}

function fail(reason: VerifyResult["reason"]): Promise<VerifyResult> {
  return Promise.resolve({ isValid: false, reason });
}

export const custodialDriver = (): MockDriver =>
  new MockDriver({ custodial: true }, "mock/custodial");

export const secretDriver = (): MockDriver =>
  new MockDriver({ needsSecret: true }, "mock/needs-secret");

export const noReplayDriver = (): MockDriver =>
  new MockDriver({ nativeReplayProtection: false }, "mock/no-replay");
