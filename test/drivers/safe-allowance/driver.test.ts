import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { LedgerEntry, SettlementLedger } from "../../../src/core/ledger.js";
import type { PaymentPayload, PaymentRequirements } from "../../../src/core/types.js";
import { DriverRegistry } from "../../../src/drivers/registry.js";
import { SafeAllowanceDriver } from "../../../src/drivers/safe-allowance/driver.js";

const NETWORK = "eip155:11155111";
// Anvil / Hardhat test account #0. Public, and never funded on any real network.
const DELEGATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const driver = () =>
  new SafeAllowanceDriver({
    network: NETWORK,
    chainId: 11155111n,
    rpcUrl: "http://rpc.invalid",
    moduleAddress: "0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134",
    safeAddress: "0x5aFE3855358E112B5647B952709E6165e1c1eEEe",
    tokenAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    delegatePrivateKey: DELEGATE_KEY,
  });

const PAYLOAD: PaymentPayload = { x402Version: 2, scheme: "allowance", network: NETWORK, payload: {} };
const REQUIREMENTS: PaymentRequirements = {
  scheme: "allowance",
  network: NETWORK,
  amount: "2500000",
  asset: "USDC",
  payTo: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  maxTimeoutSeconds: 300,
};

type Reply = unknown | ((params: unknown[]) => unknown);

/** A fake JSON-RPC node. Records every method called, answers from `replies`. */
function fakeRpc(replies: Record<string, Reply>): string[] {
  const calls: string[] = [];
  globalThis.fetch = ((_url: unknown, init?: { body?: string }) => {
    const { method, params } = JSON.parse(init?.body ?? "{}") as { method: string; params: unknown[] };
    const key = method === "eth_getTransactionCount" ? `${method}:${String(params[1])}` : method;
    calls.push(key);
    const reply = replies[key];
    const body =
      reply === undefined
        ? { error: { message: `unexpected ${key}` } }
        : { result: typeof reply === "function" ? (reply as (p: unknown[]) => unknown)(params) : reply };
    return Promise.resolve(new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, ...body })));
  }) as typeof fetch;
  return calls;
}

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function memoryLedger(): SettlementLedger & { entries: Map<string, LedgerEntry> } {
  const entries = new Map<string, LedgerEntry>();
  return {
    id: "memory",
    entries,
    lookup: (key) => Promise.resolve(entries.get(key)),
    record: (key, entry) => {
      entries.set(key, entry);
      return Promise.resolve();
    },
    confirm: (key, entry) => {
      entries.set(key, entry);
      return Promise.resolve();
    },
  };
}

// --- verify(): offline, and rejects what cannot be a correct payout (I6) ---

test("verify rejects a mismatched network, recipient and amount, with no network call", async () => {
  const calls = fakeRpc({});
  const d = driver();

  const cases: [Partial<PaymentRequirements>, string][] = [
    [{ network: "eip155:1" }, "DOMAIN_MISMATCH"],
    [{ scheme: "exact" }, "DOMAIN_MISMATCH"],
    [{ payTo: "alice.eth" }, "RECIPIENT_MISMATCH"],
    [{ payTo: "0x70997970C51812dc3A010C7d01b50e0d17dc79C" }, "RECIPIENT_MISMATCH"],
    [{ amount: "0" }, "AMOUNT_MISMATCH"],
    [{ amount: "2.5" }, "AMOUNT_MISMATCH"],
    [{ amount: "-1" }, "AMOUNT_MISMATCH"],
  ];

  for (const [override, reason] of cases) {
    const result = await d.verify(PAYLOAD, { ...REQUIREMENTS, ...override });
    assert.deepEqual(
      { isValid: result.isValid, reason: result.reason },
      { isValid: false, reason },
      JSON.stringify(override),
    );
  }

  const ok = await d.verify(PAYLOAD, REQUIREMENTS);
  assert.equal(ok.isValid, true, "the unmodified requirements are valid");
  assert.deepEqual(calls, [], "verify must not touch the network");
});

// --- a second in-flight delegate transaction is refused, not queued ---

test("a payout is refused while another delegate transaction is in flight, before anything is recorded", async () => {
  const calls = fakeRpc({
    "eth_getTransactionCount:pending": "0x8",
    "eth_getTransactionCount:latest": "0x7",
    eth_gasPrice: "0x3b9aca00",
    eth_maxPriorityFeePerGas: "0x59682f00",
  });
  const registry = new DriverRegistry(1);
  registry.register(driver());
  const ledger = memoryLedger();

  await assert.rejects(
    registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: "k", ledger }),
    (err: Error & { code?: string }) => {
      assert.equal(err.code, "RPC_UNAVAILABLE");
      assert.match(err.message, /in flight/);
      assert.match(err.message, /nonce 7/, "names the nonce a human has to clear");
      return true;
    },
  );

  assert.equal(ledger.entries.size, 0, "nothing is recorded, so a later run is not blocked");
  assert.ok(!calls.includes("eth_call"), "not even simulated");
  assert.ok(!calls.includes("eth_sendRawTransaction"), "never broadcast");
});

test("with nothing in flight the same payout proceeds to broadcast", async () => {
  let polled = "";
  const calls = fakeRpc({
    "eth_getTransactionCount:pending": "0x7",
    "eth_getTransactionCount:latest": "0x7",
    eth_gasPrice: "0x3b9aca00",
    eth_maxPriorityFeePerGas: "0x59682f00",
    eth_call: "0x",
    eth_estimateGas: "0x186a0",
    eth_sendRawTransaction: "0x",
    eth_getTransactionReceipt: ([hash]: unknown[]) => {
      polled = String(hash);
      return { status: "0x1" };
    },
  });

  const registry = new DriverRegistry(1);
  registry.register(driver());
  const ledger = memoryLedger();

  const response = await registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: "k", ledger });

  assert.equal(response.success, true);
  assert.ok(calls.includes("eth_sendRawTransaction"));
  assert.equal(ledger.entries.get("k")?.status, "settled");
  assert.equal(ledger.entries.get("k")?.transaction, polled, "the recorded hash is the one polled");
});
