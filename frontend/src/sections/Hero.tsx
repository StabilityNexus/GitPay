import { useEffect, useRef, useState } from "react";
import { Check, Dots, Live } from "../components/ui";
import { cx, useCountUp, useInView, useInterval, usePrefersReducedMotion } from "../hooks";

const WORDS = ["contributors", "bounty hunters", "reviewers", "translators"];

function RotatingWord() {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  useInterval(() => setI((n) => (n + 1) % WORDS.length), reduced ? null : 2600);
  return (
    <span className="rot">
      <span key={i} className={i === 0 ? undefined : "in"}>
        {WORDS[i]}
      </span>
    </span>
  );
}

const STEPS = [
  { label: "parse /send → intent · 25000000 USDC", result: "ok" },
  { label: "SETTLEMENT_ENABLED", result: "PASS" },
  { label: "MAINTAINER_APPROVED · MEMBER", result: "PASS" },
  { label: "AMOUNT_WITHIN_CAP · 25 ≤ 50", result: "PASS" },
  { label: "ledger · no receipt for this key", result: "ok" },
  { label: "simulate eth_call · estimate gas · sign", result: "ok" },
  { label: "write receipt (broadcasting) → broadcast", result: "ok" },
];
const DONE = STEPS.length + 1;

/** An example run that rests complete, then replays itself while on screen. */
function HeroRun() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const [stage, setStage] = useState(DONE);
  const [runs, setRuns] = useState(0);
  const played = useRef(false);

  useEffect(() => {
    if (reduced || !visible) return;
    const delay = stage === DONE ? (played.current ? 5200 : 3200) : stage === 0 ? 1400 : 620;
    const t = setTimeout(() => {
      if (document.hidden) return;
      played.current = true;
      if (stage === DONE) {
        setStage(0);
      } else {
        if (stage + 1 === DONE) setRuns((r) => r + 1);
        setStage(stage + 1);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [stage, visible, reduced]);

  const amount = useCountUp(25, runs, 700);
  const done = stage === DONE;

  return (
    <div className="window beam-border" ref={ref} aria-label="Example pull request with a GitPay run">
      <div className="win-bar">
        <Dots />
        <span className="title">acme/widgets · pull/42</span>
        <Live>example run</Live>
      </div>
      <div className="pr">
        <div className="pr-title">
          Fix rounding in amount parser <span className="num">#42</span> <span className="merged">Merged</span>
        </div>
        <div className="cmt">
          <div className="av" aria-hidden="true">
            MK
          </div>
          <div className="bub">
            <div className="bub-h">
              <b>maintainer-kim</b> commented <span className="tag">Member</span>
            </div>
            <div className="cmd">
              <span className="sl">/send</span> 0x9f3a51c0e4b2d8a7f6e1c3b9a0d2e4f6a8b07c21 25 USDC
              {stage === 0 && <span className="caret" aria-hidden="true" />}
            </div>
          </div>
        </div>
        <div className="cmt">
          <div className="av bot" aria-hidden="true">
            GP
          </div>
          <div className="bub">
            <div className="run-h">
              <span className="wf">GitPay / pay</span>
              {done ? (
                <span className="state">
                  <Check size={12} stroke={2.2} />
                  completed in 14s
                </span>
              ) : (
                <span className="state busy">
                  <span className="spin" />
                  {stage === 0 ? "queued" : "in progress"}
                </span>
              )}
            </div>
            <ol className="steps">
              {STEPS.map((s, i) => {
                const n = i + 1;
                return (
                  <li key={s.label} className={cx(n > stage && "pending", n === stage + 1 && stage > 0 && !done && "active")}>
                    <span className="ic">
                      <Check size={9} stroke={2.6} />
                    </span>
                    <em>{s.label}</em>
                    <span className="r">{s.result}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
        <div key={runs} className={cx("settle", !done && "pending", done && runs > 0 && "pop")}>
          <span className="pill pill-ok">settled</span>
          <span className="flowline">Safe → 0x9f3a…7c21 · tx 0x4c1e…a90b</span>
          <span className="amt">+{done ? amount.toFixed(2) : "0.00"} USDC</span>
        </div>
      </div>
    </div>
  );
}

function GitHubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

export function Hero() {
  return (
    <div className="wrap">
      <div className="hero">
        <div className="hero-copy">
          <a className="announce" href="https://github.com/StabilityNexus/GitPay/releases/latest" target="_blank" rel="noopener">
            <b>v1</b> Now live on Ethereum Sepolia <span aria-hidden="true">→</span>
          </a>
          <h1>
            <span className="sr">Pay contributors with one comment.</span>
            <span aria-hidden="true">
              Pay <RotatingWord />
              <span className="grad">with one comment.</span>
            </span>
          </h1>
          <p className="lede">
            GitPay is a GitHub Action that settles payouts straight from your project's Safe. A maintainer types{" "}
            <code>/send</code> on the pull request, your declared policy approves it, and the receipt lands back in
            the thread. No servers, no custody, no per-payout signing.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="#start">
              Start in dry-run <span className="arr" aria-hidden="true">→</span>
            </a>
            <a className="btn btn-ghost" href="https://github.com/StabilityNexus/GitPay" target="_blank" rel="noopener">
              <GitHubMark />
              Star on GitHub
            </a>
          </div>
          <div className="facts">
            {["Runs in your own CI", "Funds stay in your Safe", "Zero secrets to try it"].map((f) => (
              <span key={f}>
                <Check />
                {f}
              </span>
            ))}
          </div>
        </div>
        <HeroRun />
      </div>
    </div>
  );
}
