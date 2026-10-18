# AGENTS.md — GitPay

Read this before writing code. Every session. This file is authoritative; if anything
elsewhere contradicts it, this wins. `DECISION-LOG.md` records *why* the design is shaped this
way; this file records *what* it is.

---

## What this is

A CI/CD-native value transfer engine. A repository event produces a payment intent, the
adopter's declared policy approves or refuses it, the workflow settles it from the adopter's own
Safe, and a receipt is posted back.

Settlement runs on the **Safe AllowanceModule**. The maintainer sets up once — a Safe holding the
payout token, a period-capped allowance for a delegate address, and a little native gas for that
delegate — and after that **does nothing per payout**. CI holds the delegate key and calls
`executeAllowanceTransfer`; the Safe pays the recipient directly. The single optimization target
is **"maintainer does less"** (`DECISION-LOG.md` §4–§5).

The core still speaks the three x402 v2 data shapes — `PaymentRequirements`, `PaymentPayload`,
`SettlementResponse` — as the vocabulary between layers, because they are rail-neutral and a
later driver may need them. There is no x402 runtime, no facilitator and no EIP-3009 in the
shipped code. The scheme is `allowance`.

**Ethereum Sepolia (`eip155:11155111`) is the only supported network until v1.0.0 is tagged.**
Monad, Base (mainnet and Sepolia), Solana, Polygon and everything else are gated behind the
release criteria in `REFERENCES.md` §2.4. Do not add a second entry to `src/drivers/chains.ts`,
do not write a second driver, and do not accept a PR that does.

**Why Ethereum Sepolia:** the AllowanceModule is canonically deployed there
(`0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134`, v0.1.0) and is **not deployed on Base Sepolia at
all**. The module is load-bearing, so any other testnet would mean self-deploying it — an
unverified address and a trust question for adopters. Everything needed on Ethereum Sepolia is
free: testnet USDC from `faucet.circle.com`, Sepolia ETH from the Google Cloud / Alchemy /
QuickNode faucets, and Safe{Wallet} supports the chain so the clickable Spending Limits flow
works.

## The thesis

**GitPay is an artifact, not a service.** It ships as a versioned GitHub Action that runs in the
*adopter's* CI. The maintaining organization operates no server and pays nothing, at any user
count. If a feature requires us to run something, it is out of scope or it is Tier 2
(adopter-operated). This is not a preference — it is the reason the project can exist.

---

## Architecture — six layers, one rule

```
L5 RECEIPT       SettlementResponse → PR comment, which is also the ledger
L4 SETTLEMENT    driver registry: (scheme × network) → driver   ← only layer that knows rails
L3 AUTHORITY     the Safe allowance, granted once on-chain and capped per period
L2 INTENT        PaymentRequirements — what moves, to whom
L1 POLICY        offline gates, no network
L0 TRIGGER       repo event → Intent
```

