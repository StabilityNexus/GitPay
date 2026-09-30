/**
 * Reads a GitHub Actions input.
 *
 * The empty-string handling is the whole point. A *declared* input that a
 * workflow does not pass arrives as `INPUT_NAME=""`, not as absent. So
 * `input("repo") ?? process.env.GITHUB_REPOSITORY` silently yields `""` —
 * `??` only falls through on null and undefined — and every downstream
 * fallback and default is defeated by a value that looks present.
 *
 * Treating blank as absent is what callers actually mean, and it makes
 * declaring an input a safe, behaviour-preserving change.
 */
export function readInput(name: string): string | undefined {
  const value = process.env[`INPUT_${name.toUpperCase().replace(/ /g, "_")}`];
  if (value === undefined) return undefined;
  return value.trim() === "" ? undefined : value;
}
