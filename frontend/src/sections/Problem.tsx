import { useState } from "react";
import { Reveal, SectionHead } from "../components/ui";
import { cx } from "../hooks";

const CHORES: Array<[string, string?]> = [
  ["Ask the contributor for a wallet address", "then wait for a reply"],
  ["Open the treasury wallet in another tab"],
  ["Copy address and amount by hand", "one typo sends money somewhere else"],
  ["Collect owner signatures for this one transfer"],
  ["Paste the transaction hash back into the PR"],
  ["Update the spreadsheet so nobody is paid twice"],
  ["Remember who is still owed after a busy week"],
];

const COMPARE: Array<[string, string, string, string, ("manual" | "hosted")?]> = [
  ["Who holds the funds", "You", "The platform", "You, in your Safe or wallet", "hosted"],
  ["Work per payout", "Open wallet, copy, sign, post hash", "Approve in their dashboard", "One /send comment", "manual"],
  ["Server someone must run", "None", "Theirs, always", "None. It runs in your Actions", "hosted"],
  ["Protection from paying twice", "A spreadsheet and memory", "Their database", "Receipt ledger in the PR", "manual"],
  ["Rules for who can pay", "Whoever holds the keys", "Their settings page", "Declared in your workflow file"],
];

function Diff() {
  const [applied, setApplied] = useState(false);
  return (
    <Reveal className={cx("window diff", applied && "applied")} role="figure" aria-label="The maintainer payout routine as a diff">
      <div className="win-bar">
        <span className="title">payout-routine.md</span>
        <span className="diffstat">
          <span className="a">+1</span> <span className="d">−7</span>
        </span>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setApplied((a) => !a)} aria-pressed={applied}>
          {applied ? "Undo" : "Apply diff"}
        </button>
      </div>
      <ol>
        <li className="hunk">@@ every merged PR, every contributor @@</li>
        {CHORES.map(([text, note], i) => (
          <li key={text} className="del">
            <span className="ln">{i + 1}</span>
            <span className="sg">−</span>
            <span className="tx">
              {text}
              {note && <span className="note">{note}</span>}
            </span>
          </li>
        ))}
        <li className="add">
          <span className="ln">1</span>
          <span className="sg">+</span>
          <span className="tx">
            /send 0x9f3a…7c21 25
            <span className="note">policy, payout, receipt and ledger run in the workflow</span>
          </span>
        </li>
      </ol>
    </Reveal>
  );
}

export function Problem() {
  return (
    <section id="today">
      <div className="wrap">
        <SectionHead
          kicker="The problem"
          title="Paying one contributor shouldn't take seven steps."
          lede="Today a bounty means leaving GitHub, opening a wallet and keeping books by hand. Or handing your treasury to a platform that holds it for you."
        />

        <div className="split">
          <Diff />
          <Reveal className="side">
            <p>
              Hosted bounty platforms remove the chores by <strong>holding your funds</strong>. You deposit into their
              account, their server decides when to pay, and your payout history lives in their database.
            </p>
            <p>
              <strong>GitPay takes neither path.</strong> It is a versioned Action that runs in your CI. Funds stay in
              your Safe or wallet until the moment they go to the contributor, in one direct transfer.
            </p>
            <div className="vs">
              <div className="vs-row">
                <div>
                  <h3>Manual from a wallet</h3>
                  <p>You hold funds. You do every step, every time.</p>
                </div>
                <span className="pill pill-bad">7 steps</span>
              </div>
              <div className="vs-row">
                <div>
                  <h3>Hosted bounty platform</h3>
                  <p>Fewer steps. Someone else holds your money.</p>
                </div>
                <span className="pill pill-bad">custody</span>
              </div>
              <div className="vs-row us">
                <div>
                  <h3>GitPay</h3>
                  <p>One comment. Your Safe or wallet pays directly.</p>
                </div>
                <span className="pill pill-mid">1 step</span>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="compare">
          <table>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr">Question</span>
                </th>
                <th scope="col">Manual from a wallet</th>
                <th scope="col">Hosted bounty platform</th>
                <th scope="col" className="us">
                  GitPay
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([q, manual, hosted, us, weak]) => (
                <tr key={q}>
                  <th scope="row">{q}</th>
                  <td className={weak === "manual" ? "x" : undefined}>{manual}</td>
                  <td className={weak === "hosted" ? "x" : undefined}>{hosted}</td>
                  <td className="us">{us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
