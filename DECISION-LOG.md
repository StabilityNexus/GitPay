# GitPay — Decision Log & Resume Point

**Last updated:** 2026-09-05
**Purpose:** Where the design conversation got to, what's decided, what's open. Read this first
when resuming.

---

## 1. Naming

`XOps` is being replaced. Bruno's objection: it's vague and misleading — "X" reads as Twitter,
"Ops" reads as DevOps, and nothing in it says "pays contributors."

**Decision: GitPay.** Bruno explicitly preferred it over "PayOps" ("I like both PayOps and
GitPay. The latter is clearer"). It is *not* GitHub-specific — GitHub, GitLab and Bitbucket all
use Git — so it survives if the project ever expands, without being speculative now.

Repo/package still say `xops`. Rename is pending, not done.

---

## 2. Scope decisions already made

- **GitHub only.** Bruno asked "which other concrete platform do you want to support?" — the
  honest answer is none. `src/core/types.ts` has a `gitlab` variant in `IntentSource`; nothing
  is built for it. Say so plainly rather than let it read as scope creep.
- **Cut from the MVP:** multi-chain, CLI, chat commands, declarative policy engine, on-chain
  reputation. These were speculative generality. One tool that pays contributors for merged
  PRs, reliably.

---

## 3. Architecture — the corrections that were made (read this, it matters)

The mechanism was described wrong **twice** before being verified against the code. Recorded so
it doesn't happen a third time.

**Wrong description #1** (borrowed from Bruno's example, never verified): "PR merges → a key
signs a claim message → contributor pastes it into a frontend → contributor submits their own
redemption tx against a reserve contract." **There is no reserve contract and no claim step.**

**Wrong description #2:** framing "self mode" as somehow *not* x402. It is. x402 defines the
data shapes and two actions (`verify`, `settle`); doing those in-process is x402's own
documented **self-facilitation** pattern. Facilitator mode just delegates the same two actions
to someone else's server over HTTP.

**What the code and docs actually say** (verified against `AGENTS.md`, `ROADMAP.md`,
`REFERENCES.md`, `src/core/types.ts`):

- `AGENTS.md:10` — "A repository event produces a payment intent, a human signs it, the workflow
  settles it, and a receipt is posted back."
- `AGENTS.md:69` (I2) — "XOps never holds, pools, or routes funds. No XOps-operated account
  exists."
- Built on **x402 v2**, first driver = `exact` scheme over **EIP-3009
  `transferWithAuthorization`**, USDC, Base Sepolia only until v1.0.0.
- Ships as a **GitHub Action running in the adopter's own CI**. No server operated by us.

This is documented with diagrams in `SETTLEMENT-FLOW.md` (mermaid, renders on GitHub).

---

## 4. ARCHITECTURE — DECIDED (2026-09-05)

> ### ✅ DECISIONS MADE
>
> 1. **Architecture: the allowance model (Option C).** Safe + Allowance Module, auto-resetting
>    period cap, plain-EOA delegate held by CI. Verified in §6c. Chosen because the single
>    optimization target is **"maintainer does less"**, and this removes per-payout approval
>    (chore #1) and allowance top-up (chore #2) with no custom contract.
> 2. **Funding model:** maintainer funds the Safe with the payout token once, sets a period cap
>    once, and seeds the bot's wallet with native gas once (~$50 of ETH ≈ 2 years at $1–3/mo).
> 3. **Single chain for v1.** Multi-chain is deferred to a later phase. Confirmed after
>    establishing that native gas on chain B does **not** let you spend chain A's USDC — going
>    multi-chain means a full duplicate setup (Safe + allowance + token + gas) per chain, which
>    multiplies the maintainer's setup work and cuts against the goal.
> 4. **Cross-chain / gas-in-USDC (CCTP, paymasters): NOT building.** See §6e. Revisit only if
>    real contributors refuse a single chain.
> 5. **Gas auto-refuel via DEX swap: NOT building yet.** The mechanism works (bot swaps a little
>    USDC → native, threshold-triggered before hitting zero — it cannot recover from zero), but
>    a one-time $50 gas seed covers ~2 years. Build it when someone actually complains.
>
> 6. **Test chain: Ethereum Sepolia** (`11155111`). Chosen because AllowanceModule is
>    canonically deployed there (`0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134`, v0.1.0) and is
>    **not deployed on Base Sepolia at all** (§6c). Everything needed is free — testnet USDC from
>    `faucet.circle.com`, Sepolia ETH from the Google Cloud / Alchemy / QuickNode faucets, and
>    Safe{Wallet} supports the chain so the clickable Spending Limits flow works. Total cost $0,
>    which matters since there is no budget for mainnet testing.
>    **`AGENTS.md` has been updated** — network rule changed to Ethereum Sepolia, one-network
>    rule kept. A pivot banner was also added at the top of `AGENTS.md` pointing here, because
>    its x402/EIP-3009/facilitator sections are now stale and not yet rewritten.
>    **Monad AllowanceModule deployment: NEVER VERIFIED** — check before planning multi-chain.

The rest of this section records how the decision was reached.

### The tension

**Automation and per-payout human approval are opposites.** Anything fully automatic needs
something automated to hold spending power. Zero custody risk needs a human to approve each
payment. You cannot have both — you can only *bound* the risk.

### The three designs on the table

| | Maintainer does per payout | Blast radius if CI key leaks | Complexity |
|---|---|---|---|
| **A. EIP-3009 signed authorization** (what's built toward) | Signs a message in their wallet, every time | Nothing — no key in CI (facilitator mode) or gas-only key | High: per-network constants, golden vectors, facilitator, USDC-only |
| **B. Direct transfer** (briefly chosen, then questioned) | Opens wallet, confirms a real tx, pays gas, every time | Nothing | Low — but *more* maintainer work than A |
| **C. Allowance / treasury** (current front-runner) | **Nothing** | Bounded by the allowance/cap | Low-medium, any ERC-20 |

### Why B was rejected almost immediately

It's simpler *to build*, not simpler *for the maintainer*. Measured against the actual motive it
is a step backwards. Flagged by the user directly: "am i not following what my motive to reduce
headache of maintainer."

### Stated priority

> "for now i am totally focus on maintainer does less"

That single goal should decide the architecture. It currently points at **C**.

### Note on C

The original SoC proposal's **"Treasury mode"** already described this — engine calls
`disburse()` on a client-deployed treasury contract with caps/pause enforced on-chain. The first
instinct in the proposal was aimed at the right target; the EIP-3009 direction drifted from it
by optimizing for zero-custody at the cost of the automation that was the whole point.

### Benefit of moving off EIP-3009

EIP-3009 only works on tokens that implement it (USDC + a few others). A plain
`transfer`/`transferFrom` works with **any ERC-20 on any EVM chain** — which directly serves the
"org admin picks which token per repo" user story.

---

## 5. The six maintainer chores (the optimization framework)

To minimize maintainer effort, attack these separately:

1. **Per-payout approval** → an allowance removes it
2. **Topping up the allowance** → a *period-resetting* cap (weekly/monthly auto-refill) removes it
3. **Keeping the operator funded with gas** → sponsored gas / paymaster, or a monitored buffer
4. **One transaction per contributor** → batching
5. **Setting it up at all** → reuse an audited off-the-shelf module instead of deploying a custom contract
6. **Deciding and typing the amount** ← *the biggest one left once the wallet is out of the loop*

On (6): if the maintainer still types `/send @alice 50` on every merged PR, the crypto friction
is gone but the **accounting friction remains** — and accounting friction is exactly what the
Stability-Nexus CAT example in the proposal was complaining about. If the amount is derivable
(a label like `reward:50` on the issue, a flat per-merge rate in config, or a rate table by
contribution type), then **merging the PR is the only action a maintainer ever takes.**

---

## 6. Allowance model options — UNVERIFIED ANALYSIS

> ⚠️ **Everything in §6 below is from model knowledge, not verified research.** Research agents
> were launched to check exactly this and were killed by a session interrupt before delivering
> final reports. **Verify every claim before acting on it** — especially contract addresses,
> 2026 maintenance status, and parameter names. Re-run prompts in §6b.
>
> §6a below contains fragments salvaged from the agents' progress narration — real claims, but
> stripped of their supporting detail and source URLs.

### 6a. Salvaged signals from the killed agents

These are statements the agents made mid-run, indicating something they had just verified. **The
evidence and URLs behind each were lost.** Treat as high-quality leads, not conclusions.

**✅ VERIFIED — Drips does NOT make GitPay redundant. Earlier alarm was wrong.**

The salvaged "Drips has merged-PR → reward" claim was **incorrect**. What Drips actually has is
**"Drips Wave"**: a recurring ~7-day funded pool where contributors close issues, earn points,
and receive a USDC share at cycle end. That's a funding-pool/points model, not per-PR payout.

Critically, Drips is **claim-based**: the recipient must execute a `collect` transaction
themselves, and pay gas to do it. That is exactly the friction GitPay's contributor-side user
stories exist to remove. It's also a hosted app (app.drips.network) with no self-hosted or
Action mode. Alive (contracts updated Apr 2026), non-custodial, on mainnet + some L2s
(Base/Optimism/Filecoin; full list unverified).

**✅ VERIFIED — nobody ships this as a self-hosted Action for EVM/ERC-20.**

Closest analogs found:
- **Complete Codes** — USDC on merge, but a **GitHub App with a hosted backend**, not
  self-hosted CI.
- An **XRP/PayId Action** — right pattern (self-hosted Action), wrong chain, no EVM equivalent.

**So the differentiation is confirmed and defensible:** runs in the maintainer's own CI, no
hosted backend, no account, no claim step for the contributor. That's also precisely the
property Bruno said he wants as an admin ("simple independent tools I can install easily," not
an ecosystem of services). Lead with this.

**Standards / account abstraction:**

- **EIP-7702 is Final.** Usable, not experimental.
- **ERC-7715 is still Draft** and its RPC method name has changed — **do not build on it.**
- **ZeroDev session-key policies do NOT include a native cumulative ERC-20 spend cap.** This
  weakens the ERC-4337 session-key option significantly for our use case — a cumulative cap is
  exactly the bound we need.
- **Coinbase "Spend Permissions"** was flagged as "directly on-point." Worth chasing. Open
  question the agent was checking: whether it works with a Gnosis Safe or **only** with a
  Coinbase Smart Wallet — that determines whether it's usable at all.

**✅ VERIFIED — Safe Allowance Module auto-renews. This answers the architecture question.**

Read from `AllowanceModule.sol` (github.com/safe-fndn/safe-modules, formerly safe-global):

- **The allowance AUTO-RESETS on a time period with NO human action.** `resetTimeMin` sets the
  interval in minutes, `resetBaseMin` the anchor, `lastResetMin` tracks the last reset. On each
  spend, if elapsed ≥ `resetTimeMin`, the spent counter zeroes before applying the new spend.
  Fully on-chain, no owner transaction. **→ This kills chore #2 (topping up).**
- **A plain EOA delegate can spend alone** — `executeAllowanceTransfer` needs only the
  delegate's own signature, no Safe owner co-signature. **→ This kills chore #1 (per-payout
  approval).**
- **⚠️ The recipient is UNRESTRICTED.** `to` is arbitrary and delegate-chosen. If the CI key
  leaks, an attacker can send **one full period's allowance to any address they choose.** Blast
  radius is bounded by the period cap and nothing else — so the cap must be set to what you can
  afford to lose in one period, not to what's convenient.
- **Revocation:** `removeDelegate(delegate, removeAllowances)`, or `deleteAllowance` / zero via
  `setAllowance`. This is a normal Safe owner transaction — **multisig-gated, not instant** if
  the Safe needs multiple signers. Factor that into incident response.
- Repo active in 2026, audits exist. **NOT VERIFIED:** exact per-chain deployment list, and
  whether Safe{Wallet}'s UI still exposes the Spending Limits flow in 2026 (matters a lot — it's
  the difference between clickable setup and SDK-only setup).

**Implication:** Safe + Allowance Module removes chores #1 and #2 with no custom contract. It is
the current front-runner for §4. The open risk is the unrestricted recipient — size the period
cap accordingly.
- **Multicall3 is unsafe as a token disperser** — the agent confirmed the warning. Because calls
  routed through Multicall3 have Multicall3 as `msg.sender`, an allowance granted to it is
  spendable **by anyone**. Do not batch `transferFrom` this way.
- **Disperse contract source confirmed.** The agent also flagged a "major finding" on whether
  batching composes with the Safe Allowance Module — content lost.

**Liveness:**

- **Llama (llama.xyz) is dead** — DNS does not resolve.
- **Dework**: search results were AI-generated slop; the agent switched to checking GitHub
  directly. Use repo commit dates, not search results, for liveness on these.

---


### Ranked by "how little the maintainer does"

| Option | Setup (once) | Ongoing chore | Blast radius if CI key leaks | Revoke |
|---|---|---|---|---|
| **Plain ERC-20 `approve` to operator EOA** | One `approve(operator, N)` tx | **Top up when N runs out** | Remaining allowance | `approve(0)`, one tx |
| **Safe + Allowance Module** | Create/have a Safe, enable module, add delegate with a per-period cap | **None — cap auto-resets** | One period's cap | Remove delegate |
| **Custom treasury contract** | Deploy + fund + audit | None (caps on-chain) | Per-tx / daily cap | Pause switch |
| **ERC-4337 session key** | Migrate to / use a smart account, grant scoped key | None until expiry | Scoped by policy | Revoke key |
| **EIP-7702 delegation** | Sign a delegation from the existing EOA | None until revoked | Scoped by the delegate contract | Re-delegate to zero |

### The key insight

The single highest-value upgrade over plain `approve` is a **period-resetting cap** — it removes
chore #2 (topping up) entirely, which is the only recurring chore the plain allowance leaves.
**Safe's Allowance Module** is believed to provide exactly this (a delegate spends up to a cap
that auto-resets on a time period, without other Safe owners signing). If true, and if the org
already runs a Safe, that is likely the best effort-to-complexity ratio available and requires
**no custom contract**.

