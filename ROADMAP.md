## 1. Native currency payouts

**What.** `/send @alice 0.01 ETH` — pay in the chain's own currency, not only in an ERC-20.

**Why.** Every supported chain has one, several testnets have no reliable stablecoin deployment
(the reason the chain registry currently carries a single network at all — see
`src/drivers/chains.ts`), and "pay 0.01 ETH" is the shortest possible smoke test of a new
network. It is also the cheapest feature on this list, which is why it is first.

**Shape.**
- `ChainRecord` in [src/drivers/chains.ts](src/drivers/chains.ts) gains a `nativeCurrency`
  entry (`symbol`, `decimals`). This is exactly the kind of value that file exists to hold: a
  function of the network, never typed by a maintainer.
- `toAtomic()` in [src/core/amount.ts](src/core/amount.ts) already takes `decimals` as a
  parameter and infers nothing, so it needs **no change** — the registry supplies 18 the same
  way the token supplies 6 today.
- `Intent.asset` must be able to name a currency that has no contract address. Settle on CAIP-19
  (`eip155:11155111/slip44:60`) rather than overloading the zero address, and do it in the same
  PR as the registry change — `asset` is an input to the idempotency key
  ([src/core/types.ts](src/core/types.ts)), so two spellings of ETH are two keys, and the same
  payout could settle twice.
- Driver: Safe's `AllowanceModule` handles ETH via the `0x0` token sentinel, which would make
  this a small change inside
  [src/drivers/safe-allowance/driver.ts](src/drivers/safe-allowance/driver.ts) rather than a new
  driver. **Verify that on-chain before writing it down** — same rule as `REFERENCES.md` §2.6
  step 1. If it does not hold, this becomes a second driver and moves to size M.

**Doesn't change.** Core still never learns what a chain is (I1). The policy cap still compares
atomic strings. The receipt shape is unchanged.

**Open.** Whether `max_per_payout` should be per-asset — one cap cannot mean both "5 USDC" and
"5 ETH". Probably a map keyed by asset, defaulting to deny for unlisted assets.

**Done when.** A native-currency payout settles on the supported testnet, the replay test is
green for it, and the diff touches no file under `src/core` or `src/adapters`.

---

## 2. ERC-721 transfers

**What.** `/send @alice <collection> #<tokenId>` — transfer a specific NFT from the Safe.

**Why.** It is the first non-fungible value type, and the one that proves the driver boundary is
real rather than asserted. It is also the natural substrate for the recognition use case
discussed on 2026-09-09 — but see §5: that use case is out of scope, and this is only the
transfer primitive underneath it.

**Shape.**
- **Authorization is the hard part, not the transfer.** Safe's `AllowanceModule` is ERC-20 only:
  it tracks a spendable amount per token, and a token id is not an amount. A one-time
  authorization for NFTs therefore needs a different primitive — most likely a Zodiac Roles
  module scoped to `safeTransferFrom` on one collection, held by the same delegate. That keeps
  the property the 2026-09-09 change was made for: the maintainer authorizes **once**, at setup,
  and every later `/send` is just a comment.
- That lands as a **new driver** beside the existing one (`safe-roles/eip155`), with its own
  scheme id, registered through [src/drivers/registry.ts](src/drivers/registry.ts). The existing
  `SettlementDriver` interface — `supports` / `buildRequirements` / `verify` / `prepare` /
  `broadcast` — needs no new method. If it turns out it does, that is a finding worth more than
  the feature.
- `Intent.amount` is a decimal string today. For ERC-721 it carries a token id, so the intent
  needs an explicit asset kind (`erc20 | erc721 | native`) rather than letting each driver guess
  from the string. Parsing and validation live in [src/core/intent.ts](src/core/intent.ts);
  `toAtomic()` must not run for a token id.
- **Policy.** `max_per_payout` is meaningless against a token id, and silently passing is the
  wrong failure. ERC-721 needs its own named conditions — a collection allowlist, and a count cap
  per period — added to [src/core/policy.ts](src/core/policy.ts) as constants, never as an
  expression language.
- **Idempotency.** The key already excludes `amount` deliberately, so it needs no new field;
  ownership makes a duplicate transfer revert rather than double-pay. The ledger stays required
  anyway (I9) — a revert after broadcast is still a state change worth recording.

**Open.** Whether minting on demand is in scope or only transfer-from-Safe. Start with transfer:
minting means the repo's automation holds a minter role, which is a much larger trust claim.

