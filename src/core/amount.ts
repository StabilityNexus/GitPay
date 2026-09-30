// Human amounts in, atomic units out. Pure string arithmetic — floats are not
// allowed anywhere near money, and `parseFloat("0.1")` is exactly why.

const DECIMAL = /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;

/**
 * Converts a human-typed decimal amount into atomic units.
 *
 * `toAtomic("10", 6)` is `"10000000"`. `toAtomic("2.5", 6)` is `"2500000"`.
 *
 * `decimals` is passed in, never inferred — the asset registry owns that value
 * (`REFERENCES.md`: resolve decimals from the registry, never infer). Getting it
 * wrong is a 10^n error in someone's payout, so this throws rather than guesses.
 */
export function toAtomic(human: string, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new Error(`decimals must be an integer between 0 and 36, got "${decimals}"`);
  }

  const value = human.trim();
  if (!DECIMAL.test(value)) {
    throw new Error(
      `amount must be a positive decimal number without separators, got "${human}"`,
    );
  }

  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > decimals) {
    throw new Error(
      `amount "${human}" has ${fraction.length} decimal places, but the asset has only ${decimals}`,
    );
  }

  // Strip leading zeros but always leave one digit behind.
  const atomic = `${whole}${fraction.padEnd(decimals, "0")}`.replace(/^0+(?=[0-9])/, "");

  if (/^0+$/.test(atomic)) {
    throw new Error(`amount must be greater than zero, got "${human}"`);
  }

  return atomic;
}
