export const ERROR_CODES = [
  "AUTH_ALREADY_USED",
  "AUTH_EXPIRED",
  "AUTH_NOT_YET_VALID",
  "SIGNER_MISMATCH",
  "DOMAIN_MISMATCH",
  "AMOUNT_MISMATCH",
  "RECIPIENT_MISMATCH",
  "IDENTITY_UNRESOLVED",
  "POLICY_DENIED",
  "AMOUNT_CAP_EXCEEDED",
  "INSUFFICIENT_BALANCE",
  "INSUFFICIENT_GAS",
  "SIMULATION_REVERT",
  "RPC_UNAVAILABLE",
  "NONCE_CONFLICT",
  "DRIVER_NOT_FOUND",
  "TIER_VIOLATION",
  "NO_REPLAY_PROTECTION",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type Retry = "no" | "user" | "auto";

export interface ErrorSpec {
  meaning: string;
  /** Safe to render in a PR comment. Never a stack trace. */
  comment: string;
  retry: Retry;
  /** AUTH_ALREADY_USED is the one code that means the payout happened (I8). */
  success: boolean;
}

export const ERRORS: Record<ErrorCode, ErrorSpec> = {
  AUTH_ALREADY_USED: {
    meaning: "Authorization nonce already consumed",
    comment: "Already paid — see the original transaction.",
    retry: "no",
    success: true,
  },
  AUTH_EXPIRED: {
    meaning: "Past validBefore",
    comment: "Authorization expired. Re-sign; the window is 15 minutes.",
    retry: "user",
    success: false,
  },
  AUTH_NOT_YET_VALID: {
    meaning: "Before validAfter",
    comment: "Clock skew between signer and node. Wait 60 seconds and retry.",
    retry: "auto",
    success: false,
  },
  SIGNER_MISMATCH: {
    meaning: "Recovered signer is not the expected payer",
    comment: "Wrong wallet connected. Sign with the treasury account.",
    retry: "user",
    success: false,
  },
  DOMAIN_MISMATCH: {
    meaning: "Typed-data domain does not match the asset registry",
    comment: "Check the `network` and `asset` inputs.",
    retry: "no",
    success: false,
  },
  AMOUNT_MISMATCH: {
    meaning: "Payload amount differs from requirements",
    comment: "The payload was tampered with and was not settled.",
    retry: "no",
    success: false,
  },
  RECIPIENT_MISMATCH: {
    meaning: "Payload recipient differs from requirements",
    comment: "The payload was tampered with and was not settled.",
    retry: "no",
    success: false,
  },
  IDENTITY_UNRESOLVED: {
    meaning: "No resolver matched the recipient identity",
    comment: "Register a payout address or use an inline address.",
    retry: "user",
    success: false,
  },
  POLICY_DENIED: {
    meaning: "A policy condition failed",
    comment: "A required policy condition was not met. Nothing was settled.",
    retry: "no",
    success: false,
  },
  AMOUNT_CAP_EXCEEDED: {
    meaning: "Amount above policy.max_per_payout",
    comment: "Above the configured per-payout cap. Raise the cap or split the payout.",
    retry: "no",
    success: false,
  },
  INSUFFICIENT_BALANCE: {
    meaning: "Treasury balance short of the payout",
    comment: "The treasury does not hold enough of the asset.",
    retry: "user",
    success: false,
  },
  INSUFFICIENT_GAS: {
    meaning: "Broadcasting account cannot pay fees",
    comment: "Fund the broadcasting account with the network's native token.",
    retry: "user",
    success: false,
  },
  SIMULATION_REVERT: {
    meaning: "Pre-broadcast simulation reverted",
    comment: "Simulation reverted before broadcast, so no fees were spent.",
    retry: "no",
    success: false,
  },
  RPC_UNAVAILABLE: {
    meaning: "Every configured endpoint failed",
    comment: "No endpoint responded. Retryable; set `rpc_url` to override.",
    retry: "auto",
    success: false,
  },
  NONCE_CONFLICT: {
    meaning: "A different transaction from the broadcasting account used this nonce",
    comment:
      "Another transaction took this payout's nonce, so the payout was not sent. " +
      "Check the broadcasting account's history, then retry with a new `round`.",
    retry: "user",
    success: false,
  },
  DRIVER_NOT_FOUND: {
    meaning: "No driver registered for this network and scheme",
    comment: "Unsupported network/scheme combination.",
    retry: "no",
    success: false,
  },
  TIER_VIOLATION: {
    meaning: "Driver requires secrets or custody and cannot run in Tier 0",
    comment: "This driver must run as a separate service you operate.",
    retry: "no",
    success: false,
  },
  NO_REPLAY_PROTECTION: {
    meaning: "Driver does not declare an exactly-once guarantee",
    comment: "Cannot settle without replay protection.",
    retry: "no",
    success: false,
  },
};

export class GitPayError extends Error {
  readonly code: ErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: ErrorCode, message?: string, details: Record<string, unknown> = {}) {
    super(message ?? `${code}: ${ERRORS[code].meaning}`);
    this.name = "GitPayError";
    this.code = code;
    this.details = details;
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}

/** I8 lives here: one code in the taxonomy is a success. */
export function isSuccessCode(code: ErrorCode): boolean {
  return ERRORS[code].success;
}
