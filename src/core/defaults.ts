import type { SettlementMode } from "./types.js";

/** I5. Real settlement is always an explicit opt-in. */
export const DEFAULT_SETTLEMENT_MODE: SettlementMode = "dry-run";

/** The modes this build can run. `facilitator` and `auto` are specified, not built. */
export const SUPPORTED_SETTLEMENT_MODES = ["dry-run", "self"] as const;
export type SupportedSettlementMode = (typeof SUPPORTED_SETTLEMENT_MODES)[number];

/**
 * I5 again. The check has to be "is this a mode we know", never "is this not
 * dry-run": read the second way, a typo such as `dryrun` settles real money,
 * and a typo is not an explicit opt-in.
 */
export function parseSettlementMode(value: string | undefined): SupportedSettlementMode {
  const mode = (value ?? DEFAULT_SETTLEMENT_MODE).trim();
  if ((SUPPORTED_SETTLEMENT_MODES as readonly string[]).includes(mode)) {
    return mode as SupportedSettlementMode;
  }
  throw new Error(
    `Unknown mode "${mode}". Use "dry-run", or "self" to settle for real. Nothing was settled.`,
  );
}

/** Kill switch default. Honored before policy evaluation. */
export const DEFAULT_SETTLEMENT_ENABLED = true;

/** Clock-skew allowance and authorization window, in seconds. */
export const VALID_AFTER_SKEW_SECONDS = 60;
export const VALID_BEFORE_WINDOW_SECONDS = 900;
