import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { encodeExecuteAllowanceTransfer } from "../../../src/drivers/safe-allowance/abi.js";
import { bytesToHex } from "../../../src/drivers/safe-allowance/rlp.js";
import {
  addressFromPrivateKey,
  signTransaction,
  signingHash,
} from "../../../src/drivers/safe-allowance/tx.js";

/**
 * Golden vectors, computed by an independent implementation (see the fixture's
 * `provenance`). The other driver tests check that encoding is deterministic
 * and well-shaped; only these check that it is right. A self-consistent bug,
 * such as a wrong field order or a wrong chain id in the envelope, passes every
 * other test and fails here.
 */
const vector = JSON.parse(
  readFileSync(join("test", "vectors", "safe-allowance-eip155-11155111.json"), "utf8"),
) as {
  delegateKey: string;
  call: { safe: string; token: string; to: string; amount: string; delegate: string };
  transaction: Record<"chainId" | "nonce" | "maxPriorityFeePerGas" | "maxFeePerGas" | "gasLimit" | "value", string> & {
    to: string;
  };
  expected: { delegateAddress: string; calldata: string; signingHash: string; raw: string; hash: string };
};

const { call, transaction: t, expected } = vector;

const data = encodeExecuteAllowanceTransfer(call);
const tx = {
  chainId: BigInt(t.chainId),
  nonce: BigInt(t.nonce),
  maxPriorityFeePerGas: BigInt(t.maxPriorityFeePerGas),
  maxFeePerGas: BigInt(t.maxFeePerGas),
  gasLimit: BigInt(t.gasLimit),
  to: t.to,
  value: BigInt(t.value),
  data,
};

test("golden: the delegate key derives the expected address", () => {
  assert.equal(addressFromPrivateKey(vector.delegateKey).toLowerCase(), expected.delegateAddress.toLowerCase());
});

test("golden: executeAllowanceTransfer calldata matches the reference encoder", () => {
  assert.equal(data, expected.calldata);
});

test("golden: the EIP-1559 signing hash matches", () => {
  assert.equal(bytesToHex(signingHash(tx)), expected.signingHash);
});

test("golden: the signed raw transaction and its hash match", () => {
  const signed = signTransaction(tx, vector.delegateKey);
  assert.equal(signed.raw, expected.raw);
  // The hash is what the ledger records before broadcast. If it differed from
  // the one the chain assigns, a receipt would point at a transaction that
  // does not exist, and a replay could not be matched to it.
  assert.equal(signed.hash, expected.hash);
});
