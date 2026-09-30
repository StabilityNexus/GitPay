#!/usr/bin/env node
// I11 — core runtime dependencies stay at or below two packages.
// Week 1 expects zero: if the boundary is right, nothing needs a crypto library yet.

import { execFileSync } from "node:child_process";

const LIMIT = Number(process.env["XOPS_DEP_LIMIT"] ?? 2);

const raw = execFileSync("npm", ["ls", "--omit=dev", "--all", "--json"], {
  encoding: "utf8",
  shell: process.platform === "win32",
  stdio: ["ignore", "pipe", "ignore"],
});

const names = new Set();
(function collect(node) {
  for (const [name, child] of Object.entries(node.dependencies ?? {})) {
    names.add(name);
    collect(child);
  }
})(JSON.parse(raw));

const count = names.size;
console.log(`runtime dependencies: ${count} (limit ${LIMIT})`);
for (const name of [...names].sort()) console.log(`  ${name}`);

if (count > LIMIT) {
  console.error(`\nI11 violated: ${count} runtime dependencies exceeds the limit of ${LIMIT}.`);
  process.exit(1);
}
