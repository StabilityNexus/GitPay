import assert from "node:assert/strict";
import test from "node:test";

import {
  assertAllowed,
  evaluate,
  format,
  type Policy,
  type PolicyFacts,
} from "../../src/core/policy.js";

const OPEN: Policy = { enabled: true, maxPerPayout: undefined };
const MAINTAINER: PolicyFacts = { actorIsMaintainer: true, amount: "2500000" };

test("a maintainer within an unset cap is allowed", () => {
  const decision = evaluate(OPEN, MAINTAINER);
  assert.equal(decision.allowed, true);
  assert.doesNotThrow(() => assertAllowed(decision));
});

test("a non-maintainer is refused with POLICY_DENIED", () => {
  const decision = evaluate(OPEN, { ...MAINTAINER, actorIsMaintainer: false });
  assert.equal(decision.allowed, false);
  assert.throws(() => assertAllowed(decision), { code: "POLICY_DENIED" });
});

/**
 * I10. The cap is the reason policy moved out of the `/send` branch: the amount
 * does not exist until the intent is parsed, so this is the earliest point the
 * condition can be evaluated at all — and it is still before a driver.
 */
test("an over-cap amount is refused with AMOUNT_CAP_EXCEEDED, not POLICY_DENIED", () => {
  const decision = evaluate(
    { enabled: true, maxPerPayout: "1000000" },
    { actorIsMaintainer: true, amount: "2500000" },
  );
  assert.equal(decision.allowed, false);
  assert.throws(() => assertAllowed(decision), { code: "AMOUNT_CAP_EXCEEDED" });
});

test("an amount exactly at the cap is allowed", () => {
  // The cap is a maximum, not a strict bound. Off by one here means a maintainer
  // who sets the cap to the amount they intend to pay cannot pay it.
  const decision = evaluate(
    { enabled: true, maxPerPayout: "2500000" },
    { actorIsMaintainer: true, amount: "2500000" },
  );
  assert.equal(decision.allowed, true);
});

test("the cap compares as an integer, not a number or a string", () => {
  // "10000000" < "9000000" lexicographically, and 1e21 loses precision as a
  // float. Both would let an over-cap payout through.
  const big = evaluate(
    { enabled: true, maxPerPayout: "9000000" },
    { actorIsMaintainer: true, amount: "10000000" },
  );
  assert.equal(big.allowed, false);

  const precise = evaluate(
    { enabled: true, maxPerPayout: "1000000000000000000000" },
    { actorIsMaintainer: true, amount: "1000000000000000000001" },
  );
  assert.equal(precise.allowed, false, "one atomic unit over the cap must still fail");
});

test("the kill switch refuses even a maintainer within the cap", () => {
  const decision = evaluate(
    { enabled: false, maxPerPayout: "9999999999" },
    { actorIsMaintainer: true, amount: "1" },
  );
  assert.equal(decision.allowed, false);
  assert.throws(() => assertAllowed(decision), { code: "POLICY_DENIED" });
  assert.equal(decision.conditions[0]?.name, "SETTLEMENT_ENABLED");
  assert.equal(
    decision.conditions[0]?.status,
    "fail",
    "the kill switch must be evaluated first, so it is the code that gets reported",
  );
});

/**
 * A workflow-configured payout has no comment author. Treating that as "not a
 * maintainer" would deny every merge-triggered or scheduled payout, so the
 * condition is skipped — and a skip is recorded as such, never as a pass.
 */
test("a run with no comment author skips the maintainer condition rather than failing it", () => {
  const decision = evaluate(OPEN, { actorIsMaintainer: undefined, amount: "2500000" });
  assert.equal(decision.allowed, true);

  const maintainer = decision.conditions.find((c) => c.name === "MAINTAINER_APPROVED");
  assert.equal(maintainer?.status, "skip");
  assert.notEqual(maintainer?.status, "pass");
});

test("every condition is evaluated, so one run shows every problem", () => {
  const decision = evaluate(
    { enabled: false, maxPerPayout: "1" },
    { actorIsMaintainer: false, amount: "2500000" },
  );
  assert.equal(decision.conditions.filter((c) => c.status === "fail").length, 3);
});

test("evaluate is pure — the same inputs give the same decision", () => {
  const facts: PolicyFacts = { actorIsMaintainer: false, amount: "5" };
  assert.deepEqual(evaluate(OPEN, facts), evaluate(OPEN, facts));
});

test("a denial carries the failing condition and the full table as context", () => {
  const decision = evaluate(OPEN, { ...MAINTAINER, actorIsMaintainer: false });
  try {
    assertAllowed(decision);
    assert.fail("expected a refusal");
  } catch (err) {
    const { details } = err as { details: { condition?: string; conditions?: unknown[] } };
    assert.equal(details.condition, "MAINTAINER_APPROVED");
    assert.equal(details.conditions?.length, 3);
  }
});

test("format renders one line per condition with its evidence", () => {
  const lines = format(evaluate(OPEN, MAINTAINER)).split("\n");
  assert.equal(lines.length, 3);
  assert.match(lines[0] ?? "", /SETTLEMENT_ENABLED/);
  assert.match(format(evaluate(OPEN, { ...MAINTAINER, actorIsMaintainer: false })), /FAIL/);
});
