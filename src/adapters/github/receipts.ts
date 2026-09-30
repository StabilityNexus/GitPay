import type { LedgerEntry, PayoutContext, SettlementLedger } from "../../core/ledger.js";

/**
 * The PR conversation is the ledger.
 *
 * GitPay is an artifact, not a service — there is no server to keep state in, so
 * the durable record of "this payout already happened" lives where the payout
 * was requested: as a receipt comment on the pull request. A later run finds it
 * by the canonical idempotency key and settles nothing.
 *
 * The key is carried in an HTML comment so it is exact and machine-readable,
 * while the visible body stays legible to whoever reads the thread.
 */

// Keeps the pre-rename spelling on purpose. It is how existing receipts are
// found, so renaming it would hide every past payout and allow it to be paid
// again.
const MARKER = "xops-receipt";
const MARKER_PATTERN = new RegExp(`<!--\\s*${MARKER}:v1\\s+([^>]*?)\\s*-->`);

export interface Receipt extends LedgerEntry {
  key: string;
}

/** Shortens an address for display without losing either end. */
function shorten(value: string): string {
  return value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

function link(base: string | undefined, kind: "tx" | "address", value: string): string {
  const label = `\`${shorten(value)}\``;
  if (!base) return label;
  return `[${label}](${base.replace(/\/+$/, "")}/${kind}/${value})`;
}

const SHARE = "https://github.com/StabilityNexus/GitPay";
const FOOTER =
  `<sub>Paid automatically by [GitPay](${SHARE}) — open source, runs in your own CI, ` +
  `never custodies your funds. ` +
  `[Share on X](https://x.com/intent/post?text=${encodeURIComponent(
    "Paying open-source contributors straight from a merged PR with GitPay",
  )}&url=${SHARE}) · ` +
  `[Mastodon](https://mastodon.social/share?text=${encodeURIComponent(`GitPay — ${SHARE}`)}) · ` +
  `[Reddit](https://reddit.com/submit?url=${SHARE}) · ` +
  `[LinkedIn](https://www.linkedin.com/sharing/share-offsite/?url=${SHARE})</sub>`;

/**
 * The visible body is presentation and may be rewritten freely. Everything
 * `findReceipt` relies on lives in the HTML marker, so a reformat can never
 * break idempotency — which is why the transaction is no longer parsed out of
 * the prose.
 */
export function formatReceipt(receipt: Receipt, context: PayoutContext = {}): string {
  const broadcasting = receipt.status === "broadcasting";
  const explorer = context.explorerUrl;

  const marker = [
    `<!-- ${MARKER}:v1`,
    `key=${receipt.key}`,
    `status=${receipt.status}`,
    ...(receipt.transaction ? [`tx=${receipt.transaction}`] : []),
    "-->",
  ].join(" ");

  const headline =
    context.amount && context.asset && context.to
      ? `**${context.amount} ${context.asset}** → ${link(explorer, "address", context.to)}`
      : undefined;

  const rows: [string, string][] = [];
  if (context.from) rows.push(["From", `Safe ${link(explorer, "address", context.from)}`]);
  if (context.actor) rows.push(["Authorized by", `@${context.actor}`]);
  if (context.network) rows.push(["Network", `\`${context.network}\``]);
  if (receipt.transaction) {
    rows.push(["Transaction", link(explorer, "tx", receipt.transaction)]);
  }
  if (receipt.settledAt) rows.push(["Settled", receipt.settledAt.replace("T", " ").slice(0, 19) + " UTC"]);

  const lines = [
    marker,
    `### GitPay — payout ${broadcasting ? "broadcasting" : "settled"}`,
    "",
    ...(headline ? [headline, ""] : []),
    ...(rows.length ? ["| | |", "|---|---|", ...rows.map(([k, v]) => `| ${k} | ${v} |`), ""] : []),
    broadcasting
      ? "Written **before** broadcasting, so this transaction may not have landed yet. " +
        "If it never does, re-run with `round` bumped to pay again deliberately — GitPay " +
        "will not decide that for you, because paying twice cannot be undone."
      : "Re-running this payout settles nothing — this receipt is its idempotency record.",
    "",
    FOOTER,
  ];

  return lines.join("\n");
}

/** Fields from the receipt marker. Empty when the body is not a receipt. */
function parseMarker(body: string): Record<string, string> {
  const inner = MARKER_PATTERN.exec(body)?.[1];
  if (!inner) return {};
  const fields: Record<string, string> = {};
  for (const pair of inner.trim().split(/\s+/)) {
    const eq = pair.indexOf("=");
    if (eq > 0) fields[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return fields;
}

/** The key a receipt comment carries, or undefined if the body is not a receipt. */
export function parseReceiptKey(body: string): string | undefined {
  return parseMarker(body)["key"];
}

export interface CommentLike {
  body?: string | null | undefined;
  user?: { login?: string | null | undefined; type?: string | null | undefined } | null | undefined;
  author_association?: string | null | undefined;
}

/**
 * Only receipts written by the automation or by someone who can already spend
 * the project's money are believed.
 *
 * A forged receipt withholds a payment rather than causing one, so this is
 * griefing protection rather than theft protection — but a contributor should
 * not be able to block someone else's payout with a comment.
 */
const TRUSTED_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export function isTrustedReceiptAuthor(comment: CommentLike): boolean {
  if ((comment.user?.type ?? "") === "Bot") return true;
  return TRUSTED_ASSOCIATIONS.has((comment.author_association ?? "").toUpperCase());
}

/** Finds a trusted receipt for `key` among comments. Pure, so it is testable. */
/** Fallback for receipts written before the marker carried the transaction. */
const LEGACY_TRANSACTION = /^- Transaction: `([^`]+)`/m;

/**
 * A settled payout leaves two comments — the pre-broadcast record and the
 * confirmation. Both carry the same key, so the whole thread is scanned and the
 * strongest status wins. Returning the first match would report a completed
 * payout as still broadcasting, which is safe but wrong, and would send someone
 * to a block explorer for no reason.
 */
export function findReceipt(comments: readonly CommentLike[], key: string): Receipt | undefined {
  let found: Receipt | undefined;

  for (const comment of comments) {
    const body = comment.body ?? "";
    const marker = parseMarker(body);
    if (marker["key"] !== key) continue;
    if (!isTrustedReceiptAuthor(comment)) continue;

    const transaction = marker["tx"] ?? LEGACY_TRANSACTION.exec(body)?.[1];
    // The prose is read only for legacy receipts whose marker carries no
    // status. An explicit status always wins, since the prose can say anything.
    const status = marker["status"] ?? (body.includes("payout settled") ? "settled" : undefined);
    const receipt: Receipt = {
      key,
      // An unconfirmed record still blocks a re-pay. Reading it as anything
      // weaker would reintroduce the double-payment window it exists to close.
      // Anything that is not explicitly settled is treated as in-flight.
      status: status === "settled" ? "settled" : "broadcasting",
      ...(transaction === undefined ? {} : { transaction }),
    };

    if (receipt.status === "settled") return receipt;
    found ??= receipt;
  }

  return found;
}

export interface PullRequestRef {
  /** `owner/repo`. */
  repo: string;
  /** Issue or PR number. */
  number: number;
  token: string;
  apiBase?: string;
  /** Presentation only — never consulted when deciding if a payout happened. */
  context?: PayoutContext;
}

async function githubJson(url: string, token: string): Promise<CommentLike[]> {
  const response = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
      "user-agent": "gitpay",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${url}`);
  }
  return (await response.json()) as CommentLike[];
}

