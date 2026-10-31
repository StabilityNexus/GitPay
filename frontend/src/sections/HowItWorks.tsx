import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Reveal, SectionHead, Spot } from "../components/ui";
import { cx, useInView, useInterval, usePrefersReducedMotion } from "../hooks";

const K = ({ children }: { children: ReactNode }) => <span className="k">{children}</span>;
const S = ({ children }: { children: ReactNode }) => <span className="s">{children}</span>;
const G = ({ children }: { children: ReactNode }) => <span className="g">{children}</span>;

interface Layer {
  id: string;
  name: string;
  title: string;
  body: ReactNode;
  code: ReactNode;
}

const LAYERS: Layer[] = [
  {
    id: "L0",
    name: "Trigger",
    title: "A comment becomes an intent",
    body: (
      <>
        A maintainer's <code>/send</code> on a PR, or inputs set by the workflow itself. A network alias like{" "}
        <code>sepolia</code> resolves to its CAIP-2 form before anything else runs.
      </>
    ),
    code: (
      <>
        <K>/send</K> 0x9f3a…7c21 <S>25</S> USDC{"\n\n"}Intent {"{\n"}  recipient: <S>"0x9f3a…7c21"</S>,{"\n"}  amount:
        {"    "}
        <S>"25000000"</S>, <G>// atomic units, a string</G>
        {"\n"}  asset:{"     "}
        <S>"USDC"</S>,{"\n"}  network:{"   "}
        <S>"eip155:11155111"</S>,{"\n"}  round:{"     "}
        <S>"0"</S>
        {"\n}"}
      </>
    ),
  },
  {
    id: "L1",
    name: "Policy",
    title: "Offline checks, before anything is signed",
    body: "Pure and total: no network, no clock. The kill switch is checked first, then who may spend, then the cap. Every condition is evaluated so one run shows every problem.",
    code: (
      <>
        <K>policy:</K>
        {"\n  "}
        <G>[PASS]</G> SETTLEMENT_ENABLED — settlement is enabled{"\n  "}
        <G>[PASS]</G> MAINTAINER_APPROVED — the author may spend{"\n  "}
        <G>[PASS]</G> AMOUNT_WITHIN_CAP — 25000000 is within{"\n         "}the cap of 50000000
      </>
    ),
  },
  {
    id: "L2",
    name: "Intent",
    title: "What moves, to whom",
    body: (
      <>
        A plain description of what is owed, shaped like x402's <code>PaymentRequirements</code>. Amounts are strings in
        atomic units, never floats. The recipient is an opaque identity until a resolver handles it.
      </>
    ),
    code: (
      <>
        PaymentRequirements {"{\n"}  scheme:{"  "}
        <S>"allowance"</S>,{"\n"}  network: <S>"eip155:11155111"</S>,{"\n"}  asset:{"   "}
        <S>"USDC"</S>,{"\n"}  amount:{"  "}
        <S>"25000000"</S>,{"\n"}  payTo:{"   "}
        <S>"0x9f3a…7c21"</S> <G>// resolved</G>
        {"\n}"}
      </>
    ),
  },
  {
    id: "L3",
    name: "Authority",
    title: "The allowance, granted once",
    body: "Granted to a delegate once, on-chain, and revocable at any time. With a Safe, a spending limit in Safe{Wallet} caps every period. With no Safe, an ordinary wallet such as MetaMask approves the delegate on the token. No per-payout signature either way.",
    code: (
      <>
        Safe{"            "}
        <S>0xYourSafe</S>
        {"\n  └─ AllowanceModule  "}
        <S>0xCFbF…3134</S> <G>// canonical, v0.1.0</G>
        {"\n       delegate  "}
        <S>0xDelegate</S>
        {"\n       token     USDC\n       limit     "}
        <K>100 USDC / week</K> <G>// you choose</G>
        {"\n\n"}
        <G>// no Safe? scheme: approve</G>
        {"\nMetaMask wallet   "}
        <S>0xYourWallet</S>
        {"\n  └─ USDC.approve(  "}
        <S>0xDelegate</S>, <K>100 USDC</K>
        {")"} <G>// tops up by hand</G>
      </>
    ),
  },
  {
    id: "L4",
    name: "Settlement",
    title: "The only layer that knows chains",
    body: "Refuses if a delegate transaction is already in flight, simulates the call for free, estimates gas, signs, writes the receipt, and only then broadcasts.",
    code: (
      <>
        pending &gt; latest nonce?{"  "}
        <K>refuse, never queue</K>
        {"\n"}eth_call{"                 "}
        <G>✓ simulation passes</G>
        {"\n"}eth_estimateGas{"          "}
        <G>✓</G>
        {"\n"}sign EIP-1559{"            "}
        <G>✓ hash known now</G>
        {"\n"}ledger: <S>broadcasting</S>
        {"     "}
        <G>✓ written first</G>
        {"\n"}eth_sendRawTransaction{"   "}
        <G>✓</G>
        {"\n"}ledger: <S>settled</S>
      </>
    ),
  },
  {
    id: "L5",
    name: "Receipt",
    title: "The PR comment is the ledger",
    body: (
      <>
        A comment people can read and the next run can trust. It carries the idempotency key, so a re-run reports{" "}
        <code>already-paid</code> instead of paying again. Only bot and maintainer receipts count.
      </>
    ),
    code: (
      <>
        <G>✓</G> Paid 25 USDC to 0x9f3a…7c21{"\n"}  tx 0x4c1e…a90b · Ethereum Sepolia{"\n\n"}
        <K>&lt;!-- xops-receipt:v1</K>
        {"\n"}
        <K>{"     "}key + tx hash + status, invisible when rendered --&gt;</K>
      </>
    ),
  },
];

function Pipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, 0.4);
  const reduced = usePrefersReducedMotion();
  const [cur, setCur] = useState(0);
  const [auto, setAuto] = useState(true);
  useInterval(() => setCur((c) => (c + 1) % LAYERS.length), auto && visible && !reduced ? 3400 : null);
  const layer = LAYERS[cur]!;

  return (
    // The observer sits on a wrapper: the track itself is hidden on narrow screens.
    <div ref={ref}>
      <Reveal className="pipe" role="tablist" aria-label="Pipeline layers">
        <div className="pipe-track" aria-hidden="true" style={{ "--p": cur / (LAYERS.length - 1) } as CSSProperties}>
          <div className="fill" />
          <div className="spark" />
        </div>
        {LAYERS.map((l, i) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={i === cur}
            className={cx("node", i === cur && "on", i < cur && "done")}
            onClick={() => {
              setAuto(false);
              setCur(i);
            }}
          >
            <span className="dot">{l.id}</span>
            <span className="nm">{l.name}</span>
          </button>
        ))}
      </Reveal>

      <Reveal className="window layer-card" role="tabpanel" aria-live="polite">
        <div key={`c${cur}`} className={cx("layer-copy", !reduced && "swap")}>
          <span className="lid">
            {layer.id} · {layer.name.toUpperCase()}
          </span>
          <h3>{layer.title}</h3>
          <p>{layer.body}</p>
        </div>
        <pre key={`k${cur}`} className={cx("layer-code", !reduced && "swap")}>
          {layer.code}
        </pre>
      </Reveal>
    </div>
  );
}

function MoneyDiagram() {
  const svg = useRef<SVGSVGElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) svg.current?.pauseAnimations();
    else svg.current?.unpauseAnimations();
  }, [reduced]);
  const rail = "M230 178 H590";
  return (
    <Reveal className="window money" aria-label="Money path: your Safe pays the contributor directly">
      <svg
        ref={svg}
        viewBox="0 0 820 230"
        role="img"
        aria-label="The GitPay workflow calls the AllowanceModule, which checks the limit; the Safe transfers tokens straight to the contributor"
      >
        <rect className="box" x="20" y="24" width="210" height="64" rx="12" />
        <text className="ttl" x="40" y="52">GitPay workflow</text>
        <text className="lbl" x="40" y="72">your GitHub Actions</text>
        <rect className="box-acc" x="305" y="24" width="210" height="64" rx="12" />
        <text className="ttl" x="325" y="52">AllowanceModule</text>
        <text className="lbl" x="325" y="72">checks the period cap</text>
        <path className="dash" d="M230 56 H305" />
        <text className="lbl" x="236" y="46">call</text>
        <rect className="box" x="20" y="146" width="210" height="64" rx="12" />
        <text className="ttl" x="40" y="174">Your Safe</text>
        <text className="lbl" x="40" y="194">holds the USDC</text>
        <path className="dash" d="M410 88 V120 H125 V146" />
        <text className="lbl" x="250" y="114">within limit? move it</text>
        <rect className="box" x="590" y="146" width="210" height="64" rx="12" />
        <text className="ttl" x="610" y="174">Contributor</text>
        <text className="lbl" x="610" y="194">their wallet</text>
        <path className="rail" d={rail} />
        {[0, 0.8, 1.6].map((begin, i) => (
          <circle key={begin} className="tok" r="6" opacity={1 - i * 0.28}>
            <animateMotion dur="2.4s" begin={`${begin}s`} repeatCount="indefinite" path={rail} />
          </circle>
        ))}
        <text className="ok" x="330" y="166">one direct transfer</text>
        <text className="lbl" x="590" y="40">GitPay never holds</text>
        <text className="lbl" x="590" y="60">or routes the tokens.</text>
      </svg>
    </Reveal>
  );
}

export function HowItWorks() {
  return (
    <section id="how">
      <div className="wrap">
        <SectionHead
          center
          kicker="How it works"
          title="Six layers between a comment and a transfer."
          lede="Every run passes through the same pipeline. Only the settlement layer knows what a blockchain is. Click a layer, or watch it run."
        />
        <Pipeline />
        <MoneyDiagram />
        <div className="setup">
          <Spot className="card">
            <span className="k">Once · Safe or wallet</span>
            <h3>Give the delegate a limit</h3>
            <p>
              In Safe{"{Wallet}"}: Settings → Setup → Spending limits, with a reset period such as weekly. No Safe? From
              MetaMask or any wallet, call <code>approve(delegate, amount)</code> on the token.
            </p>
          </Spot>
          <Spot className="card">
            <span className="k">Once · a little test ETH</span>
            <h3>Fund the delegate's gas</h3>
            <p>The delegate is an ordinary account that pays gas for each payout. Its key lives in a repository secret.</p>
          </Spot>
          <Spot className="card hl">
            <span className="k">Per payout · forever</span>
            <h3>Nothing.</h3>
            <p>
              Maintainers comment, the workflow pays, nobody opens a wallet. A Safe's cap refills itself each period; a
              wallet approval is topped up when it runs out.
            </p>
          </Spot>
        </div>
      </div>
    </section>
  );
}
