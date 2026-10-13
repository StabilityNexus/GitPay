import { useEffect, useRef, useState } from "react";
import { Check, Reveal, SectionHead, Spot } from "../components/ui";
import { useCountUp, useInView } from "../hooks";

const STATS: Array<[number, string]> = [
  [0, "servers run by the GitPay project"],
  [0, "tokens GitPay holds, pools or routes"],
  [2, "runtime dependencies, exact-pinned"],
  [13, "invariants enforced in CI"],
];

function Stat({ n, label, play }: { n: number; label: string; play: number }) {
  const value = useCountUp(n, n > 0 ? play : 0, 1100);
  return (
    <Spot className="stat">
      <b>{Math.round(value)}</b>
      <span>{label}</span>
    </Spot>
  );
}

const PROTECTIONS = [
  <>
    Default mode is <code>dry-run</code>. Real payouts need <code>mode: self</code>; an unknown mode is refused.
  </>,
  <>Every payout is simulated first. An empty Safe or spent allowance fails for zero gas.</>,
  <>The receipt is written before broadcast, so a crashed run can never cause a double payment.</>,
  <>Only bot and maintainer receipts count, so nobody can fake one to block a payout.</>,
];

export function Security() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, 0.5);
  const [play, setPlay] = useState(0);
  useEffect(() => {
    if (inView) setPlay((p) => (p === 0 ? 1 : p));
  }, [inView]);

  return (
    <section id="trust">
      <div className="wrap">
        <SectionHead kicker="Security" title="Small enough to read. Strict enough to trust." />
        <div className="stats" ref={ref}>
          {STATS.map(([n, label]) => (
            <Stat key={label} n={n} label={label} play={play} />
          ))}
        </div>

        <Reveal className="window keynote">
          <div>
            <span className="warn">⚠ Stated plainly</span>
            <h3>The delegate key</h3>
            <p>
              GitPay puts one key in your CI on purpose: the delegate the Safe's spending limit was granted to. Its
              power is bounded on-chain and revocable.
            </p>
            <p>
              If it leaks, it can move up to the allowance each period, to any address, until a Safe owner removes it.
              The cap resets, so losses add up. Size the cap at what you can afford to lose in one period, and revoke
              fast.
            </p>
          </div>
          <div>
            <h3>What else protects a payout</h3>
            <ul>
              {PROTECTIONS.map((p, i) => (
                <li key={i}>
                  <Check />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
