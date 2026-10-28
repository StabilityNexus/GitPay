// ABI encoding for ERC-20 `transferFrom`. Chain primitives live here and only
// here — core and adapters may not import this file (I1).
//
//   function transferFrom(address from, address to, uint256 value) returns (bool)
//
// Unlike the AllowanceModule, `value` is a full uint256.

import { encodeAddress, encodeUint256 } from "../evm/abi.js";

export const TRANSFER_FROM_SIGNATURE = "transferFrom(address,address,uint256)";

/**
 * keccak256(SIGNATURE)[0..4]. Pinned as a constant so encoding costs no hash,
 * and re-derived in the tests so it can never silently drift from the signature
 * string above.
 */
export const TRANSFER_FROM_SELECTOR = "0x23b872dd";

export interface TransferFromCall {
  /** The wallet that approved the delegate, and whose tokens move. */
  from: string;
  /** Recipient. */
  to: string;
  /** Atomic units. */
  amount: string | bigint;
}

export function encodeTransferFrom(call: TransferFromCall): string {
  return (
    TRANSFER_FROM_SELECTOR +
    encodeAddress(call.from) +
    encodeAddress(call.to) +
    encodeUint256(call.amount)
  );
}
