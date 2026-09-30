# REFERENCES.md — GitPay

Lookup tables and verified primitives. Every constant here was checked against a primary source
or produced by a passing test on **15 Aug 2026**. When in doubt, prefer this file over memory.

---

## 1. Version pins

```json
{
  "dependencies": {
    "@noble/curves": "2.3.0",
    "@noble/hashes": "2.3.0"
  }
}
```

| Package | Current | Published | Note |
|---|---|---|---|
| `@noble/curves` | 2.3.0 | 2026-08-06 | runtime |
| `@noble/hashes` | 2.3.0 | 2026-08-06 | runtime |
| `@x402/core` | 2.22.0 | 2026-08-11 | **devDependency only** — schema validation in tests |
| `@x402/evm` | 2.22.0 | 2026-08-11 | not used; ≥2.22.0 if ever needed (2.9.0–2.11.0 broken on Monad) |
| `x402` (legacy, unscoped) | 1.2.0 | 2026-04-16 | **do not use** — superseded by scoped packages |

Node ≥ 20 (native `fetch`, `using: node20` in `action.yml`).

---

## 2. Chain registry — `src/drivers/chains.ts`

> Implemented as a TypeScript module, not `assets/chains.json`: it is one entry, and a JSON
> import would need a bundler assertion for nothing. It lives under `src/drivers/` because
> that is the only place I1 permits a chain id or a hex address to be written down. `main.ts`
> does the lookup and hands plain strings down, so core and the adapters still learn nothing.

**Ethereum Sepolia is the only network implemented until v1.0.0.** Everything in §2.3 is
reference material for later phases — do not add those entries to `chains.json` yet.

### 2.1 Ethereum Sepolia — the only active target

Changed from Base Sepolia on 2026-09-05. Reason: the Safe **AllowanceModule** is canonically
deployed on Ethereum Sepolia and **absent from Base Sepolia entirely**. Under the allowance
model the module is load-bearing. See `DECISION-LOG.md` §4 and §6c.

```jsonc
{
  "eip155:11155111": {
    "name": "Ethereum Sepolia",
    "chainId": 11155111,
    "explorer": "https://sepolia.etherscan.io",
    "allowanceModule": "0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134", // v0.1.0, verified
    "assets": {
      "USDC": {
        "address": "TODO — verify against Circle's docs before use",
        "decimals": 6
      }
    }
  }
}
```

> ⚠️ **The USDC address is deliberately unfilled.** Get it from `faucet.circle.com` /
> Circle's contract documentation for Ethereum Sepolia and confirm `decimals()` on-chain.
> It was not verified in the session that produced this entry, and a guessed token address is
> worse than an empty one.

> **The `facilitator` and `eip712` fields are gone on purpose.** Both belonged to the x402 /
> EIP-3009 `transferWithAuthorization` design. Under the allowance model there is no facilitator
> and no typed-data signature to build, so there is no EIP-712 domain to get wrong. The
> AllowanceModule address replaces them as the load-bearing constant.

**Why this chain:** `x402.org/facilitator` is free, keyless, and the URL used in the official
quickstart. Testnet USDC comes from `faucet.circle.com`; gas from the Alchemy, GetBlock, or CDP
faucets. Nearly every x402 tutorial and starter kit defaults here, so a working reference always
exists. Base carries ~85% of x402 mainnet volume, which makes it the right eventual production
target too. No known SDK version sensitivity.

### 2.2 Proving the layer boundary without a second chain

The layer boundary (I1) needs *evidence*, and the obvious evidence — "adding a network touched
zero core files" — normally requires two networks. It doesn't have to.

**Register a `mock/test` driver in the test suite instead.** It implements `SettlementDriver`
against an in-memory ledger, declares `nativeReplayProtection: true`, and settles instantly with
no network. It proves the same three things a second chain would:

- the registry resolves `(scheme × network)` without core changes
- `Intent` → `PaymentRequirements` → `PaymentPayload` carries no EVM assumptions
- the engine runs end-to-end against a driver that has never heard of `keccak256`

It is also strictly better as evidence: it runs offline, in CI, forever, on every push — and it
costs no faucet, no RPC, and no second set of constants to keep current. Ship it in
`test/drivers/mock/`, and put the "adding a driver touches zero core files" diff in the README.

