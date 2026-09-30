import assert from "node:assert/strict";
import { test } from "node:test";

import {
  findReceipt,
  formatReceipt,
  isTrustedReceiptAuthor,
  parseReceiptKey,
} from "../../../src/adapters/github/receipts.js";

const KEY = "xops:v1|github:kpj2006/demo-XOps#refs/pull/1|0xdead|eip155:11155111|USDC|0";
const BOT = { user: { type: "Bot", login: "github-actions[bot]" } };

test("a formatted receipt round-trips its key", () => {
  const body = formatReceipt({ key: KEY, status: "settled", transaction: "0xabc", settledAt: "2026-09-06T00:00:00Z" });
  assert.equal(parseReceiptKey(body), KEY);
});

test("the key is machine-readable but invisible in the rendered body", () => {
  const body = formatReceipt({ key: KEY, status: "settled" });
  assert.ok(body.startsWith("<!--"), "the marker is an HTML comment");
  assert.ok(body.includes("payout settled"), "and there is something for a human to read");
});

test("an ordinary comment carries no key", () => {
  assert.equal(parseReceiptKey("lgtm"), undefined);
  assert.equal(parseReceiptKey("/send 0xdead 10 USDC"), undefined);
  assert.equal(parseReceiptKey("<!-- unrelated marker -->"), undefined);
});

test("finds a receipt among unrelated conversation", () => {
  const comments = [
    { body: "nice work", ...BOT },
    { body: "/send 0xdead 10 USDC", author_association: "OWNER" },
    { body: formatReceipt({ key: KEY, status: "settled", transaction: "0xabc" }), ...BOT },
    { body: "merging", author_association: "OWNER" },
  ];
  assert.deepEqual(findReceipt(comments, KEY), { key: KEY, status: "settled", transaction: "0xabc" });
});

/**
 * The distinction that matters: a *different* payout's receipt must not be
 * mistaken for this one, or the second contributor never gets paid.
 */
test("a receipt for a different key does not match", () => {
  const other = KEY.replace("refs/pull/1", "refs/pull/2");
  const comments = [{ body: formatReceipt({ key: other, status: "settled" }), ...BOT }];
  assert.equal(findReceipt(comments, KEY), undefined);
  assert.deepEqual(findReceipt(comments, other), { key: other, status: "settled" });
});

test("a round differences makes it a different payout", () => {
  const rerun = `${KEY.slice(0, -1)}1`;
  const comments = [{ body: formatReceipt({ key: KEY, status: "settled" }), ...BOT }];
  assert.equal(findReceipt(comments, rerun), undefined, "round 1 is a deliberate re-pay");
});

test("only bots and people who can already spend are believed", () => {
  assert.ok(isTrustedReceiptAuthor(BOT));
  assert.ok(isTrustedReceiptAuthor({ author_association: "OWNER" }));
  assert.ok(isTrustedReceiptAuthor({ author_association: "collaborator" }));
  assert.ok(!isTrustedReceiptAuthor({ author_association: "CONTRIBUTOR" }));
  assert.ok(!isTrustedReceiptAuthor({ author_association: "NONE" }));
  assert.ok(!isTrustedReceiptAuthor({}));
});

test("a contributor cannot block a payout by forging a receipt", () => {
  const forged = [{ body: formatReceipt({ key: KEY, status: "settled" }), author_association: "CONTRIBUTOR" }];
  assert.equal(findReceipt(forged, KEY), undefined);
});

/**
 * A settled payout leaves both comments. Returning the earlier one would report
 * a finished payout as still broadcasting and send someone to an explorer for
 * nothing.
 */
test("a later confirmation beats the earlier broadcasting record", () => {
  const comments = [
    { body: formatReceipt({ key: KEY, status: "broadcasting", transaction: "0xabc" }), ...BOT },
    { body: "unrelated chatter", ...BOT },
    { body: formatReceipt({ key: KEY, status: "settled", transaction: "0xabc" }), ...BOT },
  ];
  assert.equal(findReceipt(comments, KEY)?.status, "settled");
});

test("an unconfirmed record alone still reports broadcasting, and still blocks", () => {
  const comments = [
    { body: formatReceipt({ key: KEY, status: "broadcasting", transaction: "0xabc" }), ...BOT },
  ];
  const found = findReceipt(comments, KEY);
  assert.equal(found?.status, "broadcasting");
  assert.equal(found?.transaction, "0xabc", "the hash is what a human needs to check");
});

/**
 * The split that matters: everything findReceipt needs lives in the marker, so
 * the visible body can be redesigned without risking idempotency. Before this,
 * the transaction was parsed out of the prose and a reformat would have broken
 * double-payment protection silently.
 */
test("idempotency data survives a total rewrite of the visible body", () => {
  const real = formatReceipt(
    { key: KEY, status: "settled", transaction: "0xabc" },
    { amount: "0.02", asset: "tUSDC", to: "0xdead", explorerUrl: "https://example.invalid" },
  );
  const marker = real.split("\n")[0] as string;

  // Marker alone, with nothing a human would recognise as a receipt.
  const stripped = `${marker}\n### something else entirely\n\nno prose, no table.`;
  const found = findReceipt([{ body: stripped, ...BOT }], KEY);
  assert.equal(found?.key, KEY);
  assert.equal(found?.status, "settled");
  assert.equal(found?.transaction, "0xabc", "the transaction comes from the marker, not the prose");
});

test("legacy receipts written before the marker carried a transaction still parse", () => {
  const legacy =
    `<!-- xops-receipt:v1 key=${KEY} -->\n` +
    "**XOps — payout settled**\n\n- Transaction: `0xlegacy`\n";
  const found = findReceipt([{ body: legacy, ...BOT }], KEY);
  assert.equal(found?.status, "settled");
  assert.equal(found?.transaction, "0xlegacy");
});

test("an explicit broadcasting status beats 'payout settled' in the prose", () => {
  const body = `<!-- xops-receipt:v1 key=${KEY} status=broadcasting tx=0xabc -->\npayout settled?`;
  assert.equal(findReceipt([{ body, ...BOT }], KEY)?.status, "broadcasting");
});

test("anything not explicitly settled is treated as in-flight", () => {
  const odd = `<!-- xops-receipt:v1 key=${KEY} status=weird tx=0xabc -->\nunknown`;
  assert.equal(findReceipt([{ body: odd, ...BOT }], KEY)?.status, "broadcasting");
});

test("an empty or bodyless comment is skipped rather than throwing", () => {
  assert.equal(findReceipt([{ body: null }, { body: undefined }, {}], KEY), undefined);
});
