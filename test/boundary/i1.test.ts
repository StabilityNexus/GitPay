import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ESLint } from "eslint";

const BOUNDARY = join("scripts", "check-boundary.mjs");
const RESTRICTED = "@typescript-eslint/no-restricted-imports";

const eslint = new ESLint({ cwd: process.cwd() });

async function probe(filePath: string, source: string) {
  const [result] = await eslint.lintText(source, { filePath });
  assert.ok(result, `eslint produced no result for ${filePath}`);
  return {
    errorCount: result.errorCount,
    restricted: result.messages.find((m) => m.ruleId === RESTRICTED),
    messages: result.messages,
  };
}

const CHAIN_IMPORT = 'import { keccak_256 } from "@noble/hashes/sha3.js";\nexport const h = keccak_256;\n';

test("I1: the lint rule rejects a chain import added to src/core", async () => {
  const { errorCount, restricted, messages } = await probe(
    join("src", "core", "__i1_probe__.ts"),
    CHAIN_IMPORT,
  );

  assert.ok(errorCount > 0, "a chain import in src/core must fail the lint");
  assert.ok(restricted, `expected ${RESTRICTED}, got ${JSON.stringify(messages)}`);
  assert.match(restricted.message, /I1/);
});

test("I1: the rule covers adapters and resolvers too", async () => {
  for (const dir of ["adapters", "resolvers"]) {
    const { restricted } = await probe(join("src", dir, "__i1_probe__.ts"), CHAIN_IMPORT);
    assert.ok(restricted, `${dir} must be covered by I1`);
  }
});

test("I1: the same import is allowed inside a driver", async () => {
  const { restricted } = await probe(
    join("src", "drivers", "exact-eip155", "__i1_probe__.ts"),
    CHAIN_IMPORT,
  );
  assert.equal(restricted, undefined, "drivers are where rails are allowed to live");
});

test("I1: core may not import a driver", async () => {
  const { restricted } = await probe(
    join("src", "core", "__i1_probe__.ts"),
    'import { DriverRegistry } from "../drivers/registry.js";\nexport const r = DriverRegistry;\n',
  );

  assert.ok(restricted, "the boundary must point one way");
  assert.match(restricted.message, /boundary points one way/);
});

test("the boundary grep catches primitives no import rule would see", () => {
  const dir = mkdtempSync(join(tmpdir(), "gitpay-i1-"));
  try {
    mkdirSync(join(dir, "core"), { recursive: true });
    writeFileSync(
      join(dir, "core", "leak.ts"),
      [
        "export const NONCE_TYPE = 'bytes32';",
        "export const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';",
        "export const isBase = (n: string) => n === 'eip155:84532';",
      ].join("\n"),
      "utf8",
    );

    const run = spawnSync(process.execPath, [BOUNDARY, dir], { encoding: "utf8" });

    assert.equal(run.status, 1, run.stdout + run.stderr);
    assert.match(run.stderr, /chain-primitive-type/);
    assert.match(run.stderr, /hex-address-literal/);
    assert.match(run.stderr, /chain-identity-literal/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the boundary grep catches dynamic imports, which the lint rule does not inspect", () => {
  const dir = mkdtempSync(join(tmpdir(), "gitpay-i1-"));
  try {
    mkdirSync(join(dir, "core"), { recursive: true });
    writeFileSync(
      join(dir, "core", "lazy.ts"),
      [
        'export const hashes = () => import("@noble/hashes/sha3.js");',
        "export const drivers = () => import ( '../drivers/registry.js' );",
      ].join("\n"),
      "utf8",
    );

    const run = spawnSync(process.execPath, [BOUNDARY, dir], { encoding: "utf8" });

    assert.equal(run.status, 1, run.stdout + run.stderr);
    assert.match(run.stderr, /chain-library-import/);
    assert.match(run.stderr, /driver-or-asset-import/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the boundary grep is clean on the real tree", () => {
  const out = execFileSync(process.execPath, [BOUNDARY], { encoding: "utf8" });
  assert.match(out, /I1 clean/);
});
