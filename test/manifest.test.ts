import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { DEFAULT_MAINTAINER_ASSOCIATIONS } from "../src/adapters/github/trigger.js";
import { DEFAULT_SETTLEMENT_ENABLED, SUPPORTED_SETTLEMENT_MODES } from "../src/core/defaults.js";
import { canonicalNetwork, lookupChain } from "../src/drivers/chains.js";
import { SAFE_ALLOWANCE_SCHEME } from "../src/drivers/safe-allowance/driver.js";

/**
 * Guards the class of defect that unit tests structurally cannot see: the
 * manifest and the code disagreeing.
 *
 * Both real-run failures were of this kind. `scheme` defaulted to "exact" with
 * no driver behind it, so the default configuration could never settle; and
 * `repo`/`ref`/`actor` were read by main.ts while undeclared, which produced an
 * "Unexpected input(s)" warning. Every unit test passes inputs explicitly, so
 * nothing exercised the defaults or the declarations until a real invocation
 * did.
 */

const manifest = readFileSync(join(process.cwd(), "action.yml"), "utf8");

/** action.yml is simple and hand-written; a real YAML parser is not worth a dependency. */
function inputs(): Map<string, { default?: string }> {
  const section = manifest.slice(manifest.indexOf("\ninputs:"), manifest.indexOf("\noutputs:"));
  const found = new Map<string, { default?: string }>();
  let current: string | undefined;

  for (const line of section.split(/\r?\n/)) {
    const name = /^ {2}([a-z_]+):\s*$/.exec(line);
    if (name?.[1]) {
      current = name[1];
      found.set(current, {});
      continue;
    }
    const value = /^ {4}default:\s*"?([^"\n]*)"?\s*$/.exec(line);
    if (value && current) found.set(current, { default: value[1] });
  }
  return found;
}

test("the default scheme is one an installed driver actually supports", () => {
  const scheme = inputs().get("scheme")?.default;
  assert.equal(
    scheme,
    SAFE_ALLOWANCE_SCHEME,
    `action.yml defaults scheme to "${scheme}" but the only driver supports ` +
      `"${SAFE_ALLOWANCE_SCHEME}". A default with no driver behind it fails every ` +
      "real settlement with DRIVER_NOT_FOUND while every unit test passes.",
  );
});

test("the default network is the one AGENTS.md mandates", () => {
  // AllowanceModule is deployed on Ethereum Sepolia and absent from Base Sepolia.
  assert.equal(inputs().get("network")?.default, "eip155:11155111");
});

test("the default network is in the chain registry", () => {
  // Otherwise the out-of-the-box configuration derives nothing, and a workflow
  // that omits chain_id and allowance_module — as the documented setup now
  // does — fails at the first real settlement rather than at parse time.
  const network = inputs().get("network")?.default;
  assert.ok(network, "network must have a default");
  assert.ok(
    lookupChain(canonicalNetwork(network)),
    `action.yml defaults network to "${network}", which the chain registry does not know`,
  );
});

test("inputs derived from the network carry no manifest default", () => {
  // A declared default arrives as the input's value, so it would win over the
  // registry in `input(name) ?? chain?.…` and quietly disable derivation. These
  // three must stay absent-unless-set.
  const declared = inputs();
  for (const name of ["chain_id", "allowance_module", "explorer_url"]) {
    assert.ok(declared.has(name), `${name} should be declared`);
    assert.equal(
      declared.get(name)?.default,
      undefined,
      `${name} is derived from network; a default here would override the chain registry`,
    );
  }
});

test("the declared allowlist default matches the one the code ships", () => {
  assert.equal(
    inputs().get("allowed_associations")?.default,
    DEFAULT_MAINTAINER_ASSOCIATIONS.join(","),
    "the manifest advertises one set of maintainers and parseAssociations falls back to another",
  );
});

test("the kill switch defaults to on, and only the string \"false\" turns it off", () => {
  // main.ts compares against "false" rather than parsing a boolean, so that a
  // typo or an unset repository variable cannot silently disable payouts.
  assert.equal(inputs().get("enabled")?.default, String(DEFAULT_SETTLEMENT_ENABLED));
});

test("max_per_payout has no default, so no cap is invented", () => {
  // A default cap would refuse payouts nobody configured a limit for, and the
  // Safe's allowance period cap is the real ceiling either way.
  assert.ok(inputs().has("max_per_payout"));
  assert.equal(inputs().get("max_per_payout")?.default, undefined);
});

