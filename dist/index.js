import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
/******/ var __webpack_modules__ = ({});
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/create fake namespace object */
/******/ (() => {
/******/ 	var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 	var leafPrototypes;
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 16: return value when it's Promise-like
/******/ 	// mode & 8|1: behave like require
/******/ 	__nccwpck_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = this(value);
/******/ 		if(mode & 8) return value;
/******/ 		if(typeof value === 'object' && value) {
/******/ 			if((mode & 4) && value.__esModule) return value;
/******/ 			if((mode & 16) && typeof value.then === 'function') return value;
/******/ 		}
/******/ 		var ns = Object.create(null);
/******/ 		__nccwpck_require__.r(ns);
/******/ 		var def = {};
/******/ 		leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 		for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 			Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 		}
/******/ 		def['default'] = () => (value);
/******/ 		__nccwpck_require__.d(ns, def);
/******/ 		return ns;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__nccwpck_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__nccwpck_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/adapters/github/inputs.ts
/**
 * Reads a GitHub Actions input.
 *
 * The empty-string handling is the whole point. A *declared* input that a
 * workflow does not pass arrives as `INPUT_NAME=""`, not as absent. So
 * `input("repo") ?? process.env.GITHUB_REPOSITORY` silently yields `""` —
 * `??` only falls through on null and undefined — and every downstream
 * fallback and default is defeated by a value that looks present.
 *
 * Treating blank as absent is what callers actually mean, and it makes
 * declaring an input a safe, behaviour-preserving change.
 */
function readInput(name) {
    const value = process.env[`INPUT_${name.toUpperCase().replace(/ /g, "_")}`];
    if (value === undefined)
        return undefined;
    return value.trim() === "" ? undefined : value;
}

;// CONCATENATED MODULE: external "node:fs"
const external_node_fs_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:fs");
;// CONCATENATED MODULE: external "node:crypto"
const external_node_crypto_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:crypto");
var external_node_crypto_namespaceObject_0 = /*#__PURE__*/__nccwpck_require__.t(external_node_crypto_namespaceObject, 2);
;// CONCATENATED MODULE: ./src/adapters/github/outputs.ts


/**
 * Written on every path, including failures. The delimiter is random per call so
 * a value containing a newline cannot forge another output.
 */
function writeOutputs(values) {
    const file = process.env["GITHUB_OUTPUT"];
    if (!file)
        return;
    const delimiter = `GITPAY_EOF_${(0,external_node_crypto_namespaceObject.randomUUID)()}`;
    let block = "";
    for (const [name, value] of Object.entries(values)) {
        block += `${name}<<${delimiter}\n${value ?? ""}\n${delimiter}\n`;
    }
    if (block)
        (0,external_node_fs_namespaceObject.appendFileSync)(file, block, "utf8");
}

;// CONCATENATED MODULE: ./src/adapters/github/receipts.ts
/**
 * The PR conversation is the ledger.
 *
 * GitPay is an artifact, not a service — there is no server to keep state in, so
 * the durable record of "this payout already happened" lives where the payout
 * was requested: as a receipt comment on the pull request. A later run finds it
 * by the canonical idempotency key and settles nothing.
 *
 * The key is carried in an HTML comment so it is exact and machine-readable,
 * while the visible body stays legible to whoever reads the thread.
 */
// Keeps the pre-rename spelling on purpose. It is how existing receipts are
// found, so renaming it would hide every past payout and allow it to be paid
// again.
const MARKER = "xops-receipt";
const MARKER_PATTERN = new RegExp(`<!--\\s*${MARKER}:v1\\s+([^>]*?)\\s*-->`);
/** Shortens an address for display without losing either end. */
function shorten(value) {
    return value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}
function receipts_link(base, kind, value) {
    const label = `\`${shorten(value)}\``;
    if (!base)
        return label;
    return `[${label}](${base.replace(/\/+$/, "")}/${kind}/${value})`;
}
const SHARE = "https://github.com/StabilityNexus/GitPay";
const FOOTER = `<sub>Paid automatically by [GitPay](${SHARE}) — open source, runs in your own CI, ` +
    `never custodies your funds. ` +
    `[Share on X](https://x.com/intent/post?text=${encodeURIComponent("Paying open-source contributors straight from a merged PR with GitPay")}&url=${SHARE}) · ` +
    `[Mastodon](https://mastodon.social/share?text=${encodeURIComponent(`GitPay — ${SHARE}`)}) · ` +
    `[Reddit](https://reddit.com/submit?url=${SHARE}) · ` +
    `[LinkedIn](https://www.linkedin.com/sharing/share-offsite/?url=${SHARE})</sub>`;
/**
 * The visible body is presentation and may be rewritten freely. Everything
 * `findReceipt` relies on lives in the HTML marker, so a reformat can never
 * break idempotency — which is why the transaction is no longer parsed out of
 * the prose.
 */
function formatReceipt(receipt, context = {}) {
    const broadcasting = receipt.status === "broadcasting";
    const explorer = context.explorerUrl;
    const marker = [
        `<!-- ${MARKER}:v1`,
        `key=${receipt.key}`,
        `status=${receipt.status}`,
        ...(receipt.transaction ? [`tx=${receipt.transaction}`] : []),
        "-->",
    ].join(" ");
    const headline = context.amount && context.asset && context.to
        ? `**${context.amount} ${context.asset}** → ${receipts_link(explorer, "address", context.to)}`
        : undefined;
    const rows = [];
    if (context.from)
        rows.push(["From", `Safe ${receipts_link(explorer, "address", context.from)}`]);
    if (context.actor)
        rows.push(["Authorized by", `@${context.actor}`]);
    if (context.network)
        rows.push(["Network", `\`${context.network}\``]);
    if (receipt.transaction) {
        rows.push(["Transaction", receipts_link(explorer, "tx", receipt.transaction)]);
    }
    if (receipt.settledAt)
        rows.push(["Settled", receipt.settledAt.replace("T", " ").slice(0, 19) + " UTC"]);
    const lines = [
        marker,
        `### GitPay — payout ${broadcasting ? "broadcasting" : "settled"}`,
        "",
        ...(headline ? [headline, ""] : []),
        ...(rows.length ? ["| | |", "|---|---|", ...rows.map(([k, v]) => `| ${k} | ${v} |`), ""] : []),
        broadcasting
            ? "Written **before** broadcasting, so this transaction may not have landed yet. " +
                "If it never does, re-run with `round` bumped to pay again deliberately — GitPay " +
                "will not decide that for you, because paying twice cannot be undone."
            : "Re-running this payout settles nothing — this receipt is its idempotency record.",
        "",
        FOOTER,
    ];
    return lines.join("\n");
}
/** Fields from the receipt marker. Empty when the body is not a receipt. */
function parseMarker(body) {
    const inner = MARKER_PATTERN.exec(body)?.[1];
    if (!inner)
        return {};
    const fields = {};
    for (const pair of inner.trim().split(/\s+/)) {
        const eq = pair.indexOf("=");
        if (eq > 0)
            fields[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
    return fields;
}
/** The key a receipt comment carries, or undefined if the body is not a receipt. */
function parseReceiptKey(body) {
    return parseMarker(body)["key"];
}
/**
 * Only receipts written by the automation or by someone who can already spend
 * the project's money are believed.
 *
 * A forged receipt withholds a payment rather than causing one, so this is
 * griefing protection rather than theft protection — but a contributor should
 * not be able to block someone else's payout with a comment.
 */
const TRUSTED_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
function isTrustedReceiptAuthor(comment) {
    if ((comment.user?.type ?? "") === "Bot")
        return true;
    return TRUSTED_ASSOCIATIONS.has((comment.author_association ?? "").toUpperCase());
}
/** Finds a trusted receipt for `key` among comments. Pure, so it is testable. */
/** Fallback for receipts written before the marker carried the transaction. */
const LEGACY_TRANSACTION = /^- Transaction: `([^`]+)`/m;
/**
 * A settled payout leaves two comments — the pre-broadcast record and the
 * confirmation. Both carry the same key, so the whole thread is scanned and the
 * strongest status wins. Returning the first match would report a completed
 * payout as still broadcasting, which is safe but wrong, and would send someone
 * to a block explorer for no reason.
 */
function findReceipt(comments, key) {
    let found;
    for (const comment of comments) {
        const body = comment.body ?? "";
        const marker = parseMarker(body);
        if (marker["key"] !== key)
            continue;
        if (!isTrustedReceiptAuthor(comment))
            continue;
        const transaction = marker["tx"] ?? LEGACY_TRANSACTION.exec(body)?.[1];
        // The prose is read only for legacy receipts whose marker carries no
        // status. An explicit status always wins, since the prose can say anything.
        const status = marker["status"] ?? (body.includes("payout settled") ? "settled" : undefined);
        const receipt = {
            key,
            // An unconfirmed record still blocks a re-pay. Reading it as anything
            // weaker would reintroduce the double-payment window it exists to close.
            // Anything that is not explicitly settled is treated as in-flight.
            status: status === "settled" ? "settled" : "broadcasting",
            ...(transaction === undefined ? {} : { transaction }),
        };
        if (receipt.status === "settled")
            return receipt;
        found ??= receipt;
    }
    return found;
}
async function githubJson(url, token) {
    const response = await fetch(url, {
        headers: {
            accept: "application/vnd.github+json",
            authorization: `Bearer ${token}`,
            "x-github-api-version": "2022-11-28",
            "user-agent": "gitpay",
        },
    });
    if (!response.ok) {
        throw new Error(`GitHub API ${response.status} for ${url}`);
    }
    return (await response.json());
}
/**
 * A ledger backed by the PR's comments.
 *
 * `lookup` pages through every comment: a receipt buried under later discussion
 * still has to be found, because missing it means paying twice.
 */
class PullRequestReceiptLedger {
    id = "github-pr-receipt";
    ref;
    constructor(ref) {
        this.ref = ref;
    }
    base() {
        const api = this.ref.apiBase ?? "https://api.github.com";
        return `${api}/repos/${this.ref.repo}/issues/${this.ref.number}/comments`;
    }
    async lookup(key) {
        for (let page = 1; page <= 20; page += 1) {
            const batch = await githubJson(`${this.base()}?per_page=100&page=${page}`, this.ref.token);
            const found = findReceipt(batch, key);
            if (found)
                return found;
            if (batch.length < 100)
                return undefined;
        }
        // Bailing out silently would mean paying twice on a very long thread.
        throw new Error(`Could not scan all comments on ${this.ref.repo}#${this.ref.number} for a receipt; refusing to settle`);
    }
    async post(key, entry) {
        return fetch(this.base(), {
            method: "POST",
            headers: {
                accept: "application/vnd.github+json",
                authorization: `Bearer ${this.ref.token}`,
                "content-type": "application/json",
                "x-github-api-version": "2022-11-28",
                "user-agent": "gitpay",
            },
            body: JSON.stringify({
                body: formatReceipt({ key, ...entry }, this.ref.context ?? {}),
            }),
        });
    }
    /**
     * Called before broadcasting. Throwing here is the safe outcome: nothing has
     * moved, so the payout simply does not happen and can be retried cleanly.
     */
    async record(key, entry) {
        const response = await this.post(key, entry);
        if (!response.ok) {
            throw new Error(`Refusing to broadcast: could not record the payout for ${key} ` +
                `(GitHub API ${response.status}). Nothing was settled.`);
        }
    }
    /**
     * Called after a successful broadcast. Deliberately does not throw — the
     * record written by `record()` already carries the transaction, so a failure
     * here costs legibility only, and turning a settled payout into a reported
     * failure would be far worse than a missing confirmation.
     */
    async confirm(key, entry) {
        const response = await this.post(key, entry);
        if (!response.ok) {
            console.warn(`Payout ${key} settled, but the confirmation comment failed ` +
                `(GitHub API ${response.status}). The earlier record still carries the transaction.`);
        }
    }
}

;// CONCATENATED MODULE: ./src/drivers/safe-allowance/abi.ts
// ABI encoding for Safe's AllowanceModule. Chain primitives live here and only
// here — core and adapters may not import this file (I1).
//
// Verified signature, read from allowances/contracts/AllowanceModule.sol:
//
//   function executeAllowanceTransfer(
//       ISafe safe, address token, address payable to, uint96 amount,
//       address paymentToken, uint96 payment, address delegate, bytes signature
//   ) public
//
// `amount` and `payment` are uint96, NOT uint256. Assuming uint256 yields a
// different selector and the call reverts with nothing useful to read.
/** Interface types collapse to `address` for selector purposes. */
const EXECUTE_ALLOWANCE_TRANSFER_SIGNATURE = "executeAllowanceTransfer(address,address,address,uint96,address,uint96,address,bytes)";
/**
 * keccak256(SIGNATURE)[0..4]. Pinned as a constant so encoding costs no hash,
 * and re-derived in the tests so it can never silently drift from the signature
 * string above.
 */
const EXECUTE_ALLOWANCE_TRANSFER_SELECTOR = "0x4515641a";
const UINT96_MAX = (1n << 96n) - 1n;
const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HEX_BYTES = /^0x(?:[0-9a-fA-F]{2})*$/;
/** Left-pads to a 32-byte word. Addresses and integers are both right-aligned. */
function word(hexNoPrefix) {
    if (hexNoPrefix.length > 64)
        throw new Error(`value does not fit in a word: ${hexNoPrefix}`);
    return hexNoPrefix.padStart(64, "0");
}
function encodeAddress(value) {
    if (!HEX_ADDRESS.test(value)) {
        throw new Error(`not a 20-byte hex address: "${value}"`);
    }
    // Lowercased for encoding only. EIP-55 case is a checksum for humans and is
    // meaningless on the wire; the caller keeps the checksummed form for display.
    return word(value.slice(2).toLowerCase());
}
function encodeUint96(value) {
    const n = typeof value === "bigint" ? value : BigInt(value);
    if (n < 0n)
        throw new Error(`uint96 cannot be negative: ${n}`);
    if (n > UINT96_MAX) {
        throw new Error(`value ${n} exceeds uint96 max ${UINT96_MAX}`);
    }
    return word(n.toString(16));
}
/** Dynamic `bytes`: a length word, then the data padded up to a word boundary. */
function encodeBytesTail(value) {
    if (!HEX_BYTES.test(value)) {
        throw new Error(`not an even-length hex byte string: "${value}"`);
    }
    const data = value.slice(2).toLowerCase();
    const byteLength = data.length / 2;
    const padded = byteLength === 0 ? "" : data.padEnd(Math.ceil(byteLength / 32) * 64, "0");
    return word(byteLength.toString(16)) + padded;
}
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
/** Offset to the `bytes` tail: 8 head words. */
const BYTES_OFFSET = 8n * 32n;
function encodeExecuteAllowanceTransfer(call) {
    const head = [
        encodeAddress(call.safe),
        encodeAddress(call.token),
        encodeAddress(call.to),
        encodeUint96(call.amount),
        encodeAddress(call.paymentToken ?? ZERO_ADDRESS),
        encodeUint96(call.payment ?? 0n),
        encodeAddress(call.delegate),
        word(BYTES_OFFSET.toString(16)),
    ].join("");
    return EXECUTE_ALLOWANCE_TRANSFER_SELECTOR + head + encodeBytesTail(call.signature ?? "0x");
}

;// CONCATENATED MODULE: ./src/drivers/safe-allowance/rpc.ts
/**
 * Per request. `fetch` has no timeout of its own, so a stalled endpoint would
 * otherwise hold the job until CI kills it.
 */
const RPC_TIMEOUT_MS = 30_000;
/** Minimal JSON-RPC over fetch. No dependency, because one call shape is all this needs. */
class JsonRpc {
    url;
    constructor(url) {
        this.url = url;
    }
    async call(method, params) {
        const response = await fetch(this.url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
            signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
        });
        if (!response.ok) {
            throw new Error(`RPC ${method} failed: HTTP ${response.status}`);
        }
        const body = (await response.json());
        if (body.error) {
            throw new Error(`RPC ${method} failed: ${body.error.message ?? "unknown error"}`);
        }
        return body.result;
    }
    hex(method, params) {
        return this.call(method, params);
    }
}
function fromHex(value) {
    return BigInt(value);
}
function toHex(value) {
    return `0x${value.toString(16)}`;
}

;// CONCATENATED MODULE: ./node_modules/@noble/hashes/esm/_u64.js
/**
 * Internal helpers for u64. BigUint64Array is too slow as per 2025, so we implement it using Uint32Array.
 * @todo re-check https://issues.chromium.org/issues/42212588
 * @module
 */
const U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
const _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
    if (le)
        return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
    return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
}
const toBig = (h, l) => (BigInt(h >>> 0) << _32n) | BigInt(l >>> 0);
// for Shift in [0, 32)
const shrSH = (h, _l, s) => h >>> s;
const shrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// Right rotate for Shift in [1, 32)
const rotrSH = (h, l, s) => (h >>> s) | (l << (32 - s));
const rotrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// Right rotate for Shift in (32, 64), NOTE: 32 is special case.
const rotrBH = (h, l, s) => (h << (64 - s)) | (l >>> (s - 32));
const rotrBL = (h, l, s) => (h >>> (s - 32)) | (l << (64 - s));
// Right rotate for shift===32 (just swaps l&h)
const rotr32H = (_h, l) => l;
const rotr32L = (h, _l) => h;
// Left rotate for Shift in [1, 32)
const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));
// Left rotate for Shift in (32, 64), NOTE: 32 is special case.
const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));
// JS uses 32-bit signed integers for bitwise operations which means we cannot
// simple take carry out of low bit sum by shift, we need to use division.
function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
}
// Addition with more than 2 elements
const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
const add3H = (low, Ah, Bh, Ch) => (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
const add4H = (low, Ah, Bh, Ch, Dh) => (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
const add5H = (low, Ah, Bh, Ch, Dh, Eh) => (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;
// prettier-ignore

// prettier-ignore
const u64 = {
    fromBig, split, toBig,
    shrSH, shrSL,
    rotrSH, rotrSL, rotrBH, rotrBL,
    rotr32H, rotr32L,
    rotlSH, rotlSL, rotlBH, rotlBL,
    add, add3L, add3H, add4L, add4H, add5H, add5L,
};
/* harmony default export */ const _u64 = ((/* unused pure expression or super */ null && (u64)));
//# sourceMappingURL=_u64.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/hashes/esm/cryptoNode.js
/**
 * Internal webcrypto alias.
 * We prefer WebCrypto aka globalThis.crypto, which exists in node.js 16+.
 * Falls back to Node.js built-in crypto for Node.js <=v14.
 * See utils.ts for details.
 * @module
 */
// @ts-ignore

const cryptoNode_crypto = external_node_crypto_namespaceObject_0 && typeof external_node_crypto_namespaceObject_0 === 'object' && "webcrypto" in external_node_crypto_namespaceObject_0
    ? external_node_crypto_namespaceObject.webcrypto
    : external_node_crypto_namespaceObject_0 && typeof external_node_crypto_namespaceObject_0 === 'object' && "randomBytes" in external_node_crypto_namespaceObject_0
        ? external_node_crypto_namespaceObject_0
        : undefined;
//# sourceMappingURL=cryptoNode.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/hashes/esm/utils.js
/**
 * Utilities for hex, bytes, CSPRNG.
 * @module
 */
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
// We use WebCrypto aka globalThis.crypto, which exists in browsers and node.js 16+.
// node.js versions earlier than v19 don't declare it in global scope.
// For node.js, package.json#exports field mapping rewrites import
// from `crypto` to `cryptoNode`, which imports native module.
// Makes the utils un-importable in browsers without a bundler.
// Once node.js 18 is deprecated (2025-04-30), we can just drop the import.

/** Checks if something is Uint8Array. Be careful: nodejs Buffer will return true. */
function isBytes(a) {
    return a instanceof Uint8Array || (ArrayBuffer.isView(a) && a.constructor.name === 'Uint8Array');
}
/** Asserts something is positive integer. */
function anumber(n) {
    if (!Number.isSafeInteger(n) || n < 0)
        throw new Error('positive integer expected, got ' + n);
}
/** Asserts something is Uint8Array. */
function abytes(b, ...lengths) {
    if (!isBytes(b))
        throw new Error('Uint8Array expected');
    if (lengths.length > 0 && !lengths.includes(b.length))
        throw new Error('Uint8Array expected of length ' + lengths + ', got length=' + b.length);
}
/** Asserts something is hash */
function ahash(h) {
    if (typeof h !== 'function' || typeof h.create !== 'function')
        throw new Error('Hash should be wrapped by utils.createHasher');
    anumber(h.outputLen);
    anumber(h.blockLen);
}
/** Asserts a hash instance has not been destroyed / finished */
function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
        throw new Error('Hash instance has been destroyed');
    if (checkFinished && instance.finished)
        throw new Error('Hash#digest() has already been called');
}
/** Asserts output is properly-sized byte array */
function aoutput(out, instance) {
    abytes(out);
    const min = instance.outputLen;
    if (out.length < min) {
        throw new Error('digestInto() expects output buffer of length at least ' + min);
    }
}
/** Cast u8 / u16 / u32 to u8. */
function u8(arr) {
    return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
/** Cast u8 / u16 / u32 to u32. */
function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
/** Zeroize a byte array. Warning: JS provides no guarantees. */
function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
        arrays[i].fill(0);
    }
}
/** Create DataView of an array for easy byte-level manipulation. */
function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/** The rotate right (circular right shift) operation for uint32 */
function rotr(word, shift) {
    return (word << (32 - shift)) | (word >>> shift);
}
/** The rotate left (circular left shift) operation for uint32 */
function rotl(word, shift) {
    return (word << shift) | ((word >>> (32 - shift)) >>> 0);
}
/** Is current platform little-endian? Most are. Big-Endian platform: IBM */
const isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44)();
/** The byte swap operation for uint32 */
function byteSwap(word) {
    return (((word << 24) & 0xff000000) |
        ((word << 8) & 0xff0000) |
        ((word >>> 8) & 0xff00) |
        ((word >>> 24) & 0xff));
}
/** Conditionally byte swap if on a big-endian platform */
const swap8IfBE = (/* unused pure expression or super */ null && (isLE
    ? (n) => n
    : (n) => byteSwap(n)));
/** @deprecated */
const byteSwapIfBE = (/* unused pure expression or super */ null && (swap8IfBE));
/** In place byte swap for Uint32Array */
function byteSwap32(arr) {
    for (let i = 0; i < arr.length; i++) {
        arr[i] = byteSwap(arr[i]);
    }
    return arr;
}
const swap32IfBE = isLE
    ? (u) => u
    : byteSwap32;
// Built-in hex conversion https://caniuse.com/mdn-javascript_builtins_uint8array_fromhex
const hasHexBuiltin = /* @__PURE__ */ (() => 
// @ts-ignore
typeof Uint8Array.from([]).toHex === 'function' && typeof Uint8Array.fromHex === 'function')();
// Array where index 0xf0 (240) is mapped to string 'f0'
const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
/**
 * Convert byte array to hex string. Uses built-in function, when available.
 * @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
 */
function bytesToHex(bytes) {
    abytes(bytes);
    // @ts-ignore
    if (hasHexBuiltin)
        return bytes.toHex();
    // pre-caching improves the speed 6x
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += hexes[bytes[i]];
    }
    return hex;
}
// We use optimized technique to convert hex string to byte array
const asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function asciiToBase16(ch) {
    if (ch >= asciis._0 && ch <= asciis._9)
        return ch - asciis._0; // '2' => 50-48
    if (ch >= asciis.A && ch <= asciis.F)
        return ch - (asciis.A - 10); // 'B' => 66-(65-10)
    if (ch >= asciis.a && ch <= asciis.f)
        return ch - (asciis.a - 10); // 'b' => 98-(97-10)
    return;
}
/**
 * Convert hex string to byte array. Uses built-in function, when available.
 * @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
 */
function hexToBytes(hex) {
    if (typeof hex !== 'string')
        throw new Error('hex string expected, got ' + typeof hex);
    // @ts-ignore
    if (hasHexBuiltin)
        return Uint8Array.fromHex(hex);
    const hl = hex.length;
    const al = hl / 2;
    if (hl % 2)
        throw new Error('hex string expected, got unpadded hex of length ' + hl);
    const array = new Uint8Array(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
        const n1 = asciiToBase16(hex.charCodeAt(hi));
        const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
        if (n1 === undefined || n2 === undefined) {
            const char = hex[hi] + hex[hi + 1];
            throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
        }
        array[ai] = n1 * 16 + n2; // multiply first octet, e.g. 'a3' => 10*16+3 => 160 + 3 => 163
    }
    return array;
}
/**
 * There is no setImmediate in browser and setTimeout is slow.
 * Call of async fn will return Promise, which will be fullfiled only on
 * next scheduler queue processing step and this is exactly what we need.
 */
const nextTick = async () => { };
/** Returns control to thread each 'tick' ms to avoid blocking. */
async function asyncLoop(iters, tick, cb) {
    let ts = Date.now();
    for (let i = 0; i < iters; i++) {
        cb(i);
        // Date.now() is not monotonic, so in case if clock goes backwards we return return control too
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick)
            continue;
        await nextTick();
        ts += diff;
    }
}
/**
 * Converts string to bytes using UTF8 encoding.
 * @example utf8ToBytes('abc') // Uint8Array.from([97, 98, 99])
 */
function utf8ToBytes(str) {
    if (typeof str !== 'string')
        throw new Error('string expected');
    return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
}
/**
 * Converts bytes to string using UTF8 encoding.
 * @example bytesToUtf8(Uint8Array.from([97, 98, 99])) // 'abc'
 */
function bytesToUtf8(bytes) {
    return new TextDecoder().decode(bytes);
}
/**
 * Normalizes (non-hex) string or Uint8Array to Uint8Array.
 * Warning: when Uint8Array is passed, it would NOT get copied.
 * Keep in mind for future mutable operations.
 */
function toBytes(data) {
    if (typeof data === 'string')
        data = utf8ToBytes(data);
    abytes(data);
    return data;
}
/**
 * Helper for KDFs: consumes uint8array or string.
 * When string is passed, does utf8 decoding, using TextDecoder.
 */
function kdfInputToBytes(data) {
    if (typeof data === 'string')
        data = utf8ToBytes(data);
    abytes(data);
    return data;
}
/** Copies several Uint8Arrays into one. */
function utils_concatBytes(...arrays) {
    let sum = 0;
    for (let i = 0; i < arrays.length; i++) {
        const a = arrays[i];
        abytes(a);
        sum += a.length;
    }
    const res = new Uint8Array(sum);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
        const a = arrays[i];
        res.set(a, pad);
        pad += a.length;
    }
    return res;
}
function checkOpts(defaults, opts) {
    if (opts !== undefined && {}.toString.call(opts) !== '[object Object]')
        throw new Error('options should be object or undefined');
    const merged = Object.assign(defaults, opts);
    return merged;
}
/** For runtime check if class implements interface */
class Hash {
}
/** Wraps hash function, creating an interface on top of it */
function utils_createHasher(hashCons) {
    const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
    const tmp = hashCons();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashCons();
    return hashC;
}
function createOptHasher(hashCons) {
    const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
    const tmp = hashCons({});
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = (opts) => hashCons(opts);
    return hashC;
}
function utils_createXOFer(hashCons) {
    const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
    const tmp = hashCons({});
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = (opts) => hashCons(opts);
    return hashC;
}
const wrapConstructor = (/* unused pure expression or super */ null && (utils_createHasher));
const wrapConstructorWithOpts = (/* unused pure expression or super */ null && (createOptHasher));
const wrapXOFConstructorWithOpts = (/* unused pure expression or super */ null && (utils_createXOFer));
/** Cryptographically secure PRNG. Uses internal OS-level `crypto.getRandomValues`. */
function utils_randomBytes(bytesLength = 32) {
    if (cryptoNode_crypto && typeof cryptoNode_crypto.getRandomValues === 'function') {
        return cryptoNode_crypto.getRandomValues(new Uint8Array(bytesLength));
    }
    // Legacy Node.js compatibility
    if (cryptoNode_crypto && typeof cryptoNode_crypto.randomBytes === 'function') {
        return Uint8Array.from(cryptoNode_crypto.randomBytes(bytesLength));
    }
    throw new Error('crypto.getRandomValues must be defined');
}
//# sourceMappingURL=utils.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/hashes/esm/sha3.js
/**
 * SHA3 (keccak) hash function, based on a new "Sponge function" design.
 * Different from older hashes, the internal state is bigger than output size.
 *
 * Check out [FIPS-202](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf),
 * [Website](https://keccak.team/keccak.html),
 * [the differences between SHA-3 and Keccak](https://crypto.stackexchange.com/questions/15727/what-are-the-key-differences-between-the-draft-sha-3-standard-and-the-keccak-sub).
 *
 * Check out `sha3-addons` module for cSHAKE, k12, and others.
 * @module
 */

