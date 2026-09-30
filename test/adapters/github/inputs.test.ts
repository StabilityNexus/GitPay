import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { readInput } from "../../../src/adapters/github/inputs.js";

const KEYS = ["INPUT_REPO", "INPUT_COMMENT", "INPUT_MY_THING"];

afterEach(() => {
  for (const key of KEYS) delete process.env[key];
});

test("reads a value that was passed", () => {
  process.env["INPUT_REPO"] = "owner/name";
  assert.equal(readInput("repo"), "owner/name");
});

test("an absent input is undefined", () => {
  assert.equal(readInput("repo"), undefined);
});

/**
 * The regression this file exists for. A declared input that the workflow does
 * not pass arrives as "", so `readInput(...) ?? fallback` must reach the
 * fallback. Returning "" here defeated every default downstream and produced
 * "Missing required intent field: repo" in a live run.
 */
test("a blank input is undefined, so ?? fallbacks still fire", () => {
  process.env["INPUT_REPO"] = "";
  assert.equal(readInput("repo"), undefined);
  assert.equal(readInput("repo") ?? "fallback", "fallback");

  process.env["INPUT_COMMENT"] = "   \n\t ";
  assert.equal(readInput("comment"), undefined, "whitespace-only is also absent");
});

test("preserves interior content and surrounding shape of real values", () => {
  process.env["INPUT_COMMENT"] = "\nlgtm\n/send 0xabc 10\n";
  assert.equal(readInput("comment"), "\nlgtm\n/send 0xabc 10\n");
});

test("maps spaces in a name to underscores, as Actions does", () => {
  process.env["INPUT_MY_THING"] = "x";
  assert.equal(readInput("my thing"), "x");
});