### Honest read

Plain `approve` to an operator EOA is probably **90% of the win with zero new contracts.**
Everything fancier (session keys, EIP-7702, paymasters) adds a dependency and integration cost
for a marginal reduction in maintainer effort. Do not adopt them because they're modern — adopt
only if they remove a chore the simple allowance leaves behind.

### Specific things to verify

- **Safe Allowance Module**: exact params (believed `delegate`, `token`, `allowanceAmount`,
  `resetTimeMin`, `resetBaseMin`); does the reset really auto-refill; can a delegate spend
  alone; **still maintained in 2026?**; audit status; deployment addresses per chain.
- **`approve` race condition**: some tokens require `approve(0)` before re-approving. Affects
  the top-up flow.
- **Permit2 (Uniswap)**: has amount *and* expiration — but expiry likely needs **re-signing**,
  so it bounds time without removing the top-up chore. Verify.
- **EIP-2612 `permit`**: gasless approval by signature. USDC is believed to support it. Turns
  the approve tx into a signature — cheaper, still per-approval.
- **EIP-7702**: believed shipped in Pectra (May 2025). Verify mainnet/L2 availability, wallet
  support, and whether the UX is actually usable by a non-expert maintainer.
- **Batching**: Multicall3 is believed deployed at a consistent address across most EVM chains;
  Safe has MultiSend. Confirm and check it composes with whichever allowance approach wins.

