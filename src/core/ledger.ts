/**
 * Exactly-once has to come from somewhere.
 *
 * Some rails give it natively: EIP-3009 consumes a nonce, so a replayed
 * authorization reverts and a retry is a no-op. Safe's AllowanceModule does not
 * — on the `msg.sender == delegate` path it checks caller identity only and
 * never compares the nonce against a stored value, so an identical second call
 * transfers again while the allowance has headroom.
 *
 * For a rail like that, a ledger supplies what the chain will not: a durable
 * record, keyed by the canonical idempotency key, that a later run can find.
 *
 * Core defines only the shape. It never learns where the record is kept.
 */

/**
 * `broadcasting` — signed and recorded, but the outcome is unknown. Written
 * BEFORE the rail is touched, so it survives a crash mid-broadcast.
 * `settled` — confirmed on the rail.
 */
export type LedgerStatus = "broadcasting" | "settled";

export interface LedgerEntry {
  status: LedgerStatus;
  /**
   * Rail transaction identifier. Known at signing time, before broadcast —
   * that is what makes writing ahead possible.
   */
  transaction?: string | undefined;
  /** When the entry was written, ISO 8601. */
  settledAt?: string | undefined;
}

/**
 * Descriptive context for a receipt. Presentation only — nothing here is used
 * to decide whether a payout already happened, so it can change freely without
 * touching idempotency.
 *
 * The explorer base is passed in rather than derived from the network: core and
 * adapters must not hold chain-specific constants (I1), so it is configuration.
 */
export interface PayoutContext {
  /** As the maintainer typed it, e.g. "0.01". */
  amount?: string | undefined;
  asset?: string | undefined;
  /** Recipient address. */
  to?: string | undefined;
  /** The account the funds left — the Safe, not the delegate. */
  from?: string | undefined;
  /** Who authorized it. */
  actor?: string | undefined;
  network?: string | undefined;
  /** Block explorer base, supplied as configuration. Core holds no such value itself. */
  explorerUrl?: string | undefined;
}

export interface SettlementLedger {
  readonly id: string;
  /** A prior attempt for this key, or undefined if there is none. */
  lookup(key: string): Promise<LedgerEntry | undefined>;
  /**
   * Writes the intent to settle, BEFORE broadcasting. A failure here must
   * abort the payout: nothing has moved yet, so aborting is free, whereas
   * broadcasting unrecorded risks paying twice on the next run.
   */
  record(key: string, entry: LedgerEntry): Promise<void>;
  /**
   * Upgrades a recorded attempt to `settled`. Best-effort by design — the
   * record already carries the transaction, so losing this only costs
   * legibility, never safety.
   */
  confirm(key: string, entry: LedgerEntry): Promise<void>;
}

/**
 * A ledger for one payout that also finds entries recorded under older
 * spellings of its key. It writes under the canonical key only, so the aliases
 * are only a migration step. A payout recorded under a spelling the lookup
 * cannot see would be paid again, because nothing on this rail refuses a second
 * transfer.
 */
export function withAliases(ledger: SettlementLedger, aliases: readonly string[]): SettlementLedger {
  return {
    id: ledger.id,
    async lookup(key) {
      for (const candidate of [key, ...aliases.filter((alias) => alias !== key)]) {
        const entry = await ledger.lookup(candidate);
        if (entry) return entry;
      }
      return undefined;
    },
    record: (key, entry) => ledger.record(key, entry),
    confirm: (key, entry) => ledger.confirm(key, entry),
  };
}

/**
 * A ledger lookup narrows a race, it does not close one. Two runs can both look
 * up, both miss, and both settle. Anything driving a non-idempotent rail needs
 * mutual exclusion around the whole check-settle-record sequence — for GitHub
 * Actions that is a `concurrency:` group keyed on the payout.
 */
export const LEDGER_RACE_WARNING =
  "A ledger lookup is check-then-act. Serialize payouts with a concurrency group.";
