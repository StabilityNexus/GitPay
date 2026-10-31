import { useEffect, useState } from "react";
import { Background } from "../sections/Chrome";
import { cx } from "../hooks";
import { Callout, Code, Path, Step, Tabs } from "./blocks";

const lines = (...l: string[]) => l.join("\n");

const DRY_RUN = lines(
  "# .github/workflows/gitpay.yml",
  "name: GitPay",
  "on:",
  "  issue_comment:",
  "    types: [created]",
  "permissions:",
  "  issues: write",
  "  pull-requests: write",
  "jobs:",
  "  pay:",
  "    # A `/send <recipient> <amount>` comment on a pull request.",
  "    if: github.event.issue.pull_request && startsWith(github.event.comment.body, '/send')",
  "    runs-on: ubuntu-latest",
  "    steps:",
  "      - uses: StabilityNexus/GitPay@v1",
  "        with:",
  "          comment: ${{ github.event.comment.body }}",
  "          actor_association: ${{ github.event.comment.author_association }}",
  "          # Ties the payout to this PR, so a re-run can never pay it twice.",
  "          ref: refs/pull/${{ github.event.issue.number }}",
  "          # mode defaults to dry-run. Nothing moves.",
);

/* The live workflow differs between a Safe and a plain wallet only in the
   account the funds leave: `safe` under the default scheme, or `scheme:
   approve` and `payer` for a wallet that approved the delegate. */
const live = (account: "safe" | "wallet") => lines(
  "# .github/workflows/gitpay.yml",
  "name: GitPay",
  "on:",
  "  issue_comment:",
  "    types: [created]",
  "permissions:",
  "  contents: read",
  "  issues: write          # the receipt comment is the payout ledger",
  "  pull-requests: write",
  "jobs:",
  "  pay:",
  "    if: github.event.issue.pull_request && startsWith(github.event.comment.body, '/send')",
  "    runs-on: ubuntu-latest",
  "    # One payout at a time. On the job, not the workflow, so an ordinary",
  "    # comment never joins the queue; never cancel a run mid-payout.",
  "    concurrency:",
  "      group: gitpay-payout-${{ github.repository }}",
  "      cancel-in-progress: false",
  "      queue: max",
  "    steps:",
  "      - uses: StabilityNexus/GitPay@v1",
  "        with:",
  "          comment: ${{ github.event.comment.body }}",
  "          actor_association: ${{ github.event.comment.author_association }}",
  "          ref: refs/pull/${{ github.event.issue.number }}",
  "          network: sepolia",
  "",
  "          mode: self                      # real settlement, explicitly",
  ...(account === "wallet" ? ["          scheme: approve                 # pay from a wallet, not a Safe"] : []),
  '          max_per_payout: "5"             # largest single payout, in /send units',
  "          allowed_associations: OWNER,MEMBER,COLLABORATOR",
  "          enabled: ${{ vars.GITPAY_ENABLED || 'true' }}   # kill switch",
  "",
  "          rpc_url: ${{ secrets.GITPAY_RPC_URL }}",
  "          delegate_key: ${{ secrets.GITPAY_DELEGATE_KEY }}",
  account === "wallet"
    ? "          payer: ${{ vars.GITPAY_PAYER }}   # the wallet that approved the delegate"
    : "          safe: ${{ vars.GITPAY_SAFE }}",
  "          token: ${{ vars.GITPAY_TOKEN }}",
  "          pr: ${{ github.event.issue.number }}",
  "          github_token: ${{ secrets.GITHUB_TOKEN }}",
);

const GH_CLI = lines(
  "# secrets: hidden after saving, readable only by workflows",
  "gh secret set GITPAY_DELEGATE_KEY      # paste the key when prompted",
  "gh secret set GITPAY_RPC_URL           # paste the RPC URL when prompted",
  "",
  "# variables: public, not sensitive",
  "gh variable set GITPAY_SAFE  --body 0xYourSafeAddress     # with a Safe",
  "gh variable set GITPAY_PAYER --body 0xYourWalletAddress   # or with a wallet",
  "gh variable set GITPAY_TOKEN --body 0xTokenAddress",
);

