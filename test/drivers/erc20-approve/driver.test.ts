import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { LedgerEntry, SettlementLedger } from "../../../src/core/ledger.js";
import type { PaymentPayload, PaymentRequirements } from "../../../src/core/types.js";
import { encodeTransferFrom } from "../../../src/drivers/erc20-approve/abi.js";
import { Erc20ApproveDriver } from "../../../src/drivers/erc20-approve/driver.js";
import { DriverRegistry } from "../../../src/drivers/registry.js";

const NETWORK = "eip155:11155111";
// Anvil / Hardhat test account #0. Public, and never funded on any real network.
const DELEGATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const DELEGATE = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const PAYER = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const TOKEN = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const driver = (payerAddress = PAYER) =>
  new Erc20ApproveDriver({
    network: NETWORK,
    chainId: 11155111n,
    rpcUrl: "http://rpc.invalid",
    payerAddress,
    tokenAddress: TOKEN,
    delegatePrivateKey: DELEGATE_KEY,
  });

const PAYLOAD: PaymentPayload = { x402Version: 2, scheme: "approve", network: NETWORK, payload: {} };
const REQUIREMENTS: PaymentRequirements = {
  scheme: "approve",
  network: NETWORK,
  amount: "2500000",
  asset: "USDC",
  payTo: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  maxTimeoutSeconds: 300,
};

type Reply = unknown | ((params: unknown[]) => unknown);

/** A fake JSON-RPC node. Records every method called, answers from `replies`. */
function fakeRpc(replies: Record<string, Reply>): { method: string; params: unknown[] }[] {
  const calls: { method: string; params: unknown[] }[] = [];
  globalThis.fetch = ((_url: unknown, init?: { body?: string }) => {
    const { method, params } = JSON.parse(init?.body ?? "{}") as { method: string; params: unknown[] };
    const key = method === "eth_getTransactionCount" ? `${method}:${String(params[1])}` : method;
    calls.push({ method: key, params });
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

const HEALTHY = {
  "eth_getTransactionCount:pending": "0x3",
  "eth_getTransactionCount:latest": "0x3",
  eth_gasPrice: "0x3b9aca00",
  eth_maxPriorityFeePerGas: "0x59682f00",
  eth_estimateGas: "0xea60",
  eth_sendRawTransaction: "0x",
  eth_getTransactionReceipt: { status: "0x1" },
};

// --- construction ---

test("a delegate key that controls the payer itself is refused", () => {
  // That is the payout wallet's own key in CI, with nothing on-chain bounding it.
  assert.throws(() => driver(DELEGATE), /controls the payer/);
  assert.throws(() => driver(DELEGATE.toLowerCase()), /controls the payer/, "case-insensitively");
});

test("I3: needing the delegate key, it cannot register at tier 0", () => {
  assert.throws(() => new DriverRegistry(0).register(driver()), { code: "TIER_VIOLATION" });
  new DriverRegistry(1).register(driver());
});

test("it resolves only for its own scheme, so a Safe workflow never reaches it", () => {
  const d = driver();
  assert.equal(d.supports(NETWORK, "approve"), true);
  assert.equal(d.supports(NETWORK, "allowance"), false);
  assert.equal(d.supports("eip155:1", "approve"), false);
});

// --- verify(): offline (I6) ---

test("verify rejects a mismatched network, recipient and amount, with no network call", async () => {
  const calls = fakeRpc({});
  const d = driver();

  const cases: [Partial<PaymentRequirements>, string][] = [
    [{ network: "eip155:1" }, "DOMAIN_MISMATCH"],
    [{ scheme: "allowance" }, "DOMAIN_MISMATCH"],
    [{ payTo: "alice.eth" }, "RECIPIENT_MISMATCH"],
    [{ amount: "0" }, "AMOUNT_MISMATCH"],
    [{ amount: "2.5" }, "AMOUNT_MISMATCH"],
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
  assert.deepEqual({ isValid: ok.isValid, payer: ok.payer }, { isValid: true, payer: PAYER });
  assert.deepEqual(calls, [], "verify must not touch the network");
});

// --- settlement ---

test("it calls transferFrom(payer, recipient, amount) on the token, from the delegate", async () => {
  const calls = fakeRpc({ ...HEALTHY, eth_call: `0x${"1".padStart(64, "0")}` });
  const registry = new DriverRegistry(1);
  registry.register(driver());
  const ledger = memoryLedger();

  const response = await registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: "k", ledger });

  assert.equal(response.success, true);
  const simulated = calls.find((c) => c.method === "eth_call")?.params[0] as Record<string, string>;
  assert.equal(simulated["to"], TOKEN, "the token is called, not a module");
  assert.equal(simulated["from"]?.toLowerCase(), DELEGATE.toLowerCase());
  assert.equal(
    simulated["data"],
    encodeTransferFrom({ from: PAYER, to: REQUIREMENTS.payTo, amount: REQUIREMENTS.amount }),
  );
  assert.equal(ledger.entries.get("k")?.status, "settled");
});

test("a token that returns no data is accepted, as every ERC-20 library accepts it", async () => {
  fakeRpc({ ...HEALTHY, eth_call: "0x", eth_getCode: "0x6080" });
  const registry = new DriverRegistry(1);
  registry.register(driver());

  const response = await registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: "k", ledger: memoryLedger() });
  assert.equal(response.success, true);
});

