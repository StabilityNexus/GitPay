/**
 * The chain registry from REFERENCES.md §2, as code rather than JSON — it is
 * a handful of entries, and a `.json` import would need a bundler assertion for
 * nothing.
 *
 * An entry means the constants are verified (REFERENCES.md §2.6 steps 1–5). It
 * does not by itself mean the network is proven: that is the live evidence in
 * docs/VERIFIED_CHAINS.md.
 *
 * It lives under `src/drivers/` because that is the only place I1 allows a
 * chain id or a hex address to be written down. Core, adapters and resolvers
 * still receive plain strings and learn nothing about rails; `main.ts` is the
 * seam that does the lookup, exactly as it is already the seam that constructs
 * the driver.
 *
 * What belongs here is anything that is a *function of the network*. A
 * maintainer should never type a value CI can derive: `chain_id` next to
 * `network` is the same fact twice, and nothing downstream compares them —
 * `supports()` and `verify()` both check the CAIP-2 network only, so a
 * mismatched chain id is signed happily and rejected at broadcast, after the
 * ledger has already recorded the attempt.
 *
 * What does NOT belong here is anything specific to the adopter: their Safe,
 * their RPC endpoint, their delegate key.
 */
export interface ChainRecord {
  /** Human label, for logs and error messages only. */
  readonly name: string;
  /** CAIP-2. Repeated inside the record so a lookup result is self-contained. */
  readonly network: string;
  readonly chainId: bigint;
  readonly explorer: string;
  /** Safe AllowanceModule deployment. Load-bearing under the allowance scheme. */
  readonly allowanceModule: string;
}

/**
 * Keyed by CAIP-2, because that is what the intent, the idempotency key and
 * driver resolution all use.
 *
 * No `assets` entry yet, deliberately. REFERENCES.md §2.1 leaves the Ethereum
 * Sepolia USDC address unverified, and a guessed token address is worse than an
 * absent one — so `token` and `decimals` stay maintainer inputs until someone
 * confirms the address and `decimals()` on-chain. That is the one remaining
 * value in the demo workflow that is a function of the network and still has to
 * be typed.
 */
const CHAINS: Readonly<Record<string, ChainRecord>> = {
  "eip155:1": {
    name: "Ethereum",
    network: "eip155:1",
    chainId: 1n,
    explorer: "https://etherscan.io",
    // v0.1.0, verified 2026-10-15: listed for chain 1 in safe-modules-deployments,
    // and the code at this address is byte-identical to Sepolia's, the
    // deployment every live settlement so far ran against. REAL MONEY: see
    // docs/VERIFIED_CHAINS.md for what has been proven here before relying on it.
    allowanceModule: "0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134",
  },
  "eip155:11155111": {
    name: "Ethereum Sepolia",
    network: "eip155:11155111",
    chainId: 11155111n,
    explorer: "https://sepolia.etherscan.io",
    // v0.1.0, verified. Absent from Base Sepolia entirely, which is why this was
    // the only network through v1.0.0 — see DECISION-LOG.md §4 and §6c.
    allowanceModule: "0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134",
  },
};

/**
 * Friendly names are *sugar for* the CAIP-2 identifier, never a replacement.
 *
 * AGENTS.md's "CAIP-2, never friendly strings" rule has a mechanism behind it:
 * `network` goes into the idempotency key verbatim, so two spellings of one
 * chain are two keys, and the same payout could settle twice. Resolving the
 * alias before the intent is built keeps a single canonical spelling in the
 * key, the receipt and driver resolution, while letting a workflow say
 * `network: sepolia`.
 */
const ALIASES: Readonly<Record<string, string>> = {
  // Deliberately not `ethereum`: one word that means mainnet to some readers and
  // "any Ethereum network" to others is a bad name for real money.
  mainnet: "eip155:1",
  "ethereum-mainnet": "eip155:1",
  sepolia: "eip155:11155111",
  "ethereum-sepolia": "eip155:11155111",
};

export function supportedNetworks(): string[] {
  return [...Object.keys(CHAINS), ...Object.keys(ALIASES)].sort();
}

/**
 * Maps a friendly alias onto its CAIP-2 identifier, and passes anything else
 * through untouched.
 *
 * Untouched matters: an unlisted network is still a usable one, as long as the
 * workflow supplies the values this registry would have derived. Gating on
 * registry membership would take a working path away in the name of making
 * setup easier. An input that is neither an alias nor valid CAIP-2 fails in
 * `parseIntent`, where that check already lives.
 */
export function canonicalNetwork(network: string): string {
  const key = network.trim();
  return ALIASES[key.toLowerCase()] ?? key;
}

/**
 * Does not throw. A miss means "nothing to default from", and the caller
 * reports which input the workflow therefore has to pass — which is a better
 * error than "unknown network", because it names the fix.
 *
 * Pass the CAIP-2 spelling from `canonicalNetwork`, not raw user input.
 */
export function lookupChain(network: string): ChainRecord | undefined {
  return CHAINS[network];
}
