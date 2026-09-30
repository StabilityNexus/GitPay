import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { DEFAULT_SETTLEMENT_MODE, DEFAULT_SETTLEMENT_ENABLED } from "../../src/core/defaults.js";
import { ERRORS, ERROR_CODES, XOpsError, isSuccessCode } from "../../src/core/errors.js";

test("I5: the default settlement mode is dry-run", () => {
  assert.equal(DEFAULT_SETTLEMENT_MODE, "dry-run");
  assert.equal(DEFAULT_SETTLEMENT_ENABLED, true);
});

test("I5: the action declares dry-run as its default too", () => {
  const action = readFileSync("action.yml", "utf8");
  const mode = /mode:\s*[\s\S]*?default:\s*"([^"]+)"/.exec(action);
  assert.ok(mode, "action.yml must declare a mode input with a default");
  assert.equal(mode[1], "dry-run");
});

test("I8: AUTH_ALREADY_USED is the only success code", () => {
  const successes = ERROR_CODES.filter(isSuccessCode);
  assert.deepEqual(successes, ["AUTH_ALREADY_USED"]);
});

test("every code carries a comment safe to render in a PR", () => {
  for (const code of ERROR_CODES) {
    const spec = ERRORS[code];
    assert.ok(spec.comment.length > 0, `${code} has no comment`);
    assert.ok(!spec.comment.includes("at "), `${code} looks like it leaks a stack frame`);
    assert.ok(["no", "user", "auto"].includes(spec.retry), `${code} has no retry policy`);
  }
});

test("XOpsError carries the code and structured details, not a stack for humans", () => {
  const err = new XOpsError("AMOUNT_CAP_EXCEEDED", undefined, { cap: "100.00" });
  assert.equal(err.code, "AMOUNT_CAP_EXCEEDED");
  assert.equal(err.details["cap"], "100.00");
  assert.match(err.message, /AMOUNT_CAP_EXCEEDED/);
});