### 2.3 Later phases — reference only, do not implement

Each step tests exactly one new thing. Do not skip a rung.

| Phase | Target | What it newly proves | Notes |
|---|---|---|---|
| **1** | Base Sepolia | the whole system | ← you are here |
| 2 | Base mainnet | real money, real gas | same driver, config change only; **`eip712.name` may differ — re-verify** |
| 3 | Monad | second EVM chain | verified constants below |
| 4 | Solana / non-EVM | second *rail*, different scheme binding | needs a new driver, not a config entry |

**Monad constants (verified 15 Aug 2026, hold for phase 3):**

```jsonc
"eip155:10143": {                       // Monad Testnet
  "explorer": "https://testnet.monadvision.com",
  "facilitator": "https://x402-facilitator.molandak.org",
  "assets": { "USDC": {
    "address": "0x534b2f3A21130d7a60830c2Df862319e593943A3",
    "decimals": 6, "eip712": { "name": "USDC", "version": "2" } } }
},
"eip155:143": {                         // Monad Mainnet
  "explorer": "https://monadvision.com",
  "facilitator": "https://x402-facilitator.molandak.org",
  "assets": { "USDC": {
    "address": "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
    "decimals": 6, "eip712": { "name": "USDC", "version": "2" } } }
}
```

Monad notes for whenever phase 3 arrives: domain name is `"USDC"`, **not** `"USD Coin"` —
different from most chains, and a silent failure if hardcoded. Requires `@x402/evm ≥ 2.22.0` if
the SDK is ever used; 2.9.0–2.11.0 reference an undeployed Permit2 proxy and fail at settlement
with no clear error. Mainnet launched 24 Nov 2025 with native Circle USDC. Monad Foundation is a
Premier member of the x402 Foundation.

### 2.4 Release gate — what unlocks phase 2

Every box, no exceptions. Multi-network work does not start until this is a tagged `v1.0.0`.

> **Rewritten 2026-09-14** against the Safe AllowanceModule architecture (`DECISION-LOG.md` §4).
> The previous version was written for the x402 / EIP-3009 model and listed boxes that the
> current design can never tick — EIP-712 digest vectors, `AUTH_EXPIRED` expiry tests, and a
> payout with zero private keys in GitHub Secrets. The allowance model puts a delegate key in CI
> **on purpose**; the bound on that key is the Safe's period cap, not its absence. A gate that
> cannot close is not a gate.
>
> A tick here means a linked CI run or a linked PR comment, not a recollection.

**Correctness**
- [x] Golden vectors pass — encoded calldata, signed raw transaction, transaction hash
      (`test/vectors/safe-allowance-eip155-11155111.json`, expected values computed
      independently with viem; `test/drivers/safe-allowance/vectors.test.ts`)
- [x] `verify()` rejects a mismatched network, recipient and amount, offline (I6)
      (`test/drivers/safe-allowance/driver.test.ts`, which also asserts zero RPC calls)
- [x] Property test: identical key inputs → identical canonical string (I7)
- [x] Mock driver settles end-to-end with zero core changes (§2.2)

**Safety**
- [ ] Settle on testnet, re-run the identical workflow, get **success** + `AUTH_ALREADY_USED`
      from the receipt ledger (I8)
- [x] Custodial mock driver throws at tier-0 registration (I3)
- [x] A driver declaring `nativeReplayProtection: false` refuses to settle without a ledger (I9)
- [x] `max_per_payout` blocks before any driver is reached (I10)
- [x] Kill switch (`enabled: false`) refuses regardless of the rest of the configuration
- [x] The ledger entry is written **before** broadcast, and a failure to write it refuses the
      payout rather than settling unrecorded
- [x] A second in-flight delegate transaction is refused, not queued behind the first
      (`test/drivers/safe-allowance/driver.test.ts`: refused before the ledger is written,
      simulated or broadcast)

**Supply chain**
- [x] `npm ls --omit=dev --all` ≤ 2 packages (I11)
- [x] `dist/` rebuild is byte-identical to committed (I12)
- [x] Layer-boundary grep is clean (I1)
- [ ] SBOM and build provenance published

