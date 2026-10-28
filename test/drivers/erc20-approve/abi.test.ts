import assert from "node:assert/strict";
import { test } from "node:test";
import { keccak_256 } from "@noble/hashes/sha3";

import { encodeUint256 } from "../../../src/drivers/evm/abi.js";
import {
  TRANSFER_FROM_SELECTOR,
  TRANSFER_FROM_SIGNATURE,
  encodeTransferFrom,
} from "../../../src/drivers/erc20-approve/abi.js";

test("the pinned selector is keccak256 of the signature", () => {
  const hash = Buffer.from(keccak_256(new TextEncoder().encode(TRANSFER_FROM_SIGNATURE))).toString("hex");
  assert.equal(TRANSFER_FROM_SELECTOR, `0x${hash.slice(0, 8)}`);
});

/**
 * Laid out by hand, word by word, rather than produced by the encoder under
 * test: three static words after the selector, each right-aligned. A swapped
 * `from` and `to` pays the payer from the recipient, and only a fixed
 * expectation catches it.
 */
test("transferFrom calldata is selector, from, to, amount", () => {
  const data = encodeTransferFrom({
    from: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    to: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    amount: "2500000",
  });

  assert.equal(
    data,
    "0x23b872dd" +
      "00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8" +
      "0000000000000000000000003c44cdddb6a900fa2b585dd299e03d12fa4293bc" +
      "00000000000000000000000000000000000000000000000000000000002625a0",
  );
});

test("amount is a full uint256, not the AllowanceModule's uint96", () => {
  const big = 1n << 100n;
  assert.equal(encodeUint256(big), big.toString(16).padStart(64, "0"));
  assert.throws(() => encodeUint256(-1n), /cannot be negative/);
  assert.throws(() => encodeUint256(1n << 256n), /exceeds uint256 max/);
});

test("a malformed address is refused rather than encoded", () => {
  assert.throws(
    () => encodeTransferFrom({ from: "alice.eth", to: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", amount: 1n }),
    /not a 20-byte hex address/,
  );
});
