import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_MAINTAINER_ASSOCIATIONS,
  isMaintainer,
  parseAssociations,
  parseSendCommand,
  resolveCommandAsset,
} from "../../../src/adapters/github/trigger.js";
import { toAtomic } from "../../../src/core/amount.js";
import { canonical } from "../../../src/core/idempotency.js";

const ADDR = "0x000000000000000000000000000000000000dEaD";

test("parses a bare recipient and amount", () => {
  const cmd = parseSendCommand(`/send ${ADDR} 10`);
  assert.deepEqual(cmd, { recipient: ADDR, amount: "10", asset: undefined });
});

test("parses a space-separated asset", () => {
  const cmd = parseSendCommand(`/send ${ADDR} 2.5 USDC`);
  assert.deepEqual(cmd, { recipient: ADDR, amount: "2.5", asset: "USDC" });
});

test("parses an asset run onto the amount", () => {
  const cmd = parseSendCommand(`/send ${ADDR} 10usdc`);
  assert.deepEqual(cmd, { recipient: ADDR, amount: "10", asset: "usdc" });
});

test("finds the command on any line, ignoring surrounding prose", () => {
  const cmd = parseSendCommand(`Nice work!\n\n/send ${ADDR} 7 USDC\n\nMerging now.`);
  assert.equal(cmd?.amount, "7");
});

test("a comment with no command is not an error", () => {
  assert.equal(parseSendCommand("looks good to me"), undefined);
  // A word merely starting with "send" must not trigger on the \b boundary.
  assert.equal(parseSendCommand("/sendhelp"), undefined);
});

test("preserves recipient case so a resolver can judge it (I4)", () => {
  const cmd = parseSendCommand(`/send ${ADDR} 1`);
  assert.equal(cmd?.recipient, ADDR, "recipient must not be lowercased here");
});

test("refuses a command it cannot read rather than guessing", () => {
  assert.throws(() => parseSendCommand("/send"), /needs a recipient and an amount/);
  assert.throws(() => parseSendCommand(`/send ${ADDR}`), /needs a recipient and an amount/);
  assert.throws(() => parseSendCommand(`/send ${ADDR} ten`), /not a valid amount/);
  assert.throws(() => parseSendCommand(`/send ${ADDR} 10 USDC extra`), /at most 3/);
  assert.throws(() => parseSendCommand(`/send ${ADDR} 10usdc USDC`), /asset was given twice/);
});

test("round:N after the amount or the asset is a deliberate re-payment", () => {
  assert.deepEqual(parseSendCommand(`/send ${ADDR} 10 round:1`), {
    recipient: ADDR,
    amount: "10",
    asset: undefined,
    round: "1",
  });
  assert.deepEqual(parseSendCommand(`/send ${ADDR} 2.5 USDC ROUND:12`), {
    recipient: ADDR,
    amount: "2.5",
    asset: "USDC",
    round: "12",
  });
  assert.equal(parseSendCommand(`/send ${ADDR} 10 round:2 USDC`)?.asset, "USDC", "in either order");
});

test("a mistyped round is refused, never read as round 0", () => {
  // Silently dropping it would answer `already-paid` to a maintainer who meant
  // to pay again — or, worse, read it as an asset or an amount.
  assert.throws(() => parseSendCommand(`/send ${ADDR} 10 round:one`), /not a valid round/);
  assert.throws(() => parseSendCommand(`/send ${ADDR} 10 round:`), /not a valid round/);
  assert.throws(() => parseSendCommand(`/send ${ADDR} 10 round:-1`), /not a valid round/);
  assert.throws(() => parseSendCommand(`/send ${ADDR} 10 round:1234567`), /not a valid round/);
  assert.throws(() => parseSendCommand(`/send ${ADDR} 10 round:1 round:2`), /given 2 times/);
});

test("round:N cannot stand in for the recipient or the amount", () => {
  assert.throws(() => parseSendCommand(`/send ${ADDR} round:1`), /not a valid amount/);
  assert.equal(parseSendCommand(`/send round:1 10`)?.recipient, "round:1", "position 1 is the recipient, opaque (I4)");
});

test("a round changes the idempotency key, and only the round", () => {
  const key = (round: number) =>
    canonical({
      v: 1,
      source: { platform: "github", repo: "o/r", ref: "refs/pull/1" },
      recipient: ADDR,
      network: "eip155:11155111",
      asset: "USDC",
      round,
    });
  const r0 = key(0);
  const r1 = key(Number(parseSendCommand(`/send ${ADDR} 10 round:1`)?.round));
  assert.notEqual(r0, r1);
  assert.equal(r0.replace(/\|0$/, "|1"), r1);
});

test("a /send with no asset pays in the workflow's asset", () => {
  assert.equal(resolveCommandAsset(undefined, "USDC"), "USDC");
  assert.equal(resolveCommandAsset(undefined, undefined), undefined);
});