**Operational**
- [ ] A real payout settles from an actual merged PR, end to end
- [ ] 20+ consecutive testnet settlements, including deliberate replays of an already-paid key
- [ ] A fresh repo integrates in under 5 minutes with zero secrets, in dry-run
- [ ] Config schema frozen and published as JSON Schema
- [ ] `v1.0.0` tagged

**Custody, stated honestly.** This gate does not claim the operator holds no key. It claims the
key's authority is bounded on-chain and revocable: the delegate can move at most one period's
allowance, to any address it chooses, until a Safe owner removes it. Size the period cap at what
you can afford to lose in one period. `DECISION-LOG.md` §6a has the full blast-radius reading.

**Never cut**, whatever else slips: golden vectors · offline verify · the replay test · the I1
lint · the dry-run default · the tier gate · this gate itself. Those are what make the claim
"provably correct" rather than "probably fine", and the claim is the deliverable.

**The point of the gate:** every unchecked box is a bug you would otherwise discover on a second
chain, where you cannot tell whether it is your bug or the chain's. Fix them where the ground is
firm.

### 2.5 Free test assets

| | Source |
|---|---|
| Ethereum Sepolia USDC | `faucet.circle.com` — select Ethereum Sepolia + USDC |
| Ethereum Sepolia ETH | Google Cloud Web3 faucet, Alchemy, or QuickNode |

Public facilitators are free today with no published SLA. Design for one disappearing — that is
what `mode: self` and `mode: auto` exist for.

### 2.6 Per-chain verification protocol

Run this for **every** new network, once the gate in §2.4 is green. It is the reusable artifact
that makes a fourth chain cost the same as the second. Salvaged from the deleted six-week
`ROADMAP.md` §6.1 and rewritten for the allowance architecture — the EIP-712 domain checks it
used to open with no longer apply, because nothing signs a payment authorization any more.

1. **Verify the module deployment first.** The Safe `AllowanceModule` is **not** deployed
   everywhere — it is absent from Base Sepolia entirely, which is why Ethereum Sepolia is the
   only active target (`DECISION-LOG.md` §6c). Check `safe-modules-deployments` for the chain,
   and confirm the address holds code on-chain. Never copy a sibling network's entry.
2. **Verify the token.** Call `decimals()` on the payout token and check the address against the
   issuer's own documentation. A wrong `decimals` is a silent factor-of-1000 error in the amount.
3. **Add a `chains.ts` entry. Nothing else.** If you need to touch any other file, stop and fix
   the boundary instead. That is the finding, and it is worth more than the chain.
4. **Confirm the diff.** `git diff --stat` must show no changes under `src/core` or
   `src/adapters`.
5. **Dry-run and read the calldata.** Selector `0x4515641a`, **292 bytes** with an empty
   signature (4 + eight head words + a zero-length `bytes` tail), with the Safe, token, recipient
   and amount correct in the decoded words.
6. **Settle the smallest possible amount.**
7. **Replay test** — re-run the identical inputs, expect success + `AUTH_ALREADY_USED` and the
   original transaction link, served from the PR receipt ledger.
8. **Wrong-network negative test** → `DOMAIN_MISMATCH`, using a neighbouring chain's CAIP-2
   identifier against the same driver.
9. **Commit a golden vector for this chain** — calldata, signed raw transaction, transaction hash.
10. **Record the tx hash** in `docs/VERIFIED_CHAINS.md`.

Mainnet only: start below $1, and confirm the Safe's balance moved by exactly the expected amount
before doing anything larger.

## 3. Core types

```ts
// src/core/types.ts — mirrors x402 v2. Do not invent fields.

export interface PaymentRequirements {
  scheme: string;                    // "exact" | "auth-capture" | "upto" | ...
  network: string;                   // CAIP-2: "eip155:143"
  amount: string;                    // atomic units, string — NEVER number
  asset: string;                     // opaque identifier — NOT assumed to be an address
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;   // e.g. { name: "USDC", version: "2" }
}

export interface PaymentPayload {
  x402Version: 2;
  scheme: string;
  network: string;
  payload: Record<string, unknown>;  // scheme-defined. Core NEVER inspects this.
}

export interface SettlementResponse {
  success: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
  errorReason?: string;
}

// GitPay-local
export interface Intent {
  source:
    | { platform: "github"; repo: string; ref: string; actor: string }
    | { platform: "gitlab"; project: string; ref: string; actor: string };
  recipient: string;                 // OPAQUE — resolved, never assumed to be 0x
  amount: string;
  asset: string;
  network: string;
  scheme: string;
  round: number;
}

export interface IdempotencyKey {
  v: 1;
  source: { platform: string; repo: string; ref: string };
  recipient: string;
  asset: string;
  network: string;
  round: number;
  // amount deliberately absent — see AGENTS.md
}

export interface PayoutTarget {
  rail: string;
  address: string;
  attestations?: unknown[];
  resolvedBy: string;
}
```

