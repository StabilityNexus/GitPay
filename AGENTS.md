# AGENTS.md — XOps

Read this before writing code. Every session. This file is authoritative; if anything
elsewhere contradicts it, this wins.

> ## ⚠️ ARCHITECTURE PIVOT IN PROGRESS — read `DECISION-LOG.md` first
>
> As of **2026-09-05** the project has decided to move from the x402 / EIP-3009
> signed-authorization model described below to the **Safe Allowance Module** model, because the
> single optimization target is now **"maintainer does less"** and per-payout signing works
> against it.
>
> **The x402, EIP-3009, `exact` scheme, facilitator and settlement-mode sections below are stale
> and have not yet been rewritten.** The network rule has been updated; nothing else has.
> `DECISION-LOG.md` §4 holds the decisions and supersedes this file on architecture until this
> banner is removed.

---

## What this is

A CI/CD-native value transfer engine. A repository event produces a payment intent, a human
signs it, the workflow settles it, and a receipt is posted back.

Built on **x402 v2** (Linux Foundation standard). First driver: the `exact` scheme over
EIP-3009 `transferWithAuthorization`, USDC.

**Ethereum Sepolia is the only supported network until v1.0.0.** Monad, Base (mainnet and
Sepolia), Solana, Polygon and everything else are gated behind the release criteria in
`REFERENCES.md` §2.4. Do not add a second network entry to `assets/chains.json`, do not write a
second driver, and do not accept a PR that does.

**Why Ethereum Sepolia, and why it changed from Base Sepolia:** the Safe **AllowanceModule** is
canonically deployed on Ethereum Sepolia (`0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134`, v0.1.0)
and is **not deployed on Base Sepolia at all**. Under the allowance model the module is
load-bearing, so Base Sepolia would mean self-deploying it — extra work, an unverified address,
and a trust question for adopters. Everything needed on Ethereum Sepolia is free: testnet USDC
from `faucet.circle.com`, Sepolia ETH from the Google Cloud / Alchemy / QuickNode faucets, and
Safe{Wallet} supports the chain so the clickable Spending Limits flow works.

The old justification for Base Sepolia was its free keyless x402 facilitator. Under the
allowance model there is no facilitator, so that reason no longer applies.

**The one-network rule itself is unchanged and still right** — only the network moved.

## The thesis

**XOps is an artifact, not a service.** It ships as a versioned GitHub Action that runs in the
*adopter's* CI. The maintaining organization operates no server and pays nothing, at any user
count. If a feature requires us to run something, it is out of scope or it is Tier 2
(adopter-operated). This is not a preference — it is the reason the project can exist.

---

## Architecture — six layers, one rule

```
L5 RECEIPT       SettlementResponse → PR comment + machine-readable receipt
L4 SETTLEMENT    driver registry: (scheme × network) → driver   ← only layer that knows rails
L3 AUTHORIZATION PaymentPayload — who approved, cryptographically
L2 INTENT        PaymentRequirements — what moves, to whom
L1 POLICY        offline gates, no network
L0 TRIGGER       repo event → Intent
```

### THE ONE RULE

> **Nothing in `src/core/**` or `src/adapters/**` may import a chain library, a token address,
> an RPC URL, a payment SDK, or a chain-specific primitive — including `keccak256`, `bytes32`,
> address formats, and ABI encoding.**

The core handles exactly three x402 data structures — `PaymentRequirements`, `PaymentPayload`,
`SettlementResponse` — plus the local `Intent` and `IdempotencyKey`. It never learns what a
chain is.

If you are about to write `if (network === "...")`, import `ethers`/`viem`, or call a hash
function in core: **stop.** That belongs in a driver.

`PaymentPayload.payload` is `Record<string, unknown>`. Core must never read a field inside it.
Only the driver owning that scheme may.

---

## Invariants — CI enforces these

**Boundary**

| ID | Rule |
|---|---|
| I1 | Core and adapters import no chain libs or chain primitives (lint + CI grep) |
| I2 | **XOps never holds, pools, or routes funds.** No XOps-operated account exists |
| I3 | Drivers with `needsSecret \|\| custodial` cannot register in Tier 0 — registry throws |
| I4 | `Intent.recipient` is an opaque `string`, resolved by a resolver. Never `` `0x${string}` `` |

**Safety**

| ID | Rule |
|---|---|
| I5 | Default mode is `dry-run`. Real settlement is explicit opt-in |
| I6 | `verify()` is offline — zero network calls in `exact/eip155` |
| I7 | Idempotency key is deterministic, versioned, and **excludes `amount`** |
| I8 | `AUTH_ALREADY_USED` is **SUCCESS**, never failure |
| I9 | A driver must declare `nativeReplayProtection`; **every tier** refuses to settle without it, or without a `SettlementLedger` standing in for it |
| I10 | No amount above `policy.max_per_payout` reaches a driver |

**Supply chain**

| ID | Rule |
|---|---|
| I11 | Core runtime dependencies ≤ 2 packages |
| I12 | `dist/` is reproducible from `src/`; CI rebuilds and diffs |
| I13 | Money-path deps exact-pinned, never auto-merged |

