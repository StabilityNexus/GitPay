import assert from "node:assert/strict";
import { test } from "node:test";

import { withAliases, type LedgerEntry, type SettlementLedger } from "../../src/core/ledger.js";
import type { PaymentPayload, PaymentRequirements } from "../../src/core/types.js";
import { DriverRegistry } from "../../src/drivers/registry.js";
import type { Capabilities, SettlementDriver } from "../../src/drivers/types.js";

const NETWORK = "eip155:11155111";
const KEY = "xops:v1|github:o/r#refs/pull/1|0xdead|eip155:11155111|USDC|0";

const REQUIREMENTS: PaymentRequirements = {
  scheme: "allowance",
  network: NETWORK,
  amount: "2500000",
  asset: "USDC",
  payTo: "0xdead",
  maxTimeoutSeconds: 60,
};
const PAYLOAD: PaymentPayload = {
  x402Version: 2,
  scheme: "allowance",
  network: NETWORK,
  payload: {},
};

function driver(
  caps: Partial<Capabilities> = {},
): SettlementDriver & { prepared: number; broadcast_: number } {
  const self = {
    id: "test-driver",
    prepared: 0,
    broadcast_: 0,
    capabilities: {
      offlineVerify: true,
      needsGas: true,
      needsSecret: false,
      custodial: false,
      nativeReplayProtection: false,
      ...caps,
    },
    supports: (n: string) => n === NETWORK,
    buildRequirements: () => REQUIREMENTS,
    verify: () => Promise.resolve({ isValid: true }),
    prepare: () => {
      self.prepared += 1;
      return Promise.resolve({ reference: `0xtx${self.prepared}`, raw: {} });
    },
    broadcast: (p: { reference: string }) => {
      self.broadcast_ += 1;
      return Promise.resolve({ success: true, transaction: p.reference, network: NETWORK });
    },
  };
  return self;
}

function ledger(
  fail: { record?: boolean; confirm?: boolean } = {},
): SettlementLedger & { entries: Map<string, LedgerEntry> } {
  const entries = new Map<string, LedgerEntry>();
  return {
    id: "test-ledger",
    entries,
    lookup: (key) => Promise.resolve(entries.get(key)),
    record: (key, entry) => {
      if (fail.record) return Promise.reject(new Error("ledger unavailable"));
      entries.set(key, entry);
      return Promise.resolve();
    },
    confirm: (key, entry) => {
      if (fail.confirm) return Promise.reject(new Error("ledger unavailable"));
      entries.set(key, entry);
      return Promise.resolve();
    },
  };
}

test("a driver with no replay protection cannot settle without a ledger", async () => {
  const registry = new DriverRegistry(0);
  registry.register(driver());
  await assert.rejects(registry.settle(PAYLOAD, REQUIREMENTS), {
    code: "NO_REPLAY_PROTECTION",
  });
});

/**
 * The hole this closes. The guard used to read `tier === 0 && !nativeReplayProtection`,
 * so a driver that pays twice on a retry became settleable simply by constructing
 * the registry at tier 1 — silently, with double payment as the failure mode.
 */
test("bumping the tier does not buy a way past the replay guard", async () => {
  for (const tier of [1, 2] as const) {
    const registry = new DriverRegistry(tier);
    registry.register(driver());
    await assert.rejects(
      registry.settle(PAYLOAD, REQUIREMENTS),
      { code: "NO_REPLAY_PROTECTION" },
      `tier ${tier} must still refuse`,
    );
  }
});

test("a ledger satisfies the guard and the first payout goes through", async () => {
  const registry = new DriverRegistry(1);
  const d = driver();
  registry.register(d);

  const response = await registry.settle(PAYLOAD, REQUIREMENTS, {
    idempotencyKey: KEY,
    ledger: ledger(),
  });

  assert.equal(response.success, true);
  assert.equal(d.broadcast_, 1);
});

/**
 * The ordering that makes a crash survivable: the record must be written before
 * the irreversible step, never after. If it were written after, a crash in
 * between would move funds with nothing to show for it, and the next run would
 * pay again.
 */
test("the record is written BEFORE the broadcast", async () => {
  const registry = new DriverRegistry(1);
  const d = driver();
  registry.register(d);

  const order: string[] = [];
  const l = ledger();
  const tracked: SettlementLedger = {
    ...l,
    record: async (k, e) => {
      order.push("record");
      await l.record(k, e);
    },
  };
  const broadcastingDriver: SettlementDriver = {
    ...d,
    broadcast: (p) => {
      order.push("broadcast");
      return d.broadcast(p);
    },
  };
  const r2 = new DriverRegistry(1);
  r2.register(broadcastingDriver);

  await r2.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: KEY, ledger: tracked });
  assert.deepEqual(order, ["record", "broadcast"]);
});

test("a failed record aborts before anything is broadcast", async () => {
  const registry = new DriverRegistry(1);
  const d = driver();
  registry.register(d);

  await assert.rejects(
    registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: KEY, ledger: ledger({ record: true }) }),
    /ledger unavailable/,
  );
  assert.equal(d.broadcast_, 0, "nothing may be broadcast once the record has failed");
});

