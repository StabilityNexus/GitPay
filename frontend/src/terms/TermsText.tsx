/** Bump when the terms change materially, so every visitor is asked to agree again. */
export const TERMS_VERSION = "2026-11-01";

const REPO = "https://github.com/StabilityNexus/GitPay";

/** The Terms of Use, shared by the /terms/ page and the first-visit modal. */
export function TermsText() {
  return (
    <>
      <p>
        These terms cover this website, its documentation, and the GitPay GitHub Action and source code published at{" "}
        <a href={REPO} target="_blank" rel="noopener">
          github.com/StabilityNexus/GitPay
        </a>{" "}
        (together, "GitPay"). By using GitPay you agree to them. If you do not agree, do not use it.
      </p>

      <h2>1. Experimental, open-source software</h2>
      <p>
        GitPay is experimental open-source software, maintained by volunteers. It is distributed under the{" "}
        <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noopener">
          GNU General Public License v3.0
        </a>
        , which governs your use of the code. It currently supports only Ethereum Sepolia, a test network.
        Tokens on a test network have no monetary value.
      </p>

      <h2>2. No custody, no service</h2>
      <p>
        GitPay runs in your own CI and pays from a Safe or wallet you control. The GitPay contributors and Stability
        Nexus operate no server, never hold, pool or route your funds, and cannot see, recover, reverse or refund any
        transaction. Nothing on this website is a financial service.
      </p>

      <h2>3. You are responsible for your setup</h2>
      <p>
        You alone are responsible for your Safe, wallet, keys and secrets, the allowances and spending limits you grant,
        the policy you configure, the recipients you pay, and compliance with the laws that apply to you, including
        tax, sanctions and reporting obligations. Blockchain transactions are irreversible. A leaked delegate key can
        spend up to the authority you granted it.
      </p>

      <h2>4. No warranty</h2>
      <p>
        GitPay is provided "as is" and "as available", without warranty of any kind, express or implied, including any
        warranty of merchantability, fitness for a particular purpose, non-infringement, accuracy, availability or
        security. Documentation and examples may be incomplete, outdated or wrong.
      </p>

      <h2>5. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, the GitPay contributors, AOSSIE and Stability Nexus are not liable for
        any loss or damage of any kind arising from or related to your use of, or inability to use, GitPay. This
        includes lost or misdirected funds, double or missed payments, leaked keys, smart contract or network failures,
        and direct, indirect, incidental, consequential or punitive damages, even if advised of their possibility.
      </p>

      <h2>6. Not advice</h2>
      <p>Nothing on this website is financial, investment, legal or tax advice.</p>

      <h2>7. Changes</h2>
      <p>
        These terms may change. The version date below changes with them, and you will be asked to agree again. Your
        continued use after a change means you accept the new terms.
      </p>

      <p className="muted">Version {TERMS_VERSION}</p>
    </>
  );
}