---

## 6c. VERIFIED — Safe setup, gas, batching, deployments

**✅ Setup is clickable, and Safe officially documents this exact use case.**
Spending Limits is **still live** in Safe{Wallet} 2026: Settings → Setup → Spending limits → New
spending limit. Pick beneficiary (delegate), token + amount, and reset period
(**daily / weekly / monthly / one-time**). First use auto-deploys and enables the module.
Roughly **one transaction, 5–10 minutes** for a non-expert. Safe even publishes an **"AI agent
with a spending limit" quickstart** — a bot delegate is a use case they explicitly support.
**→ Chore #5 (setup) is basically solved, no custom contract, no SDK required.**

**✅ Gas is a non-issue on L2. → Chore #3 mostly dissolves.**
The delegate EOA pays native gas (~80–120k gas/call, estimate). On Base that's well under
$0.05/tx — **~$0.50–$2.50/month for 50 contributors.** Top-up needed maybe once every few
months. The module's `paymentToken`/`payment` params reimburse `tx.origin` in ERC-20, but that's
relayer reimbursement, **not** a gasless path — the delegate still fronts native gas. No
4337/paymaster path exists for this module.

**✅ Batching works — but only with real signatures. → Chore #4 solved.**
`executeAllowanceTransfer` accepts an empty signature *only* when `msg.sender == delegate`. Pass
a **real EIP-712 signature** from the delegate and the check passes regardless of `msg.sender` —
so the delegate pre-signs N transfers off-chain and a forwarder batches N calls in one tx. No
native batch function in the contract.

