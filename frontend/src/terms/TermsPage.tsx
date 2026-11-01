import { Background } from "../sections/Chrome";
import { TermsText } from "./TermsText";

export function TermsPage() {
  return (
    <>
      <Background />
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
            GitPay
          </a>
          <nav className="nav-links" aria-label="Site">
            <a href="../">← Back to home</a>
          </nav>
        </div>
      </header>
      <div className="wrap">
        <main className="doc-main terms-page" id="top">
          <section className="doc-sec">
            <span className="kicker">Legal</span>
            <h1>Terms of Use</h1>
            <div className="terms-text">
              <TermsText />
            </div>
          </section>
          <footer>
            <span>GitPay · an AOSSIE / Stability Nexus project</span>
            <span>
              <a href="../">Home</a> · <a href="../docs/">Docs</a>
            </span>
          </footer>
        </main>
      </div>
    </>
  );
}
