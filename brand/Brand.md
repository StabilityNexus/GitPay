# Brand Guidelines

This document sets out the visual identity, terminology and tone for **GitPay**, a
CI/CD-native value transfer engine shipped as a versioned GitHub Action. GitPay is a
**Stability Nexus** project, developed within the **AOSSIE** open-source organization.

It covers how GitPay looks and how it is described. What GitPay *is* — its architecture,
invariants and scope — is defined in [`AGENTS.md`](../AGENTS.md); when this file and
`AGENTS.md` disagree about a fact, `AGENTS.md` wins.

## Visual Identity

### Logos and Assets

Every brand asset lives in this folder, [`/brand`](.). Prefer the SVG; use the PNG only where
SVG is not accepted.

```
brand/
├── Brand.md                     this file
├── palette.css                  the palette and type stacks as CSS custom properties
├── logo/
│   ├── gitpay-logo.svg          primary mark, light backgrounds   (+ .png, 1254 px)
│   └── gitpay-logo-dark.svg     primary mark, dark backgrounds    (+ .png, 1254 px)
└── icons/
    ├── favicon.svg              simplified glyph, legible at 16 px
    ├── favicon.ico              16 / 32 / 48 px, for browsers without SVG favicons
    ├── favicon-16.png  favicon-32.png  favicon-48.png
    ├── app-icon.svg             full mark on full-bleed Ink, source for the icons below
    ├── apple-touch-icon.png     180 px
    └── icon-192.png  icon-512.png   web-app manifest icons
```

- **GitPay Logo (light backgrounds):** `logo/gitpay-logo.svg` — The primary mark. A git
  branch glyph — two commit nodes joined by a dark stem — whose side branch curves off into a
  blue coin bearing a `$`. It reads as the project in one picture: a repository event branches
  into a payment. The stem is near-black ink (`#161925`).
- **GitPay Logo (dark backgrounds):** `logo/gitpay-logo-dark.svg` — The same mark with the
  stem in a light neutral (`#E6E9F2`). The blue branch and coin are identical in both versions.
- **Favicon:** `icons/favicon.svg` — The branch and coin reduced to what survives at 16 px:
  Mist nodes and stem on an Ink tile, the blue branch and coin, no `$`. The project site
  serves a copy at `/frontend/public/favicon.svg`.
- **App icon:** `icons/app-icon.svg` — The dark-variant mark on a square Ink background with
  no transparency, because iOS and Android apply their own corner mask. The touch and
  manifest PNGs are rendered from it.
- **Stability Nexus Logo:** `/public/stability.svg` — Parent project mark. Shown beside the
  GitPay logo in README headers, never as a substitute for it.
- **AOSSIE Logo:** `/public/aossie-logo.svg` — Organization mark, for cross-org materials.

Both logo files have transparent backgrounds. Choose the variant by the background, not by
taste: in Markdown, switch automatically with a `<picture>` element, as the README header does.

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/logo/gitpay-logo-dark.svg">
  <img alt="GitPay" src="brand/logo/gitpay-logo.svg" width="175">
</picture>
```

On a web page, link the icon set like this:

```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

Do not recolor the coin, rotate the mark, separate the coin from the branch, or set the logo
on a busy image or gradient. Keep clear space around it of at least the coin's radius.

### Color Palette

The palette is taken directly from the logo: a deep-to-sky **blue gradient** for the branch
and coin, set against a neutral **ink** stem. Blue is the only brand hue. Status colors carry
meaning and are kept separate from it.

* **GitPay Blue (Primary):** `#0C61EB`
  * The deep end of the logo gradient, where the branch leaves the stem. Use for primary
    buttons, links and emphasis **on light backgrounds** (5.35:1 on white). White text on it
    passes AA (5.35:1).
* **Coin Blue (Mid):** `#0D89F2`
  * The middle of the gradient. Use for illustration, icons, focus rings and chart series.
    **Not for body text** on white (3.57:1) — large text or graphics only.
* **Sky Blue (Highlight):** `#0DABF8`
  * The bright end of the gradient, at the top of the coin. Use for links and emphasis **on
    dark backgrounds** (6.83:1 on Ink). Never for text on white (2.56:1).
* **Brand Gradient:** `linear-gradient(135deg, #0C61EB 0%, #0DABF8 100%)`
  * For hero accents, the coin, and one featured element per page at most. Never behind body
    text.
* **Ink (Dark Neutral):** `#161925`
  * The logo stem. Use for text on light surfaces, dark surfaces, and code blocks.
* **Mist (Light Neutral):** `#E6E9F2`
  * The dark-variant stem. Use for borders and muted surfaces on light pages, and for body
    text on Ink (14.4:1).

#### Payout status colors

Every receipt, PR comment, badge and dashboard that shows a payout uses these, and only
these, for status. The meaning is fixed; never reuse them as decoration.

| Status | Color | Meaning |
|---|---|---|
| `settled` | `#16A34A` green | Transaction confirmed on-chain |
| `AUTH_ALREADY_USED` | `#16A34A` green | Already paid — this is **success** (invariant I8), never shown as an error |
| `dry-run` | `#64748B` slate | Policy ran, nothing moved. Neutral, never green — a dry run is not a payment |
| `broadcasting` | `#D97706` amber | **Outcome unknown.** A human checks the explorer. Never green, never red |
| refused / failed | `#DC2626` red | Policy refused or settlement failed. Nothing was paid |