**🔴 CONFLICT WITH THE CURRENT ROADMAP — AllowanceModule is NOT deployed on Base Sepolia.**
`AGENTS.md` mandates **Base Sepolia only until v1.0.0**. But per `safe-modules-deployments`:
- Base mainnet (8453): v0.1.0 `0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134`, v0.1.1 `0xAA46724893dedD72658219405185Fb0Fc91e091C`
- **Base Sepolia (84532): absent from both manifests**
- Ethereum Sepolia (11155111): v0.1.0 only
- v0.1.1 also covers Optimism, Gnosis, Polygon, Arbitrum + ~40 chains

**→ If you adopt the allowance model, the testnet has to change (Ethereum Sepolia), or you
deploy the module yourself on Base Sepolia.** Decide this before writing driver code.

---

## 6d. VERIFIED — the amount and address chores (#6 and the hidden one)

**The market has NOT solved "merging is the only action" — nobody has.** Every tool reviewed
(Algora, OpenQ, IssueHunt, Drips) requires at least one prior human action per issue or repo.

**Chore #6 — where the amount comes from:**
- The dominant real pattern is **human sets the amount once per issue** (via `/bounty $500`
  comment or a `bounty/50` label), then **execution on merge is fully automatic**. Algora,
  OpenQ, IssueHunt all work this way.
- **No live tool derives the amount automatically** from diff size, review count, or points.
  Nothing found. Strong hint that it's avoided because those signals are trivially gamed
  (padded diffs, rubber-stamp reviews).
- Config rate tables (flat per-merge rate): **no evidence any product does this** — likely
  because issue value varies too much for maintainers to accept one number.

**→ Reframe the goal.** "Maintainer does literally nothing" isn't achievable and nobody claims
it. The achievable and honest target is: **the amount is set once during triage — work
maintainers already do — and merging then triggers payment with zero further action.** That's
what to promise, and it's still a real improvement over manual payout.

