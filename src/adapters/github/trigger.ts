/**
 * L0 TRIGGER. Turns a PR comment into the makings of an Intent.
 *
 * Knows nothing about chains, tokens or addresses — the recipient is an opaque
 * string for a resolver to interpret, and the amount stays as the human typed it
 * until something that knows the asset's decimals converts it (I1, I4).
 */
export interface SendCommand {
  /** Opaque payout identity, verbatim. Never validated as an address here. */
  recipient: string;
  /** Decimal amount as typed. Not yet atomic units. */
  amount: string;
  /** Asset symbol if the author named one, otherwise undefined. */
  asset: string | undefined;
}

const SEND_LINE = /^\s*\/send\b(.*)$/;
/** `10`, `2.5`, or `10usdc` with the symbol run onto the number. */
const AMOUNT_WITH_ASSET = /^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z][a-zA-Z0-9]{0,11})?$/;
const ASSET = /^[a-zA-Z][a-zA-Z0-9]{0,11}$/;

const USAGE = "usage: `/send <recipient> <amount> [asset]` — e.g. `/send 0xabc…def 10 USDC`";

/**
 * Finds a `/send` command anywhere in a comment body.
 *
 * Returns `undefined` when the comment simply isn't a command — that is the
 * common case and not an error. Throws only when a line *is* a `/send` but
 * cannot be read, because silently misreading an amount is far worse than
 * refusing it.
 */
export function parseSendCommand(body: string): SendCommand | undefined {
  for (const line of body.split(/\r?\n/)) {
    const match = SEND_LINE.exec(line);
    if (!match) continue;

    const tokens = (match[1] ?? "").trim().split(/\s+/).filter(Boolean);
    if (tokens.length < 2) {
      throw new Error(`\`/send\` needs a recipient and an amount. ${USAGE}`);
    }
    if (tokens.length > 3) {
      throw new Error(
        `\`/send\` got ${tokens.length} arguments and expected at most 3. ${USAGE}`,
      );
    }

    const [recipient, second, third] = tokens as [string, string, string?];

    const amountMatch = AMOUNT_WITH_ASSET.exec(second);
    if (!amountMatch) {
      throw new Error(`"${second}" is not a valid amount. ${USAGE}`);
    }
    const [, amount, attachedAsset] = amountMatch as unknown as [string, string, string?];

    if (attachedAsset && third) {
      throw new Error(
        `the asset was given twice, as "${attachedAsset}" and "${third}". ${USAGE}`,
      );
    }

    const asset = attachedAsset ?? third;
    if (asset !== undefined && !ASSET.test(asset)) {
      throw new Error(`"${asset}" is not a valid asset symbol. ${USAGE}`);
    }

    return { recipient, amount, asset };
  }

  return undefined;
}

/**
 * Author associations GitHub reports for people who can be trusted to spend the
 * project's money. Everything else — CONTRIBUTOR, FIRST_TIME_CONTRIBUTOR, NONE —
 * is denied by default, so a drive-by commenter cannot trigger a payout to
 * themselves.
 *
 * Which associations qualify is the adopter's call, so it is configurable. What
 * an association *means* stays here rather than in core policy: `author_association`
 * is a GitHub concept, and core is told only whether the actor may spend.
 */
export const DEFAULT_MAINTAINER_ASSOCIATIONS = ["OWNER", "MEMBER", "COLLABORATOR"] as const;

/** Every value GitHub documents for `author_association`. Used to catch typos. */
const KNOWN_ASSOCIATIONS = new Set([
  "OWNER",
  "MEMBER",
  "COLLABORATOR",
  "CONTRIBUTOR",
  "FIRST_TIME_CONTRIBUTOR",
  "FIRST_TIMER",
  "MANNEQUIN",
  "NONE",
]);

/**
 * Reads the configured allowlist, e.g. `OWNER,MEMBER`.
 *
 * An unrecognized entry **warns and is kept** rather than failing the run. A
 * typo can only ever narrow an allowlist — `OWNERS` matches nobody — so the
 * consequence is a denied payout, never an unintended one. Failing outright
 * would instead break every run the day GitHub adds an association value. This
 * follows the `.xops.yml` convention: unknown keys warn, never fail.
 *
 * An empty or blank list falls back to the default. Reading it as "allow
 * nobody" would be defensible, but a blank input is far more likely to be an
 * unset repository variable than a deliberate lockout, and silently disabling
 * `/send` is a bad way to find that out — the kill switch exists to say that
 * on purpose.
 */
export function parseAssociations(raw: string | undefined): string[] {
  const entries = (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);

  if (entries.length === 0) return [...DEFAULT_MAINTAINER_ASSOCIATIONS];

  for (const entry of entries) {
    if (!KNOWN_ASSOCIATIONS.has(entry)) {
      console.warn(
        `allowed_associations lists "${entry}", which is not a GitHub author_association. ` +
          `It will match nobody. Known values: ${[...KNOWN_ASSOCIATIONS].join(", ")}.`,
      );
    }
  }

  return entries;
}

/**
 * L1 POLICY input, evaluated offline. Returns a fact for `core/policy.ts` to
 * judge rather than throwing here, so one place decides what a denial means and
 * the result table can report this condition alongside the others.
 */
export function isMaintainer(
  association: string | undefined,
  allowed: readonly string[],
): boolean {
  const value = (association ?? "").trim().toUpperCase();
  return value.length > 0 && allowed.includes(value);
}
