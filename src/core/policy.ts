import { XOpsError, type ErrorCode } from "./errors.js";

/**
 * L1 POLICY. Evaluated offline, before a resolver or a driver is reached.
 *
 * Conditions are **named constants**, never an expression language. An
 * expression language would be a permanent security surface: whoever can edit
 * the expression can rewrite the rule that is supposed to constrain them, and
 * every future evaluator bug is a money bug. A fixed set of names is auditable
 * by reading this file.
 *
 * Adding a condition means adding a name here and a fact for it — deliberately
 * more work than writing a one-line expression, because each one is a rule
 * about spending money.
 */
export type PolicyConditionName =
  | "SETTLEMENT_ENABLED"
  | "MAINTAINER_APPROVED"
  | "AMOUNT_WITHIN_CAP";

/**
 * What the adopter declares. Shaped as a plain record rather than read from
 * inputs directly so that the planned `.xops.yml` loader can produce the same
 * value without touching the evaluator.
 */
export interface Policy {
  /**
   * Kill switch. Evaluated FIRST, before every other condition — the point of a
   * kill switch is that it does not depend on the rest of the configuration
   * being sane. Distinct from `mode: dry-run`: dry-run still resolves and
   * reports what would happen, this refuses outright.
   */
  enabled: boolean;
  /**
   * I10, in atomic units. Undefined means no XOps-level cap, in which case the
   * Safe's own allowance period cap is the only ceiling.
   */
  maxPerPayout: string | undefined;
}

export interface PolicyFacts {
  /**
   * Whether the person who asked for this payout is trusted to spend the
   * project's money.
   *
   * `undefined` means the question does not arise: the run was configured by a
   * workflow rather than typed into a comment, and editing a workflow already
   * requires write access. Leaving it undefined *skips* the condition rather
   * than failing it — treating "no comment author" as "not a maintainer" would
   * deny every scheduled or merge-triggered payout.
   */
  actorIsMaintainer: boolean | undefined;
  /** Atomic units, as it will reach the driver. */
  amount: string;
}

export interface ConditionResult {
  name: PolicyConditionName;
  /** `skip` is not a pass — it records that the condition did not apply. */
  status: "pass" | "fail" | "skip";
  /** Why, in terms a maintainer reading a PR comment can act on. */
  evidence: string;
}

export interface PolicyDecision {
  allowed: boolean;
  conditions: ConditionResult[];
}

/**
 * Each condition carries its own error code. A cap breach is not the same event
 * as an outsider being refused, and a maintainer debugging one should not have
 * to read prose to tell them apart.
 */
const CODES: Record<PolicyConditionName, ErrorCode> = {
  SETTLEMENT_ENABLED: "POLICY_DENIED",
  MAINTAINER_APPROVED: "POLICY_DENIED",
  AMOUNT_WITHIN_CAP: "AMOUNT_CAP_EXCEEDED",
};

/**
 * Pure and total: no throwing, no network, no clock. Every condition is
 * evaluated so the result table shows the full picture rather than stopping at
 * the first failure — a maintainer fixing one problem should be able to see the
 * next one in the same run.
 *
 * Order still matters for which code is reported: the kill switch comes first.
 */
export function evaluate(policy: Policy, facts: PolicyFacts): PolicyDecision {
  const conditions: ConditionResult[] = [
    policy.enabled
      ? { name: "SETTLEMENT_ENABLED", status: "pass", evidence: "settlement is enabled" }
      : {
          name: "SETTLEMENT_ENABLED",
          status: "fail",
          evidence: "settlement is disabled by the kill switch",
        },
    maintainerCondition(facts.actorIsMaintainer),
    capCondition(policy.maxPerPayout, facts.amount),
  ];

  return { allowed: conditions.every((c) => c.status !== "fail"), conditions };
}

function maintainerCondition(actorIsMaintainer: boolean | undefined): ConditionResult {
  if (actorIsMaintainer === undefined) {
    return {
      name: "MAINTAINER_APPROVED",
      status: "skip",
      evidence: "not comment-triggered, so there is no comment author to authorize",
    };
  }
  return actorIsMaintainer
    ? { name: "MAINTAINER_APPROVED", status: "pass", evidence: "the author may spend" }
    : {
        name: "MAINTAINER_APPROVED",
        status: "fail",
        evidence: "the comment author is not permitted to spend",
      };
}

function capCondition(maxPerPayout: string | undefined, amount: string): ConditionResult {
  if (maxPerPayout === undefined) {
    return {
      name: "AMOUNT_WITHIN_CAP",
      status: "skip",
      evidence: "no max_per_payout set; the Safe's allowance period cap is the only ceiling",
    };
  }

  const cap = BigInt(maxPerPayout);
  const value = BigInt(amount);

  return value <= cap
    ? {
        name: "AMOUNT_WITHIN_CAP",
        status: "pass",
        evidence: `${amount} is within the cap of ${maxPerPayout}`,
      }
    : {
        name: "AMOUNT_WITHIN_CAP",
        status: "fail",
        evidence: `${amount} exceeds the cap of ${maxPerPayout} (atomic units)`,
      };
}

/**
 * I10 lives here: this is what stands between an amount and a driver. Call it
 * before anything is resolved, signed or recorded.
 */
export function assertAllowed(decision: PolicyDecision): void {
  const failed = decision.conditions.find((c) => c.status === "fail");
  if (!failed) return;

  throw new XOpsError(CODES[failed.name], `${failed.name}: ${failed.evidence}`, {
    condition: failed.name,
    conditions: decision.conditions,
  });
}

/** One line per condition. Rendered in the log, and in a PR comment later. */
export function format(decision: PolicyDecision): string {
  const mark = { pass: "PASS", fail: "FAIL", skip: "n/a " } as const;
  return decision.conditions
    .map((c) => `  [${mark[c.status]}] ${c.name} — ${c.evidence}`)
    .join("\n");
}