**Chore B (hidden) — how the contributor's wallet address is known:**
- Lowest-effort pattern in the wild is **contributor self-registration via OAuth into a hosted
  profile** (OpenQ, Algora). **But that requires a hosted backend — which is exactly what GitPay
  has chosen not to have.** This is a genuine tension between our differentiator and our UX.
- Drips uses `FUNDING.json` committed to the default branch, but that's **repo-level ownership,
  not per-contributor**.
- ENS text records: capability exists, but **NOT VERIFIED** that anyone maps GitHub handle → ENS
  → address for contributor payouts in production.
- **Unclaimed funds:** every tool lets them sit escrowed indefinitely — none expire or refund.
  Unbounded liability plus a UX cliff (contributor must register out-of-band before they ever
  see money). No data found on what fraction never register.

**→ Open design question for GitPay:** with no hosted backend, address resolution has to be
either a committed file in the repo (`.github/wallets.yml`), a bot command that commits to it,
or an address supplied inline at payout time. `src/resolvers/inline-address.ts` currently
implies inline — **which is a per-payout maintainer chore and contradicts the whole goal.**
This needs a decision.

---

## 6e. VERIFIED — "one USDC pot, pay any chain, gas from USDC" (Phase 2+ idea)

**Question asked:** can the maintainer fund 500 USDC once on one chain, then have payouts land on
any chain with gas silently covered from that same USDC?

**All pieces are real in 2026:**
- **Circle Paymaster** — live on **Base + Arbitrum only** (others "planned", unverified). Pays
  gas in USDC with **zero native balance**. **10% surcharge** on gas since Jul 2025 — pennies on
  an L2, not the blocker. Pimlico/Biconomy/Alchemy have comparable ERC-20 paymasters.
- **CCTP v2** — native USDC burn-and-mint across ~13 chains, fully programmatic, with **hooks**
  to auto-execute delivery on arrival. **Monad has native USDC + CCTP v2**, confirmed.

**Three reasons this is NOT a Phase-2 checkbox:**
1. **It replaces the architecture.** Paymasters only pay for a **contract account** sending a
   UserOperation — a plain EOA cannot use one. EIP-7702 (live since Pectra) can upgrade the
   delegate EOA into a smart account, but then the bot is a 4337/7702 account, **not** a plain
   EOA delegate on a Safe Allowance Module. Rebuild, not add-on.
2. **Economics at $10 are UNVERIFIED and likely bad.** Solver/relayer + CCTP fees against a $10
   principal. If fees eat 10–20%, the feature is negative-value — and small payouts are the
   entire use case. **Test real costs before believing this works.**
3. **The chore removed is tiny** — $1–3/month of gas.

**Off-the-shelf chain abstraction** (Particle Universal Accounts, Rhinestone Omni Account,
OneBalance): early production, custody model and bot/API access **NOT VERIFIED**. Young products,
not battle-tested rails.

**→ RECOMMENDATION: don't build this. Ask instead whether contributors actually care which chain
they're paid on.** This solves a contributor *preference*, not a maintainer chore, at the cost of
an architecture rebuild. If contributors accept USDC on one L2, the problem vanishes entirely and
the verified Safe+allowance design stays intact. Only revisit after real contributors say they
won't accept a single chain.

---

## 6f. ✅ RESOLVED (2026-09-06) — the allowance model loses idempotency; a ledger restores it

> **Fix shipped.** `core/ledger.ts` defines `SettlementLedger`;
> `adapters/github/receipts.ts` implements it against the PR's own comments; the
> registry guard now applies at **every** tier. 75 tests green. The analysis
> below is kept because it explains why the design is shaped this way.
>
> - **The receipt comment is the ledger.** No server — GitHub holds the state,
>   keyed by the canonical idempotency key, carried in an HTML comment so it is
>   exact but invisible when rendered.
> - **A repeat is a success, not a failure** (I8): the registry returns
>   `AUTH_ALREADY_USED` with the original transaction and never reaches the driver.
> - **A failed settlement is not recorded**, so a genuine retry can still pay.
> - **Forged receipts are ignored** — only bots and OWNER/MEMBER/COLLABORATOR are
>   believed, so a contributor cannot block someone's payout with a comment.
> - **I9 was widened to all tiers.** It read `tier === 0 && !nativeReplayProtection`,
>   so a driver that double-pays became settleable just by constructing the registry
>   at tier 1 — silently. A tier says who operates the process; it says nothing about
>   whether a retry pays twice. `AGENTS.md` I9 updated to match.
> - **Remaining risk: the lookup is check-then-act.** Mitigated with a
>   `concurrency: xops-payout-<pr>` group and `cancel-in-progress: false` —
>   cancelling mid-settlement is how a payout happens without its receipt.
> - **Still to do:** if `record()` fails after a successful transfer, the payout is
>   unrecorded and a re-run would pay again. It throws loudly rather than passing
>   silently, but there is no automatic repair.

