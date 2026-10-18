# Security Policy

GitPay moves money from an adopter's Safe. A bug in the settlement path can pay the wrong
person, pay twice, or let a leaked delegate key spend more than intended. Please report such
issues privately so adopters can be protected before details are public.

## Supported versions

| Version | Supported |
|---|---|
| `v1` (latest `1.x` release) | ✅ |
| anything before `v1.0.0` | ❌ |

Adopters pin the major tag `v1`; fixes ship as a new `1.x` release and the tag moves to it.

## Reporting a vulnerability

**Do not open a public issue, pull request or Discord message for a vulnerability.**

1. **Preferred:** use GitHub's private vulnerability reporting —
   [Report a vulnerability](https://github.com/StabilityNexus/GitPay/security/advisories/new).
2. **If that link is unavailable:** send a direct message on
   [Discord](https://discord.gg/hjUhu33uAn) to a maintainer listed in
   [MAINTAINERS.md](./MAINTAINERS.md), saying only that you have a security report, and we will
   open a private advisory with you.

Include, where you can:

- the GitPay version or commit, and the network (`eip155:11155111`)
- what an attacker can do, and what they need first (a comment, a collaborator role, the
  delegate key, an RPC they control, …)
- steps or a workflow file that reproduce it — on Sepolia, never with real funds

## What to expect

- Acknowledgement within **7 days**, and an initial assessment within **14 days**.
- We agree a disclosure date with you, publish a GitHub security advisory with the fix, and
  name the fixed vulnerability in the release notes. Credit is given unless you ask otherwise.

## In scope

- The Action (`src/`, `dist/`, `action.yml`): policy bypass, the idempotency key or receipt
  ledger letting one payout settle twice, a forged receipt blocking or faking a payout, the
  delegate key or other secrets leaking into logs, comments or outputs.
- The adopter workflow templates in the README.
- The release pipeline: provenance, SBOM, and the moving `v1` tag.

## Out of scope

- The Safe contracts and the AllowanceModule themselves — report those to
  [Safe](https://github.com/safe-fndn/safe-modules/security/policy).
- Behaviour that is documented as intended: a leaked delegate key can spend up to the
  allowance each period until a Safe owner removes the delegate
  ([`DECISION-LOG.md` §6a](./DECISION-LOG.md)).
- The marketing site in `frontend/`, unless it affects the Action.