```ts
// src/drivers/types.ts

export interface Capabilities {
  offlineVerify: boolean;
  needsGas: boolean;
  needsSecret: boolean;
  custodial: boolean;
  nativeReplayProtection: boolean;   // rail enforces exactly-once, or driver must
}

export interface SettlementDriver {
  readonly id: string;               // "exact/eip155"
  readonly capabilities: Capabilities;
  supports(network: string, scheme: string): boolean;
  buildRequirements(intent: Intent): PaymentRequirements;
  verify(p: PaymentPayload, r: PaymentRequirements): Promise<VerifyResult>;
  settle(p: PaymentPayload, r: PaymentRequirements): Promise<SettlementResponse>;
}

export interface VerifyResult {
  isValid: boolean;
  payer?: string;
  reason?: string;                   // an ErrorCode from §6
}
```

**Driver capability matrix:**

| Driver | offlineVerify | needsGas | needsSecret | custodial | nativeReplay | Tier |
|---|---|---|---|---|---|---|
| `exact/eip155` (self) | ✅ | ✅ | ⚠️ gas key only | ❌ | ✅ | 0 |
| `facilitator/*` | ✅ | ❌ | ❌ | ❌ | ✅ | **0 — safest default** |
| `auth-capture/eip155` | ✅ | ✅ | ⚠️ | ❌ | ✅ | 0 |
| `mock/test` (tests only) | ✅ | ❌ | ❌ | ❌ | ✅ | test |
| any custodial PSP | ❌ | ❌ | ✅ | ✅ | varies | **2 only** |

---

## 4. Verified EIP-3009 primitives

Source of truth: `x402-min.js` (all assertions passing). Do not reimplement from memory.

**Imports** — note the explicit `.js` extensions, required by noble v2 ESM:

```ts
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
```

**Type hashes** (computed, not copied):

```
EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)
TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)
```

**Digest** = `keccak256( 0x19 || 0x01 || domainSeparator || structHash )`

**Signing** — noble v2 API. The `recovered` format is `[recovery byte][r:32][s:32]`; Ethereum
wants `v = recovery + 27` and a 65-byte `r||s||v`:

```ts
const sig = secp256k1.sign(digest, privKeyBytes, { prehash: false, format: "recovered" });
const v = sig[0] + 27;
const r = sig.subarray(1, 33);
const s = sig.subarray(33, 65);
```

**Recovery** — reproduces exactly what the token contract does on-chain, which is why `verify()`
needs no network:

```ts
const recovered = Buffer.concat([Buffer.from([v - 27]), raw.subarray(0, 64)]);
const sig = secp256k1.Signature.fromBytes(recovered, "recovered");
const pub = sig.recoverPublicKey(digest).toBytes(false).slice(1);  // false = uncompressed
const addr = "0x" + Buffer.from(keccak_256(pub)).subarray(12).toString("hex");
```

> `toBytes()` takes a **boolean** `isCompressed` in noble v2, not the string `"uncompressed"`.
> This is a silent-failure trap.

**Function selector — verified:**

```
transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)
→ 0xe3ee160e
```

**Calldata layout** — 9 static params, all one 32-byte word, zero dynamic types. Total
**292 bytes** = 4 selector + 9 × 32. No ABI library required:

```
[0:4]     0xe3ee160e
[4:36]    from        (address, left-padded)
[36:68]   to          (address, left-padded)
[68:100]  value       (uint256)
[100:132] validAfter  (uint256)
[132:164] validBefore (uint256)
[164:196] nonce       (bytes32)
[196:228] v           (uint8, left-padded)
[228:260] r           (bytes32)
[260:292] s           (bytes32)
```

