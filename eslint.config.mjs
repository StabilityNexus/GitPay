import js from "@eslint/js";
import tseslint from "typescript-eslint";

// I1 — THE ONE RULE, as a lint rule. Written before there was anything to lint.
const CHAIN_LIBRARIES = [
  "ethers",
  "ethers/*",
  "@ethersproject/*",
  "viem",
  "viem/*",
  "thirdweb",
  "thirdweb/*",
  "web3",
  "web3-*",
  "ox",
  "ox/*",
  "x402",
  "@x402/*",
  "@noble/*",
  "@scure/*",
  "@solana/*",
  "bn.js",
  "elliptic",
  "keccak",
  "js-sha3",
];

const WRONG_DIRECTION = ["**/drivers", "**/drivers/*", "**/drivers/**", "**/assets/*"];

export default tseslint.config(
  { ignores: ["dist/", "build/", "node_modules/", "signer/", "dangerfile.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      eqeqeq: ["error", "always"],
      "no-console": "off",
    },
  },
  {
    files: ["src/core/**/*.ts", "src/adapters/**/*.ts", "src/resolvers/**/*.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: CHAIN_LIBRARIES,
              message:
                "I1: core, adapters and resolvers may not import a chain library or payment SDK. This belongs in a driver. See AGENTS.md.",
              allowTypeImports: false,
            },
            {
              group: WRONG_DIRECTION,
              message:
                "I1: the boundary points one way — drivers import core, never the reverse. See AGENTS.md.",
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { process: "readonly", console: "readonly" },
    },
  },
);