### Original analysis

Read directly from `allowances/contracts/AllowanceModule.sol` (2026-09-06).

**The empty-signature path — the one our bot uses — has NO replay protection.**
When `msg.sender == delegate` and `signature` is `0x`, the module checks caller identity only.
The `nonce` in the `Allowance` struct is consumed *as input to the signed hash* and is **never
compared against a stored "already used" value**. So an identical second call **succeeds and
pays again**, bounded only by `require(newSpent <= allowance.amount)` — i.e. protection is
incidental (you run out of allowance) rather than real.

**The signature path does have replay protection**, but not the kind we need. The nonce is baked
into the signed hash and storage bumps it, so a *captured, replayed signature* reverts. But a
re-running workflow doesn't replay a signature — it reads the fresh nonce and signs again, which
succeeds. **The module cannot make a stateless re-run idempotent.**

**Why this matters:** under EIP-3009 we got idempotency free — `AUTH_ALREADY_USED` mapped to
success (I8), and a retry was a no-op. The allowance model **gives that up**, and `AGENTS.md` I8
plus the whole `core/idempotency.ts` canonical-key design assume it. A re-run double-pays.

**Consequences already visible:**
- `nativeReplayProtection` is honestly **`false`** → I9 makes the tier-0 registry refuse to
  settle. That invariant is doing its job; do not weaken it to get the driver registered.
- `needsSecret` is **`true`** (CI holds the delegate key) → I3 blocks tier-0 registration.
  Tier **1** ("adopter-operated process with its own credentials") is the honest home for this
  driver — a CI runner holding the adopter's delegate key is exactly that. But note
  `registry.ts:75` only enforces the replay check at tier 0, so moving to tier 1 **silently drops
  it**. Fix the guard when making that move.

**Proposed fix, not yet built: the receipt comment is the idempotency ledger.**
Before settling, read the PR for an existing receipt carrying this payout's canonical
idempotency key; if present, report already-paid and settle nothing. Keeps "XOps is an artifact,
not a service" (no server — GitHub holds the state), needs `issues: write` permission, and the
canonical key from `core/idempotency.ts` is already exactly the right token to match on.
**Weakness: it is check-then-act, so two concurrent runs can both pass the check.** Concurrency
control (a GitHub Actions `concurrency:` group keyed on the payout) is the mitigation. Decide
before writing `settle()`.

**Other verified facts:**
- Exact signature: `executeAllowanceTransfer(ISafe safe, address token, address payable to,
  uint96 amount, address paymentToken, uint96 payment, address delegate, bytes signature)`.
  `amount`/`payment` are **uint96, not uint256** — assuming uint256 gives a wrong selector and a
  revert with nothing readable.
- Canonical selector `0x4515641a`, derived locally from keccak256, pinned in `abi.ts` and
  re-derived in its test so it cannot drift.
- uint96 max ≈ 7.9e19 USDC — not a practical ceiling.
- Reset is computed **on read**, lazily, inside `getAllowance`, and written back only when a
  mutating call follows. Public getter `getTokenAllowance(safe, delegate, token)` returns
  `[amount, spent, resetTimeMin, lastResetMin, nonce]`.

---

## 6b. RESEARCH PROMPTS — re-run these

Three research threads were launched and were **killed by a session interrupt** before
reporting. No findings were received. Re-run them:

1. **Safe (Gnosis Safe) Allowance Module** and other off-the-shelf spending-limit modules
   (Zodiac Roles Modifier, etc.). Key question: does the allowance **auto-reset on a period**?
   That would remove chore #2 entirely. Also: can a delegate spend without other owners signing;
   maintenance status in 2026; audits; setup effort with and without an existing Safe; batching
   (Multicall3 / MultiSend / Disperse).
2. **EIP-7702, ERC-4337 session keys, Permit2, EIP-2612, paymasters.** Key question: which of
   these are *actually usable in 2026* vs. still experimental — and whether the added complexity
   beats the dumb baseline (plain `approve` to an operator EOA), which may already be 90% of the win.
3. **What already exists** — Drips, thanks.dev, Gitcoin, Coordinape, Algora, OpenQ, Superfluid,
   Sablier, GitHub Sponsors, x402-ecosystem tools. Are we reinventing? What's their maintainer
   UX? **And bluntly: is there real evidence maintainers want to pay contributors in tokens, or
   is this a solution looking for a problem?** Also the friction nobody mentions: tax, KYC,
   sanctions, contributors without wallets, token volatility.

---

## 7. User stories (need revision after the pivot)