/**
 * A ledger backed by the PR's comments.
 *
 * `lookup` pages through every comment: a receipt buried under later discussion
 * still has to be found, because missing it means paying twice.
 */
export class PullRequestReceiptLedger implements SettlementLedger {
  readonly id = "github-pr-receipt";
  private readonly ref: PullRequestRef;

  constructor(ref: PullRequestRef) {
    this.ref = ref;
  }

  private base(): string {
    const api = this.ref.apiBase ?? "https://api.github.com";
    return `${api}/repos/${this.ref.repo}/issues/${this.ref.number}/comments`;
  }

  async lookup(key: string): Promise<LedgerEntry | undefined> {
    for (let page = 1; page <= 20; page += 1) {
      const batch = await githubJson(`${this.base()}?per_page=100&page=${page}`, this.ref.token);
      const found = findReceipt(batch, key);
      if (found) return found;
      if (batch.length < 100) return undefined;
    }
    // Bailing out silently would mean paying twice on a very long thread.
    throw new Error(
      `Could not scan all comments on ${this.ref.repo}#${this.ref.number} for a receipt; refusing to settle`,
    );
  }

  private async post(key: string, entry: LedgerEntry): Promise<Response> {
    return fetch(this.base(), {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${this.ref.token}`,
        "content-type": "application/json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "gitpay",
      },
      body: JSON.stringify({
        body: formatReceipt({ key, ...entry }, this.ref.context ?? {}),
      }),
    });
  }

  /**
   * Called before broadcasting. Throwing here is the safe outcome: nothing has
   * moved, so the payout simply does not happen and can be retried cleanly.
   */
  async record(key: string, entry: LedgerEntry): Promise<void> {
    const response = await this.post(key, entry);
    if (!response.ok) {
      throw new Error(
        `Refusing to broadcast: could not record the payout for ${key} ` +
          `(GitHub API ${response.status}). Nothing was settled.`,
      );
    }
  }

  /**
   * Called after a successful broadcast. Deliberately does not throw — the
   * record written by `record()` already carries the transaction, so a failure
   * here costs legibility only, and turning a settled payout into a reported
   * failure would be far worse than a missing confirmation.
   */
  async confirm(key: string, entry: LedgerEntry): Promise<void> {
    const response = await this.post(key, entry);
    if (!response.ok) {
      console.warn(
        `Payout ${key} settled, but the confirmation comment failed ` +
          `(GitHub API ${response.status}). The earlier record still carries the transaction.`,
      );
    }
  }
}
