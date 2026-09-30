# Verified chains

Every network GitPay supports is proven here with real transactions, following the per-chain
protocol in `REFERENCES.md` §2.6. A row is a transaction anyone can check on the explorer, not a
recollection.

## Ethereum Sepolia (`eip155:11155111`)

| | |
|---|---|
| AllowanceModule | `0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134` (Safe canonical, v0.1.0) |
| Safe | [`0x5b7d5882058e001c5502cbf5c2497ec5da54e6e2`](https://sepolia.etherscan.io/address/0x5b7d5882058e001c5502cbf5c2497ec5da54e6e2) |
| Token | `0xb031fed937326c333e3c35b85c3db8abca7a2400` (test USDC, 6 decimals) |
| Delegate | `0xf38983ba76d47e3717734d5039a2a14781de726e` |
| Code under test | [`StabilityNexus/GitPay@8403654`](https://github.com/StabilityNexus/GitPay/commit/840365478e41994c3c78a052c2cc8381eb4cff82) |
| Adopter repo | [kpj2006/demo-XOps](https://github.com/kpj2006/demo-XOps) |

### Payout from a merged PR

After [demo-XOps#2](https://github.com/kpj2006/demo-XOps/pull/2) was merged, a `/send` on it
settled
[`0x75e9a15a…`](https://sepolia.etherscan.io/tx/0x75e9a15aef72365d2ffb4226404904ff953424f0c58e794cc750ceece433f1a7)
(0.01 to `0x0000…a001`, [run](https://github.com/kpj2006/demo-XOps/actions/runs/36790520521)).

### 20 consecutive settlements, with replays

On [demo-XOps#3](https://github.com/kpj2006/demo-XOps/pull/3), 2026-10-01. Twenty `/send`
comments in a row, each to a distinct address, with no failure between them. After every fifth,
an already-paid payout was sent again (↺). Each replay reported `already-paid` against its
original transaction, and none moved funds.

| # | Recipient | tUSDC | Status | Transaction | Evidence |
|---|---|---|---|---|---|
| 1 | `0x0000…b001` | 0.01 | `settled` | [`0x9b9e0bed…`](https://sepolia.etherscan.io/tx/0x9b9e0bed013b535aa2ae58806d81cb71b1064b97ebc0fc7a08d376d4b0c9ff07) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36790635486) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921446103) |
| 2 | `0x0000…b002` | 0.01 | `settled` | [`0xe2f933ba…`](https://sepolia.etherscan.io/tx/0xe2f933ba6ba655d1ced8601d769bce9b7e65b64c341190c5afa377606db8292a) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36790917613) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921490579) |
| 3 | `0x0000…b003` | 0.01 | `settled` | [`0xcb6506c2…`](https://sepolia.etherscan.io/tx/0xcb6506c2f64ac9c6c0ab31533093eea9ed51977d11c3d906612a2308268b6638) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36790981623) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921500237) |
| 4 | `0x0000…b004` | 0.01 | `settled` | [`0x66460305…`](https://sepolia.etherscan.io/tx/0x664603052352f54a9de96eaadf8035469a6e73a0630eabf5d94bf577b8e30b99) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791033460) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921507583) |
| 5 | `0x0000…b005` | 0.01 | `settled` | [`0x8abd2aa2…`](https://sepolia.etherscan.io/tx/0x8abd2aa2a3409e478629cde81ca18a0ddb11f8e3008345ea476e42cd25665be2) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791080947) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921514790) |
| ↺ after 5 | `0x0000…b001` | — | `already-paid` | [`0x9b9e0bed…`](https://sepolia.etherscan.io/tx/0x9b9e0bed013b535aa2ae58806d81cb71b1064b97ebc0fc7a08d376d4b0c9ff07) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791202182) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921532087) |
| 6 | `0x0000…b006` | 0.01 | `settled` | [`0xc129dbfb…`](https://sepolia.etherscan.io/tx/0xc129dbfb722aadfd4a619fbed46422839ccfa2d9f272bcfee70f4a1d7e784d8f) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791280068) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921543124) |
| 7 | `0x0000…b007` | 0.01 | `settled` | [`0x7cdc7dff…`](https://sepolia.etherscan.io/tx/0x7cdc7dfff7838a111b2b1ee51c37d3ff7d4fe26b77f2afac2642eec1e47e1c4c) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791320376) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921549030) |
| 8 | `0x0000…b008` | 0.01 | `settled` | [`0x1939f519…`](https://sepolia.etherscan.io/tx/0x1939f5194426edeb8e0b1119cc34930b44db0c58b4dffa792e4044447931302a) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791370285) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921556329) |
| 9 | `0x0000…b009` | 0.01 | `settled` | [`0xc66fb721…`](https://sepolia.etherscan.io/tx/0xc66fb721e57e46544c743ef0ecde30555bd25bc5ec3002abcd75000a5af070a9) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791426685) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921563984) |
| 10 | `0x0000…b00a` | 0.01 | `settled` | [`0x8d051a3c…`](https://sepolia.etherscan.io/tx/0x8d051a3c551a1eda58c34c2ea2ce04f6a83f00050898d8c90a3754b9c38efd26) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791477986) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921571604) |
| ↺ after 10 | `0x0000…b006` | — | `already-paid` | [`0xc129dbfb…`](https://sepolia.etherscan.io/tx/0xc129dbfb722aadfd4a619fbed46422839ccfa2d9f272bcfee70f4a1d7e784d8f) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791530870) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921579187) |
| 11 | `0x0000…b00b` | 0.01 | `settled` | [`0xeacdf28c…`](https://sepolia.etherscan.io/tx/0xeacdf28cdf3add58f7870cc3e76bc63d9bf3d2739262130701a918e1cea68750) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791558206) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921583498) |
| 12 | `0x0000…b00c` | 0.01 | `settled` | [`0x6041e4b3…`](https://sepolia.etherscan.io/tx/0x6041e4b302d29f3fa06ea2f7ce689fbb718ab193a957a649af6ff3ad328a7e20) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791592864) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921589177) |
| 13 | `0x0000…b00d` | 0.01 | `settled` | [`0x06204258…`](https://sepolia.etherscan.io/tx/0x062042589b98b11617d7c99715d507cd0706872fb56c71f468d7c44ff62ef9ee) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791644055) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921596699) |
| 14 | `0x0000…b00e` | 0.01 | `settled` | [`0x20863a53…`](https://sepolia.etherscan.io/tx/0x20863a53dfc115259309a07285b756ab39fcbf113f321659da19728310fd3727) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791700681) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921605046) |
| 15 | `0x0000…b00f` | 0.01 | `settled` | [`0x32ddcf59…`](https://sepolia.etherscan.io/tx/0x32ddcf59c633744f37d180a4dd0b04218d0c0cc64d72cd20beba665a7e439bfd) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791748725) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921612023) |
| ↺ after 15 | `0x0000…b00b` | — | `already-paid` | [`0xeacdf28c…`](https://sepolia.etherscan.io/tx/0xeacdf28cdf3add58f7870cc3e76bc63d9bf3d2739262130701a918e1cea68750) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791811616) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921621145) |
| 16 | `0x0000…b010` | 0.01 | `settled` | [`0xd9eedf2f…`](https://sepolia.etherscan.io/tx/0xd9eedf2ff0b37029c3bfb15b1e3c42a2e6108929f924354aa58f5eaa95623842) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791854636) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921627552) |
| 17 | `0x0000…b011` | 0.01 | `settled` | [`0x0a74ba47…`](https://sepolia.etherscan.io/tx/0x0a74ba474ad2807bf467efd89ba8d4510aa8fd523ed41002b4152faf2b458a58) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791911927) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921635833) |
| 18 | `0x0000…b012` | 0.01 | `settled` | [`0x687aa421…`](https://sepolia.etherscan.io/tx/0x687aa421709125ff35a9a1886c1609e7935b3b905b91182561ceb85c524fd365) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36791985942) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921647875) |
| 19 | `0x0000…b013` | 0.01 | `settled` | [`0xdd23bc25…`](https://sepolia.etherscan.io/tx/0xdd23bc25dce943f9d927a67f09e2a68f28aad9eb747d888ca0213067f85c9452) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36792045401) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921657598) |
| 20 | `0x0000…b014` | 0.01 | `settled` | [`0x0b353b21…`](https://sepolia.etherscan.io/tx/0x0b353b21d9a48043b5f6a9710f69a313cfff4c92936c0ca39b5b8fc3f249f194) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36792103698) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921665425) |
| ↺ after 20 | `0x0000…b010` | — | `already-paid` | [`0xd9eedf2f…`](https://sepolia.etherscan.io/tx/0xd9eedf2ff0b37029c3bfb15b1e3c42a2e6108929f924354aa58f5eaa95623842) | [run](https://github.com/kpj2006/demo-XOps/actions/runs/36792148813) · [comment](https://github.com/kpj2006/demo-XOps/pull/3#issuecomment-5921670956) |

**Checked on-chain, not just in the workflow logs.** Every settlement above has receipt status
`0x1`, called the AllowanceModule, and emitted exactly one `Transfer` of 10000 atomic units
(0.01) from the Safe to that row's recipient, with no transaction hash repeated. The Safe's
balance fell from 99.94 to 99.73, and the module records 0.21 spent. That is exactly the 21
payouts on this page (20 here plus the merged-PR payout). The four replays moved nothing.

### Earlier runs

Before the move to GitPay, [demo-XOps#1](https://github.com/kpj2006/demo-XOps/pull/1) settled
three payouts on the pre-rename implementation, and a replay there reported `already-paid`. See
the release gate in `REFERENCES.md` §2.4.
