import assert from "node:assert/strict";
import { test } from "node:test";
import { keccak_256 } from "@noble/hashes/sha3";

import {
  EXECUTE_ALLOWANCE_TRANSFER_SELECTOR,
  EXECUTE_ALLOWANCE_TRANSFER_SIGNATURE,
  ZERO_ADDRESS,
  encodeAddress,
  encodeExecuteAllowanceTransfer,
  encodeUint96,
} from "../../../src/drivers/safe-allowance/abi.js";

const SAFE = "0x1111111111111111111111111111111111111111";
const TOKEN = "0x2222222222222222222222222222222222222222";
const TO = "0x000000000000000000000000000000000000dEaD";
const DELEGATE = "0x4444444444444444444444444444444444444444";

/**
 * The selector is pinned as a constant so encoding costs no hash. This test is
 * what stops it drifting from the signature string beside it.
 */
test("the pinned selector is keccak256 of the signature", () => {
  const hash = Buffer.from(
    keccak_256(new TextEncoder().encode(EXECUTE_ALLOWANCE_TRANSFER_SIGNATURE)),
  ).toString("hex");
  assert.equal(EXECUTE_ALLOWANCE_TRANSFER_SELECTOR, `0x${hash.slice(0, 8)}`);
});

test("amount is uint96 — the signature must not say uint256", () => {
  // Guards the exact mistake that produces a valid-looking call which reverts
  // on-chain with no useful error.
  assert.match(EXECUTE_ALLOWANCE_TRANSFER_SIGNATURE, /uint96,address,uint96/);
  assert.doesNotMatch(EXECUTE_ALLOWANCE_TRANSFER_SIGNATURE, /uint256/);
});

test("encodes a minimal transfer to exactly 292 bytes", () => {
  const data = encodeExecuteAllowanceTransfer({
    safe: SAFE,
    token: TOKEN,
    to: TO,
    amount: "2500000",
    delegate: DELEGATE,
  });

  // 4 selector + 8 head words + 1 length word = 4 + 256 + 32.
  assert.equal((data.length - 2) / 2, 292);
  assert.ok(data.startsWith(EXECUTE_ALLOWANCE_TRANSFER_SELECTOR));

  const body = data.slice(EXECUTE_ALLOWANCE_TRANSFER_SELECTOR.length);
  const words = body.match(/.{64}/g) ?? [];
  assert.equal(words.length, 9);
  assert.equal(words[0], `${"0".repeat(24)}${SAFE.slice(2)}`);
  assert.equal(words[2], `${"0".repeat(24)}${TO.slice(2).toLowerCase()}`);
  // 2500000 == 0x2625a0
  assert.equal(words[3], "0".repeat(58) + "2625a0");
  assert.equal(words[4], "0".repeat(64), "paymentToken defaults to the zero address");
  assert.equal(words[5], "0".repeat(64), "payment defaults to zero");
  assert.equal(words[7], "0".repeat(61) + "100", "bytes offset is 8 words");
  assert.equal(words[8], "0".repeat(64), "empty signature has zero length");
});

test("a 65-byte signature pads to two tail words", () => {
  const sig = `0x${"ab".repeat(65)}`;
  const data = encodeExecuteAllowanceTransfer({
    safe: SAFE,
    token: TOKEN,
    to: TO,
    amount: 1n,
    delegate: DELEGATE,
    signature: sig,
  });
  // 292 + 96 bytes of padded signature data (65 rounds up to 96).
  assert.equal((data.length - 2) / 2, 292 + 96);
  assert.ok(data.endsWith("ab" + "00".repeat(31)), "tail is right-padded with zeros");
});

test("rejects values that would corrupt a payout", () => {
  assert.throws(() => encodeAddress("0xnope"), /not a 20-byte hex address/);
  assert.throws(() => encodeAddress(SAFE.slice(0, 20)), /not a 20-byte hex address/);
  assert.throws(() => encodeUint96(-1n), /cannot be negative/);
  assert.throws(() => encodeUint96(1n << 96n), /exceeds uint96 max/);
  assert.throws(
    () =>
      encodeExecuteAllowanceTransfer({
        safe: SAFE,
        token: TOKEN,
        to: TO,
        amount: 1n,
        delegate: DELEGATE,
        signature: "0xabc",
      }),
    /even-length hex/,
  );
});

test("uint96 accepts the largest realistic payout", () => {
  // 79.2 billion 18-decimal tokens still fits, so uint96 is not a real ceiling.
  assert.equal(encodeUint96((1n << 96n) - 1n), "f".repeat(24).padStart(64, "0"));
  assert.equal(encodeAddress(ZERO_ADDRESS), "0".repeat(64));
});
