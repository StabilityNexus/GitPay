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
