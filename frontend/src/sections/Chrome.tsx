import { useEffect, useState } from "react";
import { cx } from "../hooks";

export function Background() {
  return (
    <div className="bg-fx" aria-hidden="true">
      <div className="gridlines" />
      <div className="blob b1" />
      <div className="blob b2" />
    </div>
  );
}

const LINKS = [
  ["#today", "Why"],
  ["#how", "How it works"],
  ["#policy", "Policy"],
  ["#flex", "Flexibility"],
  ["#trust", "Security"],
] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cx("nav", scrolled && "scrolled")}>
      <div className="wrap">
        <a className="brand" href="#top" aria-label="GitPay home">
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
        <nav className="nav-links" aria-label="Sections">
          {LINKS.map(([href, label]) => (
            <a key={href} className="hide-sm" href={href}>
              {label}
            </a>
          ))}
          <a href="./docs/">Docs</a>
          <a className="btn btn-primary btn-sm" href="#start">
            Get started
          </a>
        </nav>
      </div>
    </header>
  );
}

const STACK = [
  "GitHub Actions",
  "Safe AllowanceModule v0.1.0",
  "Ethereum Sepolia · eip155:11155111",
  "x402 v2 data shapes",
  "@noble/curves",
  "@noble/hashes",
  "CAIP-2 networks",
  "EIP-1559 signing",
  "OpenSSF Scorecard",
  "MIT licensed",
];

export function Marquee() {
  return (
    <div className="marquee" aria-label="Built on">
      <div className="marquee-track">
        {STACK.map((s) => (
          <span key={s}>{s}</span>
        ))}
        {STACK.map((s) => (
          <span key={`dup-${s}`} aria-hidden="true">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <div className="wrap">
      <footer>
        <span>GitPay, formerly XOps · an AOSSIE / Stability Nexus project · MIT</span>
        <span>
          <a href="https://github.com/StabilityNexus/GitPay" target="_blank" rel="noopener">
            github.com/StabilityNexus/GitPay
          </a>
        </span>
      </footer>
    </div>
  );
}
