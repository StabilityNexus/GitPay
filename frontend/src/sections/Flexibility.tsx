import { useState } from "react";
import { SectionHead, Spot } from "../components/ui";
import { cx, useInterval, usePrefersReducedMotion } from "../hooks";

const KEY_PARTS: Array<[string, string, string]> = [
  ["xops:v1", "Version prefix", ", so the format can evolve"],
  ["github:acme/widgets#refs/pull/42", "Where the payout came from", ": the repo and the PR"],
  ["0x9f3a…7c21", "The resolved recipient", " address"],
  ["eip155:11155111", "Network in CAIP-2 form", ", so each chain gets its own key"],
  ["USDC", "The asset", ", so multi-asset payouts need no special case"],
  ["0", "Round", ": bump it to pay the same person again on purpose"],
];

function IdempotencyKey() {
  const reduced = usePrefersReducedMotion();
  const [lit, setLit] = useState(0);
  const [hovering, setHovering] = useState(false);
  useInterval(() => setLit((i) => (i + 1) % KEY_PARTS.length), reduced || hovering ? null : 2200);
  const [, bold, rest] = KEY_PARTS[lit]!;
  return (
    <>
      <div className="key" aria-label="Idempotency key fields" onMouseLeave={() => setHovering(false)}>
        {KEY_PARTS.map(([text], i) => (
          <span
            key={text}
            className={cx(i === lit && "lit")}
            onMouseEnter={() => {
              setHovering(true);
              setLit(i);
            }}
          >
            {text}
          </span>
        ))}
        <span className="gone">amount</span>
        <span className="gone">timestamp</span>
      </div>
      <p className="keycap">
        <b>{bold}</b>
        {rest}
      </p>
    </>
  );
}

const STATUSES = ["settled", "dry-run", "already-paid", "skipped", "error"];

function StatusCycle() {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  useInterval(() => setI((n) => (n + 1) % STATUSES.length), reduced ? null : 1800);
  return (
    <span key={i} className={cx("status-cycle", i > 0 && "swap")}>
      {STATUSES[i]}
    </span>
  );
}

export function Flexibility() {
  return (
    <section id="flex">
      <div className="wrap">
        <SectionHead
          center
          kicker="Flexibility"
          title="A small core with open edges."
          lede="Chain details live in one replaceable driver. Everything else is plain data, so GitPay can grow without touching the parts that protect your money."
        />
        <div className="bento">
          <Spot className="card w2">
            <span className="k">Idempotency</span>
            <h3>Re-run anything. Pay exactly once.</h3>
            <p>
              Every payout gets a deterministic key, written into the PR receipt before broadcast. The amount is left
              out on purpose: correcting <code>/send alice 50</code> to <code>500</code> collides with the first payout
              instead of paying 550.
            </p>
            <IdempotencyKey />
          </Spot>
          <Spot className="card">
            <span className="k">Triggers</span>
            <h3>Fits how your project works</h3>
            <p>
              A maintainer's <code>/send</code>, or a workflow that pays a fixed amount on merge. Workflow runs skip the
              commenter check, because editing a workflow already takes write access.
            </p>
            <div className="spec">
              <span className="ink">issue_comment</span>
              {"   "}
              <span className="hl">/send</span>
              {"\n"}
              <span className="ink">pull_request</span>
              {"    inputs"}
            </div>
          </Spot>
          <Spot className="card">
            <span className="k">Identity</span>
            <h3>Recipients are identities</h3>
            <p>
              A recipient is a string a resolver turns into a payout target. Inline addresses ship today. ENS or agent
              IDs are small resolvers anyone can add.
            </p>
            <div className="spec">
              {'"0x9f3a…" → '}
              <span className="hl">inline</span>
              {'\n"alice.eth" → '}
              <span className="ink">ens</span> <span className="hl">(plug in)</span>
            </div>
          </Spot>
          <Spot className="card w2">
            <span className="k">Outputs</span>
            <h3>Machine-readable on every path</h3>
            <p>Success or failure, each run writes outputs your next step can use. Post to chat, update a sheet, or gate a release.</p>
            <div className="spec">
              {"STATUS           "}
              <StatusCycle />
              {"\nTX_HASH          0x4c1e…a90b\nEXPLORER_URL     https://sepolia.etherscan.io/tx/…\nERROR_CODE       "}
              <span className="ink">POLICY_DENIED · AMOUNT_CAP_EXCEEDED · …</span>
              {"\nIDEMPOTENCY_KEY  xops:v1|…"}
            </div>
          </Spot>
          <Spot className="card w2">
            <span className="k">Networks &amp; assets</span>
            <h3>Ready for more chains</h3>
            <p>
              Ethereum Sepolia today. Network and asset are already in every key, and chain facts come from a registry,
              so a new network does not touch the core.
            </p>
            <div className="spec">
              {"network: "}
              <span className="hl">sepolia</span>
              {"  →  eip155:11155111\n  chain_id · allowance_module · explorer_url  ← "}
              <span className="ink">from the registry</span>
            </div>
          </Spot>
          <Spot className="card">
            <span className="k">Roadmap</span>
            <h3>Next up</h3>
            <p>Each plugs into the same policy, ledger and receipt.</p>
            <div className="spec">
              {["native currency payouts", "ERC-721 transfers", "claim flow"].map((item, i) => (
                <span key={item}>
                  {i > 0 && "\n"}
                  <span className="hl">→</span> {item}
                </span>
              ))}
            </div>
          </Spot>
        </div>
      </div>
    </section>
  );
}