// prettier-ignore

// No __PURE__ annotations in sha3 header:
// EVERYTHING is in fact used on every export.
// Various per round constants calculations
const _0n = BigInt(0);
const _1n = BigInt(1);
const _2n = BigInt(2);
const _7n = BigInt(7);
const _256n = BigInt(256);
const _0x71n = BigInt(0x71);
const SHA3_PI = [];
const SHA3_ROTL = [];
const _SHA3_IOTA = [];
for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
    // Pi
    [x, y] = [y, (2 * x + 3 * y) % 5];
    SHA3_PI.push(2 * (5 * y + x));
    // Rotational
    SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
    // Iota
    let t = _0n;
    for (let j = 0; j < 7; j++) {
        R = ((R << _1n) ^ ((R >> _7n) * _0x71n)) % _256n;
        if (R & _2n)
            t ^= _1n << ((_1n << /* @__PURE__ */ BigInt(j)) - _1n);
    }
    _SHA3_IOTA.push(t);
}
const IOTAS = split(_SHA3_IOTA, true);
const SHA3_IOTA_H = IOTAS[0];
const SHA3_IOTA_L = IOTAS[1];
// Left rotation (without 0, 32, 64)
const rotlH = (h, l, s) => (s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s));
const rotlL = (h, l, s) => (s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s));
/** `keccakf1600` internal function, additionally allows to adjust round count. */
function keccakP(s, rounds = 24) {
    const B = new Uint32Array(5 * 2);
    // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
    for (let round = 24 - rounds; round < 24; round++) {
        // Theta θ
        for (let x = 0; x < 10; x++)
            B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
        for (let x = 0; x < 10; x += 2) {
            const idx1 = (x + 8) % 10;
            const idx0 = (x + 2) % 10;
            const B0 = B[idx0];
            const B1 = B[idx0 + 1];
            const Th = rotlH(B0, B1, 1) ^ B[idx1];
            const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
            for (let y = 0; y < 50; y += 10) {
                s[x + y] ^= Th;
                s[x + y + 1] ^= Tl;
            }
        }
        // Rho (ρ) and Pi (π)
        let curH = s[2];
        let curL = s[3];
        for (let t = 0; t < 24; t++) {
            const shift = SHA3_ROTL[t];
            const Th = rotlH(curH, curL, shift);
            const Tl = rotlL(curH, curL, shift);
            const PI = SHA3_PI[t];
            curH = s[PI];
            curL = s[PI + 1];
            s[PI] = Th;
            s[PI + 1] = Tl;
        }
        // Chi (χ)
        for (let y = 0; y < 50; y += 10) {
            for (let x = 0; x < 10; x++)
                B[x] = s[y + x];
            for (let x = 0; x < 10; x++)
                s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
        }
        // Iota (ι)
        s[0] ^= SHA3_IOTA_H[round];
        s[1] ^= SHA3_IOTA_L[round];
    }
    clean(B);
}
/** Keccak sponge function. */
class Keccak extends Hash {
    // NOTE: we accept arguments in bytes instead of bits here.
    constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        super();
        this.pos = 0;
        this.posOut = 0;
        this.finished = false;
        this.destroyed = false;
        this.enableXOF = false;
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.rounds = rounds;
        // Can be passed from user as dkLen
        anumber(outputLen);
        // 1600 = 5x5 matrix of 64bit.  1600 bits === 200 bytes
        // 0 < blockLen < 200
        if (!(0 < blockLen && blockLen < 200))
            throw new Error('only keccak-f1600 function is supported');
        this.state = new Uint8Array(200);
        this.state32 = u32(this.state);
    }
    clone() {
        return this._cloneInto();
    }
    keccak() {
        swap32IfBE(this.state32);
        keccakP(this.state32, this.rounds);
        swap32IfBE(this.state32);
        this.posOut = 0;
        this.pos = 0;
    }
    update(data) {
        aexists(this);
        data = toBytes(data);
        abytes(data);
        const { blockLen, state } = this;
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            for (let i = 0; i < take; i++)
                state[this.pos++] ^= data[pos++];
            if (this.pos === blockLen)
                this.keccak();
        }
        return this;
    }
    finish() {
        if (this.finished)
            return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        // Do the padding
        state[pos] ^= suffix;
        if ((suffix & 0x80) !== 0 && pos === blockLen - 1)
            this.keccak();
        state[blockLen - 1] ^= 0x80;
        this.keccak();
    }
    writeInto(out) {
        aexists(this, false);
        abytes(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len;) {
            if (this.posOut >= blockLen)
                this.keccak();
            const take = Math.min(blockLen - this.posOut, len - pos);
            out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
            this.posOut += take;
            pos += take;
        }
        return out;
    }
    xofInto(out) {
        // Sha3/Keccak usage with XOF is probably mistake, only SHAKE instances can do XOF
        if (!this.enableXOF)
            throw new Error('XOF is not possible for this instance');
        return this.writeInto(out);
    }
    xof(bytes) {
        anumber(bytes);
        return this.xofInto(new Uint8Array(bytes));
    }
    digestInto(out) {
        aoutput(out, this);
        if (this.finished)
            throw new Error('digest() was already called');
        this.writeInto(out);
        this.destroy();
        return out;
    }
    digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
    }
    destroy() {
        this.destroyed = true;
        clean(this.state);
    }
    _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        // Suffix can change in cSHAKE
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
    }
}
const gen = (suffix, blockLen, outputLen) => utils_createHasher(() => new Keccak(blockLen, suffix, outputLen));
/** SHA3-224 hash function. */
const sha3_224 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => gen(0x06, 144, 224 / 8))()));
/** SHA3-256 hash function. Different from keccak-256. */
const sha3_256 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => gen(0x06, 136, 256 / 8))()));
/** SHA3-384 hash function. */
const sha3_384 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => gen(0x06, 104, 384 / 8))()));
/** SHA3-512 hash function. */
const sha3_512 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => gen(0x06, 72, 512 / 8))()));
/** keccak-224 hash function. */
const keccak_224 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => gen(0x01, 144, 224 / 8))()));
/** keccak-256 hash function. Different from SHA3-256. */
const keccak_256 = /* @__PURE__ */ (() => gen(0x01, 136, 256 / 8))();
/** keccak-384 hash function. */
const keccak_384 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => gen(0x01, 104, 384 / 8))()));
/** keccak-512 hash function. */
const keccak_512 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => gen(0x01, 72, 512 / 8))()));
const genShake = (suffix, blockLen, outputLen) => createXOFer((opts = {}) => new Keccak(blockLen, suffix, opts.dkLen === undefined ? outputLen : opts.dkLen, true));
/** SHAKE128 XOF with 128-bit security. */
const shake128 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => genShake(0x1f, 168, 128 / 8))()));
/** SHAKE256 XOF with 256-bit security. */
const shake256 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => genShake(0x1f, 136, 256 / 8))()));
//# sourceMappingURL=sha3.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/hashes/esm/_md.js
/**
 * Internal Merkle-Damgard hash utils.
 * @module
 */

/** Polyfill for Safari 14. https://caniuse.com/mdn-javascript_builtins_dataview_setbiguint64 */
function setBigUint64(view, byteOffset, value, isLE) {
    if (typeof view.setBigUint64 === 'function')
        return view.setBigUint64(byteOffset, value, isLE);
    const _32n = BigInt(32);
    const _u32_max = BigInt(0xffffffff);
    const wh = Number((value >> _32n) & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE ? 4 : 0;
    const l = isLE ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE);
    view.setUint32(byteOffset + l, wl, isLE);
}
/** Choice: a ? b : c */
function Chi(a, b, c) {
    return (a & b) ^ (~a & c);
}
/** Majority function, true if any two inputs is true. */
function Maj(a, b, c) {
    return (a & b) ^ (a & c) ^ (b & c);
}
/**
 * Merkle-Damgard hash construction base class.
 * Could be used to create MD5, RIPEMD, SHA1, SHA2.
 */
class HashMD extends Hash {
    constructor(blockLen, outputLen, padOffset, isLE) {
        super();
        this.finished = false;
        this.length = 0;
        this.pos = 0;
        this.destroyed = false;
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE;
        this.buffer = new Uint8Array(blockLen);
        this.view = createView(this.buffer);
    }
    update(data) {
        aexists(this);
        data = toBytes(data);
        abytes(data);
        const { view, buffer, blockLen } = this;
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            // Fast path: we have at least one block in input, cast it to view and process
            if (take === blockLen) {
                const dataView = createView(data);
                for (; blockLen <= len - pos; pos += blockLen)
                    this.process(dataView, pos);
                continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
                this.process(view, 0);
                this.pos = 0;
            }
        }
        this.length += data.length;
        this.roundClean();
        return this;
    }
    digestInto(out) {
        aexists(this);
        aoutput(out, this);
        this.finished = true;
        // Padding
        // We can avoid allocation of buffer for padding completely if it
        // was previously not allocated here. But it won't change performance.
        const { buffer, view, blockLen, isLE } = this;
        let { pos } = this;
        // append the bit '1' to the message
        buffer[pos++] = 0b10000000;
        clean(this.buffer.subarray(pos));
        // we have less than padOffset left in buffer, so we cannot put length in
        // current block, need process it and pad again
        if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
        }
        // Pad until full block byte with zeros
        for (let i = pos; i < blockLen; i++)
            buffer[i] = 0;
        // Note: sha512 requires length to be 128bit integer, but length in JS will overflow before that
        // You need to write around 2 exabytes (u64_max / 8 / (1024**6)) for this to happen.
        // So we just write lowest 64 bits of that value.
        setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
        this.process(view, 0);
        const oview = createView(out);
        const len = this.outputLen;
        // NOTE: we do division by 4 later, which should be fused in single op with modulo by JIT
        if (len % 4)
            throw new Error('_sha2: outputLen should be aligned to 32bit');
        const outLen = len / 4;
        const state = this.get();
        if (outLen > state.length)
            throw new Error('_sha2: outputLen bigger than state');
        for (let i = 0; i < outLen; i++)
            oview.setUint32(4 * i, state[i], isLE);
    }
    digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
    _cloneInto(to) {
        to || (to = new this.constructor());
        to.set(...this.get());
        const { blockLen, buffer, length, finished, destroyed, pos } = this;
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length;
        to.pos = pos;
        if (length % blockLen)
            to.buffer.set(buffer);
        return to;
    }
    clone() {
        return this._cloneInto();
    }
}
/**
 * Initial SHA-2 state: fractional parts of square roots of first 16 primes 2..53.
 * Check out `test/misc/sha2-gen-iv.js` for recomputation guide.
 */
/** Initial SHA256 state. Bits 0..32 of frac part of sqrt of primes 2..19 */
const SHA256_IV = /* @__PURE__ */ Uint32Array.from([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);
/** Initial SHA224 state. Bits 32..64 of frac part of sqrt of primes 23..53 */
const SHA224_IV = /* @__PURE__ */ Uint32Array.from([
    0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4,
]);
/** Initial SHA384 state. Bits 0..64 of frac part of sqrt of primes 23..53 */
const SHA384_IV = /* @__PURE__ */ Uint32Array.from([
    0xcbbb9d5d, 0xc1059ed8, 0x629a292a, 0x367cd507, 0x9159015a, 0x3070dd17, 0x152fecd8, 0xf70e5939,
    0x67332667, 0xffc00b31, 0x8eb44a87, 0x68581511, 0xdb0c2e0d, 0x64f98fa7, 0x47b5481d, 0xbefa4fa4,
]);
/** Initial SHA512 state. Bits 0..64 of frac part of sqrt of primes 2..19 */
const SHA512_IV = /* @__PURE__ */ Uint32Array.from([
    0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
    0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179,
]);
//# sourceMappingURL=_md.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/hashes/esm/sha2.js
/**
 * SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
 * SHA256 is the fastest hash implementable in JS, even faster than Blake3.
 * Check out [RFC 4634](https://datatracker.ietf.org/doc/html/rfc4634) and
 * [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf).
 * @module
 */



/**
 * Round constants:
 * First 32 bits of fractional parts of the cube roots of the first 64 primes 2..311)
 */
// prettier-ignore
const SHA256_K = /* @__PURE__ */ Uint32Array.from([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
/** Reusable temporary buffer. "W" comes straight from spec. */
const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
class SHA256 extends HashMD {
    constructor(outputLen = 32) {
        super(64, outputLen, 8, false);
        // We cannot use array here since array allows indexing by variable
        // which means optimizer/compiler cannot use registers.
        this.A = SHA256_IV[0] | 0;
        this.B = SHA256_IV[1] | 0;
        this.C = SHA256_IV[2] | 0;
        this.D = SHA256_IV[3] | 0;
        this.E = SHA256_IV[4] | 0;
        this.F = SHA256_IV[5] | 0;
        this.G = SHA256_IV[6] | 0;
        this.H = SHA256_IV[7] | 0;
    }
    get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W[i] = view.getUint32(offset, false);
        for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W[i - 15];
            const W2 = SHA256_W[i - 2];
            const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ (W15 >>> 3);
            const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ (W2 >>> 10);
            SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
        }
        // Compression function main loop, 64 rounds
        let { A, B, C, D, E, F, G, H } = this;
        for (let i = 0; i < 64; i++) {
            const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
            const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
            const T2 = (sigma0 + Maj(A, B, C)) | 0;
            H = G;
            G = F;
            F = E;
            E = (D + T1) | 0;
            D = C;
            C = B;
            B = A;
            A = (T1 + T2) | 0;
        }
        // Add the compressed chunk to the current hash value
        A = (A + this.A) | 0;
        B = (B + this.B) | 0;
        C = (C + this.C) | 0;
        D = (D + this.D) | 0;
        E = (E + this.E) | 0;
        F = (F + this.F) | 0;
        G = (G + this.G) | 0;
        H = (H + this.H) | 0;
        this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
        clean(SHA256_W);
    }
    destroy() {
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        clean(this.buffer);
    }
}
class SHA224 extends SHA256 {
    constructor() {
        super(28);
        this.A = SHA224_IV[0] | 0;
        this.B = SHA224_IV[1] | 0;
        this.C = SHA224_IV[2] | 0;
        this.D = SHA224_IV[3] | 0;
        this.E = SHA224_IV[4] | 0;
        this.F = SHA224_IV[5] | 0;
        this.G = SHA224_IV[6] | 0;
        this.H = SHA224_IV[7] | 0;
    }
}
// SHA2-512 is slower than sha256 in js because u64 operations are slow.
// Round contants
// First 32 bits of the fractional parts of the cube roots of the first 80 primes 2..409
// prettier-ignore
const K512 = /* @__PURE__ */ (() => split([
    '0x428a2f98d728ae22', '0x7137449123ef65cd', '0xb5c0fbcfec4d3b2f', '0xe9b5dba58189dbbc',
    '0x3956c25bf348b538', '0x59f111f1b605d019', '0x923f82a4af194f9b', '0xab1c5ed5da6d8118',
    '0xd807aa98a3030242', '0x12835b0145706fbe', '0x243185be4ee4b28c', '0x550c7dc3d5ffb4e2',
    '0x72be5d74f27b896f', '0x80deb1fe3b1696b1', '0x9bdc06a725c71235', '0xc19bf174cf692694',
    '0xe49b69c19ef14ad2', '0xefbe4786384f25e3', '0x0fc19dc68b8cd5b5', '0x240ca1cc77ac9c65',
    '0x2de92c6f592b0275', '0x4a7484aa6ea6e483', '0x5cb0a9dcbd41fbd4', '0x76f988da831153b5',
    '0x983e5152ee66dfab', '0xa831c66d2db43210', '0xb00327c898fb213f', '0xbf597fc7beef0ee4',
    '0xc6e00bf33da88fc2', '0xd5a79147930aa725', '0x06ca6351e003826f', '0x142929670a0e6e70',
    '0x27b70a8546d22ffc', '0x2e1b21385c26c926', '0x4d2c6dfc5ac42aed', '0x53380d139d95b3df',
    '0x650a73548baf63de', '0x766a0abb3c77b2a8', '0x81c2c92e47edaee6', '0x92722c851482353b',
    '0xa2bfe8a14cf10364', '0xa81a664bbc423001', '0xc24b8b70d0f89791', '0xc76c51a30654be30',
    '0xd192e819d6ef5218', '0xd69906245565a910', '0xf40e35855771202a', '0x106aa07032bbd1b8',
    '0x19a4c116b8d2d0c8', '0x1e376c085141ab53', '0x2748774cdf8eeb99', '0x34b0bcb5e19b48a8',
    '0x391c0cb3c5c95a63', '0x4ed8aa4ae3418acb', '0x5b9cca4f7763e373', '0x682e6ff3d6b2b8a3',
    '0x748f82ee5defb2fc', '0x78a5636f43172f60', '0x84c87814a1f0ab72', '0x8cc702081a6439ec',
    '0x90befffa23631e28', '0xa4506cebde82bde9', '0xbef9a3f7b2c67915', '0xc67178f2e372532b',
    '0xca273eceea26619c', '0xd186b8c721c0c207', '0xeada7dd6cde0eb1e', '0xf57d4f7fee6ed178',
    '0x06f067aa72176fba', '0x0a637dc5a2c898a6', '0x113f9804bef90dae', '0x1b710b35131c471b',
    '0x28db77f523047d84', '0x32caab7b40c72493', '0x3c9ebe0a15c9bebc', '0x431d67c49c100d4c',
    '0x4cc5d4becb3e42b6', '0x597f299cfc657e2a', '0x5fcb6fab3ad6faec', '0x6c44198c4a475817'
].map(n => BigInt(n))))();
const SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
const SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
// Reusable temporary buffers
const SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
const SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
class SHA512 extends HashMD {
    constructor(outputLen = 64) {
        super(128, outputLen, 16, false);
        // We cannot use array here since array allows indexing by variable
        // which means optimizer/compiler cannot use registers.
        // h -- high 32 bits, l -- low 32 bits
        this.Ah = SHA512_IV[0] | 0;
        this.Al = SHA512_IV[1] | 0;
        this.Bh = SHA512_IV[2] | 0;
        this.Bl = SHA512_IV[3] | 0;
        this.Ch = SHA512_IV[4] | 0;
        this.Cl = SHA512_IV[5] | 0;
        this.Dh = SHA512_IV[6] | 0;
        this.Dl = SHA512_IV[7] | 0;
        this.Eh = SHA512_IV[8] | 0;
        this.El = SHA512_IV[9] | 0;
        this.Fh = SHA512_IV[10] | 0;
        this.Fl = SHA512_IV[11] | 0;
        this.Gh = SHA512_IV[12] | 0;
        this.Gl = SHA512_IV[13] | 0;
        this.Hh = SHA512_IV[14] | 0;
        this.Hl = SHA512_IV[15] | 0;
    }
    // prettier-ignore
    get() {
        const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
        this.Ah = Ah | 0;
        this.Al = Al | 0;
        this.Bh = Bh | 0;
        this.Bl = Bl | 0;
        this.Ch = Ch | 0;
        this.Cl = Cl | 0;
        this.Dh = Dh | 0;
        this.Dl = Dl | 0;
        this.Eh = Eh | 0;
        this.El = El | 0;
        this.Fh = Fh | 0;
        this.Fl = Fl | 0;
        this.Gh = Gh | 0;
        this.Gl = Gl | 0;
        this.Hh = Hh | 0;
        this.Hl = Hl | 0;
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 64 words w[16..79] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4) {
            SHA512_W_H[i] = view.getUint32(offset);
            SHA512_W_L[i] = view.getUint32((offset += 4));
        }
        for (let i = 16; i < 80; i++) {
            // s0 := (w[i-15] rightrotate 1) xor (w[i-15] rightrotate 8) xor (w[i-15] rightshift 7)
            const W15h = SHA512_W_H[i - 15] | 0;
            const W15l = SHA512_W_L[i - 15] | 0;
            const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
            const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
            // s1 := (w[i-2] rightrotate 19) xor (w[i-2] rightrotate 61) xor (w[i-2] rightshift 6)
            const W2h = SHA512_W_H[i - 2] | 0;
            const W2l = SHA512_W_L[i - 2] | 0;
            const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
            const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
            // SHA256_W[i] = s0 + s1 + SHA256_W[i - 7] + SHA256_W[i - 16];
            const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
            const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
            SHA512_W_H[i] = SUMh | 0;
            SHA512_W_L[i] = SUMl | 0;
        }
        let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        // Compression function main loop, 80 rounds
        for (let i = 0; i < 80; i++) {
            // S1 := (e rightrotate 14) xor (e rightrotate 18) xor (e rightrotate 41)
            const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
            const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
            //const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const CHIh = (Eh & Fh) ^ (~Eh & Gh);
            const CHIl = (El & Fl) ^ (~El & Gl);
            // T1 = H + sigma1 + Chi(E, F, G) + SHA512_K[i] + SHA512_W[i]
            // prettier-ignore
            const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
            const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
            const T1l = T1ll | 0;
            // S0 := (a rightrotate 28) xor (a rightrotate 34) xor (a rightrotate 39)
            const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
            const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
            const MAJh = (Ah & Bh) ^ (Ah & Ch) ^ (Bh & Ch);
            const MAJl = (Al & Bl) ^ (Al & Cl) ^ (Bl & Cl);
            Hh = Gh | 0;
            Hl = Gl | 0;
            Gh = Fh | 0;
            Gl = Fl | 0;
            Fh = Eh | 0;
            Fl = El | 0;
            ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
            Dh = Ch | 0;
            Dl = Cl | 0;
            Ch = Bh | 0;
            Cl = Bl | 0;
            Bh = Ah | 0;
            Bl = Al | 0;
            const All = add3L(T1l, sigma0l, MAJl);
            Ah = add3H(All, T1h, sigma0h, MAJh);
            Al = All | 0;
        }
        // Add the compressed chunk to the current hash value
        ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
        ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
        ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
        ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
        ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
        ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
        ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
        ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
        clean(SHA512_W_H, SHA512_W_L);
    }
    destroy() {
        clean(this.buffer);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
class SHA384 extends SHA512 {
    constructor() {
        super(48);
        this.Ah = SHA384_IV[0] | 0;
        this.Al = SHA384_IV[1] | 0;
        this.Bh = SHA384_IV[2] | 0;
        this.Bl = SHA384_IV[3] | 0;
        this.Ch = SHA384_IV[4] | 0;
        this.Cl = SHA384_IV[5] | 0;
        this.Dh = SHA384_IV[6] | 0;
        this.Dl = SHA384_IV[7] | 0;
        this.Eh = SHA384_IV[8] | 0;
        this.El = SHA384_IV[9] | 0;
        this.Fh = SHA384_IV[10] | 0;
        this.Fl = SHA384_IV[11] | 0;
        this.Gh = SHA384_IV[12] | 0;
        this.Gl = SHA384_IV[13] | 0;
        this.Hh = SHA384_IV[14] | 0;
        this.Hl = SHA384_IV[15] | 0;
    }
}
/**
 * Truncated SHA512/256 and SHA512/224.
 * SHA512_IV is XORed with 0xa5a5a5a5a5a5a5a5, then used as "intermediary" IV of SHA512/t.
 * Then t hashes string to produce result IV.
 * See `test/misc/sha2-gen-iv.js`.
 */
/** SHA512/224 IV */
const T224_IV = /* @__PURE__ */ Uint32Array.from([
    0x8c3d37c8, 0x19544da2, 0x73e19966, 0x89dcd4d6, 0x1dfab7ae, 0x32ff9c82, 0x679dd514, 0x582f9fcf,
    0x0f6d2b69, 0x7bd44da8, 0x77e36f73, 0x04c48942, 0x3f9d85a8, 0x6a1d36c8, 0x1112e6ad, 0x91d692a1,
]);
/** SHA512/256 IV */
const T256_IV = /* @__PURE__ */ Uint32Array.from([
    0x22312194, 0xfc2bf72c, 0x9f555fa3, 0xc84c64c2, 0x2393b86b, 0x6f53b151, 0x96387719, 0x5940eabd,
    0x96283ee2, 0xa88effe3, 0xbe5e1e25, 0x53863992, 0x2b0199fc, 0x2c85b8aa, 0x0eb72ddc, 0x81c52ca2,
]);
class SHA512_224 extends SHA512 {
    constructor() {
        super(28);
        this.Ah = T224_IV[0] | 0;
        this.Al = T224_IV[1] | 0;
        this.Bh = T224_IV[2] | 0;
        this.Bl = T224_IV[3] | 0;
        this.Ch = T224_IV[4] | 0;
        this.Cl = T224_IV[5] | 0;
        this.Dh = T224_IV[6] | 0;
        this.Dl = T224_IV[7] | 0;
        this.Eh = T224_IV[8] | 0;
        this.El = T224_IV[9] | 0;
        this.Fh = T224_IV[10] | 0;
        this.Fl = T224_IV[11] | 0;
        this.Gh = T224_IV[12] | 0;
        this.Gl = T224_IV[13] | 0;
        this.Hh = T224_IV[14] | 0;
        this.Hl = T224_IV[15] | 0;
    }
}
class SHA512_256 extends SHA512 {
    constructor() {
        super(32);
        this.Ah = T256_IV[0] | 0;
        this.Al = T256_IV[1] | 0;
        this.Bh = T256_IV[2] | 0;
        this.Bl = T256_IV[3] | 0;
        this.Ch = T256_IV[4] | 0;
        this.Cl = T256_IV[5] | 0;
        this.Dh = T256_IV[6] | 0;
        this.Dl = T256_IV[7] | 0;
        this.Eh = T256_IV[8] | 0;
        this.El = T256_IV[9] | 0;
        this.Fh = T256_IV[10] | 0;
        this.Fl = T256_IV[11] | 0;
        this.Gh = T256_IV[12] | 0;
        this.Gl = T256_IV[13] | 0;
        this.Hh = T256_IV[14] | 0;
        this.Hl = T256_IV[15] | 0;
    }
}
/**
 * SHA2-256 hash function from RFC 4634.
 *
 * It is the fastest JS hash, even faster than Blake3.
 * To break sha256 using birthday attack, attackers need to try 2^128 hashes.
 * BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
 */
const sha2_sha256 = /* @__PURE__ */ utils_createHasher(() => new SHA256());
/** SHA2-224 hash function from RFC 4634 */
const sha224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new SHA224())));
/** SHA2-512 hash function from RFC 4634. */
const sha512 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new SHA512())));
/** SHA2-384 hash function from RFC 4634. */
const sha384 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new SHA384())));
/**
 * SHA2-512/256 "truncated" hash function, with improved resistance to length extension attacks.
 * See the paper on [truncated SHA512](https://eprint.iacr.org/2010/548.pdf).
 */
const sha512_256 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new SHA512_256())));
/**
 * SHA2-512/224 "truncated" hash function, with improved resistance to length extension attacks.
 * See the paper on [truncated SHA512](https://eprint.iacr.org/2010/548.pdf).
 */
const sha512_224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new SHA512_224())));
//# sourceMappingURL=sha2.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/hashes/esm/hmac.js
/**
 * HMAC: RFC2104 message authentication code.
 * @module
 */