test("every input main.ts reads is declared in action.yml", () => {
  const main = readFileSync(join(process.cwd(), "src/main.ts"), "utf8");
  const read = new Set(
    // Also the helpers that read an input by name. Matching `input("x")` alone
    // missed every input reached through `required()` — which is most of the
    // settlement configuration — so the check silently covered a shrinking set.
    [...main.matchAll(/\b(?:input|required|derived)\(\s*"([a-z_]+)"/g)].map(
      (m) => m[1] as string,
    ),
  );
  const declared = inputs();

  const undeclared = [...read].filter((name) => !declared.has(name));
  assert.deepEqual(
    undeclared,
    [],
    `main.ts reads ${undeclared.join(", ")} but action.yml does not declare them. ` +
      "Undeclared inputs still work, but Actions warns on every run and the " +
      "contract is invisible to anyone reading the manifest.",
  );
});

test("declared inputs are readable as blank without breaking fallbacks", () => {
  // A declared input a workflow omits arrives as "", not absent. readInput turns
  // that back into undefined; this asserts the manifest does not rely on some
  // other mechanism.
  const declared = inputs();
  for (const optional of ["repo", "ref", "actor", "comment"]) {
    assert.ok(declared.has(optional), `${optional} should be declared`);
    assert.equal(declared.get(optional)?.default, undefined, `${optional} should have no default`);
  }
});

// --- The published input schema (schema/action-inputs.v1.schema.json) ---

interface Property {
  type: string;
  pattern?: string;
  enum?: string[];
  default?: string;
}

const schema = JSON.parse(
  readFileSync(join(process.cwd(), "schema", "action-inputs.v1.schema.json"), "utf8"),
) as { additionalProperties: boolean; properties: Record<string, Property> };

/** Only the keywords this schema uses. A full validator is not worth a dependency. */
function accepts(property: Property, value: string): boolean {
  if (property.enum && !property.enum.includes(value)) return false;
  if (property.pattern && !new RegExp(property.pattern).test(value)) return false;
  return true;
}

test("the schema describes exactly the inputs action.yml declares", () => {
  const declared = [...inputs().keys()].sort();
  const described = Object.keys(schema.properties).sort();
  assert.deepEqual(described, declared, "schema and action.yml have drifted apart");
  assert.equal(schema.additionalProperties, false, "an unknown input must not validate");
});

test("every schema default is action.yml's default, and passes its own schema", () => {
  for (const [name, { default: declared }] of inputs()) {
    const property = schema.properties[name] as Property;
    assert.equal(property.default, declared, `${name}: default differs from action.yml`);
    if (declared !== undefined) {
      assert.ok(accepts(property, declared), `${name}: action.yml default "${declared}" fails the schema`);
    }
  }
});

test("the schema's closed sets are the code's closed sets", () => {
  assert.deepEqual(schema.properties["mode"]?.enum, [...SUPPORTED_SETTLEMENT_MODES]);
  assert.deepEqual(schema.properties["scheme"]?.enum, [SAFE_ALLOWANCE_SCHEME]);
});

test("the schema accepts a real configuration and refuses the mistakes that cost money", () => {
  const p = (name: string) => schema.properties[name] as Property;

  // The demo repo's configuration, as GitHub resolves it.
  assert.ok(accepts(p("network"), "sepolia"));
  assert.ok(accepts(p("network"), "eip155:11155111"));
  assert.ok(accepts(p("ref"), "refs/pull/3"));
  assert.ok(accepts(p("max_per_payout"), "5"));
  assert.ok(accepts(p("allowed_associations"), "OWNER, MEMBER,COLLABORATOR"));
  assert.ok(accepts(p("safe"), "0x5b7d5882058e001c5502cbf5c2497ec5da54e6e2"));

  assert.ok(!accepts(p("mode"), "dryrun"), "a mistyped mode must not validate (I5)");
  assert.ok(!accepts(p("amount"), "2.5"), "amount is atomic units, never a decimal");
  assert.ok(!accepts(p("max_per_payout"), "5 USDC"));
  assert.ok(!accepts(p("enabled"), "no"), "the kill switch takes only true or false");
  assert.ok(!accepts(p("asset"), "US DC"), "whitespace would break the idempotency key");
  assert.ok(!accepts(p("ref"), "refs/pull/1|x"), "a delimiter would break the idempotency key");
});