The amber `broadcasting` state is the one most likely to be drawn wrong. Showing it as
success hides a payout that may never have landed; showing it as failure invites someone to
pay again, which is the one unrecoverable mistake.

#### Accessibility

All text pairings must meet WCAG 2.1 AA (4.5:1). On light surfaces use Ink for body text and
GitPay Blue for links; on dark surfaces use Mist or white for body text and Sky Blue for
links. Never convey status by color alone — always pair the color with the status word.

> **Note.** The project site in [`/frontend`](../frontend) currently uses a violet accent
> (`#8b6cff` / `#5b3cc4`) that predates the logo. The logo palette above is the brand; the
> site should move to it when next redesigned. Its favicon already has. The tokens in
> [`palette.css`](./palette.css) are ready to drop in.

## Typography

Documentation in this repository (`README.md`, `AGENTS.md`, `DECISION-LOG.md`, and the rest)
is plain Markdown rendered by GitHub, so GitHub's defaults govern it. Where custom HTML/CSS is
used — the project site, slides, diagrams:

- **Primary Typeface:** **Geist**, falling back to
  `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Monospace:** **Geist Mono**, falling back to
  `ui-monospace, "SFMono-Regular", Consolas, monospace`.
- **Weights:** Regular (400) for body copy; Semibold to Bold (600–700) for headings.
- **Monospace is for things a user types or a machine reads:** the `/send` command, action
  inputs (`max_per_payout`, `mode`), error codes (`POLICY_DENIED`), CAIP-2 network IDs,
  addresses, transaction hashes and filenames. Always wrap these in inline code in Markdown.
- **Amounts** use tabular figures (`font-variant-numeric: tabular-nums`) so columns of
  payouts line up, and always name the token: `2.50 USDC`, never `$2.50`.

## Terminology & Copywriting

### Names

- **GitPay** — one word, capital G and P. Not "Gitpay", "Git Pay", "GITPAY" or "gitpay"
  (except in code identifiers and URLs).
- **XOps** — the project's former name. Do not use it in prose. The wire formats
  `xops:v1|…` and `<!-- xops-receipt:v1 … -->` keep the old prefix **on purpose** (renaming
  them would hide every past payout from the ledger); when asked, say exactly that.
- **Stability Nexus** and **AOSSIE** — written as shown.
- **Safe** — the smart account product, capitalized. "The adopter's Safe", not "the safe" or
  "the wallet".
- **AllowanceModule** — one word, as in Safe's contracts. In UI copy, Safe{Wallet}'s own label
  **Spending Limits** is fine.
- **Ethereum Sepolia** — the full name, not just "Sepolia" or "the testnet", the first time
  it appears. Its CAIP-2 ID is `eip155:11155111`.

### Project vocabulary

Use each term for one thing only:

| Term | Means |
|---|---|
| **adopter** | The maintainer or organization running GitPay in their own repository |
| **recipient** | Whoever is paid. Not "contributor" in technical text — a recipient may be an agent or a non-GitHub identity |
| **payout** | One transfer to one recipient. Multi-recipient means N payouts, not a "batch" |
| **delegate** | The address whose key CI holds, authorized by the Safe's allowance |
| **allowance** / **period cap** | The on-chain spending limit for the delegate, reset each period |
| **receipt** | The PR comment GitPay posts after a payout. The receipts together are the **ledger** |
| **policy** | The adopter's declared rules: `enabled`, `allowed_associations`, `max_per_payout` |
| **dry run** (noun) / `dry-run` (the mode value) | The default: policy runs, nothing moves |

### Voice

GitPay moves real money, so its copy is **plain, precise and honest about risk**. Write the
way `AGENTS.md` does: short declarative sentences, the mechanism stated, the limit stated.

- **Lead with the maintainer doing less.** That is the single thing GitPay optimizes for.
  "Set up once in Safe{Wallet}, then pay with a comment" beats any list of features.
- **"GitPay is an artifact, not a service"** — the core claim. Use this exact phrase. GitPay
  runs in the adopter's CI; there is no GitPay server, account or fee.
- **"Never holds, pools or routes funds"** — the custody claim. The adopter's Safe pays the
  recipient directly.
- **State the delegate key honestly.** GitPay puts a key in CI on purpose. Say "the key's
  authority is bounded on-chain and revocable". Never say "no keys in CI", "keyless" or
  "zero risk".

Words we do not use, because they are untrue of GitPay or promise more than it does:

| Avoid | Why | Say instead |
|---|---|---|
| trustless | The adopter trusts their own CI, delegate key and Safe owners | "no GitPay server to trust" |
| gasless | The delegate pays gas in native ETH | "the delegate needs a little ETH for gas" |
| instant | Settlement waits for the chain | "settles on-chain in the same workflow run" |
| guaranteed / risk-free | A leaked key can drain up to the cap each period | "bounded by the period cap" |
| platform, service, SaaS | GitPay is a GitHub Action, nothing is hosted | "Action", "workflow step" |
| mainnet-ready, multi-chain | Ethereum Sepolia is the only supported network | "Ethereum Sepolia only, for now" |
| crypto payments, Web3 | Vague and off-putting to most maintainers | name the token and the network |

### Formatting conventions

- Write amounts as the maintainer types them, with the token: `2.50 USDC`.
- Show commands exactly as typed: `/send alice 2.50`.
- Link transaction hashes to the block explorer; never paste a bare hash in user-facing copy.
- Error messages show the code from `src/core/errors.ts` and a plain sentence. Never a stack
  trace.
