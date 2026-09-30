# Privacy Policy

## Introduction

XOps is a GitHub Action, not a hosted application or service. It runs entirely inside the
adopting repository's own GitHub Actions runner. The maintaining project (AOSSIE) operates no
backend, database, or analytics endpoint for XOps, and receives no data from any run of it.

## What XOps Processes

When a workflow invokes the action, it processes only what that workflow's own configuration and
repository events provide — for example, an issue/PR comment, a recipient identifier, and an
amount. This data:

- is read from and written back to the adopter's own GitHub repository (workflow inputs/outputs,
  PR/issue comments, `GITHUB_OUTPUT`);
- is never transmitted to AOSSIE or any server AOSSIE operates, because none exists in the
  default flow;
- may, depending on the configured `settlement.mode`, be sent to a public blockchain RPC endpoint
  or a third-party x402 facilitator that the *adopter* configures (e.g. `x402.org/facilitator`).
  Any data sent to those third parties is governed by their own policies, not this one.

The default mode is `dry-run`: no network calls, no secrets, and nothing leaves the workflow run.

## Data Storage

XOps does not store data on any server it operates — it has none. Any state (idempotency keys,
receipts) lives only in the adopter's own repository or CI logs, under the adopter's control.

## Data Sharing

XOps does not sell, share, or use any data for advertising. The only external calls it can make
are the ones explicitly configured by the adopter (an RPC endpoint or facilitator URL) to
complete a settlement the adopter requested.

## On-Chain Data

When `settlement.mode` is not `dry-run`, XOps constructs and may broadcast a transaction on a
public blockchain (currently Base Sepolia). Transactions on a public blockchain are, by their
nature, permanently public and visible to anyone — this is inherent to the technology, not a
choice made by this project.

## Security

Secrets (e.g. a gas wallet key) are supplied and held by the adopter in their own GitHub Secrets,
never by AOSSIE. See [AGENTS.md](AGENTS.md) for the project's custody model.

## Changes to This Privacy Policy

We may update this Privacy Policy as the project evolves. Updates will be published in this file.

## Contact Us

Questions about this policy: [contact@aossie.org](mailto:contact@aossie.org)
