// ABI encoding for Safe's AllowanceModule. Chain primitives live here and only
// here — core and adapters may not import this file (I1).
//
// Verified signature, read from allowances/contracts/AllowanceModule.sol:
//
//   function executeAllowanceTransfer(
//       ISafe safe, address token, address payable to, uint96 amount,
//       address paymentToken, uint96 payment, address delegate, bytes signature
//   ) public
//
// `amount` and `payment` are uint96, NOT uint256. Assuming uint256 yields a
// different selector and the call reverts with nothing useful to read.

/** Interface types collapse to `address` for selector purposes. */
export const EXECUTE_ALLOWANCE_TRANSFER_SIGNATURE =
  "executeAllowanceTransfer(address,address,address,uint96,address,uint96,address,bytes)";

/**
 * keccak256(SIGNATURE)[0..4]. Pinned as a constant so encoding costs no hash,
 * and re-derived in the tests so it can never silently drift from the signature
 * string above.
 */
export const EXECUTE_ALLOWANCE_TRANSFER_SELECTOR = "0x4515641a";

const UINT96_MAX = (1n << 96n) - 1n;
const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HEX_BYTES = /^0x(?:[0-9a-fA-F]{2})*$/;

/** Left-pads to a 32-byte word. Addresses and integers are both right-aligned. */
function word(hexNoPrefix: string): string {
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

export function encodeUint96(value: string | bigint): string {
  const n = typeof value === "bigint" ? value : BigInt(value);
  if (n < 0n) throw new Error(`uint96 cannot be negative: ${n}`);
  if (n > UINT96_MAX) {
    throw new Error(`value ${n} exceeds uint96 max ${UINT96_MAX}`);
  }
  return word(n.toString(16));
}

/** Dynamic `bytes`: a length word, then the data padded up to a word boundary. */
function encodeBytesTail(value: string): string {
  if (!HEX_BYTES.test(value)) {
    throw new Error(`not an even-length hex byte string: "${value}"`);
  }
  const data = value.slice(2).toLowerCase();
  const byteLength = data.length / 2;
  const padded = byteLength === 0 ? "" : data.padEnd(Math.ceil(byteLength / 32) * 64, "0");
  return word(byteLength.toString(16)) + padded;
}

export interface AllowanceTransferCall {
  /** The Safe holding the funds. */
  safe: string;
  /** ERC-20 being paid out. */
  token: string;
  /** Recipient. */
  to: string;
  /** Atomic units. */
  amount: string | bigint;
  /** Zero address unless reimbursing a relayer in an ERC-20. */
  paymentToken?: string;
  /** Relayer reimbursement, atomic units. */
  payment?: string | bigint;
  /** The delegate the allowance belongs to. */
  delegate: string;
  /**
   * Delegate's signature over the transfer hash, or `0x` to rely on
   * `msg.sender == delegate`.
   *
   * Note the empty form carries NO replay protection: the module consumes the
   * nonce only as signed-hash input and never compares it to a stored value, so
   * a repeated identical call transfers again whenever the allowance still has
   * headroom.
   */
  signature?: string;
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/** Offset to the `bytes` tail: 8 head words. */
const BYTES_OFFSET = 8n * 32n;

export function encodeExecuteAllowanceTransfer(call: AllowanceTransferCall): string {
  const head = [
    encodeAddress(call.safe),
    encodeAddress(call.token),
    encodeAddress(call.to),
    encodeUint96(call.amount),
    encodeAddress(call.paymentToken ?? ZERO_ADDRESS),
    encodeUint96(call.payment ?? 0n),
    encodeAddress(call.delegate),
    word(BYTES_OFFSET.toString(16)),
  ].join("");

  return EXECUTE_ALLOWANCE_TRANSFER_SELECTOR + head + encodeBytesTail(call.signature ?? "0x");
}