/* Circle's USDC on Ethereum Sepolia, the token the walkthrough pays in. */
const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const SECTIONS = [
  ["overview", "Overview"],
  ["try", "1 · Try it in dry run"],
  ["safe", "2 · Set up the Safe"],
  ["wallet", "2b · Or: a wallet, no Safe"],
  ["secrets", "3 · Find and add secrets"],
  ["live", "4 · Go live"],
  ["test", "5 · Test it"],
  ["trouble", "Troubleshooting"],
] as const;

function useActiveSection(): string {
  const [active, setActive] = useState<string>(SECTIONS[0][0]);
  useEffect(() => {
    const els = SECTIONS.map(([id]) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

function Header() {
  return (
    <header className="nav scrolled">
      <div className="wrap">
        <a className="brand" href="../" aria-label="GitPay home">
          <span className="mark">
            <svg width="18" height="18" viewBox="0 0 26 26" aria-hidden="true">
              <circle cx="6" cy="6" r="3" fill="none" stroke="#fff" strokeWidth="2.6" />
              <circle cx="6" cy="20" r="3" fill="none" stroke="#fff" strokeWidth="2.6" />
              <circle cx="20" cy="13" r="3.4" fill="#fff" />
              <path d="M6 9v8M6 9.5c0 3.5 3 3.5 10.6 3.5" fill="none" stroke="#fff" strokeWidth="2.6" />
            </svg>
          </span>
          GitPay <span className="doc-badge">docs</span>
        </a>
        <nav className="nav-links" aria-label="Site">
          <a href="../">← Back to home</a>
          <a className="btn btn-ghost btn-sm" href="https://github.com/StabilityNexus/GitPay" target="_blank" rel="noopener">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

export function DocsPage() {
  const active = useActiveSection();
  return (
    <>
      <Background />
      <Header />
      <div className="wrap doc-layout">
        <aside className="doc-toc" aria-label="On this page">
          <span className="lbl-out">On this page</span>
          <nav>
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className={cx(active === id && "on")} aria-current={active === id ? "location" : undefined}>
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="doc-main" id="top">
          <section id="overview" className="doc-sec">
            <span className="kicker">Manual integration</span>
            <h1>Add GitPay to your repository</h1>
            <p className="lede">
              Pay contributors from your own Safe, or from an ordinary wallet such as MetaMask, when a maintainer
              comments <code>/send</code> on a pull request. Start with a dry run that needs no secrets, then go live.
            </p>
            <div className="doc-facts">
              <div className="card">
                <span className="k">Dry run</span>
                <h3>About 5 minutes</h3>
                <p>One workflow file. No wallet, no secrets. Nothing moves.</p>
              </div>
              <div className="card">
                <span className="k">Go live</span>
                <h3>About 30 minutes, once</h3>
                <p>A Safe spending limit or a wallet approval, and two secrets. Nothing to do per payout after that.</p>
              </div>
              <div className="card">
                <span className="k">Network</span>
                <h3>Ethereum Sepolia</h3>
                <p>The only supported network today. Test USDC and ETH are free.</p>
              </div>
            </div>
            <Callout title="How the money moves">
              Your Safe or wallet pays the contributor directly. GitPay never holds funds and runs no server. Your
              workflow holds a <em>delegate</em> key that may spend only up to a limit you set on-chain: a Safe spending
              limit that resets each period, or a wallet approval that you top up by hand.
            </Callout>
            <div className="compare doc-table">
              <table>
                <thead>
                  <tr>
                    <th>Pay from</th>
                    <th>Setup</th>
                    <th>Ongoing</th>
                    <th>If the delegate key leaks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th><a href="#safe">A Safe</a></th>
                    <td>Safe, spending limit</td>
                    <td>None; the limit resets each period</td>
                    <td>One period's limit, every period until revoked</td>
                  </tr>
                  <tr>
                    <th><a href="#wallet">A wallet</a> (MetaMask…)</th>
                    <td>One <code>approve</code> transaction</td>
                    <td>Approve again when it runs out</td>
                    <td>What is left of the approval, once</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="try" className="doc-sec">
            <span className="kicker">Part 1</span>
            <h2>Try it in dry run</h2>
            <p className="lede">
              Check the integration before you touch any money. A dry run parses the command, runs every policy check and
              prints what it would pay.
            </p>
            <Step n={1} title="Add the workflow">
              <p>
                Create <code>.github/workflows/gitpay.yml</code> and commit it to your <strong>default branch</strong>.
              </p>
              <Code title=".github/workflows/gitpay.yml" code={DRY_RUN} />
              <Callout title="It must be on the default branch">
                Workflows triggered by <code>issue_comment</code> always run from the default branch. A copy that exists
                only on a feature branch never runs.
              </Callout>
            </Step>
            <Step n={2} title="Comment on a pull request">
              <p>
                Open any pull request and, as an owner, member or collaborator, comment with a real <code>0x</code>{" "}
                address:
              </p>
              <Code title="PR comment" code="/send 0xRecipientAddress 1 USDC" />
              <p>
                Open the <strong>Actions</strong> tab and select the <strong>GitPay</strong> run. The log shows the parsed
                payout, a table of policy checks and the idempotency key, and ends with{" "}
                <code>mode: dry-run — nothing was settled</code>.
              </p>
              <p className="muted">
                Want to see it first? <a href="https://github.com/kpj2006/gitpay-quickstart" target="_blank" rel="noopener">gitpay-quickstart</a>{" "}
                is this one file and nothing else.
              </p>
            </Step>
          </section>

          <section id="safe" className="doc-sec">
            <span className="kicker">Part 2 · one-time</span>
            <h2>Set up the Safe</h2>
            <p className="lede">
              You do this once. After it, a payout is just a <code>/send</code> comment.
            </p>

            <Step n={1} title="Get free test funds">
              <p>Use a wallet you control, such as MetaMask on the Sepolia network.</p>
              <ul className="doc-list">
                <li>
                  <strong>Test USDC:</strong>{" "}
                  <a href="https://faucet.circle.com" target="_blank" rel="noopener">faucet.circle.com</a>. Choose{" "}
                  <em>Ethereum Sepolia</em> and <em>USDC</em>.
                </li>
                <li>
                  <strong>Sepolia ETH (for gas):</strong> the Google Cloud Web3 faucet, Alchemy, or QuickNode.
                </li>
              </ul>
            </Step>

            <Step n={2} title="Create a Safe and fund it">
              <p>
                At <a href="https://app.safe.global" target="_blank" rel="noopener">app.safe.global</a>, create a Safe on{" "}
                <strong>Sepolia</strong> and send it the test USDC you plan to pay out.
              </p>
              <Callout title="Where to find the Safe address">
                It is shown under the Safe's name in the top-left of Safe{"{"}Wallet{"}"}. The copy button gives{" "}
                <code>sep:0xAbc…</code>. Drop the <code>sep:</code> prefix and keep only the <code>0x…</code> part.
              </Callout>
            </Step>

            <Step n={3} title="Create a delegate account">
              <p>
                The delegate is the account your workflow signs payouts with. Make a <strong>new, dedicated</strong>{" "}
                account for it. Do not use a Safe owner or your personal wallet.
              </p>
              <Tabs
                items={[
                  {
                    label: "MetaMask",
                    body: (
                      <ol className="doc-list">
                        <li>
                          <Path parts={["Account menu", "Add account", "Create new account"]} />
                        </li>
                        <li>
                          Copy its address. You will need it for the spending limit and for gas.
                        </li>
                        <li>
                          <Path parts={["⋮ on the account", "Account details", "Show private key"]} />. This is your{" "}
                          <code>GITPAY_DELEGATE_KEY</code>.
                        </li>
                      </ol>
                    ),
                  },
                  {
                    label: "Foundry (cast)",
                    body: (
                      <>
                        <Code title="terminal" code="cast wallet new" />
                        <p>
                          It prints an <code>Address</code> and a <code>Private key</code>. The private key is your{" "}
                          <code>GITPAY_DELEGATE_KEY</code>.
                        </p>
                      </>
                    ),
                  },
                ]}
              />
              <Callout kind="warn" title="Never paste the key into the workflow file">
                It goes only into a repository secret (Part 3). Anyone who can read it can spend up to the limit, every
                period, until you remove it from the Safe.
              </Callout>
            </Step>

            <Step n={4} title="Give the delegate a spending limit">
              <p>In Safe{"{"}Wallet{"}"}:</p>
              <p>
                <Path parts={["Settings", "Setup", "Spending limits", "New spending limit"]} />
              </p>
              <ul className="doc-list">
                <li>
                  <strong>Beneficiary:</strong> the delegate address from step 3.
                </li>
                <li>
                  <strong>Asset:</strong> USDC.
                </li>
                <li>
                  <strong>Amount and reset time:</strong> what you are willing to pay out, and lose, in one period. For
                  example, 50 USDC per day.
                </li>
              </ul>
              <p>
                The Safe owners confirm the transaction. The first spending limit also enables the Safe AllowanceModule
                (<code>0xCFbF…3134</code> on Sepolia). GitPay already knows that address.
              </p>
            </Step>

            <Step n={5} title="Give the delegate a little gas">
              <p>
                The delegate pays gas for each payout, so send it some Sepolia ETH. A few hundredths of an ETH covers many
                payouts. The Safe pays the USDC; the delegate only pays gas.
              </p>
            </Step>
          </section>

          <section id="wallet" className="doc-sec">
            <span className="kicker">Part 2b · one-time · instead of a Safe</span>
            <h2>Or: pay from a wallet, no Safe</h2>
            <p className="lede">
              Use an ordinary wallet, such as MetaMask, Rabby or a hardware wallet, as the account that pays. You approve
              a delegate to spend a fixed amount of its USDC, once. Skip this part if you set up a Safe above.
            </p>

            <Step n={1} title="Fund the paying wallet">
              <p>
                In your wallet, on <strong>Sepolia</strong>, get test USDC from{" "}
                <a href="https://faucet.circle.com" target="_blank" rel="noopener">faucet.circle.com</a> and a little
                Sepolia ETH for the approval transaction. This wallet holds the USDC you will pay out.
              </p>
            </Step>

            <Step n={2} title="Create a delegate account">
              <p>
                Exactly as in <a href="#safe">Part 2, step 3</a>: a <strong>new, separate</strong> account whose key goes
                into CI. Never use the paying wallet's own key. GitPay refuses to run if the delegate key controls the
                payer, because that would put the wallet itself in CI with no limit.
              </p>
            </Step>

            <Step n={3} title="Approve the delegate on USDC">
              <p>
                Open the USDC contract on Etherscan:{" "}
                <a href={`https://sepolia.etherscan.io/address/${SEPOLIA_USDC}#writeProxyContract`} target="_blank" rel="noopener">
                  sepolia.etherscan.io/address/{SEPOLIA_USDC.slice(0, 6)}…{SEPOLIA_USDC.slice(-4)}
                </a>
              </p>
              <p>
                <Path parts={["Contract", "Write as Proxy", "Connect to Web3", "approve"]} />
              </p>
              <ul className="doc-list">
                <li>
                  <strong>spender:</strong> the delegate address from step 2.
                </li>
                <li>
                  <strong>value:</strong> the total you allow, in atomic units. USDC has 6 decimals, so{" "}
                  <code>50000000</code> is 50 USDC.
                </li>
              </ul>
              <p>Connect the <strong>paying</strong> wallet, not the delegate, and confirm the transaction.</p>
              <Callout title="It does not refill">
                Every payout spends from this approval. When it runs out, payouts fail with{" "}
                <code>SIMULATION_REVERT</code> until you approve again. To see what is left, use{" "}
                <Path parts={["Read as Proxy", "allowance(owner, spender)"]} />.
              </Callout>
            </Step>

            <Step n={4} title="Give the delegate a little gas">
              <p>
                As with a Safe, the delegate pays gas for each payout, so send it some Sepolia ETH. The wallet pays the
                USDC; the delegate only pays gas.
              </p>
            </Step>
          </section>

          <section id="secrets" className="doc-sec">
            <span className="kicker">Part 3</span>
            <h2>Find and add your secrets</h2>
            <p className="lede">
              The workflow reads four values. Two are secret and two are not. Store each where it belongs. You need{" "}
              <code>GITPAY_SAFE</code> or <code>GITPAY_PAYER</code>, not both.
            </p>

            <div className="compare doc-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Kind</th>
                    <th>Where to find it</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th><code>GITPAY_DELEGATE_KEY</code></th>
                    <td><span className="pill pill-bad">secret</span></td>
                    <td>The private key of the delegate account from Part 2, step 3.</td>
                  </tr>
                  <tr>
                    <th><code>GITPAY_RPC_URL</code></th>
                    <td><span className="pill pill-bad">secret</span></td>
                    <td>A Sepolia JSON-RPC endpoint. It often contains an API key, so keep it secret. See below.</td>
                  </tr>
                  <tr>
                    <th><code>GITPAY_SAFE</code></th>
                    <td><span className="pill pill-mid">variable</span></td>
                    <td>With a Safe: your Safe address, without the <code>sep:</code> prefix.</td>
                  </tr>
                  <tr>
                    <th><code>GITPAY_PAYER</code></th>
                    <td><span className="pill pill-mid">variable</span></td>
                    <td>With a wallet instead: the address of the wallet that approved the delegate (Part 2b).</td>
                  </tr>
                  <tr>
                    <th><code>GITPAY_TOKEN</code></th>
                    <td><span className="pill pill-mid">variable</span></td>
                    <td>
                      The Sepolia USDC contract address, from{" "}
                      <a href="https://developers.circle.com/stablecoins/usdc-contract-addresses" target="_blank" rel="noopener">
                        Circle's USDC address list
                      </a>
                      . It is also the token in your spending limit.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Step n={1} title="Get an RPC URL">
              <Tabs
                items={[
                  {
                    label: "Alchemy",
                    body: (
                      <p>
                        At <a href="https://dashboard.alchemy.com" target="_blank" rel="noopener">dashboard.alchemy.com</a>,
                        create an app on <strong>Ethereum Sepolia</strong>, then copy its HTTPS endpoint (
                        <code>https://eth-sepolia.g.alchemy.com/v2/…</code>).
                      </p>
                    ),
                  },
                  {
                    label: "Infura",
                    body: (
                      <p>
                        At <a href="https://app.infura.io" target="_blank" rel="noopener">app.infura.io</a>, create an API
                        key with Ethereum enabled and use <code>https://sepolia.infura.io/v3/&lt;API_KEY&gt;</code>.
                      </p>
                    ),
                  },
                  {
                    label: "Public endpoint",
                    body: (
                      <p>
                        For a quick test, a public endpoint such as{" "}
                        <code>https://ethereum-sepolia-rpc.publicnode.com</code> works without an account. Public
                        endpoints are rate-limited, so use a keyed one for regular payouts.
                      </p>
                    ),
                  },
                ]}
              />
            </Step>

            <Step n={2} title="Add them to the repository">
              <Tabs
                items={[
                  {
                    label: "GitHub website",
                    body: (
                      <ol className="doc-list">
                        <li>
                          <Path parts={["Repository", "Settings", "Secrets and variables", "Actions"]} />
                        </li>
                        <li>
                          On the <strong>Secrets</strong> tab, choose <strong>New repository secret</strong> and add{" "}
                          <code>GITPAY_DELEGATE_KEY</code> and <code>GITPAY_RPC_URL</code>.
                        </li>
                        <li>
                          On the <strong>Variables</strong> tab, choose <strong>New repository variable</strong> and add{" "}
                          <code>GITPAY_SAFE</code> (or <code>GITPAY_PAYER</code>) and <code>GITPAY_TOKEN</code>.
                        </li>
                      </ol>
                    ),
                  },
                  {
                    label: "GitHub CLI",
                    body: <Code title="terminal · in your repository" code={GH_CLI} />,
                  },
                ]}
              />
              <Callout title="Names must match exactly">
                The workflow reads <code>secrets.GITPAY_DELEGATE_KEY</code>, <code>secrets.GITPAY_RPC_URL</code>,{" "}
                <code>vars.GITPAY_SAFE</code> (or <code>vars.GITPAY_PAYER</code>) and <code>vars.GITPAY_TOKEN</code>.
                GitHub stores the names in upper case.
              </Callout>
            </Step>
          </section>

          <section id="live" className="doc-sec">
            <span className="kicker">Part 4</span>
            <h2>Go live</h2>
            <p className="lede">
              Replace the dry-run workflow with this one. The only switch that turns on real payouts is{" "}
              <code>mode: self</code>.
            </p>
            <Step n={1} title="Update the workflow">
              <p>Pick the tab for the account you set up in Part 2. They differ only in the account lines.</p>
              <Tabs
                items={[
                  { label: "Safe", body: <Code title=".github/workflows/gitpay.yml" code={live("safe")} /> },
                  { label: "Wallet (MetaMask…)", body: <Code title=".github/workflows/gitpay.yml" code={live("wallet")} /> },
                ]}
              />
            </Step>
            <Step n={2} title="Review the policy">
              <ul className="doc-list">
                <li>
                  <code>max_per_payout</code>: the largest single <code>/send</code>, in the same units you type. A
                  larger request is refused before anything is signed.
                </li>
                <li>
                  <code>allowed_associations</code>: who may issue <code>/send</code>. Anyone else's command is
                  refused.
                </li>
                <li>
                  <code>enabled</code>: set the repository variable <code>GITPAY_ENABLED</code> to <code>false</code> to
                  stop every payout without a commit.
                </li>
              </ul>
              <Callout kind="warn" title="Two limits, both needed">
                <code>max_per_payout</code> stops one bad command. The Safe spending limit, or the wallet approval, stops a
                leaked key. Keep either at what you can afford to lose.
              </Callout>
            </Step>
          </section>

          <section id="test" className="doc-sec">
            <span className="kicker">Part 5</span>
            <h2>Test it</h2>
            <p className="lede">
              Run these on a test pull request. Use a second address you own as the recipient, so you can check its
              balance.
            </p>
            <Step n={1} title="Pay a small amount">
              <Code title="PR comment" code="/send 0xRecipientAddress 1 USDC" />
              <p>
                The run posts a receipt comment on the PR with an Etherscan link. Open it and check the USDC transfer
                from your Safe, or your wallet, to the recipient. The receipt's <strong>From</strong> row says which.
              </p>
            </Step>
            <Step n={2} title="Repeat the same command">
              <p>
                Post the same comment again. The run log reports <code>already-paid</code> with the first transaction.
                No second transfer happens.
              </p>
            </Step>
            <Step n={3} title="Pay the same person again, on purpose">
              <Code title="PR comment" code="/send 0xRecipientAddress 1 USDC round:1" />
              <p>
                A new round is a new payout, so this one settles and posts its own receipt. Use it for a genuine second
                payment, or to retry one that never landed.
              </p>
            </Step>
            <Step n={4} title="Go over the cap">
              <Code title="PR comment" code="/send 0xRecipientAddress 50 USDC" />
              <p>
                With <code>max_per_payout: "5"</code>, the run fails with <code>AMOUNT_CAP_EXCEEDED</code> and nothing is
                signed. A red run is the expected result here.
              </p>
            </Step>
            <Step n={5} title="Try the kill switch">
              <p>
                Set the variable <code>GITPAY_ENABLED</code> to <code>false</code> and send again. The run is refused
                with <code>POLICY_DENIED</code>. Delete the variable, or set it to <code>true</code>, to resume.
              </p>
            </Step>
            <Callout kind="ok" title="What a passing setup looks like">
              Two receipt comments and two transfers on Etherscan (round 0 and round 1), an <code>already-paid</code>{" "}
              repeat, and two refusals that moved nothing.
            </Callout>
          </section>

          <section id="trouble" className="doc-sec">
            <span className="kicker">Reference</span>
            <h2>Troubleshooting</h2>
            <p className="lede">Each run writes a status and, on failure, an error code to the log.</p>
            <div className="compare doc-table">
              <table>
                <thead>
                  <tr>
                    <th>You see</th>
                    <th>What to do</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>No run at all</th>
                    <td>
                      Is the workflow on the default branch? Was the comment on a pull request, not an issue? Does it
                      start with <code>/send</code>?
                    </td>
                  </tr>
                  <tr>
                    <th><code>skipped</code></th>
                    <td>The comment had no <code>/send</code> at the start of a line. Nothing was requested.</td>
                  </tr>
                  <tr>
                    <th><code>POLICY_DENIED</code></th>
                    <td>
                      The commenter is not in <code>allowed_associations</code>, or the kill switch is off.
                    </td>
                  </tr>
                  <tr>
                    <th><code>AMOUNT_CAP_EXCEEDED</code></th>
                    <td>The amount is above <code>max_per_payout</code>. Raise the cap or send less.</td>
                  </tr>
                  <tr>
                    <th><code>SIMULATION_REVERT</code></th>
                    <td>
                      The transfer was refused in simulation, so no gas was spent. With a Safe: this period's spending
                      limit is used up, the Safe has too little USDC, or the limit is for a different delegate or token.
                      With a wallet: the approval is spent or was never made for this delegate, or the wallet has too
                      little USDC. <code>no contract code</code> in the log means <code>GITPAY_TOKEN</code> is not a
                      token on Sepolia.
                    </td>
                  </tr>
                  <tr>
                    <th><code>unconfirmed</code></th>
                    <td>
                      An earlier attempt recorded a transaction that GitPay could not confirm, so nothing was paid by
                      this run. Open the transaction on Etherscan. If it succeeded, the contributor is paid. If it failed
                      or never landed, send the command again with <code>round:1</code> (or the next round).
                    </td>
                  </tr>
                  <tr>
                    <th><code>INSUFFICIENT_GAS</code></th>
                    <td>Send more Sepolia ETH to the delegate address.</td>
                  </tr>
                  <tr>
                    <th><code>NONCE_CONFLICT</code></th>
                    <td>
                      Something else used the delegate account's nonce. Use the delegate for GitPay only, then send
                      again.
                    </td>
                  </tr>
                  <tr>
                    <th><code>RPC_UNAVAILABLE</code></th>
                    <td>
                      Check <code>GITPAY_RPC_URL</code>, or switch providers. If the log says a transaction is{" "}
                      <em>in flight</em>, an earlier payout has not confirmed: wait for it, or replace that nonce from the
                      delegate wallet with a higher fee.
                    </td>
                  </tr>
                  <tr>
                    <th><code>already-paid</code>, but you meant to pay again</th>
                    <td>
                      A recipient is paid once per PR. To pay them again on purpose, add <code>round:1</code> to the
                      command: <code>/send 0xRecipient 2.50 round:1</code>.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Callout kind="warn" title="If the delegate key leaks">
              With a Safe: in Safe{"{"}Wallet{"}"}, delete the delegate's spending limit right away. The limit resets
              every period, so a key left in place can keep spending. With a wallet: from the paying wallet, call{" "}
              <code>approve(delegate, 0)</code> on the token, or revoke it at revoke.cash.
            </Callout>
            <div className="cta-row doc-next">
              <a
                className="btn btn-primary"
                href="https://github.com/StabilityNexus/GitPay/blob/main/SETTLEMENT-FLOW.md"
                target="_blank"
                rel="noopener"
              >
                Read the settlement flow <span className="arr" aria-hidden="true">→</span>
              </a>
              <a
                className="btn btn-ghost"
                href="https://github.com/StabilityNexus/GitPay/blob/main/schema/action-inputs.v1.schema.json"
                target="_blank"
                rel="noopener"
              >
                Every input
              </a>
            </div>
          </section>

          <footer>
            <span>GitPay · an AOSSIE / Stability Nexus project · MIT</span>
            <span>
              <a href="https://github.com/StabilityNexus/GitPay/issues" target="_blank" rel="noopener">
                Report a problem with these docs
              </a>
            </span>
          </footer>
        </main>
      </div>
    </>
  );
}
