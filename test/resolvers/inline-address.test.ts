import assert from "node:assert/strict";
import test from "node:test";

import { InlineAddressResolver, ResolverChain } from "../../src/resolvers/index.js";

const chain = () => new ResolverChain([new InlineAddressResolver()]);

test("a bare identity resolves to a payout target on the requested rail", async () => {
  const target = await chain().resolve("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", {
    rail: "eip155:84532",
  });

  assert.equal(target.address, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  assert.equal(target.rail, "eip155:84532");
  assert.equal(target.resolvedBy, "inline-address");
});

test("the inline: prefix is stripped", async () => {
  const target = await chain().resolve("inline:abc123", { rail: "mock:ledger" });
  assert.equal(target.address, "abc123");
});

test("I4: the resolver does not judge address format — that belongs to the rail", async () => {
  const target = await chain().resolve("GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ", {
    rail: "stellar:pubnet",
  });
  assert.equal(target.address.startsWith("GA"), true);
});

test("an unmatched identity fails with IDENTITY_UNRESOLVED", async () => {
  await assert.rejects(chain().resolve("@alice", { rail: "eip155:84532" }), {
    code: "IDENTITY_UNRESOLVED",
  });
});

test("an empty chain resolves nothing", async () => {
  await assert.rejects(new ResolverChain().resolve("anything", { rail: "mock:ledger" }), {
    code: "IDENTITY_UNRESOLVED",
  });
});