Written before the allowance pivot. The contributor-side ones survive; the admin-side ones about
signing each payment do **not** — rewrite them once the architecture is settled.

- As a contributor, I want to automatically receive an ERC-20 reward when my PR is merged, so I
  feel my contribution is valued without having to do anything extra.
- As a contributor, I don't want to pay gas or take any action to receive my reward, so getting
  paid never becomes another task on my list.
- As a contributor, I want a receipt posted on the PR showing exactly what I was paid and why,
  so I can verify the payout without asking the maintainer.
- As an org admin, I want to choose which ERC-20 token is used per repo, so rewards make sense
  for that project's contributors.
- ~~As an org admin, I want to sign each payment authorization myself~~ ← **contradicts "maintainer
  does less"; this is the one the pivot invalidates**
- As an org admin, I want a compromised workflow to be unable to drain more than a bounded
  amount, so automating payouts doesn't mean risking the treasury.
- As an org admin, I want this to run as a self-contained GitHub Action in my own CI, so I'm not
  depending on a hosted service or a bundle of interdependent tools.

---

## 8. Bruno's open questions — status

| Question | Status |
|---|---|
| The name | Answered — GitPay |
| "Which other concrete platform besides GitHub?" | Answered — none, GitHub only |
| x402 is buzzword-chasing? | **Nuanced.** It's genuinely the spec the current code implements, not decoration. But if the pivot to the allowance model happens, x402 and EIP-3009 both become irrelevant — and Bruno's instinct turns out to have been right for a different reason than he gave. |
| "Gap" is vague | Remove from all write-ups; say the specific thing instead |
| Complexity / "ecosystem" of interdependent parts | Being addressed by the scope cuts in §2 |
| **"I don't know if your 'how' is aligned with my example 'how'"** | Answer drafted: **no, it isn't** — the actual mechanism is not a reserve contract + contributor claim. `SETTLEMENT-FLOW.md` was written to be the durable answer. **Do not send it until the pivot in §4 is settled** — it currently documents the EIP-3009 design. |
| User stories | Drafted (§7), need revision after the pivot |

---

## 9. Files touched this session

- `SETTLEMENT-FLOW.md` — **new.** Mermaid flowchart + sequence diagram of the EIP-3009 flow.
  **Will need a rewrite if §4 resolves to the allowance model.**
- `DECISION-LOG.md` — this file.
- Nothing in `src/`, `AGENTS.md`, `ROADMAP.md` or `REFERENCES.md` has been changed.

---

## 10. Next action when resuming

