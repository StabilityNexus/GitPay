import assert from "node:assert/strict";
import { test } from "node:test";

import { hasWriteAccess, maySpend } from "../../../src/adapters/github/permissions.js";

const ALLOWED = ["OWNER", "MEMBER", "COLLABORATOR"];
const REF = { repo: "acme/widgets", login: "someone", token: "t" };

/** Answers the permission endpoint with `permission`, or with a bare status. Records each URL. */
function github(reply: string | number): { fetch: typeof fetch; urls: string[] } {
  const urls: string[] = [];
  const fake = ((url: unknown) => {
    urls.push(String(url));
    return Promise.resolve(
      typeof reply === "number"
        ? new Response("{}", { status: reply })
        : new Response(JSON.stringify({ permission: reply })),
    );
  }) as typeof fetch;
  return { fetch: fake, urls };
}

test("an org member who cannot push here may not spend", async () => {
  // The finding this exists for: MEMBER is any member of the owning org.
  const api = github("read");
  assert.equal(await maySpend("MEMBER", ALLOWED, REF, api.fetch), false);
  assert.deepEqual(api.urls, ["https://api.github.com/repos/acme/widgets/collaborators/someone/permission"]);
});

test("a member or collaborator with write, maintain or admin may spend", async () => {
  // GitHub's `permission` reports maintain as write.
  assert.equal(await maySpend("MEMBER", ALLOWED, REF, github("write").fetch), true);
  assert.equal(await maySpend("collaborator", ALLOWED, REF, github("admin").fetch), true);
});

test("someone with no access at all is refused, not an error", async () => {
  assert.equal(await maySpend("MEMBER", ALLOWED, REF, github(404).fetch), false);
});

test("the owner needs no lookup, and an outsider never causes one", async () => {
  const api = github(500);
  assert.equal(await maySpend("OWNER", ALLOWED, REF, api.fetch), true);
  assert.equal(await maySpend("NONE", ALLOWED, REF, api.fetch), false);
  assert.equal(await maySpend(undefined, ALLOWED, REF, api.fetch), false);
  assert.equal(await maySpend("MEMBER", ["OWNER"], REF, api.fetch), false, "the allowlist still narrows");
  assert.deepEqual(api.urls, []);
});

test("GitHub failing to answer refuses the payout rather than guessing", async () => {
  await assert.rejects(maySpend("MEMBER", ALLOWED, REF, github(500).fetch), /GitHub API 500/);
  await assert.rejects(
    hasWriteAccess({ ...REF, token: "" }, github("write").fetch),
    /needs the "github_token" input/,
  );
});

test("the login is escaped into the URL", async () => {
  const api = github("write");
  await hasWriteAccess({ ...REF, login: "a/../b" }, api.fetch);
  assert.match(api.urls[0] ?? "", /collaborators\/a%2F\.\.%2Fb\/permission$/);
});
