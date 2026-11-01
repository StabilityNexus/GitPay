import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

/**
 * Runs the real entry point, in dry-run, the way the Action runner does: inputs
 * as INPUT_* variables, outputs read back from GITHUB_OUTPUT. A dry run stops
 * before any network call, so this needs no RPC and no GitHub token.
 */
const MAIN = join(process.cwd(), "build", "src", "main.js");
const ADDR = "0x000000000000000000000000000000000000dEaD";

function run(inputs: Record<string, string>): {
  status: number | null;
  stderr: string;
  outputs: Record<string, string>;
} {
  const outputFile = join(mkdtempSync(join(tmpdir(), "gitpay-main-")), "output");
  const env: Record<string, string> = {
    PATH: process.env["PATH"] ?? "",
    GITHUB_OUTPUT: outputFile,
    // GitHub applies action.yml defaults; outside a runner they are passed here.
    INPUT_MODE: "dry-run",
    INPUT_NETWORK: "eip155:11155111",
    INPUT_SCHEME: "allowance",
    INPUT_ASSET: "USDC",
    INPUT_DECIMALS: "6",
    INPUT_REPO: "acme/widgets",
    INPUT_REF: "refs/pull/42",
    INPUT_ACTOR: "maintainer",
    INPUT_ACTOR_ASSOCIATION: "OWNER",
  };
  for (const [name, value] of Object.entries(inputs)) env[`INPUT_${name.toUpperCase()}`] = value;

  const child = spawnSync(process.execPath, [MAIN], { env, encoding: "utf8" });

  const outputs: Record<string, string> = {};
  const pattern = /^([A-Z_]+)<<(\S+)\n([\s\S]*?)\n\2$/gm;
  for (const [, name, , value] of readFileSync(outputFile, "utf8").matchAll(pattern)) {
    outputs[name as string] = value as string;
  }
  return { status: child.status, stderr: child.stderr, outputs };
}

function dryRun(inputs: Record<string, string>): Record<string, string> {
  const { status, stderr, outputs } = run(inputs);
  assert.equal(status, 0, stderr);
  return outputs;
}

test("a round typed in /send wins over the workflow's round input", () => {
  const { STATUS, IDEMPOTENCY_KEY } = dryRun({ comment: `/send ${ADDR} 1 round:3`, round: "0" });
  assert.equal(STATUS, "dry-run");
  assert.match(IDEMPOTENCY_KEY ?? "", /\|3$/, "the key carries the command's round");
});

test("without round:N, the workflow's round input still applies", () => {
  const { IDEMPOTENCY_KEY } = dryRun({ comment: `/send ${ADDR} 1`, round: "2" });
  assert.match(IDEMPOTENCY_KEY ?? "", /\|2$/);
});

test("with the kill switch off, a member's /send is refused by policy without a permission lookup", () => {
  // No GITHUB_ACTOR and no token: a lookup would fail with an API error instead.
  const { status, outputs } = run({ comment: `/send ${ADDR} 1`, actor_association: "MEMBER", enabled: "false" });
  assert.equal(status, 1);
  assert.equal(outputs["ERROR_CODE"], "POLICY_DENIED");
});

test("the actor input cannot stand in for the account that commented", () => {
  // A member's /send is checked against GITHUB_ACTOR. Absent here, the run
  // refuses rather than checking the overridden actor's permissions.
  const { status, stderr } = run({ comment: `/send ${ADDR} 1`, actor_association: "MEMBER", actor: "a-writer" });
  assert.equal(status, 1);
  assert.match(stderr, /the commenting account is unknown/);
});