class HMAC extends Hash {
    constructor(hash, _key) {
        super();
        this.finished = false;
        this.destroyed = false;
        ahash(hash);
        const key = toBytes(_key);
        this.iHash = hash.create();
        if (typeof this.iHash.update !== 'function')
            throw new Error('Expected instance of class which extends utils.Hash');
        this.blockLen = this.iHash.blockLen;
        this.outputLen = this.iHash.outputLen;
        const blockLen = this.blockLen;
        const pad = new Uint8Array(blockLen);
        // blockLen can be bigger than outputLen
        pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
        for (let i = 0; i < pad.length; i++)
            pad[i] ^= 0x36;
        this.iHash.update(pad);
        // By doing update (processing of first block) of outer hash here we can re-use it between multiple calls via clone
        this.oHash = hash.create();
        // Undo internal XOR && apply outer XOR
        for (let i = 0; i < pad.length; i++)
            pad[i] ^= 0x36 ^ 0x5c;
        this.oHash.update(pad);
        clean(pad);
    }
    update(buf) {
        aexists(this);
        this.iHash.update(buf);
        return this;
    }
    digestInto(out) {
        aexists(this);
        abytes(out, this.outputLen);
        this.finished = true;
        this.iHash.digestInto(out);
        this.oHash.update(out);
        this.oHash.digestInto(out);
        this.destroy();
    }
    digest() {
        const out = new Uint8Array(this.oHash.outputLen);
        this.digestInto(out);
        return out;
    }
    _cloneInto(to) {
        // Create new instance without calling constructor since key already in state and we don't know it.
        to || (to = Object.create(Object.getPrototypeOf(this), {}));
        const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
        to = to;
        to.finished = finished;
        to.destroyed = destroyed;
        to.blockLen = blockLen;
        to.outputLen = outputLen;
        to.oHash = oHash._cloneInto(to.oHash);
        to.iHash = iHash._cloneInto(to.iHash);
        return to;
    }
    clone() {
        return this._cloneInto();
    }
    destroy() {
        this.destroyed = true;
        this.oHash.destroy();
        this.iHash.destroy();
    }
}
/**
 * HMAC: RFC2104 message authentication code.
 * @param hash - function that would be used e.g. sha256
 * @param key - message key
 * @param message - message data
 * @example
 * import { hmac } from '@noble/hashes/hmac';
 * import { sha256 } from '@noble/hashes/sha2';
 * const mac1 = hmac(sha256, 'key', 'message');
 */
const hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
hmac.create = (hash, key) => new HMAC(hash, key);
//# sourceMappingURL=hmac.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/esm/utils.js
/**
 * Hex, bytes and number utilities.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */


const utils_0n = /* @__PURE__ */ BigInt(0);
const utils_1n = /* @__PURE__ */ BigInt(1);
function abool(title, value) {
    if (typeof value !== 'boolean')
        throw new Error(title + ' boolean expected, got ' + value);
}
// Used in weierstrass, der
function numberToHexUnpadded(num) {
    const hex = num.toString(16);
    return hex.length & 1 ? '0' + hex : hex;
}
function hexToNumber(hex) {
    if (typeof hex !== 'string')
        throw new Error('hex string expected, got ' + typeof hex);
    return hex === '' ? utils_0n : BigInt('0x' + hex); // Big Endian
}
// BE: Big Endian, LE: Little Endian
function utils_bytesToNumberBE(bytes) {
    return hexToNumber(bytesToHex(bytes));
}
function utils_bytesToNumberLE(bytes) {
    abytes(bytes);
    return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
}
function utils_numberToBytesBE(n, len) {
    return hexToBytes(n.toString(16).padStart(len * 2, '0'));
}
function numberToBytesLE(n, len) {
    return utils_numberToBytesBE(n, len).reverse();
}
// Unpadded, rarely used
function numberToVarBytesBE(n) {
    return hexToBytes_(numberToHexUnpadded(n));
}
/**
 * Takes hex string or Uint8Array, converts to Uint8Array.
 * Validates output length.
 * Will throw error for other types.
 * @param title descriptive title for an error e.g. 'private key'
 * @param hex hex string or Uint8Array
 * @param expectedLength optional, will compare to result array's length
 * @returns
 */
function utils_ensureBytes(title, hex, expectedLength) {
    let res;
    if (typeof hex === 'string') {
        try {
            res = hexToBytes(hex);
        }
        catch (e) {
            throw new Error(title + ' must be hex string or Uint8Array, cause: ' + e);
        }
    }
    else if (isBytes(hex)) {
        // Uint8Array.from() instead of hash.slice() because node.js Buffer
        // is instance of Uint8Array, and its slice() creates **mutable** copy
        res = Uint8Array.from(hex);
    }
    else {
        throw new Error(title + ' must be hex string or Uint8Array');
    }
    const len = res.length;
    if (typeof expectedLength === 'number' && len !== expectedLength)
        throw new Error(title + ' of length ' + expectedLength + ' expected, got ' + len);
    return res;
}
// Compares 2 u8a-s in kinda constant time
function equalBytes(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a[i] ^ b[i];
    return diff === 0;
}
/**
 * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
 */
// export const utf8ToBytes: typeof utf8ToBytes_ = utf8ToBytes_;
/**
 * Converts bytes to string using UTF8 encoding.
 * @example bytesToUtf8(Uint8Array.from([97, 98, 99])) // 'abc'
 */
// export const bytesToUtf8: typeof bytesToUtf8_ = bytesToUtf8_;
// Is positive bigint
const isPosBig = (n) => typeof n === 'bigint' && utils_0n <= n;
function utils_inRange(n, min, max) {
    return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
/**
 * Asserts min <= n < max. NOTE: It's < max and not <= max.
 * @example
 * aInRange('x', x, 1n, 256n); // would assume x is in (1n..255n)
 */
function utils_aInRange(title, n, min, max) {
    // Why min <= n < max and not a (min < n < max) OR b (min <= n <= max)?
    // consider P=256n, min=0n, max=P
    // - a for min=0 would require -1:          `inRange('x', x, -1n, P)`
    // - b would commonly require subtraction:  `inRange('x', x, 0n, P - 1n)`
    // - our way is the cleanest:               `inRange('x', x, 0n, P)
    if (!utils_inRange(n, min, max))
        throw new Error('expected valid ' + title + ': ' + min + ' <= n < ' + max + ', got ' + n);
}
// Bit operations
/**
 * Calculates amount of bits in a bigint.
 * Same as `n.toString(2).length`
 * TODO: merge with nLength in modular
 */
function bitLen(n) {
    let len;
    for (len = 0; n > utils_0n; n >>= utils_1n, len += 1)
        ;
    return len;
}
/**
 * Gets single bit at position.
 * NOTE: first bit position is 0 (same as arrays)
 * Same as `!!+Array.from(n.toString(2)).reverse()[pos]`
 */
function bitGet(n, pos) {
    return (n >> BigInt(pos)) & utils_1n;
}
/**
 * Sets single bit at position.
 */
function bitSet(n, pos, value) {
    return n | ((value ? utils_1n : utils_0n) << BigInt(pos));
}
/**
 * Calculate mask for N bits. Not using ** operator with bigints because of old engines.
 * Same as BigInt(`0b${Array(i).fill('1').join('')}`)
 */
const utils_bitMask = (n) => (utils_1n << BigInt(n)) - utils_1n;
/**
 * Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
 * @returns function that will call DRBG until 2nd arg returns something meaningful
 * @example
 *   const drbg = createHmacDRBG<Key>(32, 32, hmac);
 *   drbg(seed, bytesToKey); // bytesToKey must return Key or undefined
 */
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
    if (typeof hashLen !== 'number' || hashLen < 2)
        throw new Error('hashLen must be a number');
    if (typeof qByteLen !== 'number' || qByteLen < 2)
        throw new Error('qByteLen must be a number');
    if (typeof hmacFn !== 'function')
        throw new Error('hmacFn must be a function');
    // Step B, Step C: set hashLen to 8*ceil(hlen/8)
    const u8n = (len) => new Uint8Array(len); // creates Uint8Array
    const u8of = (byte) => Uint8Array.of(byte); // another shortcut
    let v = u8n(hashLen); // Minimal non-full-spec HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
    let k = u8n(hashLen); // Steps B and C of RFC6979 3.2: set hashLen, in our case always same
    let i = 0; // Iterations counter, will throw when over 1000
    const reset = () => {
        v.fill(1);
        k.fill(0);
        i = 0;
    };
    const h = (...b) => hmacFn(k, v, ...b); // hmac(k)(v, ...values)
    const reseed = (seed = u8n(0)) => {
        // HMAC-DRBG reseed() function. Steps D-G
        k = h(u8of(0x00), seed); // k = hmac(k || v || 0x00 || seed)
        v = h(); // v = hmac(k || v)
        if (seed.length === 0)
            return;
        k = h(u8of(0x01), seed); // k = hmac(k || v || 0x01 || seed)
        v = h(); // v = hmac(k || v)
    };
    const gen = () => {
        // HMAC-DRBG generate() function
        if (i++ >= 1000)
            throw new Error('drbg: tried 1000 values');
        let len = 0;
        const out = [];
        while (len < qByteLen) {
            v = h();
            const sl = v.slice();
            out.push(sl);
            len += v.length;
        }
        return utils_concatBytes(...out);
    };
    const genUntil = (seed, pred) => {
        reset();
        reseed(seed); // Steps D-G
        let res = undefined; // Step H: grind until k is in [1..n-1]
        while (!(res = pred(gen())))
            reseed();
        reset();
        return res;
    };
    return genUntil;
}
// Validating curves and fields
const validatorFns = {
    bigint: (val) => typeof val === 'bigint',
    function: (val) => typeof val === 'function',
    boolean: (val) => typeof val === 'boolean',
    string: (val) => typeof val === 'string',
    stringOrUint8Array: (val) => typeof val === 'string' || isBytes(val),
    isSafeInteger: (val) => Number.isSafeInteger(val),
    array: (val) => Array.isArray(val),
    field: (val, object) => object.Fp.isValid(val),
    hash: (val) => typeof val === 'function' && Number.isSafeInteger(val.outputLen),
};
// type Record<K extends string | number | symbol, T> = { [P in K]: T; }
function utils_validateObject(object, validators, optValidators = {}) {
    const checkField = (fieldName, type, isOptional) => {
        const checkVal = validatorFns[type];
        if (typeof checkVal !== 'function')
            throw new Error('invalid validator function');
        const val = object[fieldName];
        if (isOptional && val === undefined)
            return;
        if (!checkVal(val, object)) {
            throw new Error('param ' + String(fieldName) + ' is invalid. Expected ' + type + ', got ' + val);
        }
    };
    for (const [fieldName, type] of Object.entries(validators))
        checkField(fieldName, type, false);
    for (const [fieldName, type] of Object.entries(optValidators))
        checkField(fieldName, type, true);
    return object;
}
// validate type tests
// const o: { a: number; b: number; c: number } = { a: 1, b: 5, c: 6 };
// const z0 = validateObject(o, { a: 'isSafeInteger' }, { c: 'bigint' }); // Ok!
// // Should fail type-check
// const z1 = validateObject(o, { a: 'tmp' }, { c: 'zz' });
// const z2 = validateObject(o, { a: 'isSafeInteger' }, { c: 'zz' });
// const z3 = validateObject(o, { test: 'boolean', z: 'bug' });
// const z4 = validateObject(o, { a: 'boolean', z: 'bug' });
function isHash(val) {
    return typeof val === 'function' && Number.isSafeInteger(val.outputLen);
}
function _validateObject(object, fields, optFields = {}) {
    if (!object || typeof object !== 'object')
        throw new Error('expected valid options object');
    function checkField(fieldName, expectedType, isOpt) {
        const val = object[fieldName];
        if (isOpt && val === undefined)
            return;
        const current = typeof val;
        if (current !== expectedType || val === null)
            throw new Error(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
    }
    Object.entries(fields).forEach(([k, v]) => checkField(k, v, false));
    Object.entries(optFields).forEach(([k, v]) => checkField(k, v, true));
}
/**
 * throws not implemented error
 */
const notImplemented = () => {
    throw new Error('not implemented');
};
/**
 * Memoizes (caches) computation result.
 * Uses WeakMap: the value is going auto-cleaned by GC after last reference is removed.
 */
function memoized(fn) {
    const map = new WeakMap();
    return (arg, ...args) => {
        const val = map.get(arg);
        if (val !== undefined)
            return val;
        const computed = fn(arg, ...args);
        map.set(arg, computed);
        return computed;
    };
}
//# sourceMappingURL=utils.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/esm/abstract/modular.js
/**
 * Utils for modular division and fields.
 * Field over 11 is a finite (Galois) field is integer number operations `mod 11`.
 * There is no division: it is replaced by modular multiplicative inverse.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */

// prettier-ignore
const modular_0n = BigInt(0), modular_1n = BigInt(1), modular_2n = /* @__PURE__ */ BigInt(2), _3n = /* @__PURE__ */ BigInt(3);
// prettier-ignore
const _4n = /* @__PURE__ */ BigInt(4), _5n = /* @__PURE__ */ BigInt(5);
const _8n = /* @__PURE__ */ BigInt(8);
// Calculates a modulo b
function modular_mod(a, b) {
    const result = a % b;
    return result >= modular_0n ? result : b + result;
}
/**
 * Efficiently raise num to power and do modular division.
 * Unsafe in some contexts: uses ladder, so can expose bigint bits.
 * @example
 * pow(2n, 6n, 11n) // 64n % 11n == 9n
 */
function pow(num, power, modulo) {
    return FpPow(Field(modulo), num, power);
}
/** Does `x^(2^power)` mod p. `pow2(30, 4)` == `30^(2^4)` */
function pow2(x, power, modulo) {
    let res = x;
    while (power-- > modular_0n) {
        res *= res;
        res %= modulo;
    }
    return res;
}
/**
 * Inverses number over modulo.
 * Implemented using [Euclidean GCD](https://brilliant.org/wiki/extended-euclidean-algorithm/).
 */
function invert(number, modulo) {
    if (number === modular_0n)
        throw new Error('invert: expected non-zero number');
    if (modulo <= modular_0n)
        throw new Error('invert: expected positive modulus, got ' + modulo);
    // Fermat's little theorem "CT-like" version inv(n) = n^(m-2) mod m is 30x slower.
    let a = modular_mod(number, modulo);
    let b = modulo;
    // prettier-ignore
    let x = modular_0n, y = modular_1n, u = modular_1n, v = modular_0n;
    while (a !== modular_0n) {
        // JIT applies optimization if those two lines follow each other
        const q = b / a;
        const r = b % a;
        const m = x - u * q;
        const n = y - v * q;
        // prettier-ignore
        b = a, a = r, x = u, y = v, u = m, v = n;
    }
    const gcd = b;
    if (gcd !== modular_1n)
        throw new Error('invert: does not exist');
    return modular_mod(x, modulo);
}
// Not all roots are possible! Example which will throw:
// const NUM =
// n = 72057594037927816n;
// Fp = Field(BigInt('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab'));
function sqrt3mod4(Fp, n) {
    const p1div4 = (Fp.ORDER + modular_1n) / _4n;
    const root = Fp.pow(n, p1div4);
    // Throw if root^2 != n
    if (!Fp.eql(Fp.sqr(root), n))
        throw new Error('Cannot find square root');
    return root;
}
function sqrt5mod8(Fp, n) {
    const p5div8 = (Fp.ORDER - _5n) / _8n;
    const n2 = Fp.mul(n, modular_2n);
    const v = Fp.pow(n2, p5div8);
    const nv = Fp.mul(n, v);
    const i = Fp.mul(Fp.mul(nv, modular_2n), v);
    const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
    if (!Fp.eql(Fp.sqr(root), n))
        throw new Error('Cannot find square root');
    return root;
}
// TODO: Commented-out for now. Provide test vectors.
// Tonelli is too slow for extension fields Fp2.
// That means we can't use sqrt (c1, c2...) even for initialization constants.
// if (P % _16n === _9n) return sqrt9mod16;
// // prettier-ignore
// function sqrt9mod16<T>(Fp: IField<T>, n: T, p7div16?: bigint) {
//   if (p7div16 === undefined) p7div16 = (Fp.ORDER + BigInt(7)) / _16n;
//   const c1 = Fp.sqrt(Fp.neg(Fp.ONE)); //  1. c1 = sqrt(-1) in F, i.e., (c1^2) == -1 in F
//   const c2 = Fp.sqrt(c1);             //  2. c2 = sqrt(c1) in F, i.e., (c2^2) == c1 in F
//   const c3 = Fp.sqrt(Fp.neg(c1));     //  3. c3 = sqrt(-c1) in F, i.e., (c3^2) == -c1 in F
//   const c4 = p7div16;                 //  4. c4 = (q + 7) / 16        # Integer arithmetic
//   let tv1 = Fp.pow(n, c4);            //  1. tv1 = x^c4
//   let tv2 = Fp.mul(c1, tv1);          //  2. tv2 = c1 * tv1
//   const tv3 = Fp.mul(c2, tv1);        //  3. tv3 = c2 * tv1
//   let tv4 = Fp.mul(c3, tv1);          //  4. tv4 = c3 * tv1
//   const e1 = Fp.eql(Fp.sqr(tv2), n);  //  5.  e1 = (tv2^2) == x
//   const e2 = Fp.eql(Fp.sqr(tv3), n);  //  6.  e2 = (tv3^2) == x
//   tv1 = Fp.cmov(tv1, tv2, e1); //  7. tv1 = CMOV(tv1, tv2, e1)  # Select tv2 if (tv2^2) == x
//   tv2 = Fp.cmov(tv4, tv3, e2); //  8. tv2 = CMOV(tv4, tv3, e2)  # Select tv3 if (tv3^2) == x
//   const e3 = Fp.eql(Fp.sqr(tv2), n);  //  9.  e3 = (tv2^2) == x
//   return Fp.cmov(tv1, tv2, e3); // 10.  z = CMOV(tv1, tv2, e3) # Select the sqrt from tv1 and tv2
// }
/**
 * Tonelli-Shanks square root search algorithm.
 * 1. https://eprint.iacr.org/2012/685.pdf (page 12)
 * 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
 * @param P field order
 * @returns function that takes field Fp (created from P) and number n
 */
function tonelliShanks(P) {
    // Initialization (precomputation).
    // Caching initialization could boost perf by 7%.
    if (P < BigInt(3))
        throw new Error('sqrt is not defined for small field');
    // Factor P - 1 = Q * 2^S, where Q is odd
    let Q = P - modular_1n;
    let S = 0;
    while (Q % modular_2n === modular_0n) {
        Q /= modular_2n;
        S++;
    }
    // Find the first quadratic non-residue Z >= 2
    let Z = modular_2n;
    const _Fp = Field(P);
    while (FpLegendre(_Fp, Z) === 1) {
        // Basic primality test for P. After x iterations, chance of
        // not finding quadratic non-residue is 2^x, so 2^1000.
        if (Z++ > 1000)
            throw new Error('Cannot find square root: probably non-prime P');
    }
    // Fast-path; usually done before Z, but we do "primality test".
    if (S === 1)
        return sqrt3mod4;
    // Slow-path
    // TODO: test on Fp2 and others
    let cc = _Fp.pow(Z, Q); // c = z^Q
    const Q1div2 = (Q + modular_1n) / modular_2n;
    return function tonelliSlow(Fp, n) {
        if (Fp.is0(n))
            return n;
        // Check if n is a quadratic residue using Legendre symbol
        if (FpLegendre(Fp, n) !== 1)
            throw new Error('Cannot find square root');
        // Initialize variables for the main loop
        let M = S;
        let c = Fp.mul(Fp.ONE, cc); // c = z^Q, move cc from field _Fp into field Fp
        let t = Fp.pow(n, Q); // t = n^Q, first guess at the fudge factor
        let R = Fp.pow(n, Q1div2); // R = n^((Q+1)/2), first guess at the square root
        // Main loop
        // while t != 1
        while (!Fp.eql(t, Fp.ONE)) {
            if (Fp.is0(t))
                return Fp.ZERO; // if t=0 return R=0
            let i = 1;
            // Find the smallest i >= 1 such that t^(2^i) ≡ 1 (mod P)
            let t_tmp = Fp.sqr(t); // t^(2^1)
            while (!Fp.eql(t_tmp, Fp.ONE)) {
                i++;
                t_tmp = Fp.sqr(t_tmp); // t^(2^2)...
                if (i === M)
                    throw new Error('Cannot find square root');
            }
            // Calculate the exponent for b: 2^(M - i - 1)
            const exponent = modular_1n << BigInt(M - i - 1); // bigint is important
            const b = Fp.pow(c, exponent); // b = 2^(M - i - 1)
            // Update variables
            M = i;
            c = Fp.sqr(b); // c = b^2
            t = Fp.mul(t, c); // t = (t * b^2)
            R = Fp.mul(R, b); // R = R*b
        }
        return R;
    };
}
/**
 * Square root for a finite field. Will try optimized versions first:
 *
 * 1. P ≡ 3 (mod 4)
 * 2. P ≡ 5 (mod 8)
 * 3. Tonelli-Shanks algorithm
 *
 * Different algorithms can give different roots, it is up to user to decide which one they want.
 * For example there is FpSqrtOdd/FpSqrtEven to choice root based on oddness (used for hash-to-curve).
 */
function FpSqrt(P) {
    // P ≡ 3 (mod 4) => √n = n^((P+1)/4)
    if (P % _4n === _3n)
        return sqrt3mod4;
    // P ≡ 5 (mod 8) => Atkin algorithm, page 10 of https://eprint.iacr.org/2012/685.pdf
    if (P % _8n === _5n)
        return sqrt5mod8;
    // P ≡ 9 (mod 16) not implemented, see above
    // Tonelli-Shanks algorithm
    return tonelliShanks(P);
}
// Little-endian check for first LE bit (last BE bit);
const isNegativeLE = (num, modulo) => (modular_mod(num, modulo) & modular_1n) === modular_1n;
// prettier-ignore
const FIELD_FIELDS = [
    'create', 'isValid', 'is0', 'neg', 'inv', 'sqrt', 'sqr',
    'eql', 'add', 'sub', 'mul', 'pow', 'div',
    'addN', 'subN', 'mulN', 'sqrN'
];
function modular_validateField(field) {
    const initial = {
        ORDER: 'bigint',
        MASK: 'bigint',
        BYTES: 'number',
        BITS: 'number',
    };
    const opts = FIELD_FIELDS.reduce((map, val) => {
        map[val] = 'function';
        return map;
    }, initial);
    _validateObject(field, opts);
    // const max = 16384;
    // if (field.BYTES < 1 || field.BYTES > max) throw new Error('invalid field');
    // if (field.BITS < 1 || field.BITS > 8 * max) throw new Error('invalid field');
    return field;
}
// Generic field functions
/**
 * Same as `pow` but for Fp: non-constant-time.
 * Unsafe in some contexts: uses ladder, so can expose bigint bits.
 */
function FpPow(Fp, num, power) {
    if (power < modular_0n)
        throw new Error('invalid exponent, negatives unsupported');
    if (power === modular_0n)
        return Fp.ONE;
    if (power === modular_1n)
        return num;
    let p = Fp.ONE;
    let d = num;
    while (power > modular_0n) {
        if (power & modular_1n)
            p = Fp.mul(p, d);
        d = Fp.sqr(d);
        power >>= modular_1n;
    }
    return p;
}
/**
 * Efficiently invert an array of Field elements.
 * Exception-free. Will return `undefined` for 0 elements.
 * @param passZero map 0 to 0 (instead of undefined)
 */
function modular_FpInvertBatch(Fp, nums, passZero = false) {
    const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : undefined);
    // Walk from first to last, multiply them by each other MOD p
    const multipliedAcc = nums.reduce((acc, num, i) => {
        if (Fp.is0(num))
            return acc;
        inverted[i] = acc;
        return Fp.mul(acc, num);
    }, Fp.ONE);
    // Invert last element
    const invertedAcc = Fp.inv(multipliedAcc);
    // Walk from last to first, multiply them by inverted each other MOD p
    nums.reduceRight((acc, num, i) => {
        if (Fp.is0(num))
            return acc;
        inverted[i] = Fp.mul(acc, inverted[i]);
        return Fp.mul(acc, num);
    }, invertedAcc);
    return inverted;
}
// TODO: remove
function FpDiv(Fp, lhs, rhs) {
    return Fp.mul(lhs, typeof rhs === 'bigint' ? invert(rhs, Fp.ORDER) : Fp.inv(rhs));
}
/**
 * Legendre symbol.
 * Legendre constant is used to calculate Legendre symbol (a | p)
 * which denotes the value of a^((p-1)/2) (mod p).
 *
 * * (a | p) ≡ 1    if a is a square (mod p), quadratic residue
 * * (a | p) ≡ -1   if a is not a square (mod p), quadratic non residue
 * * (a | p) ≡ 0    if a ≡ 0 (mod p)
 */
function FpLegendre(Fp, n) {
    // We can use 3rd argument as optional cache of this value
    // but seems unneeded for now. The operation is very fast.
    const p1mod2 = (Fp.ORDER - modular_1n) / modular_2n;
    const powered = Fp.pow(n, p1mod2);
    const yes = Fp.eql(powered, Fp.ONE);
    const zero = Fp.eql(powered, Fp.ZERO);
    const no = Fp.eql(powered, Fp.neg(Fp.ONE));
    if (!yes && !zero && !no)
        throw new Error('invalid Legendre symbol result');
    return yes ? 1 : zero ? 0 : -1;
}
// This function returns True whenever the value x is a square in the field F.
function FpIsSquare(Fp, n) {
    const l = FpLegendre(Fp, n);
    return l === 1;
}
// CURVE.n lengths
function modular_nLength(n, nBitLength) {
    // Bit size, byte size of CURVE.n
    if (nBitLength !== undefined)
        anumber(nBitLength);
    const _nBitLength = nBitLength !== undefined ? nBitLength : n.toString(2).length;
    const nByteLength = Math.ceil(_nBitLength / 8);
    return { nBitLength: _nBitLength, nByteLength };
}
/**
 * Creates a finite field. Major performance optimizations:
 * * 1. Denormalized operations like mulN instead of mul.
 * * 2. Identical object shape: never add or remove keys.
 * * 3. `Object.freeze`.
 * Fragile: always run a benchmark on a change.
 * Security note: operations don't check 'isValid' for all elements for performance reasons,
 * it is caller responsibility to check this.
 * This is low-level code, please make sure you know what you're doing.
 *
 * Note about field properties:
 * * CHARACTERISTIC p = prime number, number of elements in main subgroup.
 * * ORDER q = similar to cofactor in curves, may be composite `q = p^m`.
 *
 * @param ORDER field order, probably prime, or could be composite
 * @param bitLen how many bits the field consumes
 * @param isLE (default: false) if encoding / decoding should be in little-endian
 * @param redef optional faster redefinitions of sqrt and other methods
 */