L3 is not a per-payout signature. The maintainer authorized the delegate once, in Safe{Wallet};
each payout is authorized by L1 policy (a maintainer's `/send`, the cap, the kill switch) and
bounded by the module's period cap. `PaymentPayload.payload` is empty for the `allowance`
scheme.

### THE ONE RULE

> **Nothing in `src/core/**`, `src/adapters/**` or `src/resolvers/**` may import a chain
> library, a token address, an RPC URL, a payment SDK, or a chain-specific primitive —
> including `keccak256`, `bytes32`, address formats, and ABI encoding.**

The core handles exactly three x402-shaped structures — `PaymentRequirements`,
`PaymentPayload`, `SettlementResponse` — plus the local `Intent` and `IdempotencyKey`. It never
learns what a chain is.

If you are about to write `if (network === "...")`, import `ethers`/`viem`, or call a hash
function in core: **stop.** That belongs in a driver. `src/main.ts` is the one seam that looks
up the chain registry and constructs the driver; it hands everything else plain strings.

`PaymentPayload.payload` is `Record<string, unknown>`. Core must never read a field inside it.
Only the driver owning that scheme may.

---

## Invariants — CI enforces these

**Boundary**

| ID | Rule |
|---|---|
| I1 | Core, adapters and resolvers import no chain libs or chain primitives (lint + CI grep) |
| I2 | **GitPay never holds, pools, or routes funds.** No GitPay-operated account exists. The Safe pays the recipient directly |
| I3 | Drivers with `needsSecret \|\| custodial` cannot register in Tier 0 — registry throws |
| I4 | `Intent.recipient` is an opaque `string`, resolved by a resolver. Never `` `0x${string}` `` |

**Safety**

| ID | Rule |
|---|---|
| I5 | Default mode is `dry-run`. Real settlement (`mode: self`) is explicit opt-in, and an unknown mode is refused, never read as "not dry-run" |
| I6 | `verify()` is offline — zero network calls |
| I7 | Idempotency key is deterministic, versioned, and **excludes `amount`** |
| I8 | `AUTH_ALREADY_USED` is **SUCCESS**, never failure |
| I9 | A driver must declare `nativeReplayProtection`; **every tier** refuses to settle without it, or without a `SettlementLedger` standing in for it |
| I10 | No amount above `max_per_payout` reaches a driver |

**Supply chain**

| ID | Rule |
|---|---|
| I11 | Core runtime dependencies ≤ 2 packages |
| I12 | `dist/` is reproducible from `src/`; CI rebuilds and diffs |
| I13 | Money-path deps exact-pinned, never auto-merged |

I1 decays fastest — every individual violation looks harmless.

---

## Custody — the boundary that defines the project

Three things get conflated. Only one is forbidden.

| | Who holds funds | Allowed |
|---|---|---|
| Direct transfer from the adopter's Safe | the adopter — Safe → recipient in one call | ✅ core |
| Escrow (`auth-capture`) | a contract **the adopter deployed and controls** | ✅ specified, not built |
| Pooled / omnibus balance | a service operator's account | ❌ Tier 2 only |

**Escrow is not custody.** An escrow contract is the adopter's infrastructure, exactly like the
token contract and the Safe are.

The boundary that counts is a **network hop to a different legal entity** — not a module split.
A custodial driver loaded in-process is custody regardless of which file it lives in. That is
what I3 enforces.

### The delegate key, stated honestly

The allowance model puts a key in CI **on purpose**. That is why the `safe-allowance` driver
declares `needsSecret: true` and `main.ts` constructs the registry at **Tier 1** — an
adopter-operated process with its own credentials. I3 rejecting it at Tier 0 is correct; do not
"fix" it by flipping the capability.

The claim is not "no key in CI". It is: **the key's authority is bounded on-chain and
revocable.** A leaked delegate key can move up to the allowance in every period, to any
address, until a Safe owner removes the delegate. The cap resets automatically, so losses are
**cumulative**: a key that stays authorized across N resets can drain N periods' worth, bounded
only by the Safe's balance. Size the period cap at what you can afford to lose in one period,
and revoke the delegate as soon as a leak is suspected — the reset timer is not on your side. Full blast-radius reading: `DECISION-LOG.md` §6a.

Registry error message when I3 fires (`src/drivers/registry.ts`):

```
Driver ${id} takes custody of funds and cannot run in-process.
Custodial settlement must run as a separate service you operate:
  settlement: { mode: facilitator, url: https://your-service }
```

`facilitator` here names the Tier 2 shape a custodial service would take. It is specified, not
built — see Scope.

---

## Dependencies

Runtime, exact-pinned, complete list:

```json
{ "@noble/curves": "1.9.2", "@noble/hashes": "1.8.0" }
```

Do **not** add `ethers`, `viem`, `thirdweb`, or `@x402/*` to runtime dependencies. Do not bump
the noble packages through Dependabot (I13); a major bump changes import paths and must be done
by hand with the golden vectors re-checked.

Everything needed is implemented on noble in `src/drivers/safe-allowance/` — ABI encoding of
`executeAllowanceTransfer`, RLP, EIP-1559 transaction signing over secp256k1, and JSON-RPC over
native `fetch`.

---

## Layout

```
src/core/           types, intent, policy, idempotency, ledger, amount, defaults, errors   ← I1
src/resolvers/      identity → PayoutTarget. Ships inline-address; interface for more      ← I1
src/drivers/        types, registry, chains.ts, safe-allowance/   ← rails live ONLY here
src/adapters/github trigger, inputs, outputs, receipts (the ledger)                        ← I1
src/main.ts         the Action entry point and the only seam that constructs a driver
action.yml          inputs; frozen as schema/action-inputs.v1.schema.json
test/vectors/       golden fixtures — regenerate deliberately, never casually
docs/VERIFIED_CHAINS.md   live settlement evidence, per chain
```

Not built: the CLI (`npx gitpay …`) — cut from the MVP (`DECISION-LOG.md` §2).

---

## Settlement flow — what a real run does

1. **Trigger** (L0) parses `/send <recipient> <amount>` or workflow inputs into an `Intent`.
   `canonicalNetwork()` resolves an alias such as `sepolia` to CAIP-2 first.
2. **Policy** (L1) evaluates offline, before anything is resolved, signed or recorded. A dry run
   reports the same refusal a real run would.
3. **Resolve** the recipient to a `PayoutTarget`, and compute the canonical idempotency key.
4. **Ledger lookup.** If a trusted receipt carries this key, return `AUTH_ALREADY_USED` with the
   original transaction and never reach the driver (I8).
5. **Prepare** (driver): refuse if the delegate already has a transaction in flight
   (`pending > latest` nonce) rather than queue behind it; simulate with `eth_call`; estimate
   gas; sign. Nothing on-chain changes.
6. **Write the ledger entry before broadcast**, with `status=broadcasting`. The transaction hash
   is fixed at signing time, so it is recorded first. If the write fails, the payout is refused
   having moved nothing.
7. **Broadcast**, then update the receipt to `status=settled` and write outputs. A failure to
   update is logged and ignored — the `broadcasting` record already carries the hash.

A `broadcasting` receipt means **outcome unknown**: the transaction may have landed, or the run
may have died between steps 6 and 7 and nothing was sent. A later run treats it as
`AUTH_ALREADY_USED` regardless, because paying again "to make sure" is the one unrecoverable
mistake. A human checks the hash on the explorer and, if it never landed, bumps `round`.

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

## Idempotency — the ledger, not the rail

Core emits a canonical **string**:

```ts
// src/core/idempotency.ts — NO hashing, NO chain concepts
export function canonical(k: IdempotencyKey): string {
  return `xops:v1|${k.source.platform}:${k.source.repo}#${k.source.ref}` +
         `|${k.recipient.toLowerCase()}|${k.network}|${k.asset}|${k.round}`;
}
```

**The AllowanceModule gives no replay protection on the delegate path.** When
`msg.sender == delegate`, the module checks caller identity only; the nonce is hashed but never
compared against a stored value, so an identical second call pays again while the allowance has
headroom. The driver therefore declares `nativeReplayProtection: false`, and I9 makes a ledger
mandatory.

**The receipt comment is the ledger** (`src/adapters/github/receipts.ts`). The key is carried in
an HTML comment, `<!-- xops-receipt:v1 … -->`, exact but invisible when rendered. No server —
GitHub holds the state. Only receipts from bots and OWNER / MEMBER / COLLABORATOR are believed,
so a contributor cannot block someone's payout with a forged comment. A failed settlement is not
recorded, so a genuine retry can still pay.

The lookup is check-then-act, so adopter workflows must serialize payouts. Set the group on
the payout **job**, not the workflow, and queue every pending run:

```yaml
jobs:
  pay:
    concurrency:
      group: gitpay-payout-${{ github.repository }}
      cancel-in-progress: false   # cancelling mid-settlement loses the receipt
      queue: max                  # the default keeps one pending run and cancels the rest