**Test vector** (Hardhat account #0 — public, never fund it):

```
privkey  0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
address  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

Golden-vector files must pin: domain, authorization, digest, signature, recovered address, and
full calldata. Regenerate only deliberately — a diff here means signing changed.

---

## 5. x402 payload shape

```jsonc
{
  "x402Version": 2,
  "scheme": "exact",
  "network": "eip155:10143",
  "payload": {
    "signature": "0x…65 bytes…",
    "authorization": {
      "from": "0x…",
      "to": "0x…",
      "value": "2500000",
      "validAfter": "1755…",
      "validBefore": "1755…",
      "nonce": "0x…32 bytes…"
    }
  }
}
```

Core never reads inside `payload`. Only `drivers/exact-eip155` does.

---

## 6. Error taxonomy — `src/core/errors.ts`

| Code | Meaning | Comment shown | Retry |
|---|---|---|---|
| `AUTH_ALREADY_USED` | Nonce consumed | ✅ **Already paid** — link original tx | no |
| `AUTH_EXPIRED` | Past `validBefore` | Re-sign; window is 15 min | user |
| `AUTH_NOT_YET_VALID` | Before `validAfter` | Clock skew — wait 60 s | auto |
| `SIGNER_MISMATCH` | Recovered ≠ expected payer | Wrong wallet connected | user |
| `DOMAIN_MISMATCH` | EIP-712 domain wrong | Check chainId / asset in `.gitpay.yml` | no |
| `AMOUNT_MISMATCH` | Payload ≠ requirements | Payload was tampered with | no |
| `RECIPIENT_MISMATCH` | Payload `to` ≠ requirements | Payload was tampered with | no |
| `IDENTITY_UNRESOLVED` | No resolver matched | Register a wallet or use inline address | user |
| `POLICY_DENIED` | Gate failed | Which rule, and its value | no |
| `AMOUNT_CAP_EXCEEDED` | Above `max_per_payout` | Cap is N; raise it or split | no |
| `INSUFFICIENT_BALANCE` | Treasury short | Fund `0x…`, needs N USDC | user |
| `INSUFFICIENT_GAS` | Gas wallet empty | Fund `0x…` with native token | user |
| `SIMULATION_REVERT` | `eth_call` reverted | Decoded revert reason | no |
| `RPC_UNAVAILABLE` | All endpoints failed | Retryable; set `rpc_url` to override | auto |
| `NONCE_CONFLICT` | Another tx used this payout's nonce | Not sent; check the account, retry with a new `round` | user |
| `DRIVER_NOT_FOUND` | No driver for pair | Unsupported network/scheme | no |
| `TIER_VIOLATION` | Driver needs secrets or custody in Tier 0 | Run your own facilitator | no |
| `NO_REPLAY_PROTECTION` | Driver lacks exactly-once guarantee | Cannot settle in Tier 0 | no |

`AUTH_ALREADY_USED` is a **success** path (I8). Everything else in the table is a failure.

---

## 7. Config schema — `.gitpay.yml`

```yaml
version: 1                          # required; unknown keys warn, never fail

network: eip155:143
scheme: exact
asset: USDC

settlement:
  mode: dry-run                     # dry-run | facilitator | self | auto
  facilitator_url: https://x402-facilitator.molandak.org
  # rpc_url: optional — bundled public endpoints used when omitted
  enabled: true                     # kill switch, honored before policy

policy:
  approvers: [maintainer, admin]
  require: [PR_MERGED, TESTS_PASS, MAINTAINER_APPROVED]
  max_per_payout: "100.00"
  max_per_day: "500.00"

payout:
  round: 0
```

**Policy constants** (named only, never an expression language):
`PR_MERGED` · `TESTS_PASS` · `MAINTAINER_APPROVED` · `COVERAGE_GT_80` ·
`NO_OPEN_REQUESTED_CHANGES` · `SANCTIONS_CLEAR` (optional, no default provider)

Publish a JSON Schema and validate it in CI.

---

## 8. Adopter-facing workflow

```yaml
# .github/workflows/reward.yml
on:
  issue_comment: { types: [created] }
permissions: { issues: write, pull-requests: write }
jobs:
  pay:
    if: startsWith(github.event.comment.body, '/send')
    runs-on: ubuntu-latest
    steps:
      - uses: StabilityNexus/GitPay@v1
```

No `secrets:` block on the default path. Verify `GITHUB_TOKEN` inheritance in `workflow_call`
on a scratch repo — if it holds, no PAT is needed for cross-repo callbacks.

**Action outputs, always written including on failure paths:** `TX_HASH`, `EXPLORER_URL`,
`STATUS`, `ERROR_CODE`, `IDEMPOTENCY_KEY`.

---

## 9. Spec sources

`github.com/x402-foundation/x402` @ `167a828` (14 Aug 2026). **Not `coinbase/x402`** — the
project moved to the x402 Foundation under the Linux Foundation, operational 14 Jul 2026, 40
members (Monad Foundation, Solana Foundation, Stellar Development Foundation, Circle, Stripe,
Visa, Cloudflare, Google among Premier).

| Path | What's in it |
|---|---|
| `specs/x402-specification-v2.md` | core types; transport/scheme/network independence |
| `specs/README.md` | the transport ÷ scheme ÷ network factoring |
| `specs/schemes/exact/scheme_exact_evm.md` | **the driver you're building** |
| `specs/schemes/exact/` | 17 network bindings — evm, svm, stellar, sui, aptos, near, ton, xrpl, hedera, starknet, cardano, algo, casper, concordium, keeta, canton |
| `specs/schemes/auth-capture/` | escrow: authorize → capture / void / refund / reclaim |
| `specs/schemes/upto/` | client-signed ceiling; supports $0 settlement |
| `specs/schemes/batch-settlement/` | off-chain vouchers, periodic on-chain claim |
| `specs/transports-v2/{http,mcp,a2a}.md` | existing bindings — **no CI/CD binding exists** |
| `specs/extensions/extension-offer-and-receipt.md` | signed receipts for audit + reputation |
| `specs/extensions/bazaar.md` | `.well-known/x402.json` discovery |
| `specs/extensions/erc20_gas_sponsoring.md` | paying gas in ERC-20 |

Other primary sources:

- `docs.x402.org/core-concepts/facilitator` — facilitator interface, self-facilitation
- `github.com/x402-foundation/x402/tree/main/examples/typescript/servers/self-facilitation`
- `docs.monad.xyz/guides/x402` — facilitator URL, USDC addresses, EIP-712 domain, scheme table
- EIP-3009 (Transfer With Authorization), EIP-712 (Typed Structured Data), CAIP-2 (chain IDs)
- `xpaysh/awesome-x402` — ecosystem index; SDKs in Go, TypeScript, Python, Rust
- `x402-rs/x402-rs` — production Rust facilitator, if a Tier 2 service is ever built
- ERC-8004 — `erc-8004/erc-8004-contracts`; mainnet 29 Jan 2026; identity resolver only
- `GHSA-qr2g-p6q7-w82m` — x402 SDK signature-verification bypass, fixed ≥2.6.0

---

## 10. Conformance & CI checks

| Check | Enforces | Frequency |
|---|---|---|
| Grep `src/core` + `src/adapters` for chain imports and hash primitives | I1 | every push |
| Default config asserts `mode: dry-run` | I5 | every push |
| Verify suite runs with network disabled | I6 | every push |
| Property test: same key inputs → same canonical string | I7 | every push |
| Test: mock driver with `custodial: true` throws at tier-0 registration | I3 | every push |
| Test: driver with `nativeReplayProtection: false` refuses settle | I9 | every push |
| `npm ls --omit=dev --all` package count ≤ 2 | I11 | every push |
| Rebuild `dist/` and diff against committed | I12 | every push |
| Golden vectors match | signing stability | every push |
| `mock/test` driver settles end-to-end with zero core changes | I1 evidence | every push |
| Testnet settle → re-run identical workflow → expect **success** + `AUTH_ALREADY_USED` | I8 | pre-release |
| Fetch x402 spec, regenerate fixtures from published JSON Schemas, run engine | spec drift | weekly cron |

The weekly conformance job is how "don't miss a spec change" becomes true instead of
aspirational — you learn from a red build, not from a blog post.

---

## 11. Local files

| File | Contents |
|---|---|
| `AGENTS.md` | authoritative rules — read every session |
| `x402-min.js` | verified EIP-3009 primitives: address derivation, EIP-712, sign, recover, ABI encode |
| `verify.js` | test harness; all assertions passing |
| `verify-output.txt` | recorded output — use as the first golden vector |
