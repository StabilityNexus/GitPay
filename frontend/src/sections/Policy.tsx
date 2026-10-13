import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Dots, Live, Reveal, SectionHead, Spot } from "../components/ui";
import { cx, usePrefersReducedMotion } from "../hooks";
import { GitPayError, assertAllowed, canonical, evaluate, format, toAtomic } from "../lib/core";

const DECIMALS = 6; // USDC
const RECIPIENT = "0x9f3a51c0e4b2d8a7f6e1c3b9a0d2e4f6a8b07c21";
const ASSOCIATIONS = ["OWNER", "MEMBER", "COLLABORATOR", "CONTRIBUTOR", "FIRST_TIME_CONTRIBUTOR", "NONE"] as const;
const GRANTABLE = ["OWNER", "MEMBER", "COLLABORATOR", "CONTRIBUTOR"] as const;

type Trigger = "comment" | "workflow";
type Mode = "dry-run" | "self";
type Status = "invalid" | "error" | "dry-run" | "already-paid" | "settled";

interface Outcome {
  status: Status;
  verdict: string;
  why: string;
  log: ReactNode[];
}

const PILL: Record<Status, string> = {
  invalid: "pill-bad",
  error: "pill-bad",
  "dry-run": "pill-mid",
  "already-paid": "pill-ok",
  settled: "pill-ok",
};

/** Colors the Action's own `format()` output: `  [PASS] NAME — evidence`. */
function colorize(line: string, i: number): ReactNode {
  const m = /^(\s*)\[(PASS|FAIL|n\/a )\](.*)$/.exec(line);
  if (!m) return <span key={i}>{line}</span>;
  const cls = m[2] === "PASS" ? "p" : m[2] === "FAIL" ? "f" : "s";
  return (
    <span key={i}>
      {m[1]}
      <span className={cls}>[{m[2]}]</span>
      {m[3]}
    </span>
  );
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function Seg<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: T;
  options: Array<[T, string]>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <label key={v}>
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
          <span>{text}</span>
        </label>
      ))}
    </div>
  );
}

function Toggle({ id, checked, disabled, onChange, children }: { id: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input type="checkbox" id={id} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="sw" aria-hidden="true" />
      <span>{children}</span>
    </label>
  );
}