function Field(ORDER, bitLenOrOpts, isLE = false, opts = {}) {
    if (ORDER <= modular_0n)
        throw new Error('invalid field: expected ORDER > 0, got ' + ORDER);
    let _nbitLength = undefined;
    let _sqrt = undefined;
    if (typeof bitLenOrOpts === 'object' && bitLenOrOpts != null) {
        if (opts.sqrt || isLE)
            throw new Error('cannot specify opts in two arguments');
        const _opts = bitLenOrOpts;
        if (_opts.BITS)
            _nbitLength = _opts.BITS;
        if (_opts.sqrt)
            _sqrt = _opts.sqrt;
        if (typeof _opts.isLE === 'boolean')
            isLE = _opts.isLE;
    }
    else {
        if (typeof bitLenOrOpts === 'number')
            _nbitLength = bitLenOrOpts;
        if (opts.sqrt)
            _sqrt = opts.sqrt;
    }
    const { nBitLength: BITS, nByteLength: BYTES } = modular_nLength(ORDER, _nbitLength);
    if (BYTES > 2048)
        throw new Error('invalid field: expected ORDER of <= 2048 bytes');
    let sqrtP; // cached sqrtP
    const f = Object.freeze({
        ORDER,
        isLE,
        BITS,
        BYTES,
        MASK: utils_bitMask(BITS),
        ZERO: modular_0n,
        ONE: modular_1n,
        create: (num) => modular_mod(num, ORDER),
        isValid: (num) => {
            if (typeof num !== 'bigint')
                throw new Error('invalid field element: expected bigint, got ' + typeof num);
            return modular_0n <= num && num < ORDER; // 0 is valid element, but it's not invertible
        },
        is0: (num) => num === modular_0n,
        // is valid and invertible
        isValidNot0: (num) => !f.is0(num) && f.isValid(num),
        isOdd: (num) => (num & modular_1n) === modular_1n,
        neg: (num) => modular_mod(-num, ORDER),
        eql: (lhs, rhs) => lhs === rhs,
        sqr: (num) => modular_mod(num * num, ORDER),
        add: (lhs, rhs) => modular_mod(lhs + rhs, ORDER),
        sub: (lhs, rhs) => modular_mod(lhs - rhs, ORDER),
        mul: (lhs, rhs) => modular_mod(lhs * rhs, ORDER),
        pow: (num, power) => FpPow(f, num, power),
        div: (lhs, rhs) => modular_mod(lhs * invert(rhs, ORDER), ORDER),
        // Same as above, but doesn't normalize
        sqrN: (num) => num * num,
        addN: (lhs, rhs) => lhs + rhs,
        subN: (lhs, rhs) => lhs - rhs,
        mulN: (lhs, rhs) => lhs * rhs,
        inv: (num) => invert(num, ORDER),
        sqrt: _sqrt ||
            ((n) => {
                if (!sqrtP)
                    sqrtP = FpSqrt(ORDER);
                return sqrtP(f, n);
            }),
        toBytes: (num) => (isLE ? numberToBytesLE(num, BYTES) : utils_numberToBytesBE(num, BYTES)),
        fromBytes: (bytes) => {
            if (bytes.length !== BYTES)
                throw new Error('Field.fromBytes: expected ' + BYTES + ' bytes, got ' + bytes.length);
            return isLE ? utils_bytesToNumberLE(bytes) : utils_bytesToNumberBE(bytes);
        },
        // TODO: we don't need it here, move out to separate fn
        invertBatch: (lst) => modular_FpInvertBatch(f, lst),
        // We can't move this out because Fp6, Fp12 implement it
        // and it's unclear what to return in there.
        cmov: (a, b, c) => (c ? b : a),
    });
    return Object.freeze(f);
}
function FpSqrtOdd(Fp, elm) {
    if (!Fp.isOdd)
        throw new Error("Field doesn't have isOdd");
    const root = Fp.sqrt(elm);
    return Fp.isOdd(root) ? root : Fp.neg(root);
}
function FpSqrtEven(Fp, elm) {
    if (!Fp.isOdd)
        throw new Error("Field doesn't have isOdd");
    const root = Fp.sqrt(elm);
    return Fp.isOdd(root) ? Fp.neg(root) : root;
}
/**
 * "Constant-time" private key generation utility.
 * Same as mapKeyToField, but accepts less bytes (40 instead of 48 for 32-byte field).
 * Which makes it slightly more biased, less secure.
 * @deprecated use `mapKeyToField` instead
 */
function hashToPrivateScalar(hash, groupOrder, isLE = false) {
    hash = ensureBytes('privateHash', hash);
    const hashLen = hash.length;
    const minLen = modular_nLength(groupOrder).nByteLength + 8;
    if (minLen < 24 || hashLen < minLen || hashLen > 1024)
        throw new Error('hashToPrivateScalar: expected ' + minLen + '-1024 bytes of input, got ' + hashLen);
    const num = isLE ? bytesToNumberLE(hash) : bytesToNumberBE(hash);
    return modular_mod(num, groupOrder - modular_1n) + modular_1n;
}
/**
 * Returns total number of bytes consumed by the field element.
 * For example, 32 bytes for usual 256-bit weierstrass curve.
 * @param fieldOrder number of field elements, usually CURVE.n
 * @returns byte length of field
 */
function getFieldBytesLength(fieldOrder) {
    if (typeof fieldOrder !== 'bigint')
        throw new Error('field order must be bigint');
    const bitLength = fieldOrder.toString(2).length;
    return Math.ceil(bitLength / 8);
}
/**
 * Returns minimal amount of bytes that can be safely reduced
 * by field order.
 * Should be 2^-128 for 128-bit curve such as P256.
 * @param fieldOrder number of field elements, usually CURVE.n
 * @returns byte length of target hash
 */
function getMinHashLength(fieldOrder) {
    const length = getFieldBytesLength(fieldOrder);
    return length + Math.ceil(length / 2);
}
/**
 * "Constant-time" private key generation utility.
 * Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
 * and convert them into private scalar, with the modulo bias being negligible.
 * Needs at least 48 bytes of input for 32-byte private key.
 * https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/
 * FIPS 186-5, A.2 https://csrc.nist.gov/publications/detail/fips/186/5/final
 * RFC 9380, https://www.rfc-editor.org/rfc/rfc9380#section-5
 * @param hash hash output from SHA3 or a similar function
 * @param groupOrder size of subgroup - (e.g. secp256k1.CURVE.n)
 * @param isLE interpret hash bytes as LE num
 * @returns valid private scalar
 */
function mapHashToField(key, fieldOrder, isLE = false) {
    const len = key.length;
    const fieldLen = getFieldBytesLength(fieldOrder);
    const minLen = getMinHashLength(fieldOrder);
    // No small numbers: need to understand bias story. No huge numbers: easier to detect JS timings.
    if (len < 16 || len < minLen || len > 1024)
        throw new Error('expected ' + minLen + '-1024 bytes of input, got ' + len);
    const num = isLE ? utils_bytesToNumberLE(key) : utils_bytesToNumberBE(key);
    // `mod(x, 11)` can sometimes produce 0. `mod(x, 10) + 1` is the same, but no 0
    const reduced = modular_mod(num, fieldOrder - modular_1n) + modular_1n;
    return isLE ? numberToBytesLE(reduced, fieldLen) : utils_numberToBytesBE(reduced, fieldLen);
}
//# sourceMappingURL=modular.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/esm/abstract/curve.js
/**
 * Methods for elliptic curve multiplication by scalars.
 * Contains wNAF, pippenger
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */


const curve_0n = BigInt(0);
const curve_1n = BigInt(1);
function negateCt(condition, item) {
    const neg = item.negate();
    return condition ? neg : item;
}
/**
 * Takes a bunch of Projective Points but executes only one
 * inversion on all of them. Inversion is very slow operation,
 * so this improves performance massively.
 * Optimization: converts a list of projective points to a list of identical points with Z=1.
 */
function normalizeZ(c, property, points) {
    const getz = property === 'pz' ? (p) => p.pz : (p) => p.ez;
    const toInv = modular_FpInvertBatch(c.Fp, points.map(getz));
    // @ts-ignore
    const affined = points.map((p, i) => p.toAffine(toInv[i]));
    return affined.map(c.fromAffine);
}
function validateW(W, bits) {
    if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
        throw new Error('invalid window size, expected [1..' + bits + '], got W=' + W);
}
function calcWOpts(W, scalarBits) {
    validateW(W, scalarBits);
    const windows = Math.ceil(scalarBits / W) + 1; // W=8 33. Not 32, because we skip zero
    const windowSize = 2 ** (W - 1); // W=8 128. Not 256, because we skip zero
    const maxNumber = 2 ** W; // W=8 256
    const mask = utils_bitMask(W); // W=8 255 == mask 0b11111111
    const shiftBy = BigInt(W); // W=8 8
    return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window, wOpts) {
    const { windowSize, mask, maxNumber, shiftBy } = wOpts;
    let wbits = Number(n & mask); // extract W bits.
    let nextN = n >> shiftBy; // shift number by W bits.
    // What actually happens here:
    // const highestBit = Number(mask ^ (mask >> 1n));
    // let wbits2 = wbits - 1; // skip zero
    // if (wbits2 & highestBit) { wbits2 ^= Number(mask); // (~);
    // split if bits > max: +224 => 256-32
    if (wbits > windowSize) {
        // we skip zero, which means instead of `>= size-1`, we do `> size`
        wbits -= maxNumber; // -32, can be maxNumber - wbits, but then we need to set isNeg here.
        nextN += curve_1n; // +256 (carry)
    }
    const offsetStart = window * windowSize;
    const offset = offsetStart + Math.abs(wbits) - 1; // -1 because we skip zero
    const isZero = wbits === 0; // is current window slice a 0?
    const isNeg = wbits < 0; // is current window slice negative?
    const isNegF = window % 2 !== 0; // fake random statement for noise
    const offsetF = offsetStart; // fake offset for noise
    return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
function validateMSMPoints(points, c) {
    if (!Array.isArray(points))
        throw new Error('array expected');
    points.forEach((p, i) => {
        if (!(p instanceof c))
            throw new Error('invalid point at index ' + i);
    });
}
function validateMSMScalars(scalars, field) {
    if (!Array.isArray(scalars))
        throw new Error('array of scalars expected');
    scalars.forEach((s, i) => {
        if (!field.isValid(s))
            throw new Error('invalid scalar at index ' + i);
    });
}
// Since points in different groups cannot be equal (different object constructor),
// we can have single place to store precomputes.
// Allows to make points frozen / immutable.
const pointPrecomputes = new WeakMap();
const pointWindowSizes = new WeakMap();
function getW(P) {
    return pointWindowSizes.get(P) || 1;
}
function assert0(n) {
    if (n !== curve_0n)
        throw new Error('invalid wNAF');
}
/**
 * Elliptic curve multiplication of Point by scalar. Fragile.
 * Scalars should always be less than curve order: this should be checked inside of a curve itself.
 * Creates precomputation tables for fast multiplication:
 * - private scalar is split by fixed size windows of W bits
 * - every window point is collected from window's table & added to accumulator
 * - since windows are different, same point inside tables won't be accessed more than once per calc
 * - each multiplication is 'Math.ceil(CURVE_ORDER / 𝑊) + 1' point additions (fixed for any scalar)
 * - +1 window is neccessary for wNAF
 * - wNAF reduces table size: 2x less memory + 2x faster generation, but 10% slower multiplication
 *
 * @todo Research returning 2d JS array of windows, instead of a single window.
 * This would allow windows to be in different memory locations
 */
function wNAF(c, bits) {
    return {
        constTimeNegate: negateCt,
        hasPrecomputes(elm) {
            return getW(elm) !== 1;
        },
        // non-const time multiplication ladder
        unsafeLadder(elm, n, p = c.ZERO) {
            let d = elm;
            while (n > curve_0n) {
                if (n & curve_1n)
                    p = p.add(d);
                d = d.double();
                n >>= curve_1n;
            }
            return p;
        },
        /**
         * Creates a wNAF precomputation window. Used for caching.
         * Default window size is set by `utils.precompute()` and is equal to 8.
         * Number of precomputed points depends on the curve size:
         * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
         * - 𝑊 is the window size
         * - 𝑛 is the bitlength of the curve order.
         * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
         * @param elm Point instance
         * @param W window size
         * @returns precomputed point tables flattened to a single array
         */
        precomputeWindow(elm, W) {
            const { windows, windowSize } = calcWOpts(W, bits);
            const points = [];
            let p = elm;
            let base = p;
            for (let window = 0; window < windows; window++) {
                base = p;
                points.push(base);
                // i=1, bc we skip 0
                for (let i = 1; i < windowSize; i++) {
                    base = base.add(p);
                    points.push(base);
                }
                p = base.double();
            }
            return points;
        },
        /**
         * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
         * @param W window size
         * @param precomputes precomputed tables
         * @param n scalar (we don't check here, but should be less than curve order)
         * @returns real and fake (for const-time) points
         */
        wNAF(W, precomputes, n) {
            // Smaller version:
            // https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
            // TODO: check the scalar is less than group order?
            // wNAF behavior is undefined otherwise. But have to carefully remove
            // other checks before wNAF. ORDER == bits here.
            // Accumulators
            let p = c.ZERO;
            let f = c.BASE;
            // This code was first written with assumption that 'f' and 'p' will never be infinity point:
            // since each addition is multiplied by 2 ** W, it cannot cancel each other. However,
            // there is negate now: it is possible that negated element from low value
            // would be the same as high element, which will create carry into next window.
            // It's not obvious how this can fail, but still worth investigating later.
            const wo = calcWOpts(W, bits);
            for (let window = 0; window < wo.windows; window++) {
                // (n === _0n) is handled and not early-exited. isEven and offsetF are used for noise
                const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
                n = nextN;
                if (isZero) {
                    // bits are 0: add garbage to fake point
                    // Important part for const-time getPublicKey: add random "noise" point to f.
                    f = f.add(negateCt(isNegF, precomputes[offsetF]));
                }
                else {
                    // bits are 1: add to result point
                    p = p.add(negateCt(isNeg, precomputes[offset]));
                }
            }
            assert0(n);
            // Return both real and fake points: JIT won't eliminate f.
            // At this point there is a way to F be infinity-point even if p is not,
            // which makes it less const-time: around 1 bigint multiply.
            return { p, f };
        },
        /**
         * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
         * @param W window size
         * @param precomputes precomputed tables
         * @param n scalar (we don't check here, but should be less than curve order)
         * @param acc accumulator point to add result of multiplication
         * @returns point
         */
        wNAFUnsafe(W, precomputes, n, acc = c.ZERO) {
            const wo = calcWOpts(W, bits);
            for (let window = 0; window < wo.windows; window++) {
                if (n === curve_0n)
                    break; // Early-exit, skip 0 value
                const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
                n = nextN;
                if (isZero) {
                    // Window bits are 0: skip processing.
                    // Move to next window.
                    continue;
                }
                else {
                    const item = precomputes[offset];
                    acc = acc.add(isNeg ? item.negate() : item); // Re-using acc allows to save adds in MSM
                }
            }
            assert0(n);
            return acc;
        },
        getPrecomputes(W, P, transform) {
            // Calculate precomputes on a first run, reuse them after
            let comp = pointPrecomputes.get(P);
            if (!comp) {
                comp = this.precomputeWindow(P, W);
                if (W !== 1) {
                    // Doing transform outside of if brings 15% perf hit
                    if (typeof transform === 'function')
                        comp = transform(comp);
                    pointPrecomputes.set(P, comp);
                }
            }
            return comp;
        },
        wNAFCached(P, n, transform) {
            const W = getW(P);
            return this.wNAF(W, this.getPrecomputes(W, P, transform), n);
        },
        wNAFCachedUnsafe(P, n, transform, prev) {
            const W = getW(P);
            if (W === 1)
                return this.unsafeLadder(P, n, prev); // For W=1 ladder is ~x2 faster
            return this.wNAFUnsafe(W, this.getPrecomputes(W, P, transform), n, prev);
        },
        // We calculate precomputes for elliptic curve point multiplication
        // using windowed method. This specifies window size and
        // stores precomputed values. Usually only base point would be precomputed.
        setWindowSize(P, W) {
            validateW(W, bits);
            pointWindowSizes.set(P, W);
            pointPrecomputes.delete(P);
        },
    };
}
/**
 * Endomorphism-specific multiplication for Koblitz curves.
 * Cost: 128 dbl, 0-256 adds.
 */
function mulEndoUnsafe(c, point, k1, k2) {
    let acc = point;
    let p1 = c.ZERO;
    let p2 = c.ZERO;
    while (k1 > curve_0n || k2 > curve_0n) {
        if (k1 & curve_1n)
            p1 = p1.add(acc);
        if (k2 & curve_1n)
            p2 = p2.add(acc);
        acc = acc.double();
        k1 >>= curve_1n;
        k2 >>= curve_1n;
    }
    return { p1, p2 };
}
/**
 * Pippenger algorithm for multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
 * 30x faster vs naive addition on L=4096, 10x faster than precomputes.
 * For N=254bit, L=1, it does: 1024 ADD + 254 DBL. For L=5: 1536 ADD + 254 DBL.
 * Algorithmically constant-time (for same L), even when 1 point + scalar, or when scalar = 0.
 * @param c Curve Point constructor
 * @param fieldN field over CURVE.N - important that it's not over CURVE.P
 * @param points array of L curve points
 * @param scalars array of L scalars (aka private keys / bigints)
 */
function pippenger(c, fieldN, points, scalars) {
    // If we split scalars by some window (let's say 8 bits), every chunk will only
    // take 256 buckets even if there are 4096 scalars, also re-uses double.
    // TODO:
    // - https://eprint.iacr.org/2024/750.pdf
    // - https://tches.iacr.org/index.php/TCHES/article/view/10287
    // 0 is accepted in scalars
    validateMSMPoints(points, c);
    validateMSMScalars(scalars, fieldN);
    const plength = points.length;
    const slength = scalars.length;
    if (plength !== slength)
        throw new Error('arrays of points and scalars must have equal length');
    // if (plength === 0) throw new Error('array must be of length >= 2');
    const zero = c.ZERO;
    const wbits = bitLen(BigInt(plength));
    let windowSize = 1; // bits
    if (wbits > 12)
        windowSize = wbits - 3;
    else if (wbits > 4)
        windowSize = wbits - 2;
    else if (wbits > 0)
        windowSize = 2;
    const MASK = utils_bitMask(windowSize);
    const buckets = new Array(Number(MASK) + 1).fill(zero); // +1 for zero array
    const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
    let sum = zero;
    for (let i = lastBits; i >= 0; i -= windowSize) {
        buckets.fill(zero);
        for (let j = 0; j < slength; j++) {
            const scalar = scalars[j];
            const wbits = Number((scalar >> BigInt(i)) & MASK);
            buckets[wbits] = buckets[wbits].add(points[j]);
        }
        let resI = zero; // not using this will do small speed-up, but will lose ct
        // Skip first bucket, because it is zero
        for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
            sumI = sumI.add(buckets[j]);
            resI = resI.add(sumI);
        }
        sum = sum.add(resI);
        if (i !== 0)
            for (let j = 0; j < windowSize; j++)
                sum = sum.double();
    }
    return sum;
}
/**
 * Precomputed multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
 * @param c Curve Point constructor
 * @param fieldN field over CURVE.N - important that it's not over CURVE.P
 * @param points array of L curve points
 * @returns function which multiplies points with scaars
 */
function precomputeMSMUnsafe(c, fieldN, points, windowSize) {
    /**
     * Performance Analysis of Window-based Precomputation
     *
     * Base Case (256-bit scalar, 8-bit window):
     * - Standard precomputation requires:
     *   - 31 additions per scalar × 256 scalars = 7,936 ops
     *   - Plus 255 summary additions = 8,191 total ops
     *   Note: Summary additions can be optimized via accumulator
     *
     * Chunked Precomputation Analysis:
     * - Using 32 chunks requires:
     *   - 255 additions per chunk
     *   - 256 doublings
     *   - Total: (255 × 32) + 256 = 8,416 ops
     *
     * Memory Usage Comparison:
     * Window Size | Standard Points | Chunked Points
     * ------------|-----------------|---------------
     *     4-bit   |     520         |      15
     *     8-bit   |    4,224        |     255
     *    10-bit   |   13,824        |   1,023
     *    16-bit   |  557,056        |  65,535
     *
     * Key Advantages:
     * 1. Enables larger window sizes due to reduced memory overhead
     * 2. More efficient for smaller scalar counts:
     *    - 16 chunks: (16 × 255) + 256 = 4,336 ops
     *    - ~2x faster than standard 8,191 ops
     *
     * Limitations:
     * - Not suitable for plain precomputes (requires 256 constant doublings)
     * - Performance degrades with larger scalar counts:
     *   - Optimal for ~256 scalars
     *   - Less efficient for 4096+ scalars (Pippenger preferred)
     */
    validateW(windowSize, fieldN.BITS);
    validateMSMPoints(points, c);
    const zero = c.ZERO;
    const tableSize = 2 ** windowSize - 1; // table size (without zero)
    const chunks = Math.ceil(fieldN.BITS / windowSize); // chunks of item
    const MASK = bitMask(windowSize);
    const tables = points.map((p) => {
        const res = [];
        for (let i = 0, acc = p; i < tableSize; i++) {
            res.push(acc);
            acc = acc.add(p);
        }
        return res;
    });
    return (scalars) => {
        validateMSMScalars(scalars, fieldN);
        if (scalars.length > points.length)
            throw new Error('array of scalars must be smaller than array of points');
        let res = zero;
        for (let i = 0; i < chunks; i++) {
            // No need to double if accumulator is still zero.
            if (res !== zero)
                for (let j = 0; j < windowSize; j++)
                    res = res.double();
            const shiftBy = BigInt(chunks * windowSize - (i + 1) * windowSize);
            for (let j = 0; j < scalars.length; j++) {
                const n = scalars[j];
                const curr = Number((n >> shiftBy) & MASK);
                if (!curr)
                    continue; // skip zero scalars chunks
                res = res.add(tables[j][curr - 1]);
            }
        }
        return res;
    };
}
// TODO: remove
/** @deprecated */
function validateBasic(curve) {
    validateField(curve.Fp);
    validateObject(curve, {
        n: 'bigint',
        h: 'bigint',
        Gx: 'field',
        Gy: 'field',
    }, {
        nBitLength: 'isSafeInteger',
        nByteLength: 'isSafeInteger',
    });
    // Set defaults
    return Object.freeze({
        ...nLength(curve.n, curve.nBitLength),
        ...curve,
        ...{ p: curve.Fp.ORDER },
    });
}
function createField(order, field) {
    if (field) {
        if (field.ORDER !== order)
            throw new Error('Field.ORDER must match order: Fp == p, Fn == n');
        modular_validateField(field);
        return field;
    }
    else {
        return Field(order);
    }
}
/** Validates CURVE opts and creates fields */
function _createCurveFields(type, CURVE, curveOpts = {}) {
    if (!CURVE || typeof CURVE !== 'object')
        throw new Error(`expected valid ${type} CURVE object`);
    for (const p of ['p', 'n', 'h']) {
        const val = CURVE[p];
        if (!(typeof val === 'bigint' && val > curve_0n))
            throw new Error(`CURVE.${p} must be positive bigint`);
    }
    const Fp = createField(CURVE.p, curveOpts.Fp);
    const Fn = createField(CURVE.n, curveOpts.Fn);
    const _b = type === 'weierstrass' ? 'b' : 'd';
    const params = ['Gx', 'Gy', 'a', _b];
    for (const p of params) {
        // @ts-ignore
        if (!Fp.isValid(CURVE[p]))
            throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
    }
    return { Fp, Fn };
}
//# sourceMappingURL=curve.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/esm/abstract/weierstrass.js
/**
 * Short Weierstrass curve methods. The formula is: y² = x³ + ax + b.
 *
 * ### Design rationale for types
 *
 * * Interaction between classes from different curves should fail:
 *   `k256.Point.BASE.add(p256.Point.BASE)`
 * * For this purpose we want to use `instanceof` operator, which is fast and works during runtime
 * * Different calls of `curve()` would return different classes -
 *   `curve(params) !== curve(params)`: if somebody decided to monkey-patch their curve,
 *   it won't affect others
 *
 * TypeScript can't infer types for classes created inside a function. Classes is one instance
 * of nominative types in TypeScript and interfaces only check for shape, so it's hard to create
 * unique type for every function call.
 *
 * We can use generic types via some param, like curve opts, but that would:
 *     1. Enable interaction between `curve(params)` and `curve(params)` (curves of same params)
 *     which is hard to debug.
 *     2. Params can be generic and we can't enforce them to be constant value:
 *     if somebody creates curve from non-constant params,
 *     it would be allowed to interact with other curves with non-constant params
 *
 * @todo https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#unique-symbol
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */




function validateSigVerOpts(opts) {
    if (opts.lowS !== undefined)
        abool('lowS', opts.lowS);
    if (opts.prehash !== undefined)
        abool('prehash', opts.prehash);
}
class DERErr extends Error {
    constructor(m = '') {
        super(m);
    }
}
/**
 * ASN.1 DER encoding utilities. ASN is very complex & fragile. Format:
 *
 *     [0x30 (SEQUENCE), bytelength, 0x02 (INTEGER), intLength, R, 0x02 (INTEGER), intLength, S]
 *
 * Docs: https://letsencrypt.org/docs/a-warm-welcome-to-asn1-and-der/, https://luca.ntop.org/Teaching/Appunti/asn1.html
 */
