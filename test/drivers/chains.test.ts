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
  assert.equal(canonicalNetwork("eip155:1"), "eip155:1");
});

test("mainnet has explicit aliases, and the ambiguous one is not among them", () => {
  assert.equal(canonicalNetwork("mainnet"), "eip155:1");
  assert.equal(canonicalNetwork("ethereum-mainnet"), "eip155:1");
  // "ethereum" alone could mean any Ethereum network. Real money gets an
  // unambiguous name or the CAIP-2 identifier.
  assert.equal(canonicalNetwork("ethereum"), "ethereum");
});

test("mainnet and Sepolia share the module address but never a chain id", () => {
  const main = lookupChain("eip155:1");
  const sepolia = lookupChain("eip155:11155111");
  assert.ok(main && sepolia);
  assert.equal(main.allowanceModule, sepolia.allowanceModule, "same canonical v0.1.0 deployment");
  assert.notEqual(main.chainId, sepolia.chainId);
  assert.notEqual(main.explorer, sepolia.explorer);
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
  // Base Sepolia: no AllowanceModule deployment, so deliberately unregistered.
  assert.equal(canonicalNetwork("eip155:84532"), "eip155:84532");
  assert.equal(lookupChain("eip155:84532"), undefined);
});

test("every record is self-consistent with the key it is stored under", () => {
  for (const network of ["eip155:1", "eip155:11155111"]) {
    const chain = lookupChain(network);
    assert.ok(chain, network);
    assert.equal(chain.network, network);
    // The chain id and the CAIP-2 reference are the same fact; the registry
    // exists so no workflow has to state it twice, so they must agree here.
    assert.equal(chain.chainId.toString(), chain.network.split(":")[1]);
    assert.match(chain.allowanceModule, /^0x[0-9a-fA-F]{40}$/);
    assert.match(chain.explorer, /^https:\/\//);
  }
});