function Playground() {
  const reduced = usePrefersReducedMotion();
  const [trigger, setTrigger] = useState<Trigger>("comment");
  const [assoc, setAssoc] = useState<(typeof ASSOCIATIONS)[number]>("MEMBER");
  const [amountRaw, setAmountRaw] = useState("25");
  const [enabled, setEnabled] = useState(true);
  const [allowed, setAllowed] = useState<string[]>(["OWNER", "MEMBER", "COLLABORATOR"]);
  const [capRaw, setCapRaw] = useState("50");
  const [mode, setMode] = useState<Mode>("dry-run");
  const [round, setRound] = useState("0");
  const [paid, setPaid] = useState(false);

  const outcome = useMemo<Outcome>(() => {
    const invalid = (why: string): Outcome => ({ status: "invalid", verdict: "Fix the input first.", why, log: [] });

    let amount: string;
    let cap: string | undefined;
    try {
      amount = toAtomic(amountRaw, DECIMALS);
    } catch (e) {
      return invalid(message(e));
    }
    try {
      cap = capRaw.trim() === "" ? undefined : toAtomic(capRaw, DECIMALS);
    } catch (e) {
      return invalid(`max_per_payout: ${message(e)}`);
    }
    if (!/^(0|[1-9][0-9]*)$/.test(round.trim())) return invalid("round is a whole number: 0, 1, 2…");

    const decision = evaluate(
      { enabled, maxPerPayout: cap },
      { actorIsMaintainer: trigger === "comment" ? allowed.includes(assoc) : undefined, amount },
    );
    const log: ReactNode[] = [<span key="h" className="k">policy:</span>, ...format(decision).split("\n").map(colorize)];

    let code: string | undefined;
    try {
      assertAllowed(decision);
    } catch (e) {
      code = e instanceof GitPayError ? e.code : "POLICY_DENIED";
    }

    if (code) {
      const failed = decision.conditions.find((c) => c.status === "fail")!;
      log.push(<span key="b"> </span>, <span key="s" className="f">STATUS=error  ERROR_CODE={code}</span>);
      return {
        status: "error",
        verdict: "Refused before anything was signed.",
        why:
          failed.name === "SETTLEMENT_ENABLED"
            ? "The kill switch wins over everything else. Nothing is resolved, signed or recorded."
            : failed.name === "MAINTAINER_APPROVED"
              ? `A ${assoc} is not in allowed_associations, so the comment is not a payment instruction.`
              : "The amount is above max_per_payout, so it never reaches the settlement driver.",
        log,
      };
    }

    const key = canonical({
      v: 1,
      source: { platform: "github", repo: "acme/widgets", ref: "refs/pull/42" },
      recipient: RECIPIENT,
      network: "eip155:11155111",
      asset: "USDC",
      round: Number(round.trim()),
    });
    log.push(
      <span key="key">
        <span className="a">idempotency key:</span> {key}
      </span>,
    );

    if (mode === "dry-run") {
      log.push(<span key="d" className="k">mode: dry-run — nothing was settled.</span>);
      return {
        status: "dry-run",
        verdict: "Allowed. Nothing moved.",
        why: `A real run with these inputs would pay ${amountRaw.trim()} USDC. Switch to mode: self to see it settle.`,
        log,
      };
    }
    if (paid) {
      log.push(
        <span key="l"><span className="a">ledger:</span> trusted receipt found for this key</span>,
        <span key="s" className="p">STATUS=already-paid  TX_HASH=0x4c1e…a90b</span>,
      );
      return {
        status: "already-paid",
        verdict: "Already paid. Reported as success.",
        why: "The PR receipt carries this exact key, so the driver is never reached and the original transaction is reported. Change round to pay again on purpose — watch the key's last field.",
        log,
      };
    }
    log.push(
      <span key="l"><span className="a">ledger:</span> no receipt → simulate → sign → record "broadcasting" → send</span>,
      <span key="s" className="p">STATUS=settled  TX_HASH=0x4c1e…a90b</span>,
    );
    return {
      status: "settled",
      verdict: `Paid ${amountRaw.trim()} USDC from your Safe.`,
      why: "Policy passed, no receipt existed, the call simulated cleanly, and the receipt was written before the broadcast.",
      log,
    };
  }, [trigger, assoc, amountRaw, enabled, allowed, capRaw, mode, round, paid]);

  // The log is keyed by status, so it remounts (and flashes) only when the
  // outcome changes — and never on first paint.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  const flash = !reduced && mounted.current;

  const toggleAllowed = (a: string) => setAllowed((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]));

  return (
    <Reveal className="window console">
      <div className="win-bar">
        <Dots />
        <span className="title">policy playground · runs the Action's own src/core/policy.ts</span>
        <Live>interactive</Live>
      </div>

      <form className="controls" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend>The request</legend>
          <Seg name="trigger" label="Trigger" value={trigger} onChange={setTrigger} options={[["comment", "/send comment"], ["workflow", "workflow inputs"]]} />
          <div className="row2">
            <label className="field" htmlFor="assoc">
              Commenter is a
              <select id="assoc" value={assoc} disabled={trigger !== "comment"} onChange={(e) => setAssoc(e.target.value as (typeof ASSOCIATIONS)[number])}>
                {ASSOCIATIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="field" htmlFor="amount">
              Amount (USDC)
              <input type="text" id="amount" inputMode="decimal" value={amountRaw} onChange={(e) => setAmountRaw(e.target.value)} />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Your policy</legend>
          <Toggle id="enabled" checked={enabled} onChange={setEnabled}>
            <code>enabled</code> · kill switch, checked first
          </Toggle>
          <div>
            <p className="hint" style={{ marginBottom: 8 }}>
              <code>allowed_associations</code> · who may type <code>/send</code>
            </p>
            <div className="chips">
              {GRANTABLE.map((a) => (
                <label key={a} className="chip">
                  <input type="checkbox" checked={allowed.includes(a)} onChange={() => toggleAllowed(a)} />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="field" htmlFor="cap">
            <span>
              <code>max_per_payout</code> · largest single payout, blank for none
            </span>
            <input type="text" id="cap" inputMode="decimal" value={capRaw} onChange={(e) => setCapRaw(e.target.value)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>The run</legend>
          <Seg name="mode" label="Mode" value={mode} onChange={setMode} options={[["dry-run", "mode: dry-run"], ["self", "mode: self"]]} />
          <div className="row2">
            <label className="field" htmlFor="round">
              <span>
                <code>round</code> · bump to pay again
              </span>
              <input type="text" id="round" inputMode="numeric" value={round} onChange={(e) => setRound(e.target.value)} />
            </label>
          </div>
          <Toggle id="paid" checked={paid} disabled={mode !== "self"} onChange={setPaid}>
            A trusted receipt already exists for this payout <span className="hint">(self mode)</span>
          </Toggle>
        </fieldset>
      </form>

      <div className="output" aria-live="polite">
        <div className="verdict">
          <span className={cx("pill", PILL[outcome.status])}>{outcome.status}</span>
          <strong>{outcome.verdict}</strong>
        </div>
        <p className="why">{outcome.why}</p>
        <div>
          <p className="lbl-out">run log</p>
          <div key={outcome.status} className={cx("term", flash && "flash")}>
            {outcome.log.map((line, i) => (
              <span key={i}>
                {line}
                {"\n"}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="lbl-out">your workflow</p>
          <div className="term">
            <span className="a">uses:</span> <span className="k">StabilityNexus/GitPay@v1</span>
            {"\n"}
            <span className="a">with:</span>
            {"\n  "}
            <span className="a">mode:</span> <span className="k">{mode}</span>
            {"\n  "}
            <span className="a">enabled:</span> <span className="k">"{String(enabled)}"</span>
            {"\n  "}
            <span className="a">allowed_associations:</span> <span className="k">"{allowed.join(",")}"</span>
            {"\n  "}
            <span className="a">max_per_payout:</span>{" "}
            {capRaw.trim() === "" ? (
              <span className="s"># unset: the Safe period cap is the only ceiling</span>
            ) : (
              <span className="k">"{capRaw.trim()}"</span>
            )}
            {round.trim() !== "0" && (
              <>
                {"\n  "}
                <span className="a">round:</span> <span className="k">"{round.trim()}"</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function Policy() {
  return (
    <section id="policy">
      <div className="wrap">
        <SectionHead
          kicker="Declared policy"
          title="Your rules, in the workflow file. Every check, in every run."
          lede="Policy is three inputs on the Action, not a script. Try them here: this playground runs GitPay's own policy evaluator, amount parser and idempotency key in your browser, so the log below is exactly what the Action prints."
        />
        <Playground />
        <div className="rules">
          <Spot className="card">
            <h3>Named rules, no expressions</h3>
            <p>Conditions are a fixed list you can audit in one file. An expression language would let whoever edits it rewrite the rule meant to constrain them.</p>
          </Spot>
          <Spot className="card">
            <h3>Every check, every run</h3>
            <p>All conditions are evaluated, so one run shows every problem. The first failure decides the error code.</p>
          </Spot>
          <Spot className="card">
            <h3>Two ceilings, both needed</h3>
            <p>
              <code>max_per_payout</code> stops one bad command. The Safe's period cap stops a leaked key. Neither replaces the other.
            </p>
          </Spot>
        </div>
      </div>
    </section>
  );
}