I1 decays fastest — every individual violation looks harmless. Write the lint rule in the first
commit, before there is anything to lint.

---

## Custody — the boundary that defines the project

Three things get conflated. Only one is forbidden.

| | Who holds funds | Allowed |
|---|---|---|
| Direct transfer | nobody — payer → recipient in one call | ✅ core |
| Escrow (`auth-capture`) | a contract **the adopter deployed and controls** | ✅ core |
| Pooled / omnibus balance | a service operator's account | ❌ Tier 2 only |

**Escrow is not custody.** An escrow contract is the adopter's infrastructure, exactly like the
token contract is. XOps constructs authorizations against it and holds no key to it.

The boundary that counts is a **network hop to a different legal entity** — not a module split.
A custodial driver loaded in-process is custody regardless of which file it lives in. That is
what I3 enforces.

Registry error message when I3 fires:

```
Driver ${id} takes custody of funds and cannot run in-process.
Custodial settlement must run as a separate service you operate:
  settlement: { mode: facilitator, url: https://your-service }
```

---

## Dependencies

Runtime, exact-pinned, complete list:

```json
{ "@noble/curves": "2.3.0", "@noble/hashes": "2.3.0" }
```

Do **not** add `ethers`, `viem`, `thirdweb`, or `@x402/*` to runtime dependencies.
`@x402/core` may be a **devDependency** for schema validation in tests only.

Everything needed is implementable on noble — EIP-712 hashing, secp256k1 sign/recover, ABI
encoding (9 static params, all 32-byte words), and JSON-RPC over native `fetch`.
See `REFERENCES.md` for verified implementations.

---

## Layout

```
src/core/         types, engine, intent, policy, idempotency, errors, receipt   ← I1
src/resolvers/    identity → PayoutTarget. Ship inline-address; interface for more   ← I1
src/drivers/      types, registry, exact-eip155/, facilitator/     ← rails live ONLY here
src/adapters/     github/{trigger,comment,outputs}                 ← I1
src/cli.ts        npx xops verify|encode|dry-run — offline, no keys
assets/chains.json
signer/           static EIP-712 signer → GitHub Pages
spec/transports/github-actions.md
test/vectors/     golden fixtures — regenerate deliberately, never casually
templates/caller/ the two files an adopter copies
```

---

## Identity — resolve, never assume

`recipient` is an opaque string. A resolver turns it into a payout target:

```ts
Identity (string) → Resolver → PayoutTarget {
  rail: string;              // CAIP-2 or a non-chain rail id
  address: string;
  attestations?: unknown[];
  resolvedBy: string;
}
```

Ship one resolver (inline address from the comment). The interface is what matters — ENS,
`.well-known` lookup, and ERC-8004 agent IDs are all just resolvers, each ~50 lines, each
writable by someone else.

Typing `recipient` as an address permanently closes agents, non-EVM chains, web2 recipients,
and reputation aggregation. Don't.

---

## Idempotency — rail-neutral in core, native in drivers

Core emits a canonical **string**. The driver derives its rail's replay primitive from it.

```ts
// src/core/idempotency.ts — NO hashing, NO chain concepts
export function canonical(k: IdempotencyKey): string {
  return `xops:v1|${k.source.platform}:${k.source.repo}#${k.source.ref}` +
         `|${k.recipient.toLowerCase()}|${k.network}|${k.asset}|${k.round}`;
}
```

```ts
// src/drivers/exact-eip155/nonce.ts — chain concepts live HERE
export const toNonce = (key: string) =>
  "0x" + Buffer.from(keccak_256(Buffer.from(key))).toString("hex");