const DER = {
    // asn.1 DER encoding utils
    Err: DERErr,
    // Basic building block is TLV (Tag-Length-Value)
    _tlv: {
        encode: (tag, data) => {
            const { Err: E } = DER;
            if (tag < 0 || tag > 256)
                throw new E('tlv.encode: wrong tag');
            if (data.length & 1)
                throw new E('tlv.encode: unpadded data');
            const dataLen = data.length / 2;
            const len = numberToHexUnpadded(dataLen);
            if ((len.length / 2) & 128)
                throw new E('tlv.encode: long form length too big');
            // length of length with long form flag
            const lenLen = dataLen > 127 ? numberToHexUnpadded((len.length / 2) | 128) : '';
            const t = numberToHexUnpadded(tag);
            return t + lenLen + len + data;
        },
        // v - value, l - left bytes (unparsed)
        decode(tag, data) {
            const { Err: E } = DER;
            let pos = 0;
            if (tag < 0 || tag > 256)
                throw new E('tlv.encode: wrong tag');
            if (data.length < 2 || data[pos++] !== tag)
                throw new E('tlv.decode: wrong tlv');
            const first = data[pos++];
            const isLong = !!(first & 128); // First bit of first length byte is flag for short/long form
            let length = 0;
            if (!isLong)
                length = first;
            else {
                // Long form: [longFlag(1bit), lengthLength(7bit), length (BE)]
                const lenLen = first & 127;
                if (!lenLen)
                    throw new E('tlv.decode(long): indefinite length not supported');
                if (lenLen > 4)
                    throw new E('tlv.decode(long): byte length is too big'); // this will overflow u32 in js
                const lengthBytes = data.subarray(pos, pos + lenLen);
                if (lengthBytes.length !== lenLen)
                    throw new E('tlv.decode: length bytes not complete');
                if (lengthBytes[0] === 0)
                    throw new E('tlv.decode(long): zero leftmost byte');
                for (const b of lengthBytes)
                    length = (length << 8) | b;
                pos += lenLen;
                if (length < 128)
                    throw new E('tlv.decode(long): not minimal encoding');
            }
            const v = data.subarray(pos, pos + length);
            if (v.length !== length)
                throw new E('tlv.decode: wrong value length');
            return { v, l: data.subarray(pos + length) };
        },
    },
    // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
    // since we always use positive integers here. It must always be empty:
    // - add zero byte if exists
    // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
    _int: {
        encode(num) {
            const { Err: E } = DER;
            if (num < weierstrass_0n)
                throw new E('integer: negative integers are not allowed');
            let hex = numberToHexUnpadded(num);
            // Pad with zero byte if negative flag is present
            if (Number.parseInt(hex[0], 16) & 0b1000)
                hex = '00' + hex;
            if (hex.length & 1)
                throw new E('unexpected DER parsing assertion: unpadded hex');
            return hex;
        },
        decode(data) {
            const { Err: E } = DER;
            if (data[0] & 128)
                throw new E('invalid signature integer: negative');
            if (data[0] === 0x00 && !(data[1] & 128))
                throw new E('invalid signature integer: unnecessary leading zero');
            return utils_bytesToNumberBE(data);
        },
    },
    toSig(hex) {
        // parse DER signature
        const { Err: E, _int: int, _tlv: tlv } = DER;
        const data = utils_ensureBytes('signature', hex);
        const { v: seqBytes, l: seqLeftBytes } = tlv.decode(0x30, data);
        if (seqLeftBytes.length)
            throw new E('invalid signature: left bytes after parsing');
        const { v: rBytes, l: rLeftBytes } = tlv.decode(0x02, seqBytes);
        const { v: sBytes, l: sLeftBytes } = tlv.decode(0x02, rLeftBytes);
        if (sLeftBytes.length)
            throw new E('invalid signature: left bytes after parsing');
        return { r: int.decode(rBytes), s: int.decode(sBytes) };
    },
    hexFromSig(sig) {
        const { _tlv: tlv, _int: int } = DER;
        const rs = tlv.encode(0x02, int.encode(sig.r));
        const ss = tlv.encode(0x02, int.encode(sig.s));
        const seq = rs + ss;
        return tlv.encode(0x30, seq);
    },
};
// Be friendly to bad ECMAScript parsers by not using bigint literals
// prettier-ignore
const weierstrass_0n = BigInt(0), weierstrass_1n = BigInt(1), weierstrass_2n = BigInt(2), weierstrass_3n = BigInt(3), weierstrass_4n = BigInt(4);
// TODO: remove
function _legacyHelperEquat(Fp, a, b) {
    /**
     * y² = x³ + ax + b: Short weierstrass curve formula. Takes x, returns y².
     * @returns y²
     */
    function weierstrassEquation(x) {
        const x2 = Fp.sqr(x); // x * x
        const x3 = Fp.mul(x2, x); // x² * x
        return Fp.add(Fp.add(x3, Fp.mul(x, a)), b); // x³ + a * x + b
    }
    return weierstrassEquation;
}
function _legacyHelperNormPriv(Fn, allowedPrivateKeyLengths, wrapPrivateKey) {
    const { BYTES: expected } = Fn;
    // Validates if priv key is valid and converts it to bigint.
    function normPrivateKeyToScalar(key) {
        let num;
        if (typeof key === 'bigint') {
            num = key;
        }
        else {
            let bytes = utils_ensureBytes('private key', key);
            if (allowedPrivateKeyLengths) {
                if (!allowedPrivateKeyLengths.includes(bytes.length * 2))
                    throw new Error('invalid private key');
                const padded = new Uint8Array(expected);
                padded.set(bytes, padded.length - bytes.length);
                bytes = padded;
            }
            try {
                num = Fn.fromBytes(bytes);
            }
            catch (error) {
                throw new Error(`invalid private key: expected ui8a of size ${expected}, got ${typeof key}`);
            }
        }
        if (wrapPrivateKey)
            num = Fn.create(num); // disabled by default, enabled for BLS
        if (!Fn.isValidNot0(num))
            throw new Error('invalid private key: out of range [1..N-1]');
        return num;
    }
    return normPrivateKeyToScalar;
}
function weierstrassN(CURVE, curveOpts = {}) {
    const { Fp, Fn } = _createCurveFields('weierstrass', CURVE, curveOpts);
    const { h: cofactor, n: CURVE_ORDER } = CURVE;
    _validateObject(curveOpts, {}, {
        allowInfinityPoint: 'boolean',
        clearCofactor: 'function',
        isTorsionFree: 'function',
        fromBytes: 'function',
        toBytes: 'function',
        endo: 'object',
        wrapPrivateKey: 'boolean',
    });
    const { endo } = curveOpts;
    if (endo) {
        // validateObject(endo, { beta: 'bigint', splitScalar: 'function' });
        if (!Fp.is0(CURVE.a) ||
            typeof endo.beta !== 'bigint' ||
            typeof endo.splitScalar !== 'function') {
            throw new Error('invalid endo: expected "beta": bigint and "splitScalar": function');
        }
    }
    function assertCompressionIsSupported() {
        if (!Fp.isOdd)
            throw new Error('compression is not supported: Field does not have .isOdd()');
    }
    // Implements IEEE P1363 point encoding
    function pointToBytes(_c, point, isCompressed) {
        const { x, y } = point.toAffine();
        const bx = Fp.toBytes(x);
        abool('isCompressed', isCompressed);
        if (isCompressed) {
            assertCompressionIsSupported();
            const hasEvenY = !Fp.isOdd(y);
            return utils_concatBytes(pprefix(hasEvenY), bx);
        }
        else {
            return utils_concatBytes(Uint8Array.of(0x04), bx, Fp.toBytes(y));
        }
    }
    function pointFromBytes(bytes) {
        abytes(bytes);
        const L = Fp.BYTES;
        const LC = L + 1; // length compressed, e.g. 33 for 32-byte field
        const LU = 2 * L + 1; // length uncompressed, e.g. 65 for 32-byte field
        const length = bytes.length;
        const head = bytes[0];
        const tail = bytes.subarray(1);
        // No actual validation is done here: use .assertValidity()
        if (length === LC && (head === 0x02 || head === 0x03)) {
            const x = Fp.fromBytes(tail);
            if (!Fp.isValid(x))
                throw new Error('bad point: is not on curve, wrong x');
            const y2 = weierstrassEquation(x); // y² = x³ + ax + b
            let y;
            try {
                y = Fp.sqrt(y2); // y = y² ^ (p+1)/4
            }
            catch (sqrtError) {
                const err = sqrtError instanceof Error ? ': ' + sqrtError.message : '';
                throw new Error('bad point: is not on curve, sqrt error' + err);
            }
            assertCompressionIsSupported();
            const isYOdd = Fp.isOdd(y); // (y & _1n) === _1n;
            const isHeadOdd = (head & 1) === 1; // ECDSA-specific
            if (isHeadOdd !== isYOdd)
                y = Fp.neg(y);
            return { x, y };
        }
        else if (length === LU && head === 0x04) {
            // TODO: more checks
            const x = Fp.fromBytes(tail.subarray(L * 0, L * 1));
            const y = Fp.fromBytes(tail.subarray(L * 1, L * 2));
            if (!isValidXY(x, y))
                throw new Error('bad point: is not on curve');
            return { x, y };
        }
        else {
            throw new Error(`bad point: got length ${length}, expected compressed=${LC} or uncompressed=${LU}`);
        }
    }
    const toBytes = curveOpts.toBytes || pointToBytes;
    const fromBytes = curveOpts.fromBytes || pointFromBytes;
    const weierstrassEquation = _legacyHelperEquat(Fp, CURVE.a, CURVE.b);
    // TODO: move top-level
    /** Checks whether equation holds for given x, y: y² == x³ + ax + b */
    function isValidXY(x, y) {
        const left = Fp.sqr(y); // y²
        const right = weierstrassEquation(x); // x³ + ax + b
        return Fp.eql(left, right);
    }
    // Validate whether the passed curve params are valid.
    // Test 1: equation y² = x³ + ax + b should work for generator point.
    if (!isValidXY(CURVE.Gx, CURVE.Gy))
        throw new Error('bad curve params: generator point');
    // Test 2: discriminant Δ part should be non-zero: 4a³ + 27b² != 0.
    // Guarantees curve is genus-1, smooth (non-singular).
    const _4a3 = Fp.mul(Fp.pow(CURVE.a, weierstrass_3n), weierstrass_4n);
    const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
    if (Fp.is0(Fp.add(_4a3, _27b2)))
        throw new Error('bad curve params: a or b');
    /** Asserts coordinate is valid: 0 <= n < Fp.ORDER. */
    function acoord(title, n, banZero = false) {
        if (!Fp.isValid(n) || (banZero && Fp.is0(n)))
            throw new Error(`bad point coordinate ${title}`);
        return n;
    }
    function aprjpoint(other) {
        if (!(other instanceof Point))
            throw new Error('ProjectivePoint expected');
    }
    // Memoized toAffine / validity check. They are heavy. Points are immutable.
    // Converts Projective point to affine (x, y) coordinates.
    // Can accept precomputed Z^-1 - for example, from invertBatch.
    // (X, Y, Z) ∋ (x=X/Z, y=Y/Z)
    const toAffineMemo = memoized((p, iz) => {
        const { px: x, py: y, pz: z } = p;
        // Fast-path for normalized points
        if (Fp.eql(z, Fp.ONE))
            return { x, y };
        const is0 = p.is0();
        // If invZ was 0, we return zero point. However we still want to execute
        // all operations, so we replace invZ with a random number, 1.
        if (iz == null)
            iz = is0 ? Fp.ONE : Fp.inv(z);
        const ax = Fp.mul(x, iz);
        const ay = Fp.mul(y, iz);
        const zz = Fp.mul(z, iz);
        if (is0)
            return { x: Fp.ZERO, y: Fp.ZERO };
        if (!Fp.eql(zz, Fp.ONE))
            throw new Error('invZ was invalid');
        return { x: ax, y: ay };
    });
    // NOTE: on exception this will crash 'cached' and no value will be set.
    // Otherwise true will be return
    const assertValidMemo = memoized((p) => {
        if (p.is0()) {
            // (0, 1, 0) aka ZERO is invalid in most contexts.
            // In BLS, ZERO can be serialized, so we allow it.
            // (0, 0, 0) is invalid representation of ZERO.
            if (curveOpts.allowInfinityPoint && !Fp.is0(p.py))
                return;
            throw new Error('bad point: ZERO');
        }
        // Some 3rd-party test vectors require different wording between here & `fromCompressedHex`
        const { x, y } = p.toAffine();
        if (!Fp.isValid(x) || !Fp.isValid(y))
            throw new Error('bad point: x or y not field elements');
        if (!isValidXY(x, y))
            throw new Error('bad point: equation left != right');
        if (!p.isTorsionFree())
            throw new Error('bad point: not in prime-order subgroup');
        return true;
    });
    function finishEndo(endoBeta, k1p, k2p, k1neg, k2neg) {
        k2p = new Point(Fp.mul(k2p.px, endoBeta), k2p.py, k2p.pz);
        k1p = negateCt(k1neg, k1p);
        k2p = negateCt(k2neg, k2p);
        return k1p.add(k2p);
    }
    /**
     * Projective Point works in 3d / projective (homogeneous) coordinates:(X, Y, Z) ∋ (x=X/Z, y=Y/Z).
     * Default Point works in 2d / affine coordinates: (x, y).
     * We're doing calculations in projective, because its operations don't require costly inversion.
     */
    class Point {
        /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
        constructor(px, py, pz) {
            this.px = acoord('x', px);
            this.py = acoord('y', py, true);
            this.pz = acoord('z', pz);
            Object.freeze(this);
        }
        /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
        static fromAffine(p) {
            const { x, y } = p || {};
            if (!p || !Fp.isValid(x) || !Fp.isValid(y))
                throw new Error('invalid affine point');
            if (p instanceof Point)
                throw new Error('projective point not allowed');
            // (0, 0) would've produced (0, 0, 1) - instead, we need (0, 1, 0)
            if (Fp.is0(x) && Fp.is0(y))
                return Point.ZERO;
            return new Point(x, y, Fp.ONE);
        }
        get x() {
            return this.toAffine().x;
        }
        get y() {
            return this.toAffine().y;
        }
        static normalizeZ(points) {
            return normalizeZ(Point, 'pz', points);
        }
        static fromBytes(bytes) {
            abytes(bytes);
            return Point.fromHex(bytes);
        }
        /** Converts hash string or Uint8Array to Point. */
        static fromHex(hex) {
            const P = Point.fromAffine(fromBytes(utils_ensureBytes('pointHex', hex)));
            P.assertValidity();
            return P;
        }
        /** Multiplies generator point by privateKey. */
        static fromPrivateKey(privateKey) {
            const normPrivateKeyToScalar = _legacyHelperNormPriv(Fn, curveOpts.allowedPrivateKeyLengths, curveOpts.wrapPrivateKey);
            return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
        }
        /** Multiscalar Multiplication */
        static msm(points, scalars) {
            return pippenger(Point, Fn, points, scalars);
        }
        /**
         *
         * @param windowSize
         * @param isLazy true will defer table computation until the first multiplication
         * @returns
         */
        precompute(windowSize = 8, isLazy = true) {
            wnaf.setWindowSize(this, windowSize);
            if (!isLazy)
                this.multiply(weierstrass_3n); // random number
            return this;
        }
        /** "Private method", don't use it directly */
        _setWindowSize(windowSize) {
            this.precompute(windowSize);
        }
        // TODO: return `this`
        /** A point on curve is valid if it conforms to equation. */
        assertValidity() {
            assertValidMemo(this);
        }
        hasEvenY() {
            const { y } = this.toAffine();
            if (!Fp.isOdd)
                throw new Error("Field doesn't support isOdd");
            return !Fp.isOdd(y);
        }
        /** Compare one point to another. */
        equals(other) {
            aprjpoint(other);
            const { px: X1, py: Y1, pz: Z1 } = this;
            const { px: X2, py: Y2, pz: Z2 } = other;
            const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
            const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
            return U1 && U2;
        }
        /** Flips point to one corresponding to (x, -y) in Affine coordinates. */
        negate() {
            return new Point(this.px, Fp.neg(this.py), this.pz);
        }
        // Renes-Costello-Batina exception-free doubling formula.
        // There is 30% faster Jacobian formula, but it is not complete.
        // https://eprint.iacr.org/2015/1060, algorithm 3
        // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
        double() {
            const { a, b } = CURVE;
            const b3 = Fp.mul(b, weierstrass_3n);
            const { px: X1, py: Y1, pz: Z1 } = this;
            let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
            let t0 = Fp.mul(X1, X1); // step 1
            let t1 = Fp.mul(Y1, Y1);
            let t2 = Fp.mul(Z1, Z1);
            let t3 = Fp.mul(X1, Y1);
            t3 = Fp.add(t3, t3); // step 5
            Z3 = Fp.mul(X1, Z1);
            Z3 = Fp.add(Z3, Z3);
            X3 = Fp.mul(a, Z3);
            Y3 = Fp.mul(b3, t2);
            Y3 = Fp.add(X3, Y3); // step 10
            X3 = Fp.sub(t1, Y3);
            Y3 = Fp.add(t1, Y3);
            Y3 = Fp.mul(X3, Y3);
            X3 = Fp.mul(t3, X3);
            Z3 = Fp.mul(b3, Z3); // step 15
            t2 = Fp.mul(a, t2);
            t3 = Fp.sub(t0, t2);
            t3 = Fp.mul(a, t3);
            t3 = Fp.add(t3, Z3);
            Z3 = Fp.add(t0, t0); // step 20
            t0 = Fp.add(Z3, t0);
            t0 = Fp.add(t0, t2);
            t0 = Fp.mul(t0, t3);
            Y3 = Fp.add(Y3, t0);
            t2 = Fp.mul(Y1, Z1); // step 25
            t2 = Fp.add(t2, t2);
            t0 = Fp.mul(t2, t3);
            X3 = Fp.sub(X3, t0);
            Z3 = Fp.mul(t2, t1);
            Z3 = Fp.add(Z3, Z3); // step 30
            Z3 = Fp.add(Z3, Z3);
            return new Point(X3, Y3, Z3);
        }
        // Renes-Costello-Batina exception-free addition formula.
        // There is 30% faster Jacobian formula, but it is not complete.
        // https://eprint.iacr.org/2015/1060, algorithm 1
        // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
        add(other) {
            aprjpoint(other);
            const { px: X1, py: Y1, pz: Z1 } = this;
            const { px: X2, py: Y2, pz: Z2 } = other;
            let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
            const a = CURVE.a;
            const b3 = Fp.mul(CURVE.b, weierstrass_3n);
            let t0 = Fp.mul(X1, X2); // step 1
            let t1 = Fp.mul(Y1, Y2);
            let t2 = Fp.mul(Z1, Z2);
            let t3 = Fp.add(X1, Y1);
            let t4 = Fp.add(X2, Y2); // step 5
            t3 = Fp.mul(t3, t4);
            t4 = Fp.add(t0, t1);
            t3 = Fp.sub(t3, t4);
            t4 = Fp.add(X1, Z1);
            let t5 = Fp.add(X2, Z2); // step 10
            t4 = Fp.mul(t4, t5);
            t5 = Fp.add(t0, t2);
            t4 = Fp.sub(t4, t5);
            t5 = Fp.add(Y1, Z1);
            X3 = Fp.add(Y2, Z2); // step 15
            t5 = Fp.mul(t5, X3);
            X3 = Fp.add(t1, t2);
            t5 = Fp.sub(t5, X3);
            Z3 = Fp.mul(a, t4);
            X3 = Fp.mul(b3, t2); // step 20
            Z3 = Fp.add(X3, Z3);
            X3 = Fp.sub(t1, Z3);
            Z3 = Fp.add(t1, Z3);
            Y3 = Fp.mul(X3, Z3);
            t1 = Fp.add(t0, t0); // step 25
            t1 = Fp.add(t1, t0);
            t2 = Fp.mul(a, t2);
            t4 = Fp.mul(b3, t4);
            t1 = Fp.add(t1, t2);
            t2 = Fp.sub(t0, t2); // step 30
            t2 = Fp.mul(a, t2);
            t4 = Fp.add(t4, t2);
            t0 = Fp.mul(t1, t4);
            Y3 = Fp.add(Y3, t0);
            t0 = Fp.mul(t5, t4); // step 35
            X3 = Fp.mul(t3, X3);
            X3 = Fp.sub(X3, t0);
            t0 = Fp.mul(t3, t1);
            Z3 = Fp.mul(t5, Z3);
            Z3 = Fp.add(Z3, t0); // step 40
            return new Point(X3, Y3, Z3);
        }
        subtract(other) {
            return this.add(other.negate());
        }
        is0() {
            return this.equals(Point.ZERO);
        }
        /**
         * Constant time multiplication.
         * Uses wNAF method. Windowed method may be 10% faster,
         * but takes 2x longer to generate and consumes 2x memory.
         * Uses precomputes when available.
         * Uses endomorphism for Koblitz curves.
         * @param scalar by which the point would be multiplied
         * @returns New point
         */
        multiply(scalar) {
            const { endo } = curveOpts;
            if (!Fn.isValidNot0(scalar))
                throw new Error('invalid scalar: out of range'); // 0 is invalid
            let point, fake; // Fake point is used to const-time mult
            const mul = (n) => wnaf.wNAFCached(this, n, Point.normalizeZ);
            /** See docs for {@link EndomorphismOpts} */
            if (endo) {
                const { k1neg, k1, k2neg, k2 } = endo.splitScalar(scalar);
                const { p: k1p, f: k1f } = mul(k1);
                const { p: k2p, f: k2f } = mul(k2);
                fake = k1f.add(k2f);
                point = finishEndo(endo.beta, k1p, k2p, k1neg, k2neg);
            }
            else {
                const { p, f } = mul(scalar);
                point = p;
                fake = f;
            }
            // Normalize `z` for both points, but return only real one
            return Point.normalizeZ([point, fake])[0];
        }
        /**
         * Non-constant-time multiplication. Uses double-and-add algorithm.
         * It's faster, but should only be used when you don't care about
         * an exposed private key e.g. sig verification, which works over *public* keys.
         */
        multiplyUnsafe(sc) {
            const { endo } = curveOpts;
            const p = this;
            if (!Fn.isValid(sc))
                throw new Error('invalid scalar: out of range'); // 0 is valid
            if (sc === weierstrass_0n || p.is0())
                return Point.ZERO;
            if (sc === weierstrass_1n)
                return p; // fast-path
            if (wnaf.hasPrecomputes(this))
                return this.multiply(sc);
            if (endo) {
                const { k1neg, k1, k2neg, k2 } = endo.splitScalar(sc);
                // `wNAFCachedUnsafe` is 30% slower
                const { p1, p2 } = mulEndoUnsafe(Point, p, k1, k2);
                return finishEndo(endo.beta, p1, p2, k1neg, k2neg);
            }
            else {
                return wnaf.wNAFCachedUnsafe(p, sc);
            }
        }
        multiplyAndAddUnsafe(Q, a, b) {
            const sum = this.multiplyUnsafe(a).add(Q.multiplyUnsafe(b));
            return sum.is0() ? undefined : sum;
        }
        /**
         * Converts Projective point to affine (x, y) coordinates.
         * @param invertedZ Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
         */
        toAffine(invertedZ) {
            return toAffineMemo(this, invertedZ);
        }
        /**
         * Checks whether Point is free of torsion elements (is in prime subgroup).
         * Always torsion-free for cofactor=1 curves.
         */
        isTorsionFree() {
            const { isTorsionFree } = curveOpts;
            if (cofactor === weierstrass_1n)
                return true;
            if (isTorsionFree)
                return isTorsionFree(Point, this);
            return wnaf.wNAFCachedUnsafe(this, CURVE_ORDER).is0();
        }
        clearCofactor() {
            const { clearCofactor } = curveOpts;
            if (cofactor === weierstrass_1n)
                return this; // Fast-path
            if (clearCofactor)
                return clearCofactor(Point, this);
            return this.multiplyUnsafe(cofactor);
        }
        toBytes(isCompressed = true) {
            abool('isCompressed', isCompressed);
            this.assertValidity();
            return toBytes(Point, this, isCompressed);
        }
        /** @deprecated use `toBytes` */
        toRawBytes(isCompressed = true) {
            return this.toBytes(isCompressed);
        }
        toHex(isCompressed = true) {
            return bytesToHex(this.toBytes(isCompressed));
        }
        toString() {
            return `<Point ${this.is0() ? 'ZERO' : this.toHex()}>`;
        }
    }
    // base / generator point
    Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
    // zero / infinity / identity point
    Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO); // 0, 1, 0
    // fields
    Point.Fp = Fp;
    Point.Fn = Fn;
    const bits = Fn.BITS;
    const wnaf = wNAF(Point, curveOpts.endo ? Math.ceil(bits / 2) : bits);
    return Point;
}
// _legacyWeierstrass
/** @deprecated use `weierstrassN` */
function weierstrassPoints(c) {
    const { CURVE, curveOpts } = _weierstrass_legacy_opts_to_new(c);
    const Point = weierstrassN(CURVE, curveOpts);
    return _weierstrass_new_output_to_legacy(c, Point);
}
// Points start with byte 0x02 when y is even; otherwise 0x03
function pprefix(hasEvenY) {
    return Uint8Array.of(hasEvenY ? 0x02 : 0x03);
}
function ecdsa(Point, ecdsaOpts, curveOpts = {}) {
    _validateObject(ecdsaOpts, { hash: 'function' }, {
        hmac: 'function',
        lowS: 'boolean',
        randomBytes: 'function',
        bits2int: 'function',
        bits2int_modN: 'function',
    });
    const randomBytes_ = ecdsaOpts.randomBytes || utils_randomBytes;
    const hmac_ = ecdsaOpts.hmac ||
        ((key, ...msgs) => hmac(ecdsaOpts.hash, key, utils_concatBytes(...msgs)));
    const { Fp, Fn } = Point;
    const { ORDER: CURVE_ORDER, BITS: fnBits } = Fn;
    function isBiggerThanHalfOrder(number) {
        const HALF = CURVE_ORDER >> weierstrass_1n;
        return number > HALF;
    }
    function normalizeS(s) {
        return isBiggerThanHalfOrder(s) ? Fn.neg(s) : s;
    }
    function aValidRS(title, num) {
        if (!Fn.isValidNot0(num))
            throw new Error(`invalid signature ${title}: out of range 1..CURVE.n`);
    }
    /**
     * ECDSA signature with its (r, s) properties. Supports DER & compact representations.
     */
    class Signature {
        constructor(r, s, recovery) {
            aValidRS('r', r); // r in [1..N-1]
            aValidRS('s', s); // s in [1..N-1]
            this.r = r;
            this.s = s;
            if (recovery != null)
                this.recovery = recovery;
            Object.freeze(this);
        }
        // pair (bytes of r, bytes of s)
        static fromCompact(hex) {
            const L = Fn.BYTES;
            const b = utils_ensureBytes('compactSignature', hex, L * 2);
            return new Signature(Fn.fromBytes(b.subarray(0, L)), Fn.fromBytes(b.subarray(L, L * 2)));
        }
        // DER encoded ECDSA signature
        // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
        static fromDER(hex) {
            const { r, s } = DER.toSig(utils_ensureBytes('DER', hex));
            return new Signature(r, s);
        }
        /**
         * @todo remove
         * @deprecated
         */
        assertValidity() { }
        addRecoveryBit(recovery) {
            return new Signature(this.r, this.s, recovery);
        }
        // ProjPointType<bigint>
        recoverPublicKey(msgHash) {
            const FIELD_ORDER = Fp.ORDER;
            const { r, s, recovery: rec } = this;
            if (rec == null || ![0, 1, 2, 3].includes(rec))
                throw new Error('recovery id invalid');
            // ECDSA recovery is hard for cofactor > 1 curves.
            // In sign, `r = q.x mod n`, and here we recover q.x from r.
            // While recovering q.x >= n, we need to add r+n for cofactor=1 curves.
            // However, for cofactor>1, r+n may not get q.x:
            // r+n*i would need to be done instead where i is unknown.
            // To easily get i, we either need to:
            // a. increase amount of valid recid values (4, 5...); OR
            // b. prohibit non-prime-order signatures (recid > 1).
            const hasCofactor = CURVE_ORDER * weierstrass_2n < FIELD_ORDER;
            if (hasCofactor && rec > 1)
                throw new Error('recovery id is ambiguous for h>1 curve');
            const radj = rec === 2 || rec === 3 ? r + CURVE_ORDER : r;
            if (!Fp.isValid(radj))
                throw new Error('recovery id 2 or 3 invalid');
            const x = Fp.toBytes(radj);
            const R = Point.fromHex(utils_concatBytes(pprefix((rec & 1) === 0), x));
            const ir = Fn.inv(radj); // r^-1
            const h = bits2int_modN(utils_ensureBytes('msgHash', msgHash)); // Truncate hash
            const u1 = Fn.create(-h * ir); // -hr^-1
            const u2 = Fn.create(s * ir); // sr^-1
            // (sr^-1)R-(hr^-1)G = -(hr^-1)G + (sr^-1). unsafe is fine: there is no private data.
            const Q = Point.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
            if (Q.is0())
                throw new Error('point at infinify');
            Q.assertValidity();
            return Q;
        }
        // Signatures should be low-s, to prevent malleability.
        hasHighS() {
            return isBiggerThanHalfOrder(this.s);
        }
        normalizeS() {
            return this.hasHighS() ? new Signature(this.r, Fn.neg(this.s), this.recovery) : this;
        }
        toBytes(format) {
            if (format === 'compact')
                return utils_concatBytes(Fn.toBytes(this.r), Fn.toBytes(this.s));
            if (format === 'der')
                return hexToBytes(DER.hexFromSig(this));
            throw new Error('invalid format');
        }
        // DER-encoded
        toDERRawBytes() {
            return this.toBytes('der');
        }
        toDERHex() {
            return bytesToHex(this.toBytes('der'));
        }
        // padded bytes of r, then padded bytes of s
        toCompactRawBytes() {
            return this.toBytes('compact');
        }
        toCompactHex() {
            return bytesToHex(this.toBytes('compact'));
        }
    }
    const normPrivateKeyToScalar = _legacyHelperNormPriv(Fn, curveOpts.allowedPrivateKeyLengths, curveOpts.wrapPrivateKey);
    const utils = {
        isValidPrivateKey(privateKey) {
            try {
                normPrivateKeyToScalar(privateKey);
                return true;
            }
            catch (error) {
                return false;
            }
        },
        normPrivateKeyToScalar: normPrivateKeyToScalar,
        /**
         * Produces cryptographically secure private key from random of size
         * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
         */
        randomPrivateKey: () => {
            const n = CURVE_ORDER;
            return mapHashToField(randomBytes_(getMinHashLength(n)), n);
        },
        precompute(windowSize = 8, point = Point.BASE) {
            return point.precompute(windowSize, false);
        },
    };
    /**
     * Computes public key for a private key. Checks for validity of the private key.
     * @param privateKey private key
     * @param isCompressed whether to return compact (default), or full key
     * @returns Public key, full when isCompressed=false; short when isCompressed=true
     */
    function getPublicKey(privateKey, isCompressed = true) {
        return Point.fromPrivateKey(privateKey).toBytes(isCompressed);
    }
    /**
     * Quick and dirty check for item being public key. Does not validate hex, or being on-curve.
     */
    function isProbPub(item) {
        if (typeof item === 'bigint')
            return false;
        if (item instanceof Point)
            return true;
        const arr = utils_ensureBytes('key', item);
        const length = arr.length;
        const L = Fp.BYTES;
        const LC = L + 1; // e.g. 33 for 32
        const LU = 2 * L + 1; // e.g. 65 for 32
        if (curveOpts.allowedPrivateKeyLengths || Fn.BYTES === LC) {
            return undefined;
        }
        else {
            return length === LC || length === LU;
        }
    }
    /**
     * ECDH (Elliptic Curve Diffie Hellman).
     * Computes shared public key from private key and public key.
     * Checks: 1) private key validity 2) shared key is on-curve.
     * Does NOT hash the result.
     * @param privateA private key
     * @param publicB different public key
     * @param isCompressed whether to return compact (default), or full key
     * @returns shared public key
     */
    function getSharedSecret(privateA, publicB, isCompressed = true) {
        if (isProbPub(privateA) === true)
            throw new Error('first arg must be private key');
        if (isProbPub(publicB) === false)
            throw new Error('second arg must be public key');
        const b = Point.fromHex(publicB); // check for being on-curve
        return b.multiply(normPrivateKeyToScalar(privateA)).toBytes(isCompressed);
    }
    // RFC6979: ensure ECDSA msg is X bytes and < N. RFC suggests optional truncating via bits2octets.
    // FIPS 186-4 4.6 suggests the leftmost min(nBitLen, outLen) bits, which matches bits2int.
    // bits2int can produce res>N, we can do mod(res, N) since the bitLen is the same.
    // int2octets can't be used; pads small msgs with 0: unacceptatble for trunc as per RFC vectors
    const bits2int = ecdsaOpts.bits2int ||
        function (bytes) {
            // Our custom check "just in case", for protection against DoS
            if (bytes.length > 8192)
                throw new Error('input is too large');
            // For curves with nBitLength % 8 !== 0: bits2octets(bits2octets(m)) !== bits2octets(m)
            // for some cases, since bytes.length * 8 is not actual bitLength.
            const num = utils_bytesToNumberBE(bytes); // check for == u8 done here
            const delta = bytes.length * 8 - fnBits; // truncate to nBitLength leftmost bits
            return delta > 0 ? num >> BigInt(delta) : num;
        };
    const bits2int_modN = ecdsaOpts.bits2int_modN ||
        function (bytes) {
            return Fn.create(bits2int(bytes)); // can't use bytesToNumberBE here
        };
    // NOTE: pads output with zero as per spec
    const ORDER_MASK = utils_bitMask(fnBits);
    /**
     * Converts to bytes. Checks if num in `[0..ORDER_MASK-1]` e.g.: `[0..2^256-1]`.
     */
    function int2octets(num) {
        // IMPORTANT: the check ensures working for case `Fn.BYTES != Fn.BITS * 8`
        utils_aInRange('num < 2^' + fnBits, num, weierstrass_0n, ORDER_MASK);
        return Fn.toBytes(num);
    }
    // Steps A, D of RFC6979 3.2
    // Creates RFC6979 seed; converts msg/privKey to numbers.
    // Used only in sign, not in verify.
    // NOTE: we cannot assume here that msgHash has same amount of bytes as curve order,
    // this will be invalid at least for P521. Also it can be bigger for P224 + SHA256
    function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
        if (['recovered', 'canonical'].some((k) => k in opts))
            throw new Error('sign() legacy options not supported');
        const { hash } = ecdsaOpts;
        let { lowS, prehash, extraEntropy: ent } = opts; // generates low-s sigs by default
        if (lowS == null)
            lowS = true; // RFC6979 3.2: we skip step A, because we already provide hash
        msgHash = utils_ensureBytes('msgHash', msgHash);
        validateSigVerOpts(opts);
        if (prehash)
            msgHash = utils_ensureBytes('prehashed msgHash', hash(msgHash));
        // We can't later call bits2octets, since nested bits2int is broken for curves
        // with fnBits % 8 !== 0. Because of that, we unwrap it here as int2octets call.
        // const bits2octets = (bits) => int2octets(bits2int_modN(bits))
        const h1int = bits2int_modN(msgHash);
        const d = normPrivateKeyToScalar(privateKey); // validate private key, convert to bigint
        const seedArgs = [int2octets(d), int2octets(h1int)];
        // extraEntropy. RFC6979 3.6: additional k' (optional).
        if (ent != null && ent !== false) {
            // K = HMAC_K(V || 0x00 || int2octets(x) || bits2octets(h1) || k')
            const e = ent === true ? randomBytes_(Fp.BYTES) : ent; // generate random bytes OR pass as-is
            seedArgs.push(utils_ensureBytes('extraEntropy', e)); // check for being bytes
        }
        const seed = utils_concatBytes(...seedArgs); // Step D of RFC6979 3.2
        const m = h1int; // NOTE: no need to call bits2int second time here, it is inside truncateHash!
        // Converts signature params into point w r/s, checks result for validity.
        // Can use scalar blinding b^-1(bm + bdr) where b ∈ [1,q−1] according to
        // https://tches.iacr.org/index.php/TCHES/article/view/7337/6509. We've decided against it:
        // a) dependency on CSPRNG b) 15% slowdown c) doesn't really help since bigints are not CT
        function k2sig(kBytes) {
            // RFC 6979 Section 3.2, step 3: k = bits2int(T)
            // Important: all mod() calls here must be done over N
            const k = bits2int(kBytes); // Cannot use fields methods, since it is group element
            if (!Fn.isValidNot0(k))
                return; // Valid scalars (including k) must be in 1..N-1
            const ik = Fn.inv(k); // k^-1 mod n
            const q = Point.BASE.multiply(k).toAffine(); // q = Gk
            const r = Fn.create(q.x); // r = q.x mod n
            if (r === weierstrass_0n)
                return;
            const s = Fn.create(ik * Fn.create(m + r * d)); // Not using blinding here, see comment above
            if (s === weierstrass_0n)
                return;
            let recovery = (q.x === r ? 0 : 2) | Number(q.y & weierstrass_1n); // recovery bit (2 or 3, when q.x > n)
            let normS = s;
            if (lowS && isBiggerThanHalfOrder(s)) {
                normS = normalizeS(s); // if lowS was passed, ensure s is always
                recovery ^= 1; // // in the bottom half of N
            }
            return new Signature(r, normS, recovery); // use normS, not s
        }
        return { seed, k2sig };
    }
    const defaultSigOpts = { lowS: ecdsaOpts.lowS, prehash: false };
    const defaultVerOpts = { lowS: ecdsaOpts.lowS, prehash: false };
    /**
     * Signs message hash with a private key.
     * ```
     * sign(m, d, k) where
     *   (x, y) = G × k
     *   r = x mod n
     *   s = (m + dr)/k mod n
     * ```
     * @param msgHash NOT message. msg needs to be hashed to `msgHash`, or use `prehash`.
     * @param privKey private key
     * @param opts lowS for non-malleable sigs. extraEntropy for mixing randomness into k. prehash will hash first arg.
     * @returns signature with recovery param
     */
    function sign(msgHash, privKey, opts = defaultSigOpts) {
        const { seed, k2sig } = prepSig(msgHash, privKey, opts); // Steps A, D of RFC6979 3.2.
        const drbg = createHmacDrbg(ecdsaOpts.hash.outputLen, Fn.BYTES, hmac_);
        return drbg(seed, k2sig); // Steps B, C, D, E, F, G
    }
    // Enable precomputes. Slows down first publicKey computation by 20ms.
    Point.BASE.precompute(8);
    /**
     * Verifies a signature against message hash and public key.
     * Rejects lowS signatures by default: to override,
     * specify option `{lowS: false}`. Implements section 4.1.4 from https://www.secg.org/sec1-v2.pdf:
     *
     * ```
     * verify(r, s, h, P) where
     *   U1 = hs^-1 mod n
     *   U2 = rs^-1 mod n
     *   R = U1⋅G - U2⋅P
     *   mod(R.x, n) == r
     * ```
     */
    function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
        const sg = signature;
        msgHash = utils_ensureBytes('msgHash', msgHash);
        publicKey = utils_ensureBytes('publicKey', publicKey);
        // Verify opts
        validateSigVerOpts(opts);
        const { lowS, prehash, format } = opts;
        // TODO: remove
        if ('strict' in opts)
            throw new Error('options.strict was renamed to lowS');
        if (format !== undefined && !['compact', 'der', 'js'].includes(format))
            throw new Error('format must be "compact", "der" or "js"');
        const isHex = typeof sg === 'string' || isBytes(sg);
        const isObj = !isHex &&
            !format &&
            typeof sg === 'object' &&
            sg !== null &&
            typeof sg.r === 'bigint' &&
            typeof sg.s === 'bigint';
        if (!isHex && !isObj)
            throw new Error('invalid signature, expected Uint8Array, hex string or Signature instance');
        let _sig = undefined;
        let P;
        // deduce signature format
        try {
            // if (format === 'js') {
            //   if (sg != null && !isBytes(sg)) _sig = new Signature(sg.r, sg.s);
            // } else if (format === 'compact') {
            //   _sig = Signature.fromCompact(sg);
            // } else if (format === 'der') {
            //   _sig = Signature.fromDER(sg);
            // } else {
            //   throw new Error('invalid format');
            // }
            if (isObj) {
                if (format === undefined || format === 'js') {
                    _sig = new Signature(sg.r, sg.s);
                }
                else {
                    throw new Error('invalid format');
                }
            }
            if (isHex) {
                // TODO: remove this malleable check
                // Signature can be represented in 2 ways: compact (2*Fn.BYTES) & DER (variable-length).
                // Since DER can also be 2*Fn.BYTES bytes, we check for it first.
                try {
                    if (format !== 'compact')
                        _sig = Signature.fromDER(sg);
                }
                catch (derError) {
                    if (!(derError instanceof DER.Err))
                        throw derError;
                }
                if (!_sig && format !== 'der')
                    _sig = Signature.fromCompact(sg);
            }
            P = Point.fromHex(publicKey);
        }
        catch (error) {
            return false;
        }
        if (!_sig)
            return false;
        if (lowS && _sig.hasHighS())
            return false;
        // todo: optional.hash => hash
        if (prehash)
            msgHash = ecdsaOpts.hash(msgHash);
        const { r, s } = _sig;
        const h = bits2int_modN(msgHash); // Cannot use fields methods, since it is group element
        const is = Fn.inv(s); // s^-1
        const u1 = Fn.create(h * is); // u1 = hs^-1 mod n
        const u2 = Fn.create(r * is); // u2 = rs^-1 mod n
        const R = Point.BASE.multiplyUnsafe(u1).add(P.multiplyUnsafe(u2));
        if (R.is0())
            return false;
        const v = Fn.create(R.x); // v = r.x mod n
        return v === r;
    }
    // TODO: clarify API for cloning .clone({hash: sha512}) ? .createWith({hash: sha512})?
    // const clone = (hash: CHash): ECDSA => ecdsa(Point, { ...ecdsaOpts, ...getHash(hash) }, curveOpts);
    return Object.freeze({
        getPublicKey,
        getSharedSecret,
        sign,
        verify,
        utils,
        Point,
        Signature,
    });
}
function _weierstrass_legacy_opts_to_new(c) {
    const CURVE = {
        a: c.a,
        b: c.b,
        p: c.Fp.ORDER,
        n: c.n,
        h: c.h,
        Gx: c.Gx,
        Gy: c.Gy,
    };
    const Fp = c.Fp;
    const Fn = Field(CURVE.n, c.nBitLength);
    const curveOpts = {
        Fp,
        Fn,
        allowedPrivateKeyLengths: c.allowedPrivateKeyLengths,
        allowInfinityPoint: c.allowInfinityPoint,
        endo: c.endo,
        wrapPrivateKey: c.wrapPrivateKey,
        isTorsionFree: c.isTorsionFree,
        clearCofactor: c.clearCofactor,
        fromBytes: c.fromBytes,
        toBytes: c.toBytes,
    };
    return { CURVE, curveOpts };
}
function _ecdsa_legacy_opts_to_new(c) {
    const { CURVE, curveOpts } = _weierstrass_legacy_opts_to_new(c);
    const ecdsaOpts = {
        hash: c.hash,
        hmac: c.hmac,
        randomBytes: c.randomBytes,
        lowS: c.lowS,
        bits2int: c.bits2int,
        bits2int_modN: c.bits2int_modN,
    };
    return { CURVE, curveOpts, ecdsaOpts };
}
function _weierstrass_new_output_to_legacy(c, Point) {
    const { Fp, Fn } = Point;
    // TODO: remove
    function isWithinCurveOrder(num) {
        return inRange(num, weierstrass_1n, Fn.ORDER);
    }
    const weierstrassEquation = _legacyHelperEquat(Fp, c.a, c.b);
    const normPrivateKeyToScalar = _legacyHelperNormPriv(Fn, c.allowedPrivateKeyLengths, c.wrapPrivateKey);
    return Object.assign({}, {
        CURVE: c,
        Point: Point,
        ProjectivePoint: Point,
        normPrivateKeyToScalar,
        weierstrassEquation,
        isWithinCurveOrder,
    });
}
function _ecdsa_new_output_to_legacy(c, ecdsa) {
    return Object.assign({}, ecdsa, {
        ProjectivePoint: ecdsa.Point,
        CURVE: c,
    });
}
// _ecdsa_legacy
function weierstrass(c) {
    const { CURVE, curveOpts, ecdsaOpts } = _ecdsa_legacy_opts_to_new(c);
    const Point = weierstrassN(CURVE, curveOpts);
    const signs = ecdsa(Point, ecdsaOpts, curveOpts);
    return _ecdsa_new_output_to_legacy(c, signs);
}
/**
 * Implementation of the Shallue and van de Woestijne method for any weierstrass curve.
 * TODO: check if there is a way to merge this with uvRatio in Edwards; move to modular.
 * b = True and y = sqrt(u / v) if (u / v) is square in F, and
 * b = False and y = sqrt(Z * (u / v)) otherwise.
 * @param Fp
 * @param Z
 * @returns
 */