```

At workflow level every `issue_comment` run joins the group before the job's `if` filters it,
and the default `queue: single` keeps only the newest pending run. A plain "lgtm" posted while
a payout runs would then cancel a `/send` waiting behind it.

The `xops:` prefix and the `xops-receipt` marker predate the rename to GitPay and are kept
deliberately. Existing receipts carry both. Renaming either would hide every past payout from
the ledger, and on the allowance rail that means paying it again.

**`amount` is excluded on purpose.** With amount in the key, `/send alice 50` corrected to
`/send alice 500` yields two keys and Alice receives 550. Excluded, the correction collides and
requires an explicit `round: 1` — a deliberate, logged act. A coarser key fails recoverably; a
finer key fails by paying twice. Same reasoning excludes timestamps and comment IDs.

Because `asset` and `network` are in the key, **multi-asset and multi-chain payouts will work
with no core changes** when those networks are eventually added. Do not add special cases for
them, and do not add the networks themselves.

---

## Conventions

- Amounts are **strings in atomic units** inside the engine. Never `number`, never floats. The
  maintainer types human decimals (`/send alice 2.50`, `max_per_payout: "5"`), converted once
  with `decimals`.
- `asset` is an **opaque identifier**, not an address — Solana mints and Stellar asset IDs
  are not `0x`. `decimals` is an input until a token is verified into the chain registry;
  never infer it.
- Networks are **CAIP-2** (`eip155:11155111`), never friendly strings. A workflow may *type* an
  alias (`sepolia`); `canonicalNetwork()` resolves it before `parseIntent`, so the CAIP-2
  spelling is the only one that reaches the intent, the idempotency key and the receipt.
  Two spellings surviving into the key would let one payout settle twice.
- Anything that is a **function of the network** — `chainId`, the AllowanceModule address,
  the explorer base — comes from the chain registry in `src/drivers/chains.ts`, never from a
  workflow input restating what `network` already says. An explicit input still overrides.
  Only adopter-specific values stay in the workflow: `rpc_url`, `safe`, `token`, `delegate_key`.
- Errors are codes from `src/core/errors.ts`. Never surface a stack trace in a PR comment.
- Every settlement path writes `STATUS`, `TX_HASH` and `EXPLORER_URL` to `GITHUB_OUTPUT`,
  including on failure paths.
- Multi-recipient is **N independent payouts**, not one atomic batch. Each is independently
  idempotent and independently retryable.
- One delegate transaction in flight at a time. A second is refused with the nonce a human has
  to clear, never queued or auto-replaced.
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
- The input schema is frozen at `schema/action-inputs.v1.schema.json` and kept in step with
  `action.yml` by `test/manifest.test.ts`. Never repurpose an input; add a new one.

---

## Security posture

- **The period cap is the real bound.** `max_per_payout` stops a single bad command; the Safe's
  allowance stops a leaked key. Both are needed and neither replaces the other.
- **Simulate before broadcast** (`eth_call` + `eth_estimateGas`). Catches an exhausted
  allowance, a missing delegate, an empty Safe and a paused token for zero gas. No guessed gas
  fallback — a failed estimate after a passing simulation is an error, not a reason to guess.
- **The ledger is written before broadcast.** A broadcast with no record is how a re-run pays
  twice.
- **Never cancel a payout run in progress.** `cancel-in-progress: false` and `queue: max`, on
  the payout job, in every adopter template.
- **Untrusted comments never mark a payout as paid.** Only bot and maintainer receipts count.
- Remaining risk, known: a run that dies after the ledger write and before broadcast leaves a
  `broadcasting` receipt for a payout that never happened. That fails toward **under**-paying —
  the contributor is not paid until a human checks the explorer and bumps `round`. There is no
  automatic repair; a double payment is the failure this ordering exists to rule out.

---

## Scope

**In (v1.0.0):** **Ethereum Sepolia only** · GitHub adapter · Safe AllowanceModule driver ·
receipt-comment ledger · inline-address resolver · declared policy · machine-readable receipts
and outputs.

**Specify, do not build:** any second network (Base mainnet, Monad, Solana, Polygon) ·
x402 `exact` / EIP-3009 driver · `facilitator` and `auto` modes · `auth-capture` (escrow) ·
`upto` · `batch-settlement` · non-EVM drivers · ERC-8004 resolver · CLI · MCP server ·
`.well-known/x402.json` discovery · gas auto-refuel · cross-chain or gas-in-USDC
(`DECISION-LOG.md` §4, §6e).

The architecture must *accommodate* every item above. It must *implement* none of them yet.
Design pressure without implementation cost is the point — if a design choice would make a
second network hard, that is a bug now, even though the second network does not exist.

**Out:** any fiat rail · dashboards · cross-repo aggregation servers · identity verification ·
tax filing · any list we maintain ourselves.

### Two stances to hold

**Fiat is Tier 2 by nature.** Moving money through a bank requires a credential held by a legal
entity, plus KYC and tax reporting per recipient. The answer is off-ramp at the recipient's
edge: settle the token, the contributor converts through their own provider.

**Adopt standards at the interface, not as a dependency.** ERC-8004 as a resolver behind the
identity interface: ~50 lines, no coupling, degrades to nothing if the standard stalls.
ERC-8004 as a core dependency: makes us EVM-only and bets correctness on a draft standard.
Take the interface, never the bet. Agents may propose; humans sign.

---

## When stuck

- `DECISION-LOG.md` — why the allowance model, the ledger, the chain registry and declared
  policy are shaped the way they are
- `ROADMAP.md` — the sanctioned backlog beyond `v1.0.0` (native currency, ERC-721, claim
  flow) and what is out of scope
- `REFERENCES.md` — verified constants, the release gate (§2.4), error codes
- `SETTLEMENT-FLOW.md` — diagrams of a payout end to end

Prefer deleting code over adding an abstraction. The dependency count and the layer boundary
are the product.