```

**`amount` is excluded on purpose.** With amount in the key, `/send alice 50` corrected to
`/send alice 500` yields two keys and Alice receives 550. Excluded, the correction collides and
requires an explicit `round: 1` — a deliberate, logged act. A coarser key fails recoverably; a
finer key fails by paying twice. Same reasoning excludes timestamps and comment IDs.

Because `asset` and `network` are in the key, **multi-asset and multi-chain payouts will work
with no core changes** when those networks are eventually added. Do not add special cases for
them, and do not add the networks themselves.

Re-running a workflow reproduces the key, the driver reproduces the nonce, and the token
contract rejects it as used. That rejection is **success** (I8).

---

## Conventions

- Amounts are **strings in atomic units**. Never `number`, never floats. USDC has 6 decimals.
- `asset` is an **opaque identifier**, not an address — Solana mints and Stellar asset IDs
  are not `0x`. Resolve `decimals` from the registry, never infer.
- Networks are **CAIP-2** (`eip155:143`), never friendly strings. A workflow may *type* an
  alias (`sepolia`); `canonicalNetwork()` resolves it before `parseIntent`, so the CAIP-2
  spelling is the only one that reaches the intent, the idempotency key and the receipt.
  Two spellings surviving into the key would let one payout settle twice.
- Anything that is a **function of the network** — `chainId`, the AllowanceModule address,
  the explorer base — comes from the chain registry in `src/drivers/chains.ts`, never from a
  workflow input restating what `network` already says. An explicit input still overrides.
- Errors are codes from `src/core/errors.ts`. Never surface a stack trace in a PR comment.
- Every settlement path writes `TX_HASH` and `EXPLORER_URL` to `GITHUB_OUTPUT`, including on
  failure paths.
- Timestamps: `validAfter = now - 60` (clock skew), `validBefore = now + 900` (15 min).
- Multi-recipient is **N independent authorizations**, not one atomic batch. Each is
  independently idempotent and independently retryable.
- Policy conditions are **named constants**, never an expression language — that is a permanent
  security surface, because whoever can edit an expression can rewrite the rule meant to
  constrain them. Implemented in `src/core/policy.ts`: `SETTLEMENT_ENABLED` (kill switch,
  evaluated first), `MAINTAINER_APPROVED`, `AMOUNT_WITHIN_CAP` (I10). Planned: `PR_MERGED`,
  `TESTS_PASS`, `COVERAGE_GT_80`.
- Policy is **declared, not scripted**. An adopter configures it with action inputs
  (`enabled`, `allowed_associations`, `max_per_payout`) and never writes assertions in workflow
  YAML. `evaluate()` is pure and total; every condition is evaluated so one run shows every
  problem, and `assertAllowed()` reports the first failure's code.
- What an `author_association` *means* belongs to the GitHub adapter. Core policy is told only
  whether the actor may spend — and `undefined` there means "not comment-triggered", which
  **skips** the condition rather than failing it. Treating a missing comment author as "not a
  maintainer" would deny every workflow-configured payout.
- `.xops.yml` carries `version: 1`. Unknown keys warn, never fail. Never repurpose a key.

---

## Security posture

- **Front-running is harmless here.** The authorization commits to `to`. Anyone who broadcasts
  it pays our gas and the intended recipient still receives the exact amount. Never treat
  "someone else's tx landed" as failure.
- **Do not use `receiveWithAuthorization`.** It requires `msg.sender == to`, forcing the
  contributor to broadcast and pay gas. That destroys the gasless property.
- **Compare payload against requirements** before settling — recipient, amount, asset, network.
  Never trust the payload's self-description.
- **Recovered signer** is checked against the expected payer from requirements, not against
  anything inside the payload.
- The **offline-signing path** — maintainer signs in their own wallet, CI never holds the
  treasury key — is the recommended default. `mode: facilitator` needs zero secrets and zero
  gas and is the safest Tier 0 configuration.
- **Simulate before broadcast** (`eth_call` + `eth_estimateGas`, decode revert reasons). Catches
  treasury caps, paused contracts, and unauthorized operators for zero gas.

---

## Scope

**In:** **Ethereum Sepolia only** · GitHub adapter · Safe AllowanceModule driver ·
inline-address resolver · CLI · machine-readable receipts.

> Was: "`exact` scheme · Base Sepolia only · facilitator driver · static signer page". The
> scheme, facilitator driver and signer page all belonged to the x402 / EIP-3009 design and are
> superseded by the allowance model. See the banner at the top of this file.

**Specify, do not build:** any second network (Base mainnet, Monad, Solana, Polygon) ·
`auth-capture` (escrow) · `upto` · `batch-settlement` · non-EVM drivers · ERC-8004 resolver ·
MCP server · `.well-known/x402.json` discovery.

The architecture must *accommodate* every item above. It must *implement* none of them yet.
Design pressure without implementation cost is the point — if a design choice would make a
second network hard, that is a bug now, even though the second network does not exist.

**Out:** any fiat rail · dashboards · cross-repo aggregation servers · identity verification ·
tax filing · any list we maintain ourselves.

### Two stances to hold

**Fiat is Tier 2 by nature.** There is no outbound fiat payout path in x402 — not in beta, not
specified. Moving money through a bank requires a credential held by a legal entity, plus KYC
and tax reporting per recipient. The answer is off-ramp at the recipient's edge: settle USDC,
the contributor converts through their own provider.

**Adopt standards at the interface, not as a dependency.** ERC-8004 as a resolver behind the
identity interface: ~50 lines, no coupling, degrades to nothing if the standard stalls.
ERC-8004 as a core dependency: makes us EVM-only and bets correctness on a draft standard.
Take the interface, never the bet. Agents may propose; humans sign.

---

## When stuck

- `ROADMAP-FUTURE.md` — the sanctioned backlog beyond `v1.0.0`. What remains *before* it is the
  unticked half of the release gate, `REFERENCES.md` §2.4
- `REFERENCES.md` — verified constants, type definitions, tested primitives, error codes
- Spec: `github.com/x402-foundation/x402` → `specs/x402-specification-v2.md`,
  `specs/schemes/exact/scheme_exact_evm.md`
- Ethereum Sepolia constants and the release gate: `REFERENCES.md` §2

Prefer deleting code over adding an abstraction. The dependency count and the layer boundary
are the product.
