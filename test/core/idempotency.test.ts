import assert from "node:assert/strict";
import test from "node:test";

import { canonical, keyFor } from "../../src/core/idempotency.js";
import type { IdempotencyKey, Intent } from "../../src/core/types.js";

function intent(overrides: Partial<Intent> = {}): Intent {
  return {
    source: { platform: "github", repo: "AOSSIE-Org/xops", ref: "pull/42", actor: "maintainer" },
    recipient: "0xF39FD6E51AAD88F6F4CE6AB8827279CFFFB92266",
    amount: "2500000",
    asset: "USDC",
    network: "eip155:84532",
    scheme: "exact",
    round: 0,
    ...overrides,
  };
}

// Deterministic generator — a property test that reproduces exactly on every run.
function lcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

test("I7: identical inputs produce an identical string", () => {
  const rand = lcg(20260821);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)] as T;

  for (let i = 0; i < 200; i += 1) {
    const key: IdempotencyKey = {
      v: 1,
      source: {
        platform: pick(["github", "gitlab"]),
        repo: pick(["a/b", "AOSSIE-Org/xops", "org/repo-with-dash"]),
        ref: pick(["pull/1", "pull/42", "refs/heads/main"]),
      },
      recipient: pick(["0xabc", "0xABC", "alice.eth"]),
      asset: pick(["USDC", "EURC"]),
      network: pick(["eip155:84532", "mock:ledger"]),
      round: Math.floor(rand() * 4),
    };
    assert.equal(canonical(key), canonical(structuredClone(key)));
  }
});

test("I7: amount is not part of the key", () => {
  const cheap = canonical(keyFor(intent({ amount: "50" })));
  const expensive = canonical(keyFor(intent({ amount: "500000000" })));

  assert.equal(cheap, expensive);
  assert.ok(!cheap.includes("50000"), "the amount must not appear in the key");
});

test("timestamps and comment ids cannot leak in — the key is a closed set of fields", () => {
  const key = keyFor(intent());
  assert.deepEqual(Object.keys(key).sort(), [
    "asset",
    "network",
    "recipient",
    "round",
    "source",
    "v",
  ]);
});

test("round is the deliberate escape hatch for re-paying the same ref", () => {
  assert.notEqual(canonical(keyFor(intent({ round: 0 }))), canonical(keyFor(intent({ round: 1 }))));
});

test("recipient is case-folded so wallet casing cannot double-pay", () => {
  const upper = canonical(keyFor(intent({ recipient: "0xABCDEF" })));
  const lower = canonical(keyFor(intent({ recipient: "0xabcdef" })));
  assert.equal(upper, lower);
});

test("asset and network are in the key, so multi-asset payouts need no core change", () => {
  const base = canonical(keyFor(intent()));
  assert.notEqual(base, canonical(keyFor(intent({ asset: "EURC" }))));
  assert.notEqual(base, canonical(keyFor(intent({ network: "mock:ledger" }))));
});

test("a delimiter inside a field is refused, so two keys can never spell the same string", () => {
  const a = "0x1111111111111111111111111111111111111111";
  const b = "0x2222222222222222222222222222222222222222";
  const n = "eip155:11155111";
  const pipeInAsset = { ref: "pull/1", recipient: a, asset: `${b}|${n}|USDC` };
  const pipeInRef = { ref: `pull/1|${a}|${n}`, recipient: b, asset: "USDC" };

  for (const { ref, recipient, asset } of [pipeInAsset, pipeInRef]) {
    const key = keyFor(
      intent({ source: { platform: "github", repo: "o/r", ref, actor: "m" }, recipient, asset }),
    );
    assert.throws(() => canonical(key), /delimiter/);
  }
});

test("whitespace and a '#' in the repo are refused too", () => {
  assert.throws(() => canonical(keyFor(intent({ asset: "US DC" }))), /asset/);
  assert.throws(
    () =>
      canonical(
        keyFor(intent({ source: { platform: "github", repo: "o/r#x", ref: "p", actor: "m" } })),
      ),
    /repo/,
  );
});

test("the key is versioned and returns a plain string", () => {
  const key = canonical(keyFor(intent()));
  assert.equal(typeof key, "string");
  assert.ok(key.startsWith("xops:v1|"));
});

test("gitlab projects map onto the same key shape as github repos", () => {
  const key = keyFor(
    intent({ source: { platform: "gitlab", project: "group/proj", ref: "mr/7", actor: "dev" } }),
  );
  assert.equal(key.source.repo, "group/proj");
  assert.ok(canonical(key).startsWith("xops:v1|gitlab:group/proj#mr/7|"));
});
