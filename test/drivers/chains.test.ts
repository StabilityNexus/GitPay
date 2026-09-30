import assert from "node:assert/strict";
import test from "node:test";

import { canonicalNetwork, lookupChain, supportedNetworks } from "../../src/drivers/chains.js";

test("an alias resolves to its CAIP-2 identifier", () => {
  assert.equal(canonicalNetwork("sepolia"), "eip155:11155111");
  assert.equal(canonicalNetwork("ethereum-sepolia"), "eip155:11155111");
  assert.equal(canonicalNetwork("SEPOLIA"), "eip155:11155111");
  assert.equal(canonicalNetwork("  sepolia  "), "eip155:11155111");
});

test("a CAIP-2 identifier passes through unchanged", () => {
  assert.equal(canonicalNetwork("eip155:11155111"), "eip155:11155111");
});

/**
 * The whole reason aliases resolve before `parseIntent` rather than inside the
 * driver. `network` is in the idempotency key verbatim, so if two spellings of
 * one chain survived into the intent they would produce two keys — and the
 * receipt written under one would not stop a payout under the other.
 */
test("every alias collapses onto a spelling the registry knows", () => {
  for (const name of supportedNetworks()) {
    const canonical = canonicalNetwork(name);
    assert.ok(
      lookupChain(canonical),
      `${name} resolves to ${canonical}, which is not in the registry`,
    );
    assert.equal(
      canonicalNetwork(canonical),
      canonical,
      "resolution must be idempotent, or the key depends on how many times it ran",
    );
  }
});

test("an unlisted network passes through and simply has nothing to derive from", () => {
  // Not an error here: a workflow that supplies chain_id, allowance_module and
  // explorer_url itself can still settle on a network this registry omits.
  assert.equal(canonicalNetwork("eip155:1"), "eip155:1");
  assert.equal(lookupChain("eip155:1"), undefined);
});

test("a record is self-consistent with the key it is stored under", () => {
  const chain = lookupChain("eip155:11155111");
  assert.ok(chain);
  assert.equal(chain.network, "eip155:11155111");
  // The chain id and the CAIP-2 reference are the same fact; the registry
  // exists so no workflow has to state it twice, so they must agree here.
  assert.equal(chain.chainId.toString(), chain.network.split(":")[1]);
  assert.match(chain.allowanceModule, /^0x[0-9a-fA-F]{40}$/);
  assert.match(chain.explorer, /^https:\/\//);
});
