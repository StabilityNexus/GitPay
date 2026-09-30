#!/usr/bin/env node
// `node --test` accepts glob patterns only on Node 22+ and directory arguments
// inconsistently across platforms. CI runs Node 20 to match the action runtime,
// so enumerate the compiled test files and hand them over explicitly.

import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const ROOT = resolve("build/test");

async function collect(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(path, out);
    else if (entry.name.endsWith(".test.js")) out.push(path);
  }
  return out;
}

const files = (await collect(ROOT)).sort();
if (files.length === 0) {
  console.error(`No compiled test files under ${ROOT}. Run 'npm run compile' first.`);
  process.exit(1);
}

const run = spawnSync(process.execPath, ["--test", ...process.argv.slice(2), ...files], {
  stdio: "inherit",
});

process.exit(run.status ?? 1);
