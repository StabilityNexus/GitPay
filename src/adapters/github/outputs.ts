import { appendFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

export type OutputName =
  | "TX_HASH"
  | "EXPLORER_URL"
  | "STATUS"
  | "ERROR_CODE"
  | "IDEMPOTENCY_KEY";

/**
 * Written on every path, including failures. The delimiter is random per call so
 * a value containing a newline cannot forge another output.
 */
export function writeOutputs(values: Partial<Record<OutputName, string>>): void {
  const file = process.env["GITHUB_OUTPUT"];
  if (!file) return;

  const delimiter = `XOPS_EOF_${randomUUID()}`;
  let block = "";
  for (const [name, value] of Object.entries(values)) {
    block += `${name}<<${delimiter}\n${value ?? ""}\n${delimiter}\n`;
  }
  if (block) appendFileSync(file, block, "utf8");
}
