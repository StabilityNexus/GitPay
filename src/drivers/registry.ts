import { XOpsError } from "../core/errors.js";
import type { SettlementLedger } from "../core/ledger.js";
import type { PaymentPayload, PaymentRequirements, SettlementResponse } from "../core/types.js";
import type {
  RequirementsContext,
  SettlementDriver,
  Tier,
  VerifyResult,
} from "./types.js";

function tierViolationMessage(id: string): string {
  return [
    `Driver ${id} takes custody of funds and cannot run in-process.`,
    "Custodial settlement must run as a separate service you operate:",
    "  settlement: { mode: facilitator, url: https://your-service }",
  ].join("\n");
}

/**
 * The only layer that knows rails exist is the driver behind this registry.
 * Everything above resolves `(network × scheme)` and gets an interface back.
 */
export class DriverRegistry {
  readonly tier: Tier;
  private readonly drivers: SettlementDriver[] = [];

  constructor(tier: Tier = 0) {
    this.tier = tier;
  }

  /** I3: a driver needing secrets or custody cannot register in Tier 0. */
  register(driver: SettlementDriver): void {
    const { needsSecret, custodial } = driver.capabilities;
    if (this.tier === 0 && (needsSecret || custodial)) {
      throw new XOpsError("TIER_VIOLATION", tierViolationMessage(driver.id), {
        driver: driver.id,
        needsSecret,
        custodial,
        tier: this.tier,
      });
    }
    if (this.drivers.some((d) => d.id === driver.id)) {
      throw new Error(`Driver ${driver.id} is already registered`);
    }
    this.drivers.push(driver);
  }

  list(): readonly SettlementDriver[] {
    return this.drivers;
  }

  resolve(network: string, scheme: string): SettlementDriver {
    const driver = this.drivers.find((d) => d.supports(network, scheme));
    if (!driver) {
      throw new XOpsError(
        "DRIVER_NOT_FOUND",
        `No driver registered for scheme "${scheme}" on network "${network}"`,
        { network, scheme, registered: this.drivers.map((d) => d.id) },
      );
    }
    return driver;
  }

  buildRequirements(ctx: RequirementsContext): PaymentRequirements {
    const driver = this.resolve(ctx.intent.network, ctx.intent.scheme);
    return driver.buildRequirements(ctx);
  }

  async verify(p: PaymentPayload, r: PaymentRequirements): Promise<VerifyResult> {
    return this.resolve(r.network, r.scheme).verify(p, r);
  }

  /**
   * I9: refuse before the driver is reached unless exactly-once is guaranteed by
   * something — the rail itself, or a ledger standing in for it.
   *
   * This is deliberately checked at EVERY tier. It used to apply only at tier 0,
   * which meant a driver with no replay protection became settleable simply by
   * constructing the registry at tier 1 — silently, with double payment as the
   * failure mode. A tier says who operates the process and what credentials it
   * holds; it says nothing about whether a retry pays twice.
   */
  async settle(
    p: PaymentPayload,
    r: PaymentRequirements,
    opts?: { idempotencyKey: string; ledger: SettlementLedger },
  ): Promise<SettlementResponse> {
    const driver = this.resolve(r.network, r.scheme);

    if (!driver.capabilities.nativeReplayProtection && !opts) {
      throw new XOpsError(
        "NO_REPLAY_PROTECTION",
        `Driver ${driver.id} declares no replay protection, so it cannot settle without a ledger`,
        { driver: driver.id, tier: this.tier },
      );
    }

    if (!opts) return driver.broadcast(await driver.prepare(p, r));

    const { idempotencyKey: key, ledger } = opts;

    const prior = await ledger.lookup(key);
    if (prior) {
      // I8: a repeat is a success that settles nothing, never a failure.
      //
      // This holds for `broadcasting` too. An attempt was recorded and signed,
      // so the transaction may well be on-chain — paying again to "make sure"
      // is the one unrecoverable mistake available here. Report the reference
      // and let a human confirm; `round` exists to deliberately re-pay.
      return {
        success: true,
        network: r.network,
        ...(prior.transaction === undefined ? {} : { transaction: prior.transaction }),
        errorReason: "AUTH_ALREADY_USED",
      };
    }

    // Sign first: this yields the transaction reference while nothing has moved.
    const prepared = await driver.prepare(p, r);

    // Write ahead. If this throws, the payout aborts having settled nothing —
    // the cheap failure. Broadcasting unrecorded is the expensive one.
    await ledger.record(key, { status: "broadcasting", transaction: prepared.reference });

    const response = await driver.broadcast(prepared);

    if (response.success) {
      // Best-effort. The record already carries the reference, so losing this
      // costs legibility, never safety — and it must not turn a settled payout
      // into a reported failure.
      try {
        await ledger.confirm(key, {
          status: "settled",
          transaction: response.transaction ?? prepared.reference,
          settledAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(
          `Settled ${prepared.reference} but could not confirm the ledger entry: ` +
            `${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return response;
  }
}
