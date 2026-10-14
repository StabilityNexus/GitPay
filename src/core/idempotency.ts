import type { IdempotencyKey, Intent } from "./types.js";

/**
 * Returns a canonical string. No hashing, no rail primitives — a driver derives
 * its rail's replay token from this string.
 *
 * `amount` is excluded on purpose: with amount in the key, `/send alice 50`
 * corrected to `/send alice 500` yields two keys and Alice receives 550.
 * Excluded, the correction collides and requires an explicit `round` bump.
 *
 * The string must be injective, so a field may not contain the delimiter that
 * ends it. Otherwise `ref = "R|A|N"` beside `asset = "X"` spells the same key
 * as `ref = "R"` beside `asset = "B|N|X"`, and one payout's receipt would
 * silently block another. Whitespace is refused too: the receipt marker is
 * whitespace-separated, so a key containing a space could never find its own
 * receipt, and the payout could be made twice.
 */
export function canonical(k: IdempotencyKey): string {
  const repo = field("repo", k.source.repo, /[|#\s]/);
  const ref = field("ref", k.source.ref);
  const recipient = field("recipient", k.recipient).toLowerCase();
  const network = field("network", k.network);
  const asset = field("asset", k.asset);
  // `xops:` predates the rename to GitPay and stays. Receipts already on PRs
  // carry keys with this prefix, and a new prefix would never match them.
  return (
    `xops:v${k.v}|${k.source.platform}:${repo}#${ref}` +
    `|${recipient}|${network}|${asset}|${k.round}`
  );
}

function field(name: string, value: string, forbidden = /[|\s]/): string {
  if (forbidden.test(value)) {
    throw new Error(
      `Idempotency key field ${name} contains a delimiter or whitespace, got "${value}"`,
    );
  }
  return value;
}

/**
 * Whether a recorded key names the same payout as `key`, for ledger lookups.
 *
 * Exact equality, except that the asset field compares case-insensitively.
 * Before a `/send` asset was resolved to the workflow's spelling, it was keyed
 * as typed, so one payout may be on record as `USDC`, `usdc` or `Usdc`. A
 * lookup that missed those would pay again. Folding case can only merge keys
 * that differ in asset case alone, which are one token by then — a coarser
 * match fails toward under-paying, a finer one toward paying twice.
 *
 * For matching only. New keys are still written by `canonical()`, unchanged.
 */
export function sameKey(recorded: string, key: string): boolean {
  if (recorded === key) return true;
  const a = recorded.split("|");
  const b = key.split("|");
  // v1 has exactly six fields, and `canonical` refuses `|` inside any of them,
  // so the asset is always the fifth.
  if (a.length !== 6 || b.length !== 6) return false;
  return a.every((field, i) =>
    i === 4 ? field.toLowerCase() === b[i]!.toLowerCase() : field === b[i],
  );
}

export function keyFor(intent: Intent): IdempotencyKey {
  const { source } = intent;
  return {
    v: 1,
    source: {
      platform: source.platform,
      repo: source.platform === "github" ? source.repo : source.project,
      ref: source.ref,
    },
    recipient: intent.recipient,
    asset: intent.asset,
    network: intent.network,
    round: intent.round,
  };
}