function SWUFpSqrtRatio(Fp, Z) {
    // Generic implementation
    const q = Fp.ORDER;
    let l = weierstrass_0n;
    for (let o = q - weierstrass_1n; o % weierstrass_2n === weierstrass_0n; o /= weierstrass_2n)
        l += weierstrass_1n;
    const c1 = l; // 1. c1, the largest integer such that 2^c1 divides q - 1.
    // We need 2n ** c1 and 2n ** (c1-1). We can't use **; but we can use <<.
    // 2n ** c1 == 2n << (c1-1)
    const _2n_pow_c1_1 = weierstrass_2n << (c1 - weierstrass_1n - weierstrass_1n);
    const _2n_pow_c1 = _2n_pow_c1_1 * weierstrass_2n;
    const c2 = (q - weierstrass_1n) / _2n_pow_c1; // 2. c2 = (q - 1) / (2^c1)  # Integer arithmetic
    const c3 = (c2 - weierstrass_1n) / weierstrass_2n; // 3. c3 = (c2 - 1) / 2            # Integer arithmetic
    const c4 = _2n_pow_c1 - weierstrass_1n; // 4. c4 = 2^c1 - 1                # Integer arithmetic
    const c5 = _2n_pow_c1_1; // 5. c5 = 2^(c1 - 1)                  # Integer arithmetic
    const c6 = Fp.pow(Z, c2); // 6. c6 = Z^c2
    const c7 = Fp.pow(Z, (c2 + weierstrass_1n) / weierstrass_2n); // 7. c7 = Z^((c2 + 1) / 2)
    let sqrtRatio = (u, v) => {
        let tv1 = c6; // 1. tv1 = c6
        let tv2 = Fp.pow(v, c4); // 2. tv2 = v^c4
        let tv3 = Fp.sqr(tv2); // 3. tv3 = tv2^2
        tv3 = Fp.mul(tv3, v); // 4. tv3 = tv3 * v
        let tv5 = Fp.mul(u, tv3); // 5. tv5 = u * tv3
        tv5 = Fp.pow(tv5, c3); // 6. tv5 = tv5^c3
        tv5 = Fp.mul(tv5, tv2); // 7. tv5 = tv5 * tv2
        tv2 = Fp.mul(tv5, v); // 8. tv2 = tv5 * v
        tv3 = Fp.mul(tv5, u); // 9. tv3 = tv5 * u
        let tv4 = Fp.mul(tv3, tv2); // 10. tv4 = tv3 * tv2
        tv5 = Fp.pow(tv4, c5); // 11. tv5 = tv4^c5
        let isQR = Fp.eql(tv5, Fp.ONE); // 12. isQR = tv5 == 1
        tv2 = Fp.mul(tv3, c7); // 13. tv2 = tv3 * c7
        tv5 = Fp.mul(tv4, tv1); // 14. tv5 = tv4 * tv1
        tv3 = Fp.cmov(tv2, tv3, isQR); // 15. tv3 = CMOV(tv2, tv3, isQR)
        tv4 = Fp.cmov(tv5, tv4, isQR); // 16. tv4 = CMOV(tv5, tv4, isQR)
        // 17. for i in (c1, c1 - 1, ..., 2):
        for (let i = c1; i > weierstrass_1n; i--) {
            let tv5 = i - weierstrass_2n; // 18.    tv5 = i - 2
            tv5 = weierstrass_2n << (tv5 - weierstrass_1n); // 19.    tv5 = 2^tv5
            let tvv5 = Fp.pow(tv4, tv5); // 20.    tv5 = tv4^tv5
            const e1 = Fp.eql(tvv5, Fp.ONE); // 21.    e1 = tv5 == 1
            tv2 = Fp.mul(tv3, tv1); // 22.    tv2 = tv3 * tv1
            tv1 = Fp.mul(tv1, tv1); // 23.    tv1 = tv1 * tv1
            tvv5 = Fp.mul(tv4, tv1); // 24.    tv5 = tv4 * tv1
            tv3 = Fp.cmov(tv2, tv3, e1); // 25.    tv3 = CMOV(tv2, tv3, e1)
            tv4 = Fp.cmov(tvv5, tv4, e1); // 26.    tv4 = CMOV(tv5, tv4, e1)
        }
        return { isValid: isQR, value: tv3 };
    };
    if (Fp.ORDER % weierstrass_4n === weierstrass_3n) {
        // sqrt_ratio_3mod4(u, v)
        const c1 = (Fp.ORDER - weierstrass_3n) / weierstrass_4n; // 1. c1 = (q - 3) / 4     # Integer arithmetic
        const c2 = Fp.sqrt(Fp.neg(Z)); // 2. c2 = sqrt(-Z)
        sqrtRatio = (u, v) => {
            let tv1 = Fp.sqr(v); // 1. tv1 = v^2
            const tv2 = Fp.mul(u, v); // 2. tv2 = u * v
            tv1 = Fp.mul(tv1, tv2); // 3. tv1 = tv1 * tv2
            let y1 = Fp.pow(tv1, c1); // 4. y1 = tv1^c1
            y1 = Fp.mul(y1, tv2); // 5. y1 = y1 * tv2
            const y2 = Fp.mul(y1, c2); // 6. y2 = y1 * c2
            const tv3 = Fp.mul(Fp.sqr(y1), v); // 7. tv3 = y1^2; 8. tv3 = tv3 * v
            const isQR = Fp.eql(tv3, u); // 9. isQR = tv3 == u
            let y = Fp.cmov(y2, y1, isQR); // 10. y = CMOV(y2, y1, isQR)
            return { isValid: isQR, value: y }; // 11. return (isQR, y) isQR ? y : y*c2
        };
    }
    // No curves uses that
    // if (Fp.ORDER % _8n === _5n) // sqrt_ratio_5mod8
    return sqrtRatio;
}
/**
 * Simplified Shallue-van de Woestijne-Ulas Method
 * https://www.rfc-editor.org/rfc/rfc9380#section-6.6.2
 */
function weierstrass_mapToCurveSimpleSWU(Fp, opts) {
    validateField(Fp);
    const { A, B, Z } = opts;
    if (!Fp.isValid(A) || !Fp.isValid(B) || !Fp.isValid(Z))
        throw new Error('mapToCurveSimpleSWU: invalid opts');
    const sqrtRatio = SWUFpSqrtRatio(Fp, Z);
    if (!Fp.isOdd)
        throw new Error('Field does not have .isOdd()');
    // Input: u, an element of F.
    // Output: (x, y), a point on E.
    return (u) => {
        // prettier-ignore
        let tv1, tv2, tv3, tv4, tv5, tv6, x, y;
        tv1 = Fp.sqr(u); // 1.  tv1 = u^2
        tv1 = Fp.mul(tv1, Z); // 2.  tv1 = Z * tv1
        tv2 = Fp.sqr(tv1); // 3.  tv2 = tv1^2
        tv2 = Fp.add(tv2, tv1); // 4.  tv2 = tv2 + tv1
        tv3 = Fp.add(tv2, Fp.ONE); // 5.  tv3 = tv2 + 1
        tv3 = Fp.mul(tv3, B); // 6.  tv3 = B * tv3
        tv4 = Fp.cmov(Z, Fp.neg(tv2), !Fp.eql(tv2, Fp.ZERO)); // 7.  tv4 = CMOV(Z, -tv2, tv2 != 0)
        tv4 = Fp.mul(tv4, A); // 8.  tv4 = A * tv4
        tv2 = Fp.sqr(tv3); // 9.  tv2 = tv3^2
        tv6 = Fp.sqr(tv4); // 10. tv6 = tv4^2
        tv5 = Fp.mul(tv6, A); // 11. tv5 = A * tv6
        tv2 = Fp.add(tv2, tv5); // 12. tv2 = tv2 + tv5
        tv2 = Fp.mul(tv2, tv3); // 13. tv2 = tv2 * tv3
        tv6 = Fp.mul(tv6, tv4); // 14. tv6 = tv6 * tv4
        tv5 = Fp.mul(tv6, B); // 15. tv5 = B * tv6
        tv2 = Fp.add(tv2, tv5); // 16. tv2 = tv2 + tv5
        x = Fp.mul(tv1, tv3); // 17.   x = tv1 * tv3
        const { isValid, value } = sqrtRatio(tv2, tv6); // 18. (is_gx1_square, y1) = sqrt_ratio(tv2, tv6)
        y = Fp.mul(tv1, u); // 19.   y = tv1 * u  -> Z * u^3 * y1
        y = Fp.mul(y, value); // 20.   y = y * y1
        x = Fp.cmov(x, tv3, isValid); // 21.   x = CMOV(x, tv3, is_gx1_square)
        y = Fp.cmov(y, value, isValid); // 22.   y = CMOV(y, y1, is_gx1_square)
        const e1 = Fp.isOdd(u) === Fp.isOdd(y); // 23.  e1 = sgn0(u) == sgn0(y)
        y = Fp.cmov(Fp.neg(y), y, e1); // 24.   y = CMOV(-y, y, e1)
        const tv4_inv = FpInvertBatch(Fp, [tv4], true)[0];
        x = Fp.mul(x, tv4_inv); // 25.   x = x / tv4
        return { x, y };
    };
}
//# sourceMappingURL=weierstrass.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/esm/_shortw_utils.js
/**
 * Utilities for short weierstrass curves, combined with noble-hashes.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */

/** connects noble-curves to noble-hashes */
function getHash(hash) {
    return { hash };
}
function createCurve(curveDef, defHash) {
    const create = (hash) => weierstrass({ ...curveDef, hash: hash });
    return { ...create(defHash), create };
}
//# sourceMappingURL=_shortw_utils.js.map
;// CONCATENATED MODULE: ./node_modules/@noble/curves/esm/secp256k1.js
/**
 * SECG secp256k1. See [pdf](https://www.secg.org/sec2-v2.pdf).
 *
 * Belongs to Koblitz curves: it has efficiently-computable GLV endomorphism ψ,
 * check out {@link EndomorphismOpts}. Seems to be rigid (not backdoored).
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */







// Seems like generator was produced from some seed:
// `Point.BASE.multiply(Point.Fn.inv(2n, N)).toAffine().x`
// // gives short x 0x3b78ce563f89a0ed9414f5aa28ad0d96d6795f9c63n
const secp256k1_CURVE = {
    p: BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f'),
    n: BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141'),
    h: BigInt(1),
    a: BigInt(0),
    b: BigInt(7),
    Gx: BigInt('0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'),
    Gy: BigInt('0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8'),
};
const secp256k1_0n = BigInt(0);
const secp256k1_1n = BigInt(1);
const secp256k1_2n = BigInt(2);
const divNearest = (a, b) => (a + b / secp256k1_2n) / b;
/**
 * √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
 * (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
 */
function sqrtMod(y) {
    const P = secp256k1_CURVE.p;
    // prettier-ignore
    const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
    // prettier-ignore
    const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
    const b2 = (y * y * y) % P; // x^3, 11
    const b3 = (b2 * b2 * y) % P; // x^7
    const b6 = (pow2(b3, _3n, P) * b3) % P;
    const b9 = (pow2(b6, _3n, P) * b3) % P;
    const b11 = (pow2(b9, secp256k1_2n, P) * b2) % P;
    const b22 = (pow2(b11, _11n, P) * b11) % P;
    const b44 = (pow2(b22, _22n, P) * b22) % P;
    const b88 = (pow2(b44, _44n, P) * b44) % P;
    const b176 = (pow2(b88, _88n, P) * b88) % P;
    const b220 = (pow2(b176, _44n, P) * b44) % P;
    const b223 = (pow2(b220, _3n, P) * b3) % P;
    const t1 = (pow2(b223, _23n, P) * b22) % P;
    const t2 = (pow2(t1, _6n, P) * b2) % P;
    const root = pow2(t2, secp256k1_2n, P);
    if (!Fpk1.eql(Fpk1.sqr(root), y))
        throw new Error('Cannot find square root');
    return root;
}
const Fpk1 = Field(secp256k1_CURVE.p, undefined, undefined, { sqrt: sqrtMod });
/**
 * secp256k1 curve, ECDSA and ECDH methods.
 *
 * Field: `2n**256n - 2n**32n - 2n**9n - 2n**8n - 2n**7n - 2n**6n - 2n**4n - 1n`
 *
 * @example
 * ```js
 * import { secp256k1 } from '@noble/curves/secp256k1';
 * const priv = secp256k1.utils.randomPrivateKey();
 * const pub = secp256k1.getPublicKey(priv);
 * const msg = new Uint8Array(32).fill(1); // message hash (not message) in ecdsa
 * const sig = secp256k1.sign(msg, priv); // `{prehash: true}` option is available
 * const isValid = secp256k1.verify(sig, msg, pub) === true;
 * ```
 */
const secp256k1 = createCurve({
    ...secp256k1_CURVE,
    Fp: Fpk1,
    lowS: true, // Allow only low-S signatures by default in sign() and verify()
    endo: {
        // Endomorphism, see above
        beta: BigInt('0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'),
        splitScalar: (k) => {
            const n = secp256k1_CURVE.n;
            const a1 = BigInt('0x3086d221a7d46bcde86c90e49284eb15');
            const b1 = -secp256k1_1n * BigInt('0xe4437ed6010e88286f547fa90abfe4c3');
            const a2 = BigInt('0x114ca50f7a8e2f3f657c1108d9d44cfd8');
            const b2 = a1;
            const POW_2_128 = BigInt('0x100000000000000000000000000000000'); // (2n**128n).toString(16)
            const c1 = divNearest(b2 * k, n);
            const c2 = divNearest(-b1 * k, n);
            let k1 = modular_mod(k - c1 * a1 - c2 * a2, n);
            let k2 = modular_mod(-c1 * b1 - c2 * b2, n);
            const k1neg = k1 > POW_2_128;
            const k2neg = k2 > POW_2_128;
            if (k1neg)
                k1 = n - k1;
            if (k2neg)
                k2 = n - k2;
            if (k1 > POW_2_128 || k2 > POW_2_128) {
                throw new Error('splitScalar: Endomorphism failed, k=' + k);
            }
            return { k1neg, k1, k2neg, k2 };
        },
    },
}, sha2_sha256);
// Schnorr signatures are superior to ECDSA from above. Below is Schnorr-specific BIP0340 code.
// https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
/** An object mapping tags to their tagged hash prefix of [SHA256(tag) | SHA256(tag)] */
const TAGGED_HASH_PREFIXES = {};
function taggedHash(tag, ...messages) {
    let tagP = TAGGED_HASH_PREFIXES[tag];
    if (tagP === undefined) {
        const tagH = sha256(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
        tagP = concatBytes(tagH, tagH);
        TAGGED_HASH_PREFIXES[tag] = tagP;
    }
    return sha256(concatBytes(tagP, ...messages));
}
// ECDSA compact points are 33-byte. Schnorr is 32: we strip first byte 0x02 or 0x03
const pointToBytes = (point) => point.toBytes(true).slice(1);
const numTo32b = (n) => numberToBytesBE(n, 32);
const modP = (x) => mod(x, secp256k1_CURVE.p);
const modN = (x) => mod(x, secp256k1_CURVE.n);
const Point = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => secp256k1.Point)()));
const hasEven = (y) => y % secp256k1_2n === secp256k1_0n;
// Calculate point, scalar and bytes
function schnorrGetExtPubKey(priv) {
    let d_ = secp256k1.utils.normPrivateKeyToScalar(priv); // same method executed in fromPrivateKey
    let p = Point.fromPrivateKey(d_); // P = d'⋅G; 0 < d' < n check is done inside
    const scalar = hasEven(p.y) ? d_ : modN(-d_);
    return { scalar: scalar, bytes: pointToBytes(p) };
}
/**
 * lift_x from BIP340. Convert 32-byte x coordinate to elliptic curve point.
 * @returns valid point checked for being on-curve
 */