**Done when.** An NFT moves from the Safe to a contributor on a merged PR, the receipt links the
token, a non-allowlisted collection is refused by policy before any driver is reached (I10), and
the diff touches no file under `src/core/idempotency.ts`.

---

## 3. Claim flow

**What.** A second flow alongside direct transfer: `/send` records an **entitlement** rather than
moving funds, and the contributor redeems it themselves, on their own schedule, to an address
they choose.

**Why.** Direct transfer requires a resolved recipient address at the moment the maintainer types
the command. Often there isn't one — the contributor has never given an address, or wants to pick
the chain, or the maintainer wants to reward a PR now and let settlement happen later. Today that
case has no answer except "ask them in a comment first".

**Why it stays *in addition to*, not instead of.** Direct transfer is the default and stays the
default. It is the flow with no contributor-side step, no contract, and no unclaimed balance —
and giving that up for every payout in order to serve the unresolved-recipient case would be a
straight downgrade. Prior art cuts the same way: Drips is claim-based, and the `collect`
transaction the recipient must send is precisely the friction this project set out to remove
(`DECISION-LOG.md` §6a).

**Shape.**
- This is the one item that **needs a contract**. The current design deliberately has none —
  `SETTLEMENT-FLOW.md` exists largely to state that there is no reserve contract and no claim
  step — so adding one is a real architectural change, not an increment. Expect an escrow
  contract, a deployment story per chain, and an audit posture before any mainnet use.
- It fits the existing seams as: a driver (`claim-escrow/eip155`) whose `broadcast` funds an
  entitlement instead of a recipient; a resolver in [src/resolvers/](src/resolvers/) that can
  return a *pending* target for an identity with no known address; a new state in the receipt
  (`pending-claim`, later `claimed`); and a static redemption page, with no backend, in the
  spirit of the signer page already planned for week 5.
- **Custody is the question to answer first.** I2 today is "XOps never holds funds — the Safe
  pays the recipient directly". With escrow, funds leave the Safe into a contract before anyone
  is paid. XOps still holds nothing, but the invariant as written no longer describes the system.
  Rewrite it honestly before building, or the first person to read the code finds the gap.

**Open, and all of it load-bearing:**
- **Identity binding.** How does a GitHub account prove it controls the claiming wallet, with no
  hosted backend? A signature posted as a PR comment is the obvious candidate and needs
  adversarial review — comments are editable, and authorship is not a signature.
- **Expiry and refund.** Every surveyed tool lets unclaimed funds sit escrowed indefinitely
  (`DECISION-LOG.md`). Decide deliberately: expiry back to the Safe, or forever.
- **Gas.** The contributor pays to claim, which reintroduces a barrier for exactly the people
  least likely to hold gas. A relayer removes the barrier and adds an operator.
- **Batching.** Escrow makes "one claim, many merged PRs" possible. Attractive, and it changes
  the `round` semantics in the idempotency key — design the two together.

**Done when.** A contributor with no address on file is granted an entitlement from a merged PR,
claims it days later to an address of their choosing, and the replay and expiry tests are green
for both the grant and the claim.

---

## 4. Cross-cutting work these three imply

- **`.xops.yml` schema.** Three payout kinds and two flows will not fit the flat config that one
  kind and one flow fit. Version the schema (`version: 1` is already the plan) and add the
  discriminator before the second kind lands, not after.
- **Receipt shape.** `pending-claim` is the first non-terminal outcome. Getting that state machine
  into [src/adapters/github/receipts.ts](src/adapters/github/receipts.ts) early is cheaper than
  retrofitting it.
- **Per-kind golden vectors.** The rule from `REFERENCES.md` §2.6 applies per asset kind as well as
  per chain: a committed vector for each, or the regression barrier has a hole in it.

---

## 5. Explicitly out of scope

Listed so that "we decided not to" stays distinguishable from "nobody thought of it". Each of
these needs a new agreement in this file — and by the 2026-09-10 review, each is presumed scope
creep until it gets one.

- **Other forges.** GitLab, Bitbucket, Gitea. `IntentSource` has a `gitlab` variant in the types
  and *nothing* behind it; that is an unbuilt branch, not a roadmap item.
- **Non-EVM rails.** Solana, Bitcoin, anything that is not `eip155:*`.
- **Recognition tokens, badges, on-chain reputation.** The "GitPay-Badge" idea from 2026-09-09.
  Item 2 builds the ERC-721 transfer primitive; issuing an organization's own contribution-linked
  token is a product on top of it, and a separate one.
- **Chat platforms** (Discord or Slack triggers), **a hosted backend or database**, **an
  expression language for policy**, and **recurring or streaming payments**.