test("a token address with no contract code is refused, not recorded as a settled no-op", async () => {
  // eth_call to an address with no code succeeds with empty data, exactly like
  // a no-return token. Without this check the transaction mines with status 1
  // and the ledger says paid while nothing moved.
  const calls = fakeRpc({ ...HEALTHY, eth_call: "0x", eth_getCode: "0x" });
  const registry = new DriverRegistry(1);
  registry.register(driver());
  const ledger = memoryLedger();

  await assert.rejects(
    registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: "k", ledger }),
    (err: Error & { code?: string }) => {
      assert.equal(err.code, "SIMULATION_REVERT");
      assert.match(err.message, /no contract code/);
      return true;
    },
  );
  assert.equal(ledger.entries.size, 0, "nothing recorded, so a corrected run can still pay");
  assert.ok(!calls.some((c) => c.method === "eth_sendRawTransaction"));
});

test("a transfer the token refuses by returning false is stopped before anything is recorded", async () => {
  const calls = fakeRpc({ ...HEALTHY, eth_call: `0x${"0".repeat(64)}` });
  const registry = new DriverRegistry(1);
  registry.register(driver());
  const ledger = memoryLedger();

  await assert.rejects(
    registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: "k", ledger }),
    (err: Error & { code?: string }) => {
      assert.equal(err.code, "SIMULATION_REVERT");
      assert.match(err.message, /returned false/);
      return true;
    },
  );
  assert.equal(ledger.entries.size, 0, "a mined no-op would otherwise read as a settled payout");
  assert.ok(!calls.some((c) => c.method === "eth_sendRawTransaction"));
});

test("a spent or missing approval reverts in simulation, before anything is recorded", async () => {
  // A node that answers everything but rejects the simulation, as one does
  // when the allowance is spent or was never granted.
  const calls: { method: string; params: unknown[] }[] = [];
  globalThis.fetch = ((_url: unknown, init?: { body?: string }) => {
    const { method, params } = JSON.parse(init?.body ?? "{}") as { method: string; params: unknown[] };
    const key = method === "eth_getTransactionCount" ? `${method}:${String(params[1])}` : method;
    calls.push({ method: key, params });
    const body =
      key === "eth_call"
        ? { error: { message: "execution reverted: ERC20: transfer amount exceeds allowance" } }
        : { result: (HEALTHY as Record<string, unknown>)[key] };
    return Promise.resolve(new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, ...body })));
  }) as typeof fetch;

  const registry = new DriverRegistry(1);
  registry.register(driver());
  const ledger = memoryLedger();

  await assert.rejects(registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: "k", ledger }), {
    code: "SIMULATION_REVERT",
  });
  assert.equal(ledger.entries.size, 0);
  assert.ok(!calls.some((c) => c.method === "eth_sendRawTransaction"));
});

test("I9 + I8: a recorded payout is not paid again, and the rail is never touched", async () => {
  // transferFrom has no nonce, so the ledger is the only thing standing
  // between a re-run and a second transfer.
  const calls = fakeRpc({});
  const registry = new DriverRegistry(1);
  registry.register(driver());
  const ledger = memoryLedger();
  ledger.entries.set("k", { status: "settled", transaction: "0xabc" });

  const response = await registry.settle(PAYLOAD, REQUIREMENTS, { idempotencyKey: "k", ledger });

  assert.deepEqual(response, {
    success: true,
    network: NETWORK,
    transaction: "0xabc",
    errorReason: "AUTH_ALREADY_USED",
  });
  assert.deepEqual(calls, []);

  await assert.rejects(registry.settle(PAYLOAD, REQUIREMENTS), { code: "NO_REPLAY_PROTECTION" });
});