1. Re-run the three research threads in §6.
2. Settle §4 — allowance/treasury vs. signature-per-payout. Priority is "maintainer does less."
3. Decide where the payout **amount** comes from (chore #6) — this may matter more than the
   settlement mechanism.
4. Then, and only then: rewrite `SETTLEMENT-FLOW.md`, revise the user stories, and decide how
   much of `AGENTS.md` / `ROADMAP.md` / `REFERENCES.md` has to follow. Those encode a 6-week plan
   and a release gate built on EIP-3009 — changing them mid-SoC is worth doing deliberately, and
   probably worth Bruno's sign-off first.

---

## 11. ✅ RESOLVED (2026-09-08) — the workflow states the network once, and derives the rest

**Problem.** The demo workflow named the same chain twice, in two formats: `network:
eip155:11155111` and `chain_id: "11155111"`, plus a hardcoded `allowance_module` and
`explorer_url` that are equally functions of the network. Four values, one fact.

That is not just verbose. Nothing downstream compares `chain_id` against `network` —
`SafeAllowanceDriver.supports()` and `.verify()` both match on the CAIP-2 network alone — so a
mismatched chain id is signed without complaint and rejected only at **broadcast**, which is
after `registry.settle()` has written the `broadcasting` ledger entry. The payout is then stuck
behind `already-paid` until someone bumps `round`. A copy-paste setup error lands in the one
window where failure is expensive.

**Decision.** A chain registry at `src/drivers/chains.ts`, keyed by CAIP-2, supplying `chainId`,
`allowanceModule` and `explorer`. `main.ts` looks the record up and an explicit input still wins.
Only adopter-specific values stay in the workflow: `rpc_url`, `safe`, `token`, `delegate_key`.

**Friendly network names: accepted as sugar, rejected as a substitute.** `network: sepolia` now
works, but `canonicalNetwork()` resolves it *before* `parseIntent`, so `eip155:11155111` is what
reaches the intent, the key, driver resolution and the receipt. The AGENTS.md rule "CAIP-2, never
friendly strings" has a mechanism behind it: `network` is in the idempotency key verbatim, so two
spellings of one chain are two keys, and the receipt written under one would not stop a second
payout under the other.

**An unlisted network stays usable.** `lookupChain()` does not throw; a miss just means nothing to
default from, and the error names the input to pass. Gating on registry membership would have
removed a working path in the name of making setup easier.

**Not derived: `token` and `decimals`.** REFERENCES.md §2.1 leaves the Ethereum Sepolia USDC
address unverified, and a guessed token address is worse than an absent one. They stay inputs
until someone confirms the address and `decimals()` on-chain — at which point they belong in the
registry's `assets` map for the same reason as the rest.

**Guards added.** `test/drivers/chains.test.ts` (alias resolution is idempotent and collapses onto
a known key; a record agrees with the key it is stored under). `test/manifest.test.ts`: the
default network must be in the registry, and `chain_id` / `allowance_module` / `explorer_url` must
carry **no** manifest default — a declared default arrives as the input's value and would silently
win over the registry.

---

## 12. ✅ RESOLVED (2026-09-08) — policy is declared as inputs, not scripted in workflow YAML

**Problem.** The only policy XOps enforced was a hardcoded maintainer gate, and the only place a
cap or a kill switch existed was in the documentation. I10 ("no amount above
`policy.max_per_payout` reaches a driver") had **no implementation**, `AMOUNT_CAP_EXCEEDED` was an
unused error code, and `DEFAULT_SETTLEMENT_ENABLED` sat in `core/defaults.ts` wired to nothing.

Meanwhile the demo repo asserted the gate's behaviour in twenty lines of hand-written shell. That
is the wrong place for it twice over: an adopter should not have to write assertions to find out
what the action refuses, and shell in a workflow cannot be unit-tested.

**Decision.** `src/core/policy.ts`, three named conditions, evaluated offline before anything is
resolved, signed or recorded:

- `SETTLEMENT_ENABLED` — the kill switch, evaluated first
- `MAINTAINER_APPROVED` — the gate, with the allowlist now the adopter's to set
- `AMOUNT_WITHIN_CAP` — I10, finally enforced

A maintainer configures all three with inputs (`enabled`, `allowed_associations`,
`max_per_payout`) and writes no logic. Every run prints the per-condition table with evidence, so
a refusal says which rule refused and why.

**Named constants, not an expression language.** Whoever can edit an expression can rewrite the
rule that is supposed to constrain them, and every future evaluator bug is a money bug. Adding a
condition is deliberately more work than writing a one-liner.

**Where the maintainer gate moved, and why it moved twice.** It used to run inside the
`if (command)` branch, before the intent existed — so it structurally could not check an amount.
Policy now runs after `parseIntent` and before the `dry-run` branch. Two consequences worth
stating: I10 is enforceable at all, and a dry run is an honest preview, because it reports the
same refusal a real run would rather than claiming success on a blocked payout.

**`author_association` semantics stayed in the adapter.** Core policy is told only whether the
actor may spend. `undefined` there means "not comment-triggered" and **skips** the condition —
treating a missing comment author as "not a maintainer" would deny every workflow-configured or
merge-triggered payout. A skip is recorded as a skip, never as a pass.

**The cap is a human decimal, in the same units `/send` is typed in.** `max_per_payout: "5"` is
5 USDC. Atomic units would have been the safer misread — a maintainer who typed "50" meaning
50 USDC would get a 0.00005 cap and a loud, harmless refusal, where the decimal reading of an
atomic intent is over-permissive. Consistency with the number the cap is *compared against* won
anyway: the maintainer's whole mental model comes from `/send 2.50`, and the resolved cap is
logged in both forms on every run.

**A blank `allowed_associations` falls back to the default rather than allowing nobody.** A blank
input is far more likely to be an unset repository variable than a deliberate lockout, and
silently disabling `/send` is a bad way to discover that. The kill switch is how you say it on
purpose. An unrecognized entry warns and is kept, following the `.xops.yml` convention: a typo
can only ever narrow an allowlist, so the consequence is a refused payout, never an unintended
one — and failing outright would break every run the day GitHub adds an association value.

**Deviation from ROADMAP week 4.** The kill switch is the *first condition*, not a check ahead of
policy evaluation. Conditions are pure and offline, so there is no work to skip, and evaluating
all of them is what lets one run report every problem at once. A disabled kill switch still
refuses regardless of the rest of the configuration.

**The demo workflow's twenty lines of assertions became six.** The decision table is unit-tested
offline in `test/core/policy.test.ts`; the workflow now asserts only what a unit test cannot —
that the gate fires inside a real Action run, in a real settlement configuration, with nothing
signed on the way to refusing. Its outputs also arrive as env vars rather than `${{ }}`
interpolated into the script.

**Still open.** The policy result table is printed to the log but not yet rendered into the PR
comment (ROADMAP week 4). `.xops.yml` remains the planned home for this configuration; `Policy`
is a plain record so a loader can produce it without touching the evaluator.
