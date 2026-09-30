import assert from "node:assert/strict";
import test from "node:test";

import { XOpsError } from "../../src/core/errors.js";
import { DriverRegistry } from "../../src/drivers/registry.js";
import {
  MOCK_NETWORK,
  MOCK_SCHEME,
  MockDriver,
  custodialDriver,
  noReplayDriver,
  secretDriver,
} from "./mock/index.js";

function requirements() {
  return {
    scheme: MOCK_SCHEME,
    network: MOCK_NETWORK,
    amount: "1",
    asset: "USDC",
    payTo: "recipient-1",
    maxTimeoutSeconds: 900,
    extra: { nonce: "mock-nonce:x" },
  };
}

test("a Tier 0 driver registers and resolves by (network x scheme)", () => {
  const registry = new DriverRegistry(0);
  const driver = new MockDriver();
  registry.register(driver);

  assert.equal(registry.resolve(MOCK_NETWORK, MOCK_SCHEME), driver);
});

test("I3: a custodial driver throws at tier-0 registration", () => {
  const registry = new DriverRegistry(0);

  assert.throws(
    () => registry.register(custodialDriver()),
    (err: unknown) => {
      assert.ok(err instanceof XOpsError);
      assert.equal(err.code, "TIER_VIOLATION");
      assert.match(err.message, /takes custody of funds and cannot run in-process/);
      assert.match(err.message, /mode: facilitator/);
      return true;
    },
  );
  assert.equal(registry.list().length, 0);
});

test("I3: a driver needing a secret also throws at tier-0 registration", () => {
  const registry = new DriverRegistry(0);
  assert.throws(() => registry.register(secretDriver()), { code: "TIER_VIOLATION" });
});

test("I3 is a tier rule, not a ban — Tier 2 may run a custodial driver", () => {
  const registry = new DriverRegistry(2);
  registry.register(custodialDriver());
  assert.equal(registry.list().length, 1);
});

test("I9: a driver without native replay protection refuses to settle", async () => {
  const registry = new DriverRegistry(0);
  const driver = noReplayDriver();
  registry.register(driver);

  const payload = driver.authorize("payer-1", requirements());

  await assert.rejects(registry.settle(payload, requirements()), {
    code: "NO_REPLAY_PROTECTION",
  });
  assert.equal(driver.settleCalls, 0, "the driver must never be reached");
});

test("an unresolvable pair fails with DRIVER_NOT_FOUND, not a crash", () => {
  const registry = new DriverRegistry(0);
  registry.register(new MockDriver());

  assert.throws(() => registry.resolve("eip155:84532", "exact"), { code: "DRIVER_NOT_FOUND" });
});

test("registering the same driver id twice is a programming error", () => {
  const registry = new DriverRegistry(0);
  registry.register(new MockDriver());
  assert.throws(() => registry.register(new MockDriver()), /already registered/);
});
