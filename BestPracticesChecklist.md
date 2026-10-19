# AOSSIE Best Practices Checklist

> Criteria adapted from the [OpenSSF Best Practices Badge](https://github.com/coreinfrastructure/best-practices-badge)
> (MIT / CC BY 3.0) by OpenSSF contributors. Modified for AOSSIE multi-repo template use.

> **Purpose:** Covers OpenSSF Best Practices criteria that are NOT auto-detected by OpenSSF Scorecard.
> Scorecard already handles: License, SAST tools, CI tests, Security Policy file, Branch Protection,
> Pinned Dependencies, Signed Releases, Maintained status, and Known Vulnerabilities.
>
> **How to use:**
> 1. Fill in checkboxes below — tick `[x]` for Met, leave `[ ]` for Unmet, use `[~]` for N/A
> 2. Add a brief note or URL after each item as evidence
> 3. Run the checklist-score workflow to update the badge automatically
>
> **Legend:**
> - 🔴 MUST — Required for passing
> - 🟡 SHOULD — Required unless documented rationale given
> - 🔵 SUGGESTED — Optional but recommended
> - ⚪ N/A — Mark `[~]` if not applicable, add justification

---

## Score Summary

<!-- Auto-updated by checklist-score.yml workflow — do not edit manually -->
| Category           | Met | Total | Status |
|--------------------|-----|-------|--------|
| Basics             | 8   | 8     | ✅     |
| Change Control     | 6   | 6     | ✅     |
| Reporting          | 8   | 8     | ✅     |
| Quality            | 10   | 11     | 🟡     |
| Security           | 9   | 9     | ✅     |
| Analysis           | 5   | 7     | 🟡     |
| **Total**          | **46** | **49** | **94%** |
---

## 🏗️ Basics

### Project Website & Documentation

- [x] 🔴 **description_good** — The project README/website clearly describes what the software does and what problem it solves.
  - *Evidence URL:* https://github.com/StabilityNexus/GitPay#readme (opening section), and the live site https://gitpay.stability.nexus

- [x] 🔴 **interact** — The project provides information on how to obtain the software, submit bug reports, and contribute.
  - *Evidence URL:* Obtain: README "Using the Action" (`uses: StabilityNexus/GitPay@v1`) and https://github.com/StabilityNexus/GitPay/releases. Bugs: [CONTRIBUTING.md § Reporting Bugs](CONTRIBUTING.md#reporting-bugs) and issue templates in [.github/ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE). Contribute: [CONTRIBUTING.md](CONTRIBUTING.md)

- [x] 🔴 **contribution** — `CONTRIBUTING.md` explains the contribution process (e.g., PRs are used, how to open one).
  - *Evidence URL:* [CONTRIBUTING.md § Development Workflow and § Pull Request Guidelines](CONTRIBUTING.md#-development-workflow)

- [x] 🟡 **contribution_requirements** — `CONTRIBUTING.md` references acceptable contribution standards (coding style, tests required, etc.).
  - *Evidence URL:* [CONTRIBUTING.md § Code Style Guidelines](CONTRIBUTING.md#-code-style-guidelines) (defers to [AGENTS.md](AGENTS.md) for the CI-enforced rules) and § Test Your Changes ("Tests are required")

- [x] 🔴 **documentation_basics** — Basic documentation exists for the software (README, Wiki, or docs folder).
  - *Evidence URL:* [README.md](README.md), [AGENTS.md](AGENTS.md), [SETTLEMENT-FLOW.md](SETTLEMENT-FLOW.md), [REFERENCES.md](REFERENCES.md), [DECISION-LOG.md](DECISION-LOG.md), [docs/](docs/)

- [x] 🔴 **documentation_interface** — Reference documentation describes the external interface (API inputs/outputs, CLI flags, config schema, etc.).
  - *Evidence URL:* Every input and output is described in [action.yml](action.yml) and frozen as a JSON Schema in [schema/action-inputs.v1.schema.json](schema/action-inputs.v1.schema.json) (kept in step by `test/manifest.test.ts`); error codes in [REFERENCES.md § 6](REFERENCES.md#6-error-taxonomy--srccoreerrorsts)

### Other Basics

- [x] 🔴 **discussion** — Project has a searchable, URL-addressable discussion mechanism (GitHub Issues, Discord with archive, mailing list, etc.) that doesn't require proprietary client software.
  - *Evidence URL:* GitHub Issues and pull requests (public, searchable): https://github.com/StabilityNexus/GitPay/issues. Discord is linked from the README for chat.

- [x] 🟡 **english** — Documentation is provided in English and English bug reports/comments are accepted.
  - *Note:* All documentation, issues and reviews are in English.

---

## 🔄 Change Control

### Version Control

- [x] 🔵 **repo_distributed** — Project uses a distributed VCS (e.g., git). *(SUGGESTED)*
  - *Evidence URL:* https://github.com/StabilityNexus/GitPay (git)

### Version Numbering

- [x] 🔴 **version_unique** — Each release has a unique version identifier (e.g., v1.0.0).
  - *Evidence URL:* https://github.com/StabilityNexus/GitPay/releases/tag/v1.0.0. [VERSION](VERSION) is the single source; [release.yml](.github/workflows/release.yml) refuses a tag that does not match it.

- [x] 🔵 **version_semver** — Project uses [SemVer](https://semver.org) or [CalVer](https://calver.org/) format. *(SUGGESTED)*
  - *Note:* SemVer (`1.0.0`, `1.0.1`). Adopters pin the major tag `v1`, which `release.yml` moves only on a stable release.

- [x] 🔵 **version_tags** — Releases are tagged in the VCS (e.g., `git tag v1.0.0`). *(SUGGESTED)*
  - *Evidence URL:* https://github.com/StabilityNexus/GitPay/tags (`v1.0.0`, and the moving major tag `v1`)

### Release Notes

- [x] 🔴 **release_notes** — Each release includes human-readable release notes summarizing major changes. Raw `git log` output is NOT acceptable.
  - *Evidence URL:* [v1.0.1](https://github.com/StabilityNexus/GitPay/releases/tag/v1.0.1) and [v1.0.0](https://github.com/StabilityNexus/GitPay/releases/tag/v1.0.0) each open with a written summary (what changed, what adopters must do) above the generated PR list. [release-drafter.yml](.github/release-drafter.yml) starts every new draft with a Summary section.

- [~] 🔴 **release_notes_vulns** — Release notes identify every publicly known vulnerability (with CVE) fixed in that release.
  - *Evidence URL:* `[x]` N/A — *Justification:* No release has fixed a publicly known vulnerability in what ships. The Action's runtime dependencies are only `@noble/curves` and `@noble/hashes` (I11). The one security upgrade so far ([#18](https://github.com/StabilityNexus/GitPay/pull/18), `brace-expansion`, `js-yaml`) touched development-only dependencies that are not in `dist/`.

---

## 🐛 Reporting

### Bug Reporting

- [x] 🔴 **report_process** — A bug-reporting process exists (e.g., GitHub Issues link in README).
  - *Evidence URL:* [CONTRIBUTING.md § Reporting Bugs](CONTRIBUTING.md#reporting-bugs) and the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml)

- [x] 🟡 **report_tracker** — An issue tracker (e.g., GitHub Issues) is used to track individual bugs.
  - *Evidence URL:* https://github.com/StabilityNexus/GitPay/issues

- [~] 🔴 **report_responses** — A majority of bug reports submitted in the last 2–12 months have been acknowledged (response ≠ fix).
  - *Self-certification note:* `[x]` N/A — no bug reports have been filed (the tracker has no issues as of 2026-10-15). Revisit when the first report arrives.

- [~] 🟡 **enhancement_responses** — More than 50% of enhancement requests in the last 2–12 months have received a response.
  - *Self-certification note:* `[x]` N/A — no enhancement requests have been filed as of 2026-10-15.

- [x] 🔴 **report_archive** — Reports and responses are publicly archived and searchable (GitHub Issues satisfies this).
  - *Evidence URL:* https://github.com/StabilityNexus/GitPay/issues (public, searchable)

### Vulnerability Reporting

- [x] 🔴 **vulnerability_report_process** — A vulnerability reporting process is documented (e.g., `SECURITY.md`).
  - *Evidence URL:* [SECURITY.md](SECURITY.md) — supported versions, how to report, what to include, response times (acknowledge within 7 days, assess within 14), scope.

- [x] 🟡 **vulnerability_report_private** — If private vulnerability reporting is supported, the method for private submission is documented.
  - *Evidence URL:* [SECURITY.md § Reporting a vulnerability](SECURITY.md#reporting-a-vulnerability) — GitHub private vulnerability reporting ([form](https://github.com/StabilityNexus/GitPay/security/advisories/new)), with a direct message to a listed maintainer as the fallback. Public issues and channels are explicitly ruled out.

- [~] 🔴 **vulnerability_report_response** — Initial response to any vulnerability report received in the last 6 months was within 14 days.
  - *Self-certification note:* `[x]` N/A — *Justification:* no vulnerability reports have been received.

---

## ✅ Quality

### Build System

- [x] 🔴 **build** — If the project requires building, a working build system exists that can auto-rebuild from source.
  - *Evidence URL:* `npm run build` (`@vercel/ncc`) produces `dist/index.js`. CI rebuilds it on every release and refuses one that differs from the committed `dist/` (I12, [release.yml](.github/workflows/release.yml)).

- [x] 🔵 **build_common_tools** — Common build tools are used (npm, pip, cargo, make, gradle, etc.). *(SUGGESTED)*
  - *Evidence URL:* npm scripts in [package.json](package.json)

- [x] 🟡 **build_floss_tools** — The project can be built using only FLOSS tools.
  - *Note:* Node.js, npm, TypeScript and `@vercel/ncc`, all open source.

### Automated Testing

- [x] 🔵 **test_invocation** — The test suite can be invoked in a standard way for the language (e.g., `npm test`, `pytest`, `cargo test`). *(SUGGESTED)*
  - *Evidence URL:* `npm test` (or `npm run check` for lint, boundary, dependency count and tests), run in CI by [ci.yml](.github/workflows/ci.yml)

- [x] 🔵 **test_most** — The test suite covers most code branches, input fields, and functionality. *(SUGGESTED)*
  - *Estimated coverage %:* **90% of lines, 91% of branches, 88% of functions** across `src/`, measured 2026-10-15 with `node --test --experimental-test-coverage` (147 tests). Golden vectors from an independent implementation cover transaction encoding and signing.

### New Functionality Testing Policy

- [x] 🔴 **test_policy** — The project has a general policy that new functionality must include tests in the automated test suite.
  - *Evidence (CONTRIBUTING reference or informal policy):* [CONTRIBUTING.md § Test Your Changes](CONTRIBUTING.md#3-test-your-changes): "Tests are required. A PR that adds or changes behaviour must add or update tests…"

- [x] 🔴 **tests_are_added** — Evidence exists that the test policy has been followed in recent major changes (e.g., PRs include tests).
  - *Evidence URL (recent PR with tests):* [#43](https://github.com/StabilityNexus/GitPay/pull/43) (asset fix: 7 tests, including a ledger test), [#20](https://github.com/StabilityNexus/GitPay/pull/20) (release-gate tests), [#23](https://github.com/StabilityNexus/GitPay/pull/23) (frozen input schema test)

- [x] 🔵 **tests_documented_added** — The test policy is documented in contribution instructions. *(SUGGESTED)*
  - *Evidence URL:* [CONTRIBUTING.md § Test Your Changes](CONTRIBUTING.md#3-test-your-changes)

### Linting / Warning Flags

- [x] 🔴 **warnings** — At least one linter or compiler warning flag is enabled (ESLint, Pylint, clippy, golangci-lint, Slither for Solidity, etc.).
  - *Tool used:* ESLint with `typescript-eslint` ([eslint.config.mjs](eslint.config.mjs)), including the I1 layer-boundary import rule; TypeScript compiler in `strict` mode ([tsconfig.json](tsconfig.json)).

- [x] 🔴 **warnings_fixed** — Warnings from the linter are addressed (not suppressed without reason).
  - *Note:* `npm run lint` passes and CI fails on any lint error. There are no `eslint-disable`, `@ts-ignore` or `@ts-expect-error` suppressions anywhere in `src/`, `test/` or `frontend/src/`.

- [ ] 🔵 **warnings_strict** — Project uses maximum strictness in linter config where practical. *(SUGGESTED)*
  - *Note:* **Partly.** The compiler is at maximum practical strictness (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`). ESLint uses `typescript-eslint`'s `recommended` set, not `strict-type-checked`. *To meet:* move to `strict-type-checked`.

---

## 🔐 Security

### Secure Development Knowledge

- [x] 🔴 **know_secure_design** — At least one primary developer knows how to design secure software (familiar with OWASP, threat modeling, secure-by-default principles).
  - *Self-certification note:* The maintainer's threat model is written down: secure defaults (`dry-run` unless `mode: self`, unknown modes refused, I5), least authority (a capped, revocable Safe allowance rather than a custodial key; no funds ever held, I2), the delegate key's blast radius ([AGENTS.md § The delegate key](AGENTS.md#the-delegate-key-stated-honestly), [DECISION-LOG.md §6a](DECISION-LOG.md)), and 13 CI-enforced invariants.

- [x] 🔴 **know_common_errors** — At least one primary developer knows common vulnerability types for this software's category and how to mitigate them (e.g., injection, XSS, reentrancy for Solidity, prompt injection for AI).
  - *Self-certification note:* Mitigations for this category's failures are implemented and tested: replay and double payment (deterministic idempotency key, ledger written before broadcast, I7–I9), forged receipts (only bot and maintainer receipts trusted), untrusted comment authors (policy allowlist), over-spend (per-payout cap, I10, plus the on-chain period cap), stuck nonces (refused, never queued), simulation before broadcast, secret leakage (gitleaks), and supply chain (2 exact-pinned runtime deps, SBOM and signed provenance).

### Cryptography (mark N/A if project does not handle cryptography)

- [x] 🔴 **crypto_published** — Only publicly reviewed cryptographic protocols/algorithms are used by default.
  - *Note:* ECDSA over secp256k1 and Keccak-256, as Ethereum requires; EIP-1559 transaction signing. All are public standards.

- [x] 🟡 **crypto_call** — Project calls an established crypto library rather than reimplementing crypto functions.
  - *Library used:* [`@noble/curves`](https://github.com/paulmillr/noble-curves) (secp256k1) and [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) (keccak-256), both independently audited. GitPay implements only ABI and RLP encoding on top, checked against golden vectors from viem.

- [x] 🔴 **crypto_working** — No broken algorithms (MD4, MD5, single DES, RC4, Dual_EC_DRBG) used unless required for interoperability (must be documented).
  - *Note:* None are used; `src/` uses only secp256k1 and keccak-256.

- [x] 🔴 **crypto_keylength** — Key lengths meet [NIST 2030 minimums](https://www.keylength.com/en/4/) by default.
  - *Note:* 256-bit elliptic-curve keys (secp256k1), above the 224-bit ECC minimum.

- [~] 🔴 **crypto_password_storage** — Passwords for external users are stored as iterated salted hashes (Argon2id, bcrypt, scrypt, PBKDF2).
  - *Note:* `[x]` N/A — *Justification:* GitPay has no users and stores no passwords. It is a GitHub Action with no accounts.

- [x] 🔴 **crypto_random** — Cryptographic keys and nonces are generated using a CSPRNG; insecure generators (Math.random, rand()) are NOT used for security purposes.
  - *Note:* GitPay generates no keys (the delegate key is supplied by the adopter as a secret). ECDSA nonces are deterministic per RFC 6979 inside `@noble/curves`. `Math.random` does not appear in `src/`.

- [x] 🟡 **delivery_unsigned** — Cryptographic hashes are NOT retrieved over plain HTTP without a signature check.
  - *Note:* Releases publish `SHA256SUMS` over HTTPS alongside Sigstore build-provenance and SBOM attestations, verifiable with `gh attestation verify dist/index.js --repo StabilityNexus/GitPay`.

---

## 🔬 Analysis

### Static Code Analysis

- [ ] 🔴 **static_analysis_fixed** — All medium+ severity vulnerabilities found by static analysis are fixed in a timely manner after confirmation.
  - *Note:* **Unmet.** Code scanning has 50+ open OpenSSF Scorecard alerts, rated medium and high. Nearly all are in workflows inherited from the AOSSIE template: unpinned actions (`PinnedDependencies`), over-broad token permissions (`TokenPermissions`), and `main` without branch protection. One `Vulnerabilities` alert is [GHSA-vfj7-8cjw-p6xm](https://osv.dev/GHSA-vfj7-8cjw-p6xm) in `braces@3.0.3`, a development-only dependency (via `micromatch`) with no fixed version, not shipped in `dist/`. *To fix:* pin and scope the template workflows, enable branch protection, and record the `braces` alert as a risk-accepted dismissal.

- [x] 🔵 **static_analysis_common_vulnerabilities** — The static analysis tool includes checks for common vulnerabilities in the language/environment (e.g., eslint-plugin-security, bandit, Slither). *(SUGGESTED)*
  - *Tool + ruleset:* CodeQL's default JavaScript/TypeScript query suite ([codeql.yml](.github/workflows/codeql.yml)), which covers injection, prototype pollution, insecure randomness and similar CWE classes. It runs on every push and pull request to `main` and weekly. It was gated on `repository_owner == 'AOSSIE-Org'` from the template, so it never ran here until that condition was removed.

- [x] 🔵 **static_analysis_often** — Static analysis runs on every commit or at least daily (CI integration). *(SUGGESTED)*
  - *Evidence URL:* On every push and PR: ESLint and the I1 boundary grep ([ci.yml](.github/workflows/ci.yml)), gitleaks, OSV-Scanner, dependency review and Socket. Weekly: OpenSSF Scorecard ([scorecard.yml](.github/workflows/scorecard.yml)). Daily: a full-history gitleaks scan.

### Dynamic Code Analysis

- [ ] 🔵 **dynamic_analysis** — At least one dynamic analysis tool is applied before major releases (fuzzer, web app scanner like OWASP ZAP, etc.). *(SUGGESTED)*
  - *Tool used:* **Unmet.** No fuzzer or scanner is run. The release gate's 20 live Sepolia settlements with replays ([docs/VERIFIED_CHAINS.md](docs/VERIFIED_CHAINS.md)) are end-to-end tests, not dynamic analysis. *Candidate:* property-based fuzzing of the `/send` parser, `toAtomic` and the idempotency key (e.g. `fast-check`).

- [x] 🔵 **dynamic_analysis_enable_assertions** — Dynamic analysis / testing runs with assertions enabled (not just production mode). *(SUGGESTED)*
  - *Note:* Tests run under `node --test` with `node:assert/strict`. The shipped Action keeps its run-time checks on in production: policy `assertAllowed`, intent and key-field validation, and simulation before broadcast all throw rather than continue.

- [~] 🔴 **dynamic_analysis_fixed** — Medium+ severity vulnerabilities found by dynamic analysis are fixed in a timely manner.
  - *Note:* `[x]` N/A — no dynamic analysis tool is run yet (see above), so there are no findings to fix.

- [~] 🔵 **dynamic_analysis_unsafe** — If the project uses memory-unsafe languages (C/C++), memory safety tools (Valgrind, AddressSanitizer) are used. *(SUGGESTED)*
  - *Note:* `[x]` N/A — *Justification:* TypeScript on Node.js only; no memory-unsafe code.

---

## 📎 Project-Specific Notes

> Add domain-specific notes here for Web3, Full-Stack, or AI projects.

### Web3 / Solidity Notes
- Scorecard does not audit Solidity-specific security. Use [Slither](https://github.com/crytic/slither) for `static_analysis` and `warnings` criteria.
- For `crypto_*` criteria, document which cryptographic primitives your contracts rely on (e.g., ECDSA in EVM is standard).
- Smart contract audit reports count as evidence for `know_secure_design`.

### Full-Stack / Next.js Notes
- For `crypto_password_storage`: document which auth library handles hashing (e.g., NextAuth + bcrypt).
- For `dynamic_analysis`: [OWASP ZAP](https://www.zaproxy.org/) can be run as a GitHub Action.

### AI / LLM Notes
- For `know_common_errors`: include awareness of prompt injection, data leakage, and model output validation.
- For `dynamic_analysis`: consider adversarial input testing as a form of dynamic analysis.

---

*This checklist complements [OpenSSF Scorecard](https://scorecard.dev/) (auto-detected checks) and is
inspired by the [OpenSSF Best Practices Badge](https://www.bestpractices.dev/en/criteria/0) passing criteria.*