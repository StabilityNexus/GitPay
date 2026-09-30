import assert from "node:assert/strict";
import test from "node:test";

import { canonical, keyFor } from "../../src/core/idempotency.js";
import { parseIntent } from "../../src/core/intent.js";
import type { PaymentPayload } from "../../src/core/types.js";
import { DriverRegistry } from "../../src/drivers/registry.js";
import { InlineAddressResolver, ResolverChain } from "../../src/resolvers/index.js";
import { MOCK_NETWORK, MockDriver } from "../drivers/mock/index.js";

const TREASURY = "treasury-account";
const CONTRIBUTOR = "contributor-account";

async function harness(amount = "2500000") {
  const intent = parseIntent({
    platform: "github",
    repo: "AOSSIE-Org/xops",
    ref: "pull/42",
    actor: "maintainer",
    recipient: CONTRIBUTOR,
    amount,
    asset: "USDC",
    network: MOCK_NETWORK,
    scheme: "exact",
    round: "0",
  });

  const driver = new MockDriver();
  const registry = new DriverRegistry(0);
  registry.register(driver);

  const resolvers = new ResolverChain([new InlineAddressResolver()]);
  const target = await resolvers.resolve(intent.recipient, { rail: intent.network });
  const idempotencyKey = canonical(keyFor(intent));
  const requirements = registry.buildRequirements({ intent, target, idempotencyKey });

  return { intent, driver, registry, target, idempotencyKey, requirements };
}

function tamper(payload: PaymentPayload, patch: Record<string, unknown>): PaymentPayload {
  const authorization = payload.payload["authorization"] as Record<string, unknown>;
  return {
    ...payload,
    payload: { ...payload.payload, authorization: { ...authorization, ...patch } },
  };
}

test("the mock driver settles end to end through the registry", async () => {
  const { driver, registry, requirements, target } = await harness();
  driver.fund(TREASURY, 10_000_000n);

  const payload = driver.authorize(TREASURY, requirements);

  const verified = await registry.verify(payload, requirements);
  assert.equal(verified.isValid, true);
  assert.equal(verified.payer, TREASURY);

  const settled = await registry.settle(payload, requirements);
  assert.equal(settled.success, true);
  assert.ok(settled.transaction);
  assert.equal(settled.errorReason, undefined);

  assert.equal(driver.balanceOf(target.address), 2_500_000n);
  assert.equal(driver.balanceOf(TREASURY), 7_500_000n);
});

test("I8: re-running identical inputs is a success with AUTH_ALREADY_USED", async () => {
  const { driver, registry, requirements, intent, target, idempotencyKey } = await harness();
  driver.fund(TREASURY, 10_000_000n);

  const first = await registry.settle(driver.authorize(TREASURY, requirements), requirements);
  assert.equal(first.success, true);

  // A workflow re-run rebuilds the same key, so the driver rebuilds the same nonce.
  const replayKey = canonical(keyFor(intent));
  assert.equal(replayKey, idempotencyKey);
  const replayRequirements = registry.buildRequirements({
    intent,
    target,
    idempotencyKey: replayKey,
  });

  const second = await registry.settle(
    driver.authorize(TREASURY, replayRequirements),
    replayRequirements,
  );

  assert.equal(second.success, true, "a consumed nonce is not a failure");
  assert.equal(second.errorReason, "AUTH_ALREADY_USED");
  assert.equal(second.transaction, first.transaction, "the original tx must be reported");
  assert.equal(driver.balanceOf(target.address), 2_500_000n, "the recipient is paid once");
});

test("a tampered recipient is caught before settlement", async () => {
  const { driver, registry, requirements } = await harness();
  driver.fund(TREASURY, 10_000_000n);

  const attacked = tamper(driver.authorize(TREASURY, requirements), { to: "attacker" });
  const verified = await registry.verify(attacked, requirements);

  assert.equal(verified.isValid, false);
  assert.equal(verified.reason, "RECIPIENT_MISMATCH");
});

test("a tampered amount is caught before settlement", async () => {
  const { driver, registry, requirements } = await harness();
  driver.fund(TREASURY, 10_000_000n);

  const attacked = tamper(driver.authorize(TREASURY, requirements), { value: "999999999" });
  const verified = await registry.verify(attacked, requirements);

  assert.equal(verified.isValid, false);
  assert.equal(verified.reason, "AMOUNT_MISMATCH");
});

test("a payload for another network never reaches the ledger", async () => {
  const { driver, registry, requirements } = await harness();
  const foreign = { ...driver.authorize(TREASURY, requirements), network: "eip155:84532" };

  const verified = await registry.verify(foreign, requirements);
  assert.equal(verified.reason, "DOMAIN_MISMATCH");
});

test("an unfunded treasury fails with INSUFFICIENT_BALANCE and moves nothing", async () => {
  const { driver, registry, requirements, target } = await harness();

  const settled = await registry.settle(driver.authorize(TREASURY, requirements), requirements);

  assert.equal(settled.success, false);
  assert.equal(settled.errorReason, "INSUFFICIENT_BALANCE");
  assert.equal(driver.balanceOf(target.address), 0n);
});

test("the requirements the core hands a driver carry no rail assumptions", async () => {
  const { requirements } = await harness();

  assert.deepEqual(Object.keys(requirements).sort(), [
    "amount",
    "asset",
    "extra",
    "maxTimeoutSeconds",
    "network",
    "payTo",
    "scheme",
  ]);
  assert.equal(typeof requirements.amount, "string");
});
