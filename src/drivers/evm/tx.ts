import { keccak_256 } from "@noble/hashes/sha3";
import { secp256k1 } from "@noble/curves/secp256k1";

import { bytesToHex, hexToBytes, rlpEncode, toMinimalBytes } from "./rlp.js";

/**
 * EIP-1559 (type 0x02) transaction signing.
 *
 * The reason this exists rather than a library call: the transaction hash must
 * be known *before* the transaction is broadcast, so the ledger can be written
 * first. Signing is pure and local, so the hash is available with nothing having
 * moved.
 */
export interface Eip1559Transaction {
  chainId: bigint;
  nonce: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gasLimit: bigint;
  /** Contract being called. */
  to: string;
  value: bigint;
  /** Hex calldata. */
  data: string;
}

const TYPE_EIP1559 = 0x02;

function fields(tx: Eip1559Transaction): readonly Uint8Array[] {
  return [
    toMinimalBytes(tx.chainId),
    toMinimalBytes(tx.nonce),
    toMinimalBytes(tx.maxPriorityFeePerGas),
    toMinimalBytes(tx.maxFeePerGas),
    toMinimalBytes(tx.gasLimit),
    hexToBytes(tx.to),
    toMinimalBytes(tx.value),
    hexToBytes(tx.data),
  ];
}

/** keccak256(0x02 || rlp([...fields, accessList])) — what actually gets signed. */
export function signingHash(tx: Eip1559Transaction): Uint8Array {
  const payload = rlpEncode([...fields(tx), []]);
  const typed = new Uint8Array(payload.length + 1);
  typed[0] = TYPE_EIP1559;
  typed.set(payload, 1);
  return keccak_256(typed);
}

export interface SignedTransaction {
  /** Ready for eth_sendRawTransaction. */
  raw: string;
  /** keccak256 of the raw transaction — the reference recorded before broadcast. */
  hash: string;
}

export function signTransaction(tx: Eip1559Transaction, privateKey: string): SignedTransaction {
  const key = hexToBytes(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
  if (key.length !== 32) {
    throw new Error(`private key must be 32 bytes, got ${key.length}`);
  }

  const signature = secp256k1.sign(signingHash(tx), key);

  const signed = rlpEncode([
    ...fields(tx),
    [],
    // yParity, not the legacy v — type-2 transactions carry the recovery bit raw.
    toMinimalBytes(BigInt(signature.recovery)),
    toMinimalBytes(signature.r),
    toMinimalBytes(signature.s),
  ]);

  const typed = new Uint8Array(signed.length + 1);
  typed[0] = TYPE_EIP1559;
  typed.set(signed, 1);

  return { raw: bytesToHex(typed), hash: bytesToHex(keccak_256(typed)) };
}

/** The address a private key controls — used to read the right account nonce. */
export function addressFromPrivateKey(privateKey: string): string {
  const key = hexToBytes(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
  const uncompressed = secp256k1.getPublicKey(key, false).slice(1);
  return bytesToHex(keccak_256(uncompressed).slice(-20));
}
