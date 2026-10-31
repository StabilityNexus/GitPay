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

function dryRun(inputs: Record<string, string>): Record<string, string> {
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

  const run = spawnSync(process.execPath, [MAIN], { env, encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);

  const outputs: Record<string, string> = {};
  const pattern = /^([A-Z_]+)<<(\S+)\n([\s\S]*?)\n\2$/gm;
  for (const [, name, , value] of readFileSync(outputFile, "utf8").matchAll(pattern)) {
    outputs[name as string] = value as string;
  }
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
