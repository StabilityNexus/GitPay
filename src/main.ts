import { readInput as input } from "./adapters/github/inputs.js";
import { writeOutputs } from "./adapters/github/outputs.js";
import { PullRequestReceiptLedger } from "./adapters/github/receipts.js";
import { ERC20_APPROVE_SCHEME, Erc20ApproveDriver } from "./drivers/erc20-approve/driver.js";
import { SAFE_ALLOWANCE_SCHEME, SafeAllowanceDriver } from "./drivers/safe-allowance/driver.js";
import { maySpend } from "./adapters/github/permissions.js";
import {
  parseAssociations,
  parseSendCommand,
  resolveCommandAsset,
} from "./adapters/github/trigger.js";
import { toAtomic } from "./core/amount.js";
import { DEFAULT_SETTLEMENT_ENABLED, parseSettlementMode } from "./core/defaults.js";
import { GitPayError, isErrorCode } from "./core/errors.js";
import { canonical, keyFor } from "./core/idempotency.js";
import { parseIntent } from "./core/intent.js";
import { withAliases } from "./core/ledger.js";
import type { LedgerEntry, SettlementLedger } from "./core/ledger.js";
import { assertAllowed, evaluate, format } from "./core/policy.js";
import { canonicalNetwork, lookupChain } from "./drivers/chains.js";
import { DriverRegistry } from "./drivers/registry.js";
import type { SettlementDriver } from "./drivers/types.js";
import { INLINE_PREFIX, InlineAddressResolver, ResolverChain } from "./resolvers/index.js";

