import assert from "node:assert/strict";
import { test } from "node:test";

import {
  bytesToHex,
  hexToBytes,
  rlpEncode,
  toMinimalBytes,
} from "../../../src/drivers/safe-allowance/rlp.js";
import {
  addressFromPrivateKey,
  signTransaction,
  signingHash,
} from "../../../src/drivers/safe-allowance/tx.js";

const hex = (input: Parameters<typeof rlpEncode>[0]): string => bytesToHex(rlpEncode(input));

/** Canonical vectors from the RLP spec. A wrong encoding recovers a wrong sender. */
test("RLP matches the published vectors", () => {
  assert.equal(hex(new TextEncoder().encode("dog")), "0x83646f67");
  assert.equal(hex([]), "0xc0");
  assert.equal(hex(new Uint8Array(0)), "0x80");
  assert.equal(hex(Uint8Array.of(0x00)), "0x00", "a single low byte is its own encoding");
  assert.equal(hex(Uint8Array.of(0x7f)), "0x7f");
  assert.equal(hex(Uint8Array.of(0x80)), "0x8180", "0x80 needs a prefix");
  assert.equal(
    hex([new TextEncoder().encode("cat"), new TextEncoder().encode("dog")]),
    "0xc88363617483646f67",
  );
  // 56 bytes crosses into the long form.
  assert.equal(hex(new Uint8Array(56)).slice(0, 6), "0xb838");
});

test("integers encode minimally, and zero is the empty string", () => {
  assert.equal(bytesToHex(toMinimalBytes(0n)), "0x");
  assert.equal(bytesToHex(toMinimalBytes(1n)), "0x01");
  assert.equal(bytesToHex(toMinimalBytes(255n)), "0xff");
  assert.equal(bytesToHex(toMinimalBytes(256n)), "0x0100");
  assert.equal(bytesToHex(toMinimalBytes(11155111n)), "0xaa36a7", "Sepolia chain id");
  assert.throws(() => toMinimalBytes(-1n), /negative/);
});

test("hex round-trips and rejects malformed input", () => {
  assert.equal(bytesToHex(hexToBytes("0xdeadBEEF")), "0xdeadbeef");
  assert.equal(hexToBytes("0x").length, 0);
  assert.throws(() => hexToBytes("0xabc"), /odd-length/);
  assert.throws(() => hexToBytes("0xzz"), /not hex/);
});

// A throwaway key. Never used for anything but deriving a deterministic address.
const KEY = "0x4c0883a69102937d6231471b5dbb6204fe512961708279f1a4b1e1a1a1a1a1a1";

const TX = {
  chainId: 11155111n,
  nonce: 7n,
  maxPriorityFeePerGas: 1_500_000_000n,
  maxFeePerGas: 30_000_000_000n,
  gasLimit: 120_000n,
  to: "0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134",
  value: 0n,
  data: "0x4515641a",
};

test("derives a stable 20-byte address from the key", () => {
  const address = addressFromPrivateKey(KEY);
  assert.match(address, /^0x[0-9a-f]{40}$/);
  assert.equal(address, addressFromPrivateKey(KEY.slice(2)), "0x prefix is optional");
});

test("a signed transaction is type 0x02 and deterministic", () => {
  const a = signTransaction(TX, KEY);
  const b = signTransaction(TX, KEY);

  assert.ok(a.raw.startsWith("0x02"), "EIP-1559 envelope");
  assert.match(a.hash, /^0x[0-9a-f]{64}$/);
  assert.equal(a.hash, b.hash, "same input, same hash");
});

/**
 * The property the whole write-ahead design rests on: the hash exists before
 * anything is broadcast. If signing needed the network, the ledger could not be
 * written first.
 */
test("the hash is known from signing alone, with no network", () => {
  const signed = signTransaction(TX, KEY);
  assert.equal(signed.hash.length, 66);
  assert.ok(signed.raw.length > 66);
});

test("changing any field changes the hash", () => {
  const base = signTransaction(TX, KEY).hash;
  assert.notEqual(signTransaction({ ...TX, nonce: 8n }, KEY).hash, base);
  assert.notEqual(signTransaction({ ...TX, data: "0x4515641b" }, KEY).hash, base);
  assert.notEqual(signTransaction({ ...TX, chainId: 1n }, KEY).hash, base, "replay across chains");
});

test("the signing hash is 32 bytes and excludes the signature", () => {
  assert.equal(signingHash(TX).length, 32);
});

test("rejects a key that is not 32 bytes", () => {
  assert.throws(() => signTransaction(TX, "0xabcd"), /must be 32 bytes/);
});