function lift_x(x) {
    aInRange('x', x, secp256k1_1n, secp256k1_CURVE.p); // Fail if x ≥ p.
    const xx = modP(x * x);
    const c = modP(xx * x + BigInt(7)); // Let c = x³ + 7 mod p.
    let y = sqrtMod(c); // Let y = c^(p+1)/4 mod p.
    if (!hasEven(y))
        y = modP(-y); // Return the unique point P such that x(P) = x and
    const p = Point.fromAffine({ x, y }); // y(P) = y if y mod 2 = 0 or y(P) = p-y otherwise.
    p.assertValidity();
    return p;
}
const num = (/* unused pure expression or super */ null && (bytesToNumberBE));
/**
 * Create tagged hash, convert it to bigint, reduce modulo-n.
 */
function challenge(...args) {
    return modN(num(taggedHash('BIP0340/challenge', ...args)));
}
/**
 * Schnorr public key is just `x` coordinate of Point as per BIP340.
 */
function schnorrGetPublicKey(privateKey) {
    return schnorrGetExtPubKey(privateKey).bytes; // d'=int(sk). Fail if d'=0 or d'≥n. Ret bytes(d'⋅G)
}
/**
 * Creates Schnorr signature as per BIP340. Verifies itself before returning anything.
 * auxRand is optional and is not the sole source of k generation: bad CSPRNG won't be dangerous.
 */
function schnorrSign(message, privateKey, auxRand = randomBytes(32)) {
    const m = ensureBytes('message', message);
    const { bytes: px, scalar: d } = schnorrGetExtPubKey(privateKey); // checks for isWithinCurveOrder
    const a = ensureBytes('auxRand', auxRand, 32); // Auxiliary random data a: a 32-byte array
    const t = numTo32b(d ^ num(taggedHash('BIP0340/aux', a))); // Let t be the byte-wise xor of bytes(d) and hash/aux(a)
    const rand = taggedHash('BIP0340/nonce', t, px, m); // Let rand = hash/nonce(t || bytes(P) || m)
    const k_ = modN(num(rand)); // Let k' = int(rand) mod n
    if (k_ === secp256k1_0n)
        throw new Error('sign failed: k is zero'); // Fail if k' = 0.
    const { bytes: rx, scalar: k } = schnorrGetExtPubKey(k_); // Let R = k'⋅G.
    const e = challenge(rx, px, m); // Let e = int(hash/challenge(bytes(R) || bytes(P) || m)) mod n.
    const sig = new Uint8Array(64); // Let sig = bytes(R) || bytes((k + ed) mod n).
    sig.set(rx, 0);
    sig.set(numTo32b(modN(k + e * d)), 32);
    // If Verify(bytes(P), m, sig) (see below) returns failure, abort
    if (!schnorrVerify(sig, m, px))
        throw new Error('sign: Invalid signature produced');
    return sig;
}
/**
 * Verifies Schnorr signature.
 * Will swallow errors & return false except for initial type validation of arguments.
 */
function schnorrVerify(signature, message, publicKey) {
    const sig = ensureBytes('signature', signature, 64);
    const m = ensureBytes('message', message);
    const pub = ensureBytes('publicKey', publicKey, 32);
    try {
        const P = lift_x(num(pub)); // P = lift_x(int(pk)); fail if that fails
        const r = num(sig.subarray(0, 32)); // Let r = int(sig[0:32]); fail if r ≥ p.
        if (!inRange(r, secp256k1_1n, secp256k1_CURVE.p))
            return false;
        const s = num(sig.subarray(32, 64)); // Let s = int(sig[32:64]); fail if s ≥ n.
        if (!inRange(s, secp256k1_1n, secp256k1_CURVE.n))
            return false;
        const e = challenge(numTo32b(r), pointToBytes(P), m); // int(challenge(bytes(r)||bytes(P)||m))%n
        // R = s⋅G - e⋅P, where -eP == (n-e)P
        const R = Point.BASE.multiplyUnsafe(s).add(P.multiplyUnsafe(modN(-e)));
        const { x, y } = R.toAffine();
        // Fail if is_infinite(R) / not has_even_y(R) / x(R) ≠ r.
        if (R.is0() || !hasEven(y) || x !== r)
            return false;
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Schnorr signatures over secp256k1.
 * https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
 * @example
 * ```js
 * import { schnorr } from '@noble/curves/secp256k1';
 * const priv = schnorr.utils.randomPrivateKey();
 * const pub = schnorr.getPublicKey(priv);
 * const msg = new TextEncoder().encode('hello');
 * const sig = schnorr.sign(msg, priv);
 * const isValid = schnorr.verify(sig, msg, pub);
 * ```
 */
const schnorr = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => ({
    getPublicKey: schnorrGetPublicKey,
    sign: schnorrSign,
    verify: schnorrVerify,
    utils: {
        randomPrivateKey: secp256k1.utils.randomPrivateKey,
        lift_x,
        pointToBytes,
        numberToBytesBE,
        bytesToNumberBE,
        taggedHash,
        mod,
    },
}))()));
const isoMap = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => isogenyMap(Fpk1, [
    // xNum
    [
        '0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7',
        '0x7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581',
        '0x534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262',
        '0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c',
    ],
    // xDen
    [
        '0xd35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b',
        '0xedadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14',
        '0x0000000000000000000000000000000000000000000000000000000000000001', // LAST 1
    ],
    // yNum
    [
        '0x4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c',
        '0xc75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3',
        '0x29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931',
        '0x2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84',
    ],
    // yDen
    [
        '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b',
        '0x7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573',
        '0x6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f',
        '0x0000000000000000000000000000000000000000000000000000000000000001', // LAST 1
    ],
].map((i) => i.map((j) => BigInt(j)))))()));
const mapSWU = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => mapToCurveSimpleSWU(Fpk1, {
    A: BigInt('0x3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533'),
    B: BigInt('1771'),
    Z: Fpk1.create(BigInt('-11')),
}))()));
/** Hashing / encoding to secp256k1 points / field. RFC 9380 methods. */
const secp256k1_hasher = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createHasher(secp256k1.Point, (scalars) => {
    const { x, y } = mapSWU(Fpk1.create(scalars[0]));
    return isoMap(x, y);
}, {
    DST: 'secp256k1_XMD:SHA-256_SSWU_RO_',
    encodeDST: 'secp256k1_XMD:SHA-256_SSWU_NU_',
    p: Fpk1.ORDER,
    m: 1,
    k: 128,
    expand: 'xmd',
    hash: sha256,
}))()));
const hashToCurve = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => secp256k1_hasher.hashToCurve)()));
const encodeToCurve = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => secp256k1_hasher.encodeToCurve)()));
//# sourceMappingURL=secp256k1.js.map
;// CONCATENATED MODULE: ./src/drivers/safe-allowance/rlp.ts
// Minimal RLP, enough to encode an EIP-1559 transaction. Chain primitives live
// in drivers only (I1).
/**
 * Integers are encoded as the shortest big-endian byte string with no leading
 * zeros, and zero is the empty string. Getting this wrong produces a
 * structurally valid transaction that recovers to the wrong sender.
 */
function toMinimalBytes(value) {
    if (value < 0n)
        throw new Error(`cannot encode a negative integer: ${value}`);
    if (value === 0n)
        return new Uint8Array(0);
    let hex = value.toString(16);
    if (hex.length % 2 === 1)
        hex = `0${hex}`;
    return rlp_hexToBytes(`0x${hex}`);
}
function rlp_hexToBytes(hex) {
    const body = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (body.length % 2 !== 0)
        throw new Error(`odd-length hex: "${hex}"`);
    const out = new Uint8Array(body.length / 2);
    for (let i = 0; i < out.length; i += 1) {
        const byte = Number.parseInt(body.slice(i * 2, i * 2 + 2), 16);
        if (Number.isNaN(byte))
            throw new Error(`not hex: "${hex}"`);
        out[i] = byte;
    }
    return out;
}
function rlp_bytesToHex(bytes) {
    let out = "0x";
    for (const byte of bytes)
        out += byte.toString(16).padStart(2, "0");
    return out;
}
function concat(parts) {
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }
    return out;
}
/** Length prefix: `short + len`, or `long + lenOfLen` followed by the length. */
function prefix(length, short, long) {
    if (length <= 55)
        return Uint8Array.of(short + length);
    const lengthBytes = toMinimalBytes(BigInt(length));
    return concat([Uint8Array.of(long + lengthBytes.length), lengthBytes]);
}
function rlpEncode(input) {
    if (input instanceof Uint8Array) {
        // A single byte below 0x80 is its own encoding.
        if (input.length === 1 && input[0] < 0x80)
            return input;
        return concat([prefix(input.length, 0x80, 0xb7), input]);
    }
    const payload = concat(input.map(rlpEncode));
    return concat([prefix(payload.length, 0xc0, 0xf7), payload]);
}

;// CONCATENATED MODULE: ./src/drivers/safe-allowance/tx.ts



