// ABI words shared by every EVM driver. Chain primitives live under
// src/drivers/ and only there — core and adapters may not import this file (I1).

const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const UINT256_MAX = (1n << 256n) - 1n;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/** Left-pads to a 32-byte word. Addresses and integers are both right-aligned. */
export function word(hexNoPrefix: string): string {
  if (hexNoPrefix.length > 64) throw new Error(`value does not fit in a word: ${hexNoPrefix}`);
  return hexNoPrefix.padStart(64, "0");
}

export function encodeAddress(value: string): string {
  if (!HEX_ADDRESS.test(value)) {
    throw new Error(`not a 20-byte hex address: "${value}"`);
  }
  // Lowercased for encoding only. EIP-55 case is a checksum for humans and is
  // meaningless on the wire; the caller keeps the checksummed form for display.
  return word(value.slice(2).toLowerCase());
}

export function encodeUint256(value: string | bigint): string {
  const n = typeof value === "bigint" ? value : BigInt(value);
  if (n < 0n) throw new Error(`uint256 cannot be negative: ${n}`);
  if (n > UINT256_MAX) throw new Error(`value ${n} exceeds uint256 max`);
  return word(n.toString(16));
}