test("a /send naming the workflow's asset in any case gets the workflow's spelling", () => {
  for (const typed of ["USDC", "usdc", "Usdc"]) {
    assert.equal(resolveCommandAsset(typed, "USDC"), "USDC");
  }
});

test("a /send cannot choose a different token than the workflow pays in", () => {
  // The driver pays the `token` input whatever the comment says, so a mismatch
  // would pay USDC under a receipt that says DAI.
  assert.throws(() => resolveCommandAsset("DAI", "USDC"), /pays in USDC/);
  assert.throws(() => resolveCommandAsset("USDT", "USDC"), /cannot choose the token/);
});

test("a named asset with nothing configured to check it against is refused", () => {
  assert.throws(() => resolveCommandAsset("USDC", undefined), /sets no `asset` input/);
});

test("spelling the asset differently cannot produce a second key for one payout", () => {
  const keyWith = (typed: string | undefined) =>
    canonical({
      v: 1,
      source: { platform: "github", repo: "acme/widgets", ref: "refs/pull/42" },
      recipient: ADDR,
      network: "eip155:11155111",
      asset: resolveCommandAsset(typed, "USDC")!,
      round: 0,
    });
  const keys = new Set([keyWith(undefined), keyWith("USDC"), keyWith("usdc"), keyWith("Usdc")]);
  assert.equal(keys.size, 1, "every spelling of the one configured asset must share one key");
});

test("by default maintainers may send and nobody else may", () => {
  const allowed = [...DEFAULT_MAINTAINER_ASSOCIATIONS];
  for (const ok of ["OWNER", "MEMBER", "COLLABORATOR", "owner", " Member "]) {
    assert.equal(isMaintainer(ok, allowed), true, `${ok} should be allowed`);
  }
  for (const denied of ["CONTRIBUTOR", "FIRST_TIME_CONTRIBUTOR", "NONE", "", undefined]) {
    assert.equal(isMaintainer(denied, allowed), false, `${denied} should be denied`);
  }
});

test("the allowlist is configurable, and narrowing it takes effect", () => {
  const ownerOnly = parseAssociations("OWNER");
  assert.deepEqual(ownerOnly, ["OWNER"]);
  assert.equal(isMaintainer("OWNER", ownerOnly), true);
  assert.equal(isMaintainer("COLLABORATOR", ownerOnly), false);
});

test("the allowlist is read case- and whitespace-insensitively", () => {
  assert.deepEqual(parseAssociations(" owner , member "), ["OWNER", "MEMBER"]);
});

/**
 * A blank input is far more likely to be an unset repository variable than a
 * deliberate lockout. Reading it as "allow nobody" would silently disable
 * `/send`; the kill switch is how you say that on purpose.
 */
test("a blank or missing allowlist falls back to the default rather than locking out", () => {
  for (const blank of [undefined, "", "   ", ",", " , "]) {
    assert.deepEqual(parseAssociations(blank), [...DEFAULT_MAINTAINER_ASSOCIATIONS]);
  }
});

/**
 * Unknown values warn and are kept. A typo can only ever narrow an allowlist —
 * "OWNERS" matches nobody — so the consequence is a refused payout, never an
 * unintended one, and failing outright would break every run the day GitHub
 * adds an association value.
 */
test("an unrecognized association warns, is kept, and matches nobody", () => {
  const warnings: string[] = [];
  const original = console.warn;
  console.warn = (msg: unknown) => warnings.push(String(msg));
  try {
    const parsed = parseAssociations("OWNER,OWNERS");
    assert.deepEqual(parsed, ["OWNER", "OWNERS"]);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0] ?? "", /OWNERS/);
    assert.equal(isMaintainer("OWNERS", parsed), true, "kept entries still match themselves");
    assert.equal(
      isMaintainer("CONTRIBUTOR", parsed),
      false,
      "but a typo never widens the allowlist",
    );
  } finally {
    console.warn = original;
  }
});

test("converts human amounts to atomic units without floats", () => {
  assert.equal(toAtomic("10", 6), "10000000");
  assert.equal(toAtomic("2.5", 6), "2500000");
  assert.equal(toAtomic("0.000001", 6), "1");
  assert.equal(toAtomic("0.1", 18), "100000000000000000");
  assert.equal(toAtomic("1", 0), "1");
});

test("refuses amounts that would silently lose money", () => {
  assert.throws(() => toAtomic("0", 6), /greater than zero/);
  assert.throws(() => toAtomic("0.0", 6), /greater than zero/);
  assert.throws(() => toAtomic("1.0000001", 6), /only 6/);
  assert.throws(() => toAtomic("1,000", 6), /without separators/);
  assert.throws(() => toAtomic("-1", 6), /positive decimal/);
  assert.throws(() => toAtomic("1e6", 6), /positive decimal/);
});
