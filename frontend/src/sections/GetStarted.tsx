import { useRef, useState, type ReactNode } from "react";
import { Reveal, useCopy } from "../components/ui";
import { cx, usePrefersReducedMotion } from "../hooks";

const C = ({ children }: { children: ReactNode }) => <span className="c">{children}</span>;
const K = ({ children }: { children: ReactNode }) => <span className="k">{children}</span>;
const S = ({ children }: { children: ReactNode }) => <span className="s">{children}</span>;

/* GitHub expressions are written as strings so JSX does not read the braces. */
const expr = (e: string) => "${{ " + e + " }}";

const DRY_RUN = (
  <>
    <C># .github/workflows/gitpay.yml</C>
    {"\n"}
    <K>on:</K>
    {"\n  "}
    <K>issue_comment:</K>
    {"\n    "}
    <K>types:</K>
    {" [created]\n"}
    <K>permissions:</K>
    {"\n  "}
    <K>issues:</K>
    {" write\n  "}
    <K>pull-requests:</K>
    {" write\n"}
    <K>jobs:</K>
    {"\n  "}
    <K>pay:</K>
    {"\n    "}
    <K>if:</K>
    {" github.event.issue.pull_request && startsWith(github.event.comment.body, '/send')\n    "}
    <K>runs-on:</K>
    {" ubuntu-latest\n    "}
    <K>steps:</K>
    {"\n      - "}
    <K>uses:</K> <S>StabilityNexus/GitPay@v1</S>
    {"\n        "}
    <K>with:</K>
    {"\n          "}
    <K>comment:</K> {expr("github.event.comment.body")}
    {"\n          "}
    <K>actor_association:</K> {expr("github.event.comment.author_association")}
    {"\n          "}
    <K>ref:</K> {`refs/pull/${expr("github.event.issue.number")}`}
    {"\n          "}
    <C># mode defaults to dry-run. Nothing moves.</C>
  </>
);

const GO_LIVE = (
  <>
    <C># add to the job, then extend `with:`</C>
    {"\n"}
    <K>concurrency:</K>
    {"\n  "}
    <K>group:</K> {`gitpay-payout-${expr("github.repository")}`}
    {"\n  "}
    <K>cancel-in-progress:</K>
    {" false   "}
    <C># never cancel mid-payout</C>
    {"\n\n        "}
    <K>with:</K>
    {"\n          "}
    <C># the three inputs above, plus:</C>
    {"\n          "}
    <K>mode:</K> <S>self</S>
    {"\n          "}
    <K>max_per_payout:</K> <S>"5"</S>
    {"\n          "}
    <K>rpc_url:</K> {expr("secrets.GITPAY_RPC_URL")}
    {"\n          "}
    <K>safe:</K> <S>"0xYourSafe"</S>
    {"\n          "}
    <K>token:</K> <S>"0xYourToken"</S>
    {"\n          "}
    <K>delegate_key:</K> {expr("secrets.GITPAY_DELEGATE_KEY")}
    {"\n          "}
    <K>pr:</K> {expr("github.event.issue.number")}
    {"\n          "}
    <K>github_token:</K> {expr("secrets.GITHUB_TOKEN")}
  </>
);

/* Same job as GO_LIVE; only the account the funds leave differs. */
const GO_LIVE_WALLET = (
  <>
    <C># no Safe: pay from MetaMask or any wallet that ran</C>
    {"\n"}
    <C># USDC.approve(delegate, amount) once. Same concurrency block.</C>
    {"\n        "}
    <K>with:</K>
    {"\n          "}
    <C># the three inputs above, plus:</C>
    {"\n          "}
    <K>mode:</K> <S>self</S>
    {"\n          "}
    <K>scheme:</K> <S>approve</S>
    {"\n          "}
    <K>max_per_payout:</K> <S>"5"</S>
    {"\n          "}
    <K>rpc_url:</K> {expr("secrets.GITPAY_RPC_URL")}
    {"\n          "}
    <K>payer:</K> <S>"0xYourWallet"</S>
    {"   "}
    <C># approved the delegate</C>
    {"\n          "}
    <K>token:</K> <S>"0xYourToken"</S>
    {"\n          "}
    <K>delegate_key:</K> {expr("secrets.GITPAY_DELEGATE_KEY")}
    {"\n          "}
    <K>pr:</K> {expr("github.event.issue.number")}
    {"\n          "}
    <K>github_token:</K> {expr("secrets.GITHUB_TOKEN")}
  </>
);

const TABS = [
  { label: "1 · dry run", code: DRY_RUN },
  { label: "2 · live · Safe", code: GO_LIVE },
  { label: "2 · live · wallet", code: GO_LIVE_WALLET },
];

export function GetStarted() {
  const reduced = usePrefersReducedMotion();
  const [tab, setTab] = useState(0);
  const [label, setLabel] = useState("Copy");
  const code = useRef<HTMLPreElement>(null);
  const copy = useCopy();

  return (
    <section id="start">
      <div className="wrap">
        <Reveal className="final">
          <div className="final-copy">
            <span className="kicker">Get started</span>
            <h2>
              One file. <span className="grad">Zero secrets</span> to try it.
            </h2>
            <p className="lede">
              Add the workflow and comment <code>/send 0xRecipient 1 USDC</code> on a pull request. The run log shows
              the payout, the policy checks and the key, and ends with <code>mode: dry-run — nothing was settled</code>.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="https://github.com/kpj2006/gitpay-quickstart" target="_blank" rel="noopener">
                Open the quickstart <span className="arr" aria-hidden="true">→</span>
              </a>
              <a className="btn btn-ghost" href="./docs/">
                Step-by-step setup
              </a>
            </div>
          </div>
          <div className="window">
            <div className="win-bar">
              <div className="tabs" role="tablist" aria-label="Workflow examples">
                {TABS.map(({ label: tabLabel }, i) => (
                  <button key={tabLabel} type="button" role="tab" aria-selected={tab === i} onClick={() => setTab(i)}>
                    {tabLabel}
                  </button>
                ))}
              </div>
              <span className="title" />
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => void copy(code.current?.innerText ?? "", code.current, setLabel)}
              >
                {label}
              </button>
            </div>
            <pre key={tab} ref={code} className={cx("code", !reduced && "swap")}>
              {TABS[tab]?.code}
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