const TYPE_EIP1559 = 0x02;
function fields(tx) {
    return [
        toMinimalBytes(tx.chainId),
        toMinimalBytes(tx.nonce),
        toMinimalBytes(tx.maxPriorityFeePerGas),
        toMinimalBytes(tx.maxFeePerGas),
        toMinimalBytes(tx.gasLimit),
        rlp_hexToBytes(tx.to),
        toMinimalBytes(tx.value),
        rlp_hexToBytes(tx.data),
    ];
}
/** keccak256(0x02 || rlp([...fields, accessList])) — what actually gets signed. */
function signingHash(tx) {
    const payload = rlpEncode([...fields(tx), []]);
    const typed = new Uint8Array(payload.length + 1);
    typed[0] = TYPE_EIP1559;
    typed.set(payload, 1);
    return keccak_256(typed);
}
function signTransaction(tx, privateKey) {
    const key = rlp_hexToBytes(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
    if (key.length !== 32) {
        throw new Error(`private key must be 32 bytes, got ${key.length}`);
    }
    const signature = secp256k1.sign(signingHash(tx), key);
    const signed = rlpEncode([
        ...fields(tx),
        [],
        // yParity, not the legacy v — type-2 transactions carry the recovery bit raw.
        toMinimalBytes(BigInt(signature.recovery)),
        toMinimalBytes(signature.r),
        toMinimalBytes(signature.s),
    ]);
    const typed = new Uint8Array(signed.length + 1);
    typed[0] = TYPE_EIP1559;
    typed.set(signed, 1);
    return { raw: rlp_bytesToHex(typed), hash: rlp_bytesToHex(keccak_256(typed)) };
}
/** The address a private key controls — used to read the right account nonce. */
function addressFromPrivateKey(privateKey) {
    const key = rlp_hexToBytes(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
    const uncompressed = secp256k1.getPublicKey(key, false).slice(1);
    return rlp_bytesToHex(keccak_256(uncompressed).slice(-20));
}

;// CONCATENATED MODULE: ./src/drivers/safe-allowance/driver.ts



const CAPABILITIES = {
    offlineVerify: true,
    needsGas: true,
    // CI holds the delegate key, so this cannot register in tier 0 (I3).
    needsSecret: true,
    // GitPay never holds funds; the Safe pays the recipient directly (I2).
    custodial: false,
    /**
     * Honestly false. On the `msg.sender == delegate` path the module checks
     * caller identity only — the nonce is consumed as signed-hash input and never
     * compared against a stored value, so an identical second call transfers
     * again while the allowance has headroom. I9 therefore requires a ledger.
     */
    nativeReplayProtection: false,
};
const SAFE_ALLOWANCE_SCHEME = "allowance";
class SafeAllowanceDriver {
    config;
    id = "safe-allowance/eip155";
    capabilities = CAPABILITIES;
    rpc;
    delegate;
    constructor(config) {
        this.config = config;
        this.rpc = new JsonRpc(config.rpcUrl);
        this.delegate = addressFromPrivateKey(config.delegatePrivateKey);
    }
    supports(network, scheme) {
        return network === this.config.network && scheme === SAFE_ALLOWANCE_SCHEME;
    }
    buildRequirements(ctx) {
        return {
            scheme: SAFE_ALLOWANCE_SCHEME,
            network: ctx.intent.network,
            amount: ctx.intent.amount,
            asset: ctx.intent.asset,
            payTo: ctx.target.address,
            maxTimeoutSeconds: 300,
            extra: { safe: this.config.safeAddress, delegate: this.delegate },
        };
    }
    /**
     * There is no counterparty signature to check here — the delegate's authority
     * is the allowance itself, enforced on-chain. Verification is a shape check so
     * a malformed requirement fails before a transaction is built.
     */
    verify(_p, r) {
        if (r.scheme !== SAFE_ALLOWANCE_SCHEME || r.network !== this.config.network) {
            return Promise.resolve({ isValid: false, reason: "DOMAIN_MISMATCH" });
        }
        if (!/^0x[0-9a-fA-F]{40}$/.test(r.payTo)) {
            return Promise.resolve({ isValid: false, reason: "RECIPIENT_MISMATCH" });
        }
        if (!/^[0-9]+$/.test(r.amount) || BigInt(r.amount) === 0n) {
            return Promise.resolve({ isValid: false, reason: "AMOUNT_MISMATCH" });
        }
        return Promise.resolve({ isValid: true, payer: this.config.safeAddress });
    }
    /**
     * Signs. Reads chain state — a nonce and a fee estimate — but writes nothing,
     * so no funds can move here. That is the property that lets the caller record
     * the resulting hash before anything becomes irreversible.
     */
    async prepare(_p, r) {
        const data = encodeExecuteAllowanceTransfer({
            safe: this.config.safeAddress,
            token: this.config.tokenAddress,
            to: r.payTo,
            amount: r.amount,
            delegate: this.delegate,
            // msg.sender is the delegate, so no signature is needed. This path has no
            // replay protection, which is why nativeReplayProtection is false.
            signature: "0x",
        });
        const [pendingHex, latestHex, feeHex, tipHex] = await Promise.all([
            this.rpc.hex("eth_getTransactionCount", [this.delegate, "pending"]),
            this.rpc.hex("eth_getTransactionCount", [this.delegate, "latest"]),
            this.rpc.hex("eth_gasPrice", []),
            this.rpc.hex("eth_maxPriorityFeePerGas", []).catch(() => toHex(1500000000n)),
        ]);
        const pending = fromHex(pendingHex);
        const latest = fromHex(latestHex);
        /**
         * A transaction already in flight owns nonce `latest`. Signing `pending`
         * would queue behind it, and if the in-flight one never lands, every payout
         * after it is stuck too — silently, since each looks fine on its own.
         *
         * Refuse instead. This does not unstick anything, but it stops the queue
         * growing and names the nonce a human has to clear. Automatic replacement is
         * deliberately not attempted: the in-flight transaction may be a different
         * payout that is about to land, and replacing it would mean one contributor
         * silently never gets paid.
         */
        if (pending > latest) {
            throw Object.assign(new Error(`Delegate ${this.delegate} has ${pending - latest} transaction(s) in flight ` +
                `(nonce ${latest} is unconfirmed). Refusing to queue another payout behind it. ` +
                "Wait for it to confirm, or replace it from the delegate wallet using nonce " +
                `${latest} with a higher fee.`), { code: "RPC_UNAVAILABLE" });
        }
        const gasPrice = fromHex(feeHex);
        const tip = fromHex(tipHex);
        // Simulate first. A revert caught here costs no gas and, crucially, happens
        // before anything is recorded or broadcast.
        const call = { from: this.delegate, to: this.config.moduleAddress, data };
        await this.rpc.call("eth_call", [call, "latest"]).catch((err) => {
            throw Object.assign(new Error(`simulation reverted: ${err instanceof Error ? err.message : String(err)}`), { code: "SIMULATION_REVERT" });
        });
        // No guessed fallback. The simulation just passed, so a failed estimate is
        // an RPC problem, and a guessed limit that is too low reverts on-chain,
        // burns gas, and leaves a recorded attempt that needs a `round` bump.
        // Nothing is recorded yet, so aborting here costs nothing.
        const gasLimit = this.config.gasLimit ??
            (await this.rpc
                .hex("eth_estimateGas", [call])
                .then((hex) => (fromHex(hex) * 12n) / 10n)
                .catch((err) => {
                throw Object.assign(new Error(`gas estimation failed: ${err instanceof Error ? err.message : String(err)}`), { code: "RPC_UNAVAILABLE" });
            }));
        const signed = signTransaction({
            chainId: this.config.chainId,
            nonce: pending,
            maxPriorityFeePerGas: tip,
            maxFeePerGas: gasPrice * 2n + tip,
            gasLimit,
            to: this.config.moduleAddress,
            value: 0n,
            data,
        }, this.config.delegatePrivateKey);
        const raw = { raw: signed.raw, to: r.payTo, amount: r.amount };
        return { reference: signed.hash, raw };
    }
    /** The irreversible step. Everything before this can be abandoned safely. */
    async broadcast(prepared) {
        const { raw } = prepared.raw;
        let nonceTooLow = false;
        try {
            await this.rpc.hex("eth_sendRawTransaction", [raw]);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            // Already known to the network is not a failure — it is this exact
            // transaction, which is precisely what we wanted broadcast. A nonce that
            // is too low may also be this transaction, already mined, so it is
            // polled by its exact hash like the others.
            nonceTooLow = /nonce too low/i.test(message);
            if (!nonceTooLow && !/already known|known transaction/i.test(message)) {
                return {
                    success: false,
                    network: this.config.network,
                    errorReason: classify(message),
                };
            }
        }
        // With no receipt for this hash, a nonce that was too low means a different
        // transaction used it, so this one can never land. That is a definite
        // answer, unlike an ordinary timeout.
        return this.awaitReceipt(prepared.reference, nonceTooLow ? "NONCE_CONFLICT" : "RPC_UNAVAILABLE");
    }
    async awaitReceipt(hash, unconfirmed) {
        for (let attempt = 0; attempt < 30; attempt += 1) {
            // One failed poll is not an outcome. The transaction may already be out,
            // so keep polling rather than drop the hash on a transient error.
            const receipt = await this.rpc
                .call("eth_getTransactionReceipt", [hash])
                .catch(() => null);
            if (receipt) {
                return receipt.status === "0x1"
                    ? { success: true, transaction: hash, network: this.config.network }
                    : {
                        success: false,
                        transaction: hash,
                        network: this.config.network,
                        errorReason: "SIMULATION_REVERT",
                    };
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        // Broadcast but unconfirmed. Reported as a failure so nothing claims the
        // payout landed — but the hash is returned, and the caller's ledger entry
        // already holds it, so no retry can quietly pay twice.
        return {
            success: false,
            transaction: hash,
            network: this.config.network,
            errorReason: unconfirmed,
        };
    }
}
function classify(message) {
    if (/insufficient funds/i.test(message))
        return "INSUFFICIENT_GAS";
    if (/revert/i.test(message))
        return "SIMULATION_REVERT";
    return "RPC_UNAVAILABLE";
}

;// CONCATENATED MODULE: ./src/adapters/github/trigger.ts
const SEND_LINE = /^\s*\/send\b(.*)$/;
/** `10`, `2.5`, or `10usdc` with the symbol run onto the number. */
const AMOUNT_WITH_ASSET = /^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z][a-zA-Z0-9]{0,11})?$/;
const ASSET = /^[a-zA-Z][a-zA-Z0-9]{0,11}$/;
const USAGE = "usage: `/send <recipient> <amount> [asset]` — e.g. `/send 0xabc…def 10 USDC`";
/**
 * Finds a `/send` command anywhere in a comment body.
 *
 * Returns `undefined` when the comment simply isn't a command — that is the
 * common case and not an error. Throws only when a line *is* a `/send` but
 * cannot be read, because silently misreading an amount is far worse than
 * refusing it.
 */
function parseSendCommand(body) {
    for (const line of body.split(/\r?\n/)) {
        const match = SEND_LINE.exec(line);
        if (!match)
            continue;
        const tokens = (match[1] ?? "").trim().split(/\s+/).filter(Boolean);
        if (tokens.length < 2) {
            throw new Error(`\`/send\` needs a recipient and an amount. ${USAGE}`);
        }
        if (tokens.length > 3) {
            throw new Error(`\`/send\` got ${tokens.length} arguments and expected at most 3. ${USAGE}`);
        }
        const [recipient, second, third] = tokens;
        const amountMatch = AMOUNT_WITH_ASSET.exec(second);
        if (!amountMatch) {
            throw new Error(`"${second}" is not a valid amount. ${USAGE}`);
        }
        const [, amount, attachedAsset] = amountMatch;
        if (attachedAsset && third) {
            throw new Error(`the asset was given twice, as "${attachedAsset}" and "${third}". ${USAGE}`);
        }
        const asset = attachedAsset ?? third;
        if (asset !== undefined && !ASSET.test(asset)) {
            throw new Error(`"${asset}" is not a valid asset symbol. ${USAGE}`);
        }
        return { recipient, amount, asset };
    }
    return undefined;
}
/**
 * Author associations GitHub reports for people who can be trusted to spend the
 * project's money. Everything else — CONTRIBUTOR, FIRST_TIME_CONTRIBUTOR, NONE —
 * is denied by default, so a drive-by commenter cannot trigger a payout to
 * themselves.
 *
 * Which associations qualify is the adopter's call, so it is configurable. What
 * an association *means* stays here rather than in core policy: `author_association`
 * is a GitHub concept, and core is told only whether the actor may spend.
 */
const DEFAULT_MAINTAINER_ASSOCIATIONS = ["OWNER", "MEMBER", "COLLABORATOR"];
/** Every value GitHub documents for `author_association`. Used to catch typos. */
const KNOWN_ASSOCIATIONS = new Set([
    "OWNER",
    "MEMBER",
    "COLLABORATOR",
    "CONTRIBUTOR",
    "FIRST_TIME_CONTRIBUTOR",
    "FIRST_TIMER",
    "MANNEQUIN",
    "NONE",
]);
/**
 * Reads the configured allowlist, e.g. `OWNER,MEMBER`.
 *
 * An unrecognized entry **warns and is kept** rather than failing the run. A
 * typo can only ever narrow an allowlist — `OWNERS` matches nobody — so the
 * consequence is a denied payout, never an unintended one. Failing outright
 * would instead break every run the day GitHub adds an association value. This
 * follows the `.gitpay.yml` convention: unknown keys warn, never fail.
 *
 * An empty or blank list falls back to the default. Reading it as "allow
 * nobody" would be defensible, but a blank input is far more likely to be an
 * unset repository variable than a deliberate lockout, and silently disabling
 * `/send` is a bad way to find that out — the kill switch exists to say that
 * on purpose.
 */
function parseAssociations(raw) {
    const entries = (raw ?? "")
        .split(",")
        .map((entry) => entry.trim().toUpperCase())
        .filter(Boolean);
    if (entries.length === 0)
        return [...DEFAULT_MAINTAINER_ASSOCIATIONS];
    for (const entry of entries) {
        if (!KNOWN_ASSOCIATIONS.has(entry)) {
            console.warn(`allowed_associations lists "${entry}", which is not a GitHub author_association. ` +
                `It will match nobody. Known values: ${[...KNOWN_ASSOCIATIONS].join(", ")}.`);
        }
    }
    return entries;
}
/**
 * L1 POLICY input, evaluated offline. Returns a fact for `core/policy.ts` to
 * judge rather than throwing here, so one place decides what a denial means and
 * the result table can report this condition alongside the others.
 */
function isMaintainer(association, allowed) {
    const value = (association ?? "").trim().toUpperCase();
    return value.length > 0 && allowed.includes(value);
}

;// CONCATENATED MODULE: ./src/core/amount.ts
// Human amounts in, atomic units out. Pure string arithmetic — floats are not
// allowed anywhere near money, and `parseFloat("0.1")` is exactly why.
const DECIMAL = /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
/**
 * Converts a human-typed decimal amount into atomic units.
 *
 * `toAtomic("10", 6)` is `"10000000"`. `toAtomic("2.5", 6)` is `"2500000"`.
 *
 * `decimals` is passed in, never inferred — the asset registry owns that value
 * (`REFERENCES.md`: resolve decimals from the registry, never infer). Getting it
 * wrong is a 10^n error in someone's payout, so this throws rather than guesses.
 */
function toAtomic(human, decimals) {
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
        throw new Error(`decimals must be an integer between 0 and 36, got "${decimals}"`);
    }
    const value = human.trim();
    if (!DECIMAL.test(value)) {
        throw new Error(`amount must be a positive decimal number without separators, got "${human}"`);
    }
    const [whole, fraction = ""] = value.split(".");
    if (fraction.length > decimals) {
        throw new Error(`amount "${human}" has ${fraction.length} decimal places, but the asset has only ${decimals}`);
    }
    // Strip leading zeros but always leave one digit behind.
    const atomic = `${whole}${fraction.padEnd(decimals, "0")}`.replace(/^0+(?=[0-9])/, "");
    if (/^0+$/.test(atomic)) {
        throw new Error(`amount must be greater than zero, got "${human}"`);
    }
    return atomic;
}

;// CONCATENATED MODULE: ./src/core/defaults.ts
/** I5. Real settlement is always an explicit opt-in. */
const DEFAULT_SETTLEMENT_MODE = "dry-run";
/** Kill switch default. Honored before policy evaluation. */
const DEFAULT_SETTLEMENT_ENABLED = true;
/** Clock-skew allowance and authorization window, in seconds. */
const VALID_AFTER_SKEW_SECONDS = 60;
const VALID_BEFORE_WINDOW_SECONDS = 900;

;// CONCATENATED MODULE: ./src/core/errors.ts
const ERROR_CODES = (/* unused pure expression or super */ null && ([
    "AUTH_ALREADY_USED",
    "AUTH_EXPIRED",
    "AUTH_NOT_YET_VALID",
    "SIGNER_MISMATCH",
    "DOMAIN_MISMATCH",
    "AMOUNT_MISMATCH",
    "RECIPIENT_MISMATCH",
    "IDENTITY_UNRESOLVED",
    "POLICY_DENIED",
    "AMOUNT_CAP_EXCEEDED",
    "INSUFFICIENT_BALANCE",
    "INSUFFICIENT_GAS",
    "SIMULATION_REVERT",
    "RPC_UNAVAILABLE",
    "NONCE_CONFLICT",
    "DRIVER_NOT_FOUND",
    "TIER_VIOLATION",
    "NO_REPLAY_PROTECTION",
]));
const ERRORS = {
    AUTH_ALREADY_USED: {
        meaning: "Authorization nonce already consumed",
        comment: "Already paid — see the original transaction.",
        retry: "no",
        success: true,
    },
    AUTH_EXPIRED: {
        meaning: "Past validBefore",
        comment: "Authorization expired. Re-sign; the window is 15 minutes.",
        retry: "user",
        success: false,
    },
    AUTH_NOT_YET_VALID: {
        meaning: "Before validAfter",
        comment: "Clock skew between signer and node. Wait 60 seconds and retry.",
        retry: "auto",
        success: false,
    },
    SIGNER_MISMATCH: {
        meaning: "Recovered signer is not the expected payer",
        comment: "Wrong wallet connected. Sign with the treasury account.",
        retry: "user",
        success: false,
    },
    DOMAIN_MISMATCH: {
        meaning: "Typed-data domain does not match the asset registry",
        comment: "Check the network and asset in `.gitpay.yml`.",
        retry: "no",
        success: false,
    },
    AMOUNT_MISMATCH: {
        meaning: "Payload amount differs from requirements",
        comment: "The payload was tampered with and was not settled.",
        retry: "no",
        success: false,
    },
    RECIPIENT_MISMATCH: {
        meaning: "Payload recipient differs from requirements",
        comment: "The payload was tampered with and was not settled.",
        retry: "no",
        success: false,
    },
    IDENTITY_UNRESOLVED: {
        meaning: "No resolver matched the recipient identity",
        comment: "Register a payout address or use an inline address.",
        retry: "user",
        success: false,
    },
    POLICY_DENIED: {
        meaning: "A policy condition failed",
        comment: "A required policy condition was not met. Nothing was settled.",
        retry: "no",
        success: false,
    },
    AMOUNT_CAP_EXCEEDED: {
        meaning: "Amount above policy.max_per_payout",
        comment: "Above the configured per-payout cap. Raise the cap or split the payout.",
        retry: "no",
        success: false,
    },
    INSUFFICIENT_BALANCE: {
        meaning: "Treasury balance short of the payout",
        comment: "The treasury does not hold enough of the asset.",
        retry: "user",
        success: false,
    },
    INSUFFICIENT_GAS: {
        meaning: "Broadcasting account cannot pay fees",
        comment: "Fund the broadcasting account with the network's native token.",
        retry: "user",
        success: false,
    },
    SIMULATION_REVERT: {
        meaning: "Pre-broadcast simulation reverted",
        comment: "Simulation reverted before broadcast, so no fees were spent.",
        retry: "no",
        success: false,
    },
    RPC_UNAVAILABLE: {
        meaning: "Every configured endpoint failed",
        comment: "No endpoint responded. Retryable; set `rpc_url` to override.",
        retry: "auto",
        success: false,
    },
    NONCE_CONFLICT: {
        meaning: "A different transaction from the broadcasting account used this nonce",
        comment: "Another transaction took this payout's nonce, so the payout was not sent. " +
            "Check the broadcasting account's history, then retry with a new `round`.",
        retry: "user",
        success: false,
    },
    DRIVER_NOT_FOUND: {
        meaning: "No driver registered for this network and scheme",
        comment: "Unsupported network/scheme combination.",
        retry: "no",
        success: false,
    },
    TIER_VIOLATION: {
        meaning: "Driver requires secrets or custody and cannot run in Tier 0",
        comment: "This driver must run as a separate service you operate.",
        retry: "no",
        success: false,
    },
    NO_REPLAY_PROTECTION: {
        meaning: "Driver does not declare an exactly-once guarantee",
        comment: "Cannot settle without replay protection.",
        retry: "no",
        success: false,
    },
};
class GitPayError extends Error {
    code;
    details;
    constructor(code, message, details = {}) {
        super(message ?? `${code}: ${ERRORS[code].meaning}`);
        this.name = "GitPayError";
        this.code = code;
        this.details = details;
    }
}
function isErrorCode(value) {
    return typeof value === "string" && ERROR_CODES.includes(value);
}
/** I8 lives here: one code in the taxonomy is a success. */
function isSuccessCode(code) {
    return ERRORS[code].success;
}

;// CONCATENATED MODULE: ./src/core/idempotency.ts
/**
 * Returns a canonical string. No hashing, no rail primitives — a driver derives
 * its rail's replay token from this string.
 *
 * `amount` is excluded on purpose: with amount in the key, `/send alice 50`
 * corrected to `/send alice 500` yields two keys and Alice receives 550.
 * Excluded, the correction collides and requires an explicit `round` bump.
 *
 * The string must be injective, so a field may not contain the delimiter that
 * ends it. Otherwise `ref = "R|A|N"` beside `asset = "X"` spells the same key
 * as `ref = "R"` beside `asset = "B|N|X"`, and one payout's receipt would
 * silently block another. Whitespace is refused too: the receipt marker is
 * whitespace-separated, so a key containing a space could never find its own
 * receipt, and the payout could be made twice.
 */
function canonical(k) {
    const repo = field("repo", k.source.repo, /[|#\s]/);
    const ref = field("ref", k.source.ref);
    const recipient = field("recipient", k.recipient).toLowerCase();
    const network = field("network", k.network);
    const asset = field("asset", k.asset);
    // `xops:` predates the rename to GitPay and stays. Receipts already on PRs
    // carry keys with this prefix, and a new prefix would never match them.
    return (`xops:v${k.v}|${k.source.platform}:${repo}#${ref}` +
        `|${recipient}|${network}|${asset}|${k.round}`);
}
function field(name, value, forbidden = /[|\s]/) {
    if (forbidden.test(value)) {
        throw new Error(`Idempotency key field ${name} contains a delimiter or whitespace, got "${value}"`);
    }
    return value;
}
function keyFor(intent) {
    const { source } = intent;
    return {
        v: 1,
        source: {
            platform: source.platform,
            repo: source.platform === "github" ? source.repo : source.project,
            ref: source.ref,
        },
        recipient: intent.recipient,
        asset: intent.asset,
        network: intent.network,
        round: intent.round,
    };
}

;// CONCATENATED MODULE: ./src/core/intent.ts
// CAIP-2: namespace:reference. Says nothing about what the namespace means.
const CAIP2 = /^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$/;
const ATOMIC_AMOUNT = /^[0-9]+$/;
function required(raw, field) {
    const value = raw[field]?.trim();
    if (!value)
        throw new Error(`Missing required intent field: ${field}`);
    return value;
}
function parseIntent(raw) {
    const platform = (raw.platform ?? "github").trim();
    if (platform !== "github" && platform !== "gitlab") {
        throw new Error(`Unsupported platform: ${platform}`);
    }
    const repo = required(raw, "repo");
    const ref = required(raw, "ref");
    const actor = required(raw, "actor");
    const recipient = required(raw, "recipient");
    const amount = required(raw, "amount");
    const asset = required(raw, "asset");
    const network = required(raw, "network");
    const scheme = required(raw, "scheme");
    if (!ATOMIC_AMOUNT.test(amount)) {
        throw new Error(`amount must be a whole number of atomic units as a string, got "${amount}"`);
    }
    if (!CAIP2.test(network)) {
        throw new Error(`network must be a CAIP-2 identifier, got "${network}"`);
    }
    const round = Number(raw.round ?? "0");
    if (!Number.isInteger(round) || round < 0) {
        throw new Error(`round must be a non-negative integer, got "${raw.round}"`);
    }
    const source = platform === "github"
        ? { platform, repo, ref, actor }
        : { platform, project: repo, ref, actor };
    return { source, recipient, amount, asset, network, scheme, round };
}

;// CONCATENATED MODULE: ./src/core/ledger.ts
/**
 * Exactly-once has to come from somewhere.
 *
 * Some rails give it natively: EIP-3009 consumes a nonce, so a replayed
 * authorization reverts and a retry is a no-op. Safe's AllowanceModule does not
 * — on the `msg.sender == delegate` path it checks caller identity only and
 * never compares the nonce against a stored value, so an identical second call
 * transfers again while the allowance has headroom.
 *
 * For a rail like that, a ledger supplies what the chain will not: a durable
 * record, keyed by the canonical idempotency key, that a later run can find.
 *
 * Core defines only the shape. It never learns where the record is kept.
 */
/**
 * A ledger for one payout that also finds entries recorded under older
 * spellings of its key. It writes under the canonical key only, so the aliases
 * are only a migration step. A payout recorded under a spelling the lookup
 * cannot see would be paid again, because nothing on this rail refuses a second
 * transfer.
 */
function withAliases(ledger, aliases) {
    return {
        id: ledger.id,
        async lookup(key) {
            for (const candidate of [key, ...aliases.filter((alias) => alias !== key)]) {
                const entry = await ledger.lookup(candidate);
                if (entry)
                    return entry;
            }
            return undefined;
        },
        record: (key, entry) => ledger.record(key, entry),
        confirm: (key, entry) => ledger.confirm(key, entry),
    };
}
/**
 * A ledger lookup narrows a race, it does not close one. Two runs can both look
 * up, both miss, and both settle. Anything driving a non-idempotent rail needs
 * mutual exclusion around the whole check-settle-record sequence — for GitHub
 * Actions that is a `concurrency:` group keyed on the payout.
 */
const LEDGER_RACE_WARNING = "A ledger lookup is check-then-act. Serialize payouts with a concurrency group.";

;// CONCATENATED MODULE: ./src/core/policy.ts

/**
 * Each condition carries its own error code. A cap breach is not the same event
 * as an outsider being refused, and a maintainer debugging one should not have
 * to read prose to tell them apart.
 */
const CODES = {
    SETTLEMENT_ENABLED: "POLICY_DENIED",
    MAINTAINER_APPROVED: "POLICY_DENIED",
    AMOUNT_WITHIN_CAP: "AMOUNT_CAP_EXCEEDED",
};
/**
 * Pure and total: no throwing, no network, no clock. Every condition is
 * evaluated so the result table shows the full picture rather than stopping at
 * the first failure — a maintainer fixing one problem should be able to see the
 * next one in the same run.
 *
 * Order still matters for which code is reported: the kill switch comes first.
 */
function evaluate(policy, facts) {
    const conditions = [
        policy.enabled
            ? { name: "SETTLEMENT_ENABLED", status: "pass", evidence: "settlement is enabled" }
            : {
                name: "SETTLEMENT_ENABLED",
                status: "fail",
                evidence: "settlement is disabled by the kill switch",
            },
        maintainerCondition(facts.actorIsMaintainer),
        capCondition(policy.maxPerPayout, facts.amount),
    ];
    return { allowed: conditions.every((c) => c.status !== "fail"), conditions };
}
function maintainerCondition(actorIsMaintainer) {
    if (actorIsMaintainer === undefined) {
        return {
            name: "MAINTAINER_APPROVED",
            status: "skip",
            evidence: "not comment-triggered, so there is no comment author to authorize",
        };
    }
    return actorIsMaintainer
        ? { name: "MAINTAINER_APPROVED", status: "pass", evidence: "the author may spend" }
        : {
            name: "MAINTAINER_APPROVED",
            status: "fail",
            evidence: "the comment author is not permitted to spend",
        };
}
function capCondition(maxPerPayout, amount) {
    if (maxPerPayout === undefined) {
        return {
            name: "AMOUNT_WITHIN_CAP",
            status: "skip",
            evidence: "no max_per_payout set; the Safe's allowance period cap is the only ceiling",
        };
    }
    const cap = BigInt(maxPerPayout);
    const value = BigInt(amount);
    return value <= cap
        ? {
            name: "AMOUNT_WITHIN_CAP",
            status: "pass",
            evidence: `${amount} is within the cap of ${maxPerPayout}`,
        }
        : {
            name: "AMOUNT_WITHIN_CAP",
            status: "fail",
            evidence: `${amount} exceeds the cap of ${maxPerPayout} (atomic units)`,
        };
}
/**
 * I10 lives here: this is what stands between an amount and a driver. Call it
 * before anything is resolved, signed or recorded.
 */
function assertAllowed(decision) {
    const failed = decision.conditions.find((c) => c.status === "fail");
    if (!failed)
        return;
    throw new GitPayError(CODES[failed.name], `${failed.name}: ${failed.evidence}`, {
        condition: failed.name,
        conditions: decision.conditions,
    });
}
/** One line per condition. Rendered in the log, and in a PR comment later. */
function format(decision) {
    const mark = { pass: "PASS", fail: "FAIL", skip: "n/a " };
    return decision.conditions
        .map((c) => `  [${mark[c.status]}] ${c.name} — ${c.evidence}`)
        .join("\n");
}

;// CONCATENATED MODULE: ./src/drivers/chains.ts
/**
 * Keyed by CAIP-2, because that is what the intent, the idempotency key and
 * driver resolution all use.
 *
 * No `assets` entry yet, deliberately. REFERENCES.md §2.1 leaves the Ethereum
 * Sepolia USDC address unverified, and a guessed token address is worse than an
 * absent one — so `token` and `decimals` stay maintainer inputs until someone
 * confirms the address and `decimals()` on-chain. That is the one remaining
 * value in the demo workflow that is a function of the network and still has to
 * be typed.
 */
const CHAINS = {
    "eip155:11155111": {
        name: "Ethereum Sepolia",
        network: "eip155:11155111",
        chainId: 11155111n,
        explorer: "https://sepolia.etherscan.io",
        // v0.1.0, verified. Absent from Base Sepolia entirely, which is why this is
        // the only supported network until v1.0.0 — see DECISION-LOG.md §4 and §6c.
        allowanceModule: "0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134",
    },
};
/**
 * Friendly names are *sugar for* the CAIP-2 identifier, never a replacement.
 *
 * AGENTS.md's "CAIP-2, never friendly strings" rule has a mechanism behind it:
 * `network` goes into the idempotency key verbatim, so two spellings of one
 * chain are two keys, and the same payout could settle twice. Resolving the
 * alias before the intent is built keeps a single canonical spelling in the
 * key, the receipt and driver resolution, while letting a workflow say
 * `network: sepolia`.
 */
const ALIASES = {
    sepolia: "eip155:11155111",
    "ethereum-sepolia": "eip155:11155111",
};
function supportedNetworks() {
    return [...Object.keys(CHAINS), ...Object.keys(ALIASES)].sort();
}
/**
 * Maps a friendly alias onto its CAIP-2 identifier, and passes anything else
 * through untouched.
 *
 * Untouched matters: an unlisted network is still a usable one, as long as the
 * workflow supplies the values this registry would have derived. Gating on
 * registry membership would take a working path away in the name of making
 * setup easier. An input that is neither an alias nor valid CAIP-2 fails in
 * `parseIntent`, where that check already lives.
 */
function canonicalNetwork(network) {
    const key = network.trim();
    return ALIASES[key.toLowerCase()] ?? key;
}
/**
 * Does not throw. A miss means "nothing to default from", and the caller
 * reports which input the workflow therefore has to pass — which is a better
 * error than "unknown network", because it names the fix.
 *
 * Pass the CAIP-2 spelling from `canonicalNetwork`, not raw user input.
 */
function lookupChain(network) {
    return CHAINS[network];
}

;// CONCATENATED MODULE: ./src/drivers/registry.ts

function tierViolationMessage(id) {
    return [
        `Driver ${id} takes custody of funds and cannot run in-process.`,
        "Custodial settlement must run as a separate service you operate:",
        "  settlement: { mode: facilitator, url: https://your-service }",
    ].join("\n");
}
/**
 * The only layer that knows rails exist is the driver behind this registry.
 * Everything above resolves `(network × scheme)` and gets an interface back.
 */
class DriverRegistry {
    tier;
    drivers = [];
    constructor(tier = 0) {
        this.tier = tier;
    }
    /** I3: a driver needing secrets or custody cannot register in Tier 0. */
    register(driver) {
        const { needsSecret, custodial } = driver.capabilities;
        if (this.tier === 0 && (needsSecret || custodial)) {
            throw new GitPayError("TIER_VIOLATION", tierViolationMessage(driver.id), {
                driver: driver.id,
                needsSecret,
                custodial,
                tier: this.tier,
            });
        }
        if (this.drivers.some((d) => d.id === driver.id)) {
            throw new Error(`Driver ${driver.id} is already registered`);
        }
        this.drivers.push(driver);
    }
    list() {
        return this.drivers;
    }
    resolve(network, scheme) {
        const driver = this.drivers.find((d) => d.supports(network, scheme));
        if (!driver) {
            throw new GitPayError("DRIVER_NOT_FOUND", `No driver registered for scheme "${scheme}" on network "${network}"`, { network, scheme, registered: this.drivers.map((d) => d.id) });
        }
        return driver;
    }
    buildRequirements(ctx) {
        const driver = this.resolve(ctx.intent.network, ctx.intent.scheme);
        return driver.buildRequirements(ctx);
    }
    async verify(p, r) {
        return this.resolve(r.network, r.scheme).verify(p, r);
    }
    /**
     * I9: refuse before the driver is reached unless exactly-once is guaranteed by
     * something — the rail itself, or a ledger standing in for it.
     *
     * This is deliberately checked at EVERY tier. It used to apply only at tier 0,
     * which meant a driver with no replay protection became settleable simply by
     * constructing the registry at tier 1 — silently, with double payment as the
     * failure mode. A tier says who operates the process and what credentials it
     * holds; it says nothing about whether a retry pays twice.
     */
    async settle(p, r, opts) {
        const driver = this.resolve(r.network, r.scheme);
        if (!driver.capabilities.nativeReplayProtection && !opts) {
            throw new GitPayError("NO_REPLAY_PROTECTION", `Driver ${driver.id} declares no replay protection, so it cannot settle without a ledger`, { driver: driver.id, tier: this.tier });
        }
        if (!opts)
            return driver.broadcast(await driver.prepare(p, r));
        const { idempotencyKey: key, ledger } = opts;
        const prior = await ledger.lookup(key);
        if (prior) {
            // I8: a repeat is a success that settles nothing, never a failure.
            //
            // This holds for `broadcasting` too. An attempt was recorded and signed,
            // so the transaction may well be on-chain — paying again to "make sure"
            // is the one unrecoverable mistake available here. Report the reference
            // and let a human confirm; `round` exists to deliberately re-pay.
            return {
                success: true,
                network: r.network,
                ...(prior.transaction === undefined ? {} : { transaction: prior.transaction }),
                errorReason: "AUTH_ALREADY_USED",
            };
        }
        // Sign first: this yields the transaction reference while nothing has moved.
        const prepared = await driver.prepare(p, r);
        // Write ahead. If this throws, the payout aborts having settled nothing —
        // the cheap failure. Broadcasting unrecorded is the expensive one.
        await ledger.record(key, { status: "broadcasting", transaction: prepared.reference });
        const response = await driver.broadcast(prepared);
        if (response.success) {
            // Best-effort. The record already carries the reference, so losing this
            // costs legibility, never safety — and it must not turn a settled payout
            // into a reported failure.
            try {
                await ledger.confirm(key, {
                    status: "settled",
                    transaction: response.transaction ?? prepared.reference,
                    settledAt: new Date().toISOString(),
                });
            }
            catch (err) {
                console.warn(`Settled ${prepared.reference} but could not confirm the ledger entry: ` +
                    `${err instanceof Error ? err.message : String(err)}`);
            }
        }
        return response;
    }
}

;// CONCATENATED MODULE: ./src/resolvers/inline-address.ts
const INLINE_PREFIX = "inline:";
/**
 * Takes the payout address verbatim from the identity string. It does not
 * validate the address format — the format belongs to a rail, and only the
 * driver for that rail may judge it.
 *
 * Accepts `inline:<value>` and bare values. `@handle` identities are left for
 * lookup-based resolvers.
 */
class InlineAddressResolver {
    id = "inline-address";
    canResolve(identity) {
        const value = strip(identity);
        return value.length > 0 && !value.startsWith("@") && !/\s/.test(value);
    }
    resolve(identity, ctx) {
        return Promise.resolve({
            rail: ctx.rail,
            address: strip(identity),
            resolvedBy: this.id,
        });
    }
}
function strip(identity) {
    const trimmed = identity.trim();
    return trimmed.startsWith(INLINE_PREFIX) ? trimmed.slice(INLINE_PREFIX.length).trim() : trimmed;
}

;// CONCATENATED MODULE: ./src/resolvers/index.ts


class ResolverChain {
    resolvers;
    constructor(resolvers = []) {
        this.resolvers = resolvers;
    }
    use(resolver) {
        this.resolvers.push(resolver);
        return this;
    }
    async resolve(identity, ctx) {
        for (const resolver of this.resolvers) {
            if (resolver.canResolve(identity)) {
                return resolver.resolve(identity, ctx);
            }
        }
        throw new GitPayError("IDENTITY_UNRESOLVED", `No resolver matched "${identity}"`, {
            identity,
            tried: this.resolvers.map((r) => r.id),
        });
    }
}

;// CONCATENATED MODULE: ./src/main.ts















async function run() {
    // L0 TRIGGER. A comment body, when given, is the source of truth for who gets
    // paid and how much — it beats the workflow's static inputs, because a person
    // typed it deliberately.
    const body = readInput("comment");
    const command = body === undefined ? undefined : parseSendCommand(body);
    if (body !== undefined && command === undefined) {
        console.log("no /send command in this comment — nothing to do.");
        writeOutputs({ STATUS: "skipped", ERROR_CODE: "" });
        return 0;
    }
    if (command) {
        const decimals = Number(readInput("decimals") ?? "6");
        console.log(`/send parsed: recipient=${command.recipient} amount=${command.amount}` +
            `${command.asset ? ` asset=${command.asset}` : ""} (decimals=${decimals})`);
    }
    const decimals = Number(readInput("decimals") ?? "6");
    /**
     * Resolve the network spelling BEFORE the intent is built. A friendly alias is
     * sugar for a CAIP-2 identifier, never a substitute: `network` goes into the
     * idempotency key verbatim, so two spellings of one chain would be two keys —
     * and the same payout could then settle twice. One canonical spelling reaches
     * the key, the receipt and driver resolution.
     */
    const requestedNetwork = readInput("network");
    const network = requestedNetwork === undefined ? undefined : canonicalNetwork(requestedNetwork);
    const intent = parseIntent({
        platform: "github",
        repo: readInput("repo") ?? process.env["GITHUB_REPOSITORY"],
        ref: readInput("ref") ?? process.env["GITHUB_REF"],
        actor: readInput("actor") ?? process.env["GITHUB_ACTOR"],
        recipient: command?.recipient ?? readInput("recipient"),
        amount: command ? toAtomic(command.amount, decimals) : readInput("amount"),
        asset: command?.asset ?? readInput("asset"),
        network,
        scheme: readInput("scheme"),
        round: readInput("round"),
    });
    /**
     * L1 POLICY, offline, before anything is resolved, signed or recorded.
     *
     * It runs here rather than inside the `if (command)` branch above for two
     * reasons. The amount only exists once the intent is parsed, so a cap could
     * not have been checked earlier — I10 requires that no amount above
     * `max_per_payout` reaches a driver, and this is the last place that is still
     * true of every path. And it runs before the `dry-run` branch, so a dry run
     * is an honest preview: it reports the same refusal a real run would, instead
     * of reporting success on a payout that policy would have blocked.
     *
     * A future resolver may make network calls, so a refusal landing before
     * resolution also means an outsider cannot make the runner do work.
     */
    const maxPerPayout = readInput("max_per_payout");
    const decision = evaluate({
        enabled: (readInput("enabled") ?? String(DEFAULT_SETTLEMENT_ENABLED)) !== "false",
        // Typed as the maintainer thinks of it, in the same units as `/send`, and
        // converted with the asset's decimals. A cap written in atomic units next
        // to a `/send 2.50` would be read wrong by exactly the person it protects.
        maxPerPayout: maxPerPayout === undefined ? undefined : toAtomic(maxPerPayout, decimals),
    }, {
        // undefined, not false, when nothing was typed into a comment: this run
        // was configured by a workflow, and editing one already needs write access.
        actorIsMaintainer: command === undefined
            ? undefined
            : isMaintainer(readInput("actor_association"), parseAssociations(readInput("allowed_associations"))),
        amount: intent.amount,
    });
    console.log("policy:");
    console.log(format(decision));
    assertAllowed(decision);
    const resolvers = new ResolverChain([new InlineAddressResolver()]);
    const target = await resolvers.resolve(intent.recipient, { rail: intent.network });
    /**
     * The key names the resolved address, not the identity as typed.
     * `inline:0xabc` and `0xabc` are one payee. Keyed on the typed spelling, a
     * payout sent one way and retried the other way would find no receipt, and
     * this rail would transfer again.
     *
     * Receipts written before this change carry the `inline:` spelling. They are
     * still looked up, but new ones are recorded only under the canonical key.
     */
    const key = keyFor(intent);
    const idempotencyKey = canonical({ ...key, recipient: target.address });
    const legacyKeys = target.resolvedBy === "inline-address"
        ? [canonical({ ...key, recipient: `${INLINE_PREFIX}${target.address}` })]
        : [];
    console.log("intent:");
    console.log(JSON.stringify(intent, null, 2));
    console.log("payout target:");
    console.log(JSON.stringify(target, null, 2));
    console.log(`idempotency key: ${idempotencyKey}`);
    const mode = readInput("mode") ?? DEFAULT_SETTLEMENT_MODE;
    if (mode === "dry-run") {
        console.log("mode: dry-run — nothing was settled.");
        writeOutputs({ STATUS: "dry-run", IDEMPOTENCY_KEY: idempotencyKey, ERROR_CODE: "" });
        return 0;
    }
    if (maxPerPayout === undefined) {
        // Only worth saying on a path that actually moves money.
        console.warn("no max_per_payout set — the Safe's allowance period cap is the only ceiling on this payout.");
    }
    const required = (name) => {
        const value = readInput(name);
        if (!value)
            throw new Error(`Real settlement needs the "${name}" input`);
        return value;
    };
    /**
     * Anything that is a function of the network comes from the chain registry,
     * and an explicit input still wins — a custom module deployment or a private
     * explorer stays configurable, and an unlisted network stays usable by
     * passing all three.
     *
     * The point is not saved typing. `chain_id` written next to `network` is one
     * fact in two formats with nothing comparing them: `supports()` and
     * `verify()` both match on the CAIP-2 network alone, so a mismatched chain id
     * is signed without complaint and rejected only at broadcast — by which time
     * the ledger has recorded the attempt, and the payout is stuck behind
     * `already-paid` until someone bumps `round`.
     */
    const chain = lookupChain(intent.network);
    const derived = (name, fallback) => {
        const value = readInput(name) ?? fallback;
        if (!value) {
            throw new Error(`Real settlement needs the "${name}" input: network ${intent.network} is not in ` +
                "the chain registry, so there is nothing to derive it from.");
        }
        return value;
    };
    const driver = new SafeAllowanceDriver({
        network: intent.network,
        chainId: BigInt(derived("chain_id", chain?.chainId.toString())),
        rpcUrl: required("rpc_url"),
        moduleAddress: derived("allowance_module", chain?.allowanceModule),
        safeAddress: required("safe"),
        tokenAddress: required("token"),
        delegatePrivateKey: required("delegate_key"),
    });
    /**
     * Tier 1, not 0: CI holds the delegate key, so this is an adopter-operated
     * process with its own credentials. I3 would reject it at tier 0, correctly —
     * and I9 still applies here, which is why the ledger below is not optional.
     */
    const registry = new DriverRegistry(1);
    registry.register(driver);
    const explorerUrl = readInput("explorer_url") ?? chain?.explorer;
    const receipts = new PullRequestReceiptLedger({
        repo: intent.source.platform === "github" ? intent.source.repo : intent.source.project,
        number: Number(required("pr")),
        token: required("github_token"),
        // Presentation for the receipt. The explorer base is resolved here and
        // handed over as a plain string, so the adapter still imports no chain
        // knowledge and holds no constant of its own (I1).
        context: {
            amount: command?.amount ?? intent.amount,
            asset: intent.asset,
            to: target.address,
            from: readInput("safe"),
            actor: intent.source.actor,
            network: intent.network,
            explorerUrl,
        },
    });
    const ledger = withAliases(receipts, legacyKeys);
    const requirements = registry.buildRequirements({ intent, target, idempotencyKey });
    const verified = await driver.verify({ x402Version: 2, scheme: intent.scheme, network: intent.network, payload: {} }, requirements);
    if (!verified.isValid) {
        throw new GitPayError(verified.reason ?? "POLICY_DENIED", "The payout failed verification");
    }
    const response = await registry.settle({ x402Version: 2, scheme: intent.scheme, network: intent.network, payload: {} }, requirements, { idempotencyKey, ledger });
    const alreadyPaid = response.errorReason === "AUTH_ALREADY_USED";
    console.log(alreadyPaid
        ? `already paid — ${response.transaction ?? "no transaction recorded"}`
        : `settled: ${response.transaction ?? "(no transaction)"}`);
    writeOutputs({
        STATUS: response.success ? (alreadyPaid ? "already-paid" : "settled") : "error",
        TX_HASH: response.transaction ?? "",
        EXPLORER_URL: explorerUrl && response.transaction
            ? `${explorerUrl.replace(/\/+$/, "")}/tx/${response.transaction}`
            : "",
        IDEMPOTENCY_KEY: idempotencyKey,
        ERROR_CODE: response.success ? "" : (response.errorReason ?? ""),
    });
    return response.success ? 0 : 1;
}
run().then((code) => {
    process.exitCode = code;
}, (err) => {
    const code = err instanceof GitPayError ? err.code : "";
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    writeOutputs({ STATUS: "error", TX_HASH: "", EXPLORER_URL: "", ERROR_CODE: code });
    process.exitCode = 1;
});

