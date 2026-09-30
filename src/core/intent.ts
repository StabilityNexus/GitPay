import type { Intent } from "./types.js";

// CAIP-2: namespace:reference. Says nothing about what the namespace means.
const CAIP2 = /^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$/;
const ATOMIC_AMOUNT = /^[0-9]+$/;

export interface RawIntent {
  platform?: string | undefined;
  repo?: string | undefined;
  ref?: string | undefined;
  actor?: string | undefined;
  recipient?: string | undefined;
  amount?: string | undefined;
  asset?: string | undefined;
  network?: string | undefined;
  scheme?: string | undefined;
  round?: string | undefined;
}

function required(raw: RawIntent, field: keyof RawIntent): string {
  const value = raw[field]?.trim();
  if (!value) throw new Error(`Missing required intent field: ${field}`);
  return value;
}

export function parseIntent(raw: RawIntent): Intent {
  const platform = (raw.platform ?? "github").trim();
  if (platform !== "github" && platform !== "gitlab") {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const repo = required(raw, "repo");
  const ref = required(raw, "ref");
  const actor = required(raw, "actor");
  const recipient = required(raw, "recipient");
  const amount = required(raw, "amount");
  const asset = required(raw, "asset");
  const network = required(raw, "network");
  const scheme = required(raw, "scheme");

  if (!ATOMIC_AMOUNT.test(amount)) {
    throw new Error(
      `amount must be a whole number of atomic units as a string, got "${amount}"`,
    );
  }
  if (!CAIP2.test(network)) {
    throw new Error(`network must be a CAIP-2 identifier, got "${network}"`);
  }

  const round = Number(raw.round ?? "0");
  if (!Number.isInteger(round) || round < 0) {
    throw new Error(`round must be a non-negative integer, got "${raw.round}"`);
  }

  const source =
    platform === "github"
      ? ({ platform, repo, ref, actor } as const)
      : ({ platform, project: repo, ref, actor } as const);

  return { source, recipient, amount, asset, network, scheme, round };
}