async function run(): Promise<number> {
  // First, before anything is parsed or resolved: an unknown mode is refused
  // rather than read as "not dry-run", which would settle on a typo (I5).
  const mode = parseSettlementMode(input("mode"));

  // L0 TRIGGER. A comment body, when given, is the source of truth for who gets
  // paid and how much — it beats the workflow's static inputs, because a person
  // typed it deliberately.
  const body = input("comment");
  const command = body === undefined ? undefined : parseSendCommand(body);

  if (body !== undefined && command === undefined) {
    console.log("no /send command in this comment — nothing to do.");
    writeOutputs({ STATUS: "skipped", ERROR_CODE: "" });
    return 0;
  }

  if (command) {
    const decimals = Number(input("decimals") ?? "6");
    console.log(
      `/send parsed: recipient=${command.recipient} amount=${command.amount}` +
        `${command.asset ? ` asset=${command.asset}` : ""} (decimals=${decimals})`,
    );
  }

  const decimals = Number(input("decimals") ?? "6");

  /**
   * Resolve the network spelling BEFORE the intent is built. A friendly alias is
   * sugar for a CAIP-2 identifier, never a substitute: `network` goes into the
   * idempotency key verbatim, so two spellings of one chain would be two keys —
   * and the same payout could then settle twice. One canonical spelling reaches
   * the key, the receipt and driver resolution.
   */
  const requestedNetwork = input("network");
  const network =
    requestedNetwork === undefined ? undefined : canonicalNetwork(requestedNetwork);

  // A `/send` may name the asset only to confirm it; the workflow's `token` is
  // what pays, and the workflow's spelling is what reaches the key.
  const asset = command
    ? resolveCommandAsset(command.asset, input("asset"))
    : input("asset");

  const intent = parseIntent({
    platform: "github",
    repo: input("repo") ?? process.env["GITHUB_REPOSITORY"],
    ref: input("ref") ?? process.env["GITHUB_REF"],
    actor: input("actor") ?? process.env["GITHUB_ACTOR"],
    recipient: command?.recipient ?? input("recipient"),
    amount: command ? toAtomic(command.amount, decimals) : input("amount"),
    asset,
    network,
    scheme: input("scheme"),
    // A `round:N` typed in the command wins, like the recipient and amount.
    round: command?.round ?? input("round"),
  });

  /**
   * L1 POLICY, offline, before anything is resolved, signed or recorded.
   *
   * It runs here rather than inside the `if (command)` branch above for two
   * reasons. The amount only exists once the intent is parsed, so a cap could
   * not have been checked earlier — I10 requires that no amount above
   * `max_per_payout` reaches a driver, and this is the last place that is still
   * true of every path. And it runs before the `dry-run` branch, so a dry run
   * is an honest preview: it reports the same refusal a real run would, instead
   * of reporting success on a payout that policy would have blocked.
   *
   * A future resolver may make network calls, so a refusal landing before
   * resolution also means an outsider cannot make the runner do work.
   */
  const maxPerPayout = input("max_per_payout");
  const decision = evaluate(
    {
      enabled: (input("enabled") ?? String(DEFAULT_SETTLEMENT_ENABLED)) !== "false",
      // Typed as the maintainer thinks of it, in the same units as `/send`, and
      // converted with the asset's decimals. A cap written in atomic units next
      // to a `/send 2.50` would be read wrong by exactly the person it protects.
      maxPerPayout: maxPerPayout === undefined ? undefined : toAtomic(maxPerPayout, decimals),
    },
    {
      // undefined, not false, when nothing was typed into a comment: this run
      // was configured by a workflow, and editing one already needs write access.
      //
      // The allowlist matches `author_association`, which does not say whether
      // the author can push here — `MEMBER` is any org member — so anyone it
      // admits short of OWNER is checked against the repository's permissions
      // too. An outsider is refused before that lookup, so cannot make the
      // runner do work.
      actorIsMaintainer:
        command === undefined
          ? undefined
          : await maySpend(
              input("actor_association"),
              parseAssociations(input("allowed_associations")),
              {
                repo:
                  intent.source.platform === "github" ? intent.source.repo : intent.source.project,
                login: intent.source.actor,
                token: input("github_token") ?? "",
              },
            ),
      amount: intent.amount,
    },
  );

  console.log("policy:");
  console.log(format(decision));
  assertAllowed(decision);

  const resolvers = new ResolverChain([new InlineAddressResolver()]);
  const target = await resolvers.resolve(intent.recipient, { rail: intent.network });

  /**
   * The key names the resolved address, not the identity as typed.
   * `inline:0xabc` and `0xabc` are one payee. Keyed on the typed spelling, a
   * payout sent one way and retried the other way would find no receipt, and
   * this rail would transfer again.
   *
   * Receipts written before this change carry the `inline:` spelling. They are
   * still looked up, but new ones are recorded only under the canonical key.
   *
   * Receipts keyed with an older casing of the asset (`usdc` before
   * `resolveCommandAsset` fixed the spelling) need no alias here: the receipt
   * ledger matches the asset field case-insensitively (`sameKey`).
   */
  const key = keyFor(intent);
  const idempotencyKey = canonical({ ...key, recipient: target.address });
  const legacyKeys =
    target.resolvedBy === "inline-address"
      ? [canonical({ ...key, recipient: `${INLINE_PREFIX}${target.address}` })]
      : [];

  console.log("intent:");
  console.log(JSON.stringify(intent, null, 2));
  console.log("payout target:");
  console.log(JSON.stringify(target, null, 2));
  console.log(`idempotency key: ${idempotencyKey}`);

  if (mode === "dry-run") {
    console.log("mode: dry-run — nothing was settled.");
    writeOutputs({ STATUS: "dry-run", IDEMPOTENCY_KEY: idempotencyKey, ERROR_CODE: "" });
    return 0;
  }

  if (maxPerPayout === undefined) {
    // Only worth saying on a path that actually moves money.
    console.warn(
      "no max_per_payout set — the on-chain allowance is the only ceiling on this payout.",
    );
  }

  const required = (name: string): string => {
    const value = input(name);
    if (!value) throw new Error(`Real settlement needs the "${name}" input`);
    return value;
  };

  /**
   * Anything that is a function of the network comes from the chain registry,
   * and an explicit input still wins — a custom module deployment or a private
   * explorer stays configurable, and an unlisted network stays usable by
   * passing all three.
   *
   * The point is not saved typing. `chain_id` written next to `network` is one
   * fact in two formats with nothing comparing them: `supports()` and
   * `verify()` both match on the CAIP-2 network alone, so a mismatched chain id
   * is signed without complaint and rejected only at broadcast — by which time
   * the ledger has recorded the attempt, and the payout is stuck behind
   * `unconfirmed` until someone bumps `round`.
   */
  const chain = lookupChain(intent.network);

  const derived = (name: string, fallback: string | undefined): string => {
    const value = input(name) ?? fallback;
    if (!value) {
      throw new Error(
        `Real settlement needs the "${name}" input: network ${intent.network} is not in ` +
          "the chain registry, so there is nothing to derive it from.",
      );
    }
    return value;
  };

  /**
   * The scheme picks the driver, and only the chosen one is constructed, so each
   * asks for its own inputs: `safe` under `allowance`, `payer` under `approve`.
   * `from` is the account the funds leave, shown on the receipt.
   */
  const evm = () => ({
    network: intent.network,
    chainId: BigInt(derived("chain_id", chain?.chainId.toString())),
    rpcUrl: required("rpc_url"),
    tokenAddress: required("token"),
    delegatePrivateKey: required("delegate_key"),
  });
  const schemes: Record<string, () => { driver: SettlementDriver; from: string; fromLabel: string }> = {
    [SAFE_ALLOWANCE_SCHEME]: () => {
      const safeAddress = required("safe");
      const moduleAddress = derived("allowance_module", chain?.allowanceModule);
      return {
        driver: new SafeAllowanceDriver({ ...evm(), safeAddress, moduleAddress }),
        from: safeAddress,
        fromLabel: "Safe",
      };
    },
    [ERC20_APPROVE_SCHEME]: () => {
      const payerAddress = required("payer");
      return {
        driver: new Erc20ApproveDriver({ ...evm(), payerAddress }),
        from: payerAddress,
        fromLabel: "Wallet",
      };
    },
  };

  // Own keys only: `scheme: constructor` must not find Object.prototype's.
  const build = Object.hasOwn(schemes, intent.scheme) ? schemes[intent.scheme] : undefined;
  if (!build) {
    throw new GitPayError(
      "DRIVER_NOT_FOUND",
      `No driver for scheme "${intent.scheme}". Supported: ${Object.keys(schemes).join(", ")}`,
    );
  }
  const { driver, from, fromLabel } = build();

  /**
   * Tier 1, not 0: CI holds the delegate key, so this is an adopter-operated
   * process with its own credentials. I3 would reject it at tier 0, correctly —
   * and I9 still applies here, which is why the ledger below is not optional.
   */
  const registry = new DriverRegistry(1);
  registry.register(driver);

  const explorerUrl = input("explorer_url") ?? chain?.explorer;

  const receipts = new PullRequestReceiptLedger({
    repo:
      intent.source.platform === "github" ? intent.source.repo : intent.source.project,
    number: Number(required("pr")),
    token: required("github_token"),
    // Presentation for the receipt. The explorer base is resolved here and
    // handed over as a plain string, so the adapter still imports no chain
    // knowledge and holds no constant of its own (I1).
    context: {
      amount: command?.amount ?? intent.amount,
      asset: intent.asset,
      to: target.address,
      from,
      fromLabel,
      actor: intent.source.actor,
      network: intent.network,
      explorerUrl,
    },
  });
  /**
   * Remembers what the settlement's own lookup found, so the run can tell a
   * settled receipt from a `broadcasting` one without asking GitHub twice. The
   * status that matters is the one that stopped this payment, not a later read.
   */
  const aliased = withAliases(receipts, legacyKeys);
  let prior: LedgerEntry | undefined;
  const ledger: SettlementLedger = {
    id: aliased.id,
    lookup: async (key) => (prior = await aliased.lookup(key)),
    record: (key, entry) => aliased.record(key, entry),
    confirm: (key, entry) => aliased.confirm(key, entry),
  };

  const requirements = registry.buildRequirements({ intent, target, idempotencyKey });
  const verified = await driver.verify(
    { x402Version: 2, scheme: intent.scheme, network: intent.network, payload: {} },
    requirements,
  );
  if (!verified.isValid) {
    throw new GitPayError(verified.reason ?? "POLICY_DENIED", "The payout failed verification");
  }

  const response = await registry.settle(
    { x402Version: 2, scheme: intent.scheme, network: intent.network, payload: {} },
    requirements,
    { idempotencyKey, ledger },
  );

  const alreadyPaid = response.errorReason === "AUTH_ALREADY_USED";

  /**
   * A prior receipt stops a second payment either way (I8). But a receipt still
   * at `broadcasting` was written before its broadcast and never confirmed, so
   * nobody knows whether the transaction landed. Reporting that as `already-paid`, with a
   * green run, would tell everyone the contributor was paid when nobody knows.
   * It is reported as `unconfirmed` and the run fails, so a human looks.
   */
  const unconfirmed = alreadyPaid && prior?.status === "broadcasting";

  // "Landed" is not "paid": a reverted transaction is in a block and moved
  // nothing. Only success on the explorer means the contributor was paid.
  const tx = response.transaction ?? "no transaction";
  const recheck =
    "Check it on the explorer: if it succeeded, the contributor is paid; if it failed " +
    "(reverted) or never landed, nothing was paid, so send the command again with " +
    `round:${intent.round + 1}.`;

  console.log(
    unconfirmed
      ? `unconfirmed — an earlier attempt recorded ${tx} but could not confirm it. ` +
          `Nothing was paid now. ${recheck}`
      : alreadyPaid
        ? `already paid — ${response.transaction ?? "no transaction recorded"}`
        : response.success
          ? `settled: ${tx}`
          : `not settled (${response.errorReason ?? "unknown error"}) — sent ${tx} but could ` +
            `not confirm it as a successful payout. ${recheck}`,
  );

  writeOutputs({
    STATUS: unconfirmed
      ? "unconfirmed"
      : response.success
        ? alreadyPaid
          ? "already-paid"
          : "settled"
        : "error",
    TX_HASH: response.transaction ?? "",
    EXPLORER_URL:
      explorerUrl && response.transaction
        ? `${explorerUrl.replace(/\/+$/, "")}/tx/${response.transaction}`
        : "",
    IDEMPOTENCY_KEY: idempotencyKey,
    ERROR_CODE: response.success ? "" : (response.errorReason ?? ""),
  });

  return response.success && !unconfirmed ? 0 : 1;
}

run().then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    // Drivers attach a code to a plain Error (`Object.assign(new Error(…), { code })`),
    // so reading GitPayError alone left ERROR_CODE blank for every driver refusal.
    const raw = err instanceof GitPayError ? err.code : (err as { code?: unknown } | null)?.code;
    const code = isErrorCode(raw) ? raw : "";
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    writeOutputs({ STATUS: "error", TX_HASH: "", EXPLORER_URL: "", ERROR_CODE: code });
    process.exitCode = 1;
  },
);
