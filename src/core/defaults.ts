import type { SettlementMode } from "./types.js";

/** I5. Real settlement is always an explicit opt-in. */
export const DEFAULT_SETTLEMENT_MODE: SettlementMode = "dry-run";

/** Kill switch default. Honored before policy evaluation. */
export const DEFAULT_SETTLEMENT_ENABLED = true;

/** Clock-skew allowance and authorization window, in seconds. */
export const VALID_AFTER_SKEW_SECONDS = 60;
export const VALID_BEFORE_WINDOW_SECONDS = 900;
