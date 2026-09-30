#!/usr/bin/env node
// I1 — nothing under these roots may import a chain library or name a chain
// primitive. The lint rule catches imports; this catches everything else.
//
// Usage: node scripts/check-boundary.mjs [roots...]

import { readFileSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, relative, resolve, extname } from "node:path";

const DEFAULT_ROOTS = ["src/core", "src/adapters", "src/resolvers"];
const EXTENSIONS = new Set([".ts", ".mts", ".cts", ".js", ".mjs", ".cjs", ".json"]);

const RULES = [
  {
    id: "chain-library-import",
    why: "chain libraries and payment SDKs belong to a driver",
    re: /\b(?:from|import(?:\s*\()?|require\s*\()\s*["'](?:ethers|viem|thirdweb|web3|ox|x402|bn\.js|elliptic|keccak|js-sha3|@ethersproject\/[^"']+|@noble\/[^"']+|@x402\/[^"']+|@scure\/[^"']+|@solana\/[^"']+)["']/,
  },
  {
    id: "driver-or-asset-import",
    why: "the boundary points one way: drivers may import core, never the reverse",
    re: /\b(?:from|import(?:\s*\()?|require\s*\()\s*["'][^"']*(?:\/drivers\/|\/assets\/|chains\.json)/,
  },
  {
    id: "hash-primitive",
    why: "hashing is a rail primitive",
    re: /\bkeccak_?256\b|\bsha3_\d+\b|\bsecp256k1\b|\bblake2b\b/i,
  },
  {
    id: "chain-primitive-type",
    why: "bytes32 and friends are rail types",
    re: /\bbytes32\b|\buint256\b/,
  },
  {
    id: "hex-address-literal",
    why: "token and treasury addresses live in the chain registry",
    re: /["']0x[0-9a-fA-F]{40}["']/,
  },
  {
    id: "chain-identity-literal",
    why: "core must never branch on a specific chain",
    re: /\beip155\b|\bchainId\b|\bverifyingContract\b|\bdomainSeparator\b/,
  },
  {
    id: "abi-encoding",
    why: "calldata encoding is driver work",
    re: /\bencodeFunctionData\b|\bencodeAbiParameters\b|\babiEncode\b|\btransferWithAuthorization\b/,
  },
  {
    id: "network-endpoint",
    why: "core and adapters make no rail network calls",
    re: /https?:\/\/[^\s"']*(?:rpc|infura|alchemy|quicknode|basescan|etherscan|facilitator)/i,
  },
];

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      await walk(path, out);
    } else if (EXTENSIONS.has(extname(entry.name))) {
      out.push(path);
    }
  }
  return out;
}

const roots = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ROOTS;
const violations = [];
let scanned = 0;

for (const root of roots) {
  const absolute = resolve(root);
  try {
    await stat(absolute);
  } catch {
    console.error(`boundary: root not found: ${root}`);
    process.exit(2);
  }

  for (const file of await walk(absolute)) {
    scanned += 1;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of RULES) {
        if (rule.re.test(line)) {
          violations.push({
            file: relative(process.cwd(), file),
            line: index + 1,
            rule: rule.id,
            why: rule.why,
            text: line.trim(),
          });
        }
      }
    });
  }
}

if (violations.length) {
  console.error(`I1 violated — ${violations.length} finding(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}] ${v.why}`);
    console.error(`    ${v.text}\n`);
  }
  console.error("Move this into a driver. See AGENTS.md — THE ONE RULE.");
  process.exit(1);
}

console.log(`I1 clean — ${scanned} file(s) across ${roots.join(", ")}`);
