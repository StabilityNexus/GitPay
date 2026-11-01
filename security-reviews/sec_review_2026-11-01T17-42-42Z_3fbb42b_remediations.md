# Remediations of Security Review Findings

Review date and time: 2026-11-01T17:42:42Z

## Remediations

### Remediation of Finding 1: `MEMBER` and `COLLABORATOR` are trusted to spend without write access

- [x] This remediation implements the security review's recommendation for this finding.
- [ ] This remediation addresses the finding in a way that differs from the security review's recommendation.

Remediation commits:
- [f40474f](https://github.com/StabilityNexus/GitPay/commit/f40474ff3fd3de673f0d942d4cf99b462a4c259d)
- [dbabe64](https://github.com/StabilityNexus/GitPay/commit/dbabe64232f12b8d2f96a126f8417829f4dfbc11)

Description: A `/send` author admitted by `allowed_associations` must now also have `write`,
`maintain` or `admin` permission on the repository, checked against GitHub's
collaborator-permission endpoint (`src/adapters/github/permissions.ts`). `OWNER` skips the
lookup because an owner always has admin. The account checked is `GITHUB_ACTOR`, the one that
posted the comment, never the overridable `actor` input. The allowlist still narrows. An outsider
is refused before any lookup, a failed lookup refuses the payout, and with the kill switch off no
lookup runs. `github_token` now defaults to
`${{ github.token }}`, so the dry-run template keeps working without a new input. `action.yml`
and the frozen input schema document the check.

### Remediation of Finding 2: Receipt comments are believed from non-writers and from any bot

- [ ] This remediation implements the security review's recommendation for this finding.
- [x] This remediation addresses the finding in a way that differs from the security review's recommendation.

Remediation commits:
- [f40474f](https://github.com/StabilityNexus/GitPay/commit/f40474ff3fd3de673f0d942d4cf99b462a4c259d)
- [dbabe64](https://github.com/StabilityNexus/GitPay/commit/dbabe64232f12b8d2f96a126f8417829f4dfbc11)

Description: The receipt ledger now applies the Finding 1 permission check to the human author
of any receipt that matches the payout's key. A matching receipt from a `MEMBER` or `COLLABORATOR`
who cannot push is neither believed nor dropped. Dropping a genuine one, written through a
person's token by someone who has since lost access, could pay twice. Unless a trusted receipt
also exists, the run refuses and names the comment for a maintainer to check. A forger can still
stall a payout, but no longer silently: the run fails instead of reporting `already-paid`. Any
account of type `Bot` is still believed, because GitPay's own receipts are written by
`github-actions[bot]` and the token's own identity cannot be learned cheaply. GitPay's own
receipts cost no extra API call.

### Remediation of Finding 3: A malformed delegate key is echoed into the error message and the run log

- [x] This remediation implements the security review's recommendation for this finding.
- [ ] This remediation addresses the finding in a way that differs from the security review's recommendation.

Remediation commits:
- [9b6c494](https://github.com/StabilityNexus/GitPay/commit/9b6c4940f28a8c1c7d54d2eb5f01bbddd7ec2efe)

Description: The delegate key is validated as 64 hex digits, with an optional `0x` prefix,
before it is decoded, and the error omits the value. `hexToBytes` checks every character, so
`0g` is no longer read as `0`, and its errors no longer quote their input.

## Non-remediated findings

None.

## Comments

Commit links point at `StabilityNexus/GitPay` rather than the checkout's `origin` remote, which
is a personal fork (`kpj2006/XOps`) that will not carry these commits. The repository merges
pull requests with merge commits, so the hashes are preserved on `main`.
