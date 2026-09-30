// Mirrors x402 v2. Do not invent fields.
// L0-L5 all speak these types. None of them knows what a chain is.

export interface PaymentRequirements {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

export interface PaymentPayload {
  x402Version: 2;
  scheme: string;
  network: string;
  // Scheme-defined. Core NEVER reads a field inside this.
  payload: Record<string, unknown>;
}

export interface SettlementResponse {
  success: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
  errorReason?: string;
}

export type IntentSource =
  | { platform: "github"; repo: string; ref: string; actor: string }
  | { platform: "gitlab"; project: string; ref: string; actor: string };

export interface Intent {
  source: IntentSource;
  recipient: string;
  amount: string;
  asset: string;
  network: string;
  scheme: string;
  round: number;
}

export interface IdempotencyKey {
  v: 1;
  source: { platform: string; repo: string; ref: string };
  recipient: string;
  asset: string;
  network: string;
  round: number;
  // `amount` deliberately absent — see AGENTS.md
}

export interface PayoutTarget {
  rail: string;
  address: string;
  attestations?: unknown[];
  resolvedBy: string;
}

export type SettlementMode = "dry-run" | "facilitator" | "self" | "auto";
