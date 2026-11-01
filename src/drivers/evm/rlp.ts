// Minimal RLP, enough to encode an EIP-1559 transaction. Chain primitives live
// in drivers only (I1).

export type RlpInput = Uint8Array | readonly RlpInput[];

/**
 * Integers are encoded as the shortest big-endian byte string with no leading
 * zeros, and zero is the empty string. Getting this wrong produces a
 * structurally valid transaction that recovers to the wrong sender.
 */
export function toMinimalBytes(value: bigint): Uint8Array {
  if (value < 0n) throw new Error(`cannot encode a negative integer: ${value}`);
  if (value === 0n) return new Uint8Array(0);
  let hex = value.toString(16);
  if (hex.length % 2 === 1) hex = `0${hex}`;
  return hexToBytes(`0x${hex}`);
}

/**
 * Errors name the problem, never the input: one caller passes the delegate's
 * private key. And every character is checked, because `parseInt("0g", 16)` is
 * 0 — a typo would otherwise become a different value instead of an error.
 */
export function hexToBytes(hex: string): Uint8Array {
  const body = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (body.length % 2 !== 0) throw new Error(`odd-length hex (${body.length} digits)`);
  if (!/^[0-9a-fA-F]*$/.test(body)) throw new Error("not hex");
  const out = new Uint8Array(body.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(body.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  let out = "0x";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Length prefix: `short + len`, or `long + lenOfLen` followed by the length. */
function prefix(length: number, short: number, long: number): Uint8Array {
  if (length <= 55) return Uint8Array.of(short + length);
  const lengthBytes = toMinimalBytes(BigInt(length));
  return concat([Uint8Array.of(long + lengthBytes.length), lengthBytes]);
}

export function rlpEncode(input: RlpInput): Uint8Array {
  if (input instanceof Uint8Array) {
    // A single byte below 0x80 is its own encoding.
    if (input.length === 1 && (input[0] as number) < 0x80) return input;
    return concat([prefix(input.length, 0x80, 0xb7), input]);
  }

  const payload = concat(input.map(rlpEncode));
  return concat([prefix(payload.length, 0xc0, 0xf7), payload]);
}