/**
 * The case that motivated the redesign. A settled payout must never be reported
 * as a failure just because the follow-up bookkeeping did not land — the record
 * already carries the transaction, so safety is intact.
 */
test("a failed confirm does not turn a settled payout into an error", async () => {
  const registry = new DriverRegistry(1);
  const d = driver();
  registry.register(d);

  const response = await registry.settle(PAYLOAD, REQUIREMENTS, {
    idempotencyKey: KEY,
    ledger: ledger({ confirm: true }),
  });

  assert.equal(response.success, true, "the money moved, so the result is success");
  assert.equal(d.broadcast_, 1);
});

test("an unconfirmed attempt still blocks a re-pay", async () => {
  const registry = new DriverRegistry(1);
  const d = driver();
  registry.register(d);

  // A crash between broadcast and confirm leaves exactly this state.
  const l = ledger();
  await l.record(KEY, { status: "broadcasting", transaction: "0xmaybe" });

  const response = await registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: KEY, ledger: l });

  assert.equal(d.broadcast_, 0, "an unknown outcome must never be resolved by paying again");
  assert.equal(response.errorReason, "AUTH_ALREADY_USED");
  assert.equal(response.transaction, "0xmaybe", "and it hands back the hash to check");
});

test("a re-run settles nothing and reports already paid (I8)", async () => {
  const registry = new DriverRegistry(1);
  const d = driver();
  registry.register(d);
  const l = ledger();

  const first = await registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: KEY, ledger: l });
  const second = await registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: KEY, ledger: l });

  assert.equal(d.broadcast_, 1, "the rail must be reached exactly once");
  assert.equal(second.success, true, "a repeat is a success, never a failure");
  assert.equal(second.errorReason, "AUTH_ALREADY_USED");
  assert.equal(second.transaction, first.transaction, "and it reports the original transaction");
});

test("a different payout on the same PR is not blocked by the first receipt", async () => {
  const registry = new DriverRegistry(1);
  const d = driver();
  registry.register(d);
  const l = ledger();

  await registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: KEY, ledger: l });
  await registry.settle(PAYLOAD, REQUIREMENTS, {
    idempotencyKey: KEY.replace("0xdead", "0xbeef"),
    ledger: l,
  });

  assert.equal(d.broadcast_, 2);
});

test("a rail with native replay protection needs no ledger", async () => {
  const registry = new DriverRegistry(0);
  registry.register(driver({ nativeReplayProtection: true }));
  const response = await registry.settle(PAYLOAD, REQUIREMENTS);
  assert.equal(response.success, true);
});

/**
 * Semantics changed with write-ahead, deliberately.
 *
 * A broadcast that returns an error does NOT mean the transaction never landed:
 * the RPC may have accepted it and lost the response. Since the transaction was
 * already signed and recorded, "failed" and "succeeded but unreported" are
 * indistinguishable from here — so the record stands and a retry is blocked
 * until a human checks the hash and bumps `round`.
 *
 * The cost is that a transient RPC failure needs human intervention. The
 * alternative is auto-retrying a payout that may already have been made.
 */
test("a failed broadcast still leaves a record, because it may have landed", async () => {
  const registry = new DriverRegistry(1);
  const l = ledger();
  const failing: SettlementDriver = {
    ...driver(),
    broadcast: () => Promise.resolve({ success: false, errorReason: "RPC_UNAVAILABLE" }),
  };
  registry.register(failing);

  const response = await registry.settle(PAYLOAD, REQUIREMENTS, {
    idempotencyKey: KEY,
    ledger: l,
  });

  assert.equal(response.success, false);
  assert.equal(l.entries.size, 1, "the signed transaction was recorded before broadcasting");
  assert.equal(l.entries.get(KEY)?.status, "broadcasting", "and stays unconfirmed");

  // The record blocks an automatic retry — the outcome is genuinely unknown.
  const retry = await registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: KEY, ledger: l });
  assert.equal(retry.errorReason, "AUTH_ALREADY_USED");
});

test("a receipt under a legacy key spelling still blocks the re-pay, and new ones use the canonical key", async () => {
  const legacy = KEY.replace("|0xdead|", "|inline:0xdead|");
  const inner = ledger();
  inner.entries.set(legacy, { status: "settled", transaction: "0xold" });

  const registry = new DriverRegistry(0);
  const d = driver();
  registry.register(d);

  const repeat = await registry.settle(PAYLOAD, REQUIREMENTS, {
    idempotencyKey: KEY,
    ledger: withAliases(inner, [legacy]),
  });
  assert.equal(repeat.errorReason, "AUTH_ALREADY_USED");
  assert.equal(d.broadcast_, 0, "the legacy receipt must stop the second transfer");

  const fresh = ledger();
  await registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: KEY, ledger: withAliases(fresh, [legacy]) });
  assert.deepEqual([...fresh.entries.keys()], [KEY], "only the canonical key is ever written");
});
