import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("../src/components/Web3Wallet.jsx", import.meta.url),
  "utf8"
);

const forbiddenSourcePatterns = [
  [/Wallet\.createRandom\s*\(/, "Wallet.createRandom"],
  [/\bcreateRandom\s*\(/, "createRandom"],
  [/\bmnemonic\b/i, "mnemonic browser flow"],
  [/\bprivateKey\b/i, "privateKey browser flow"],
  [/\brecovery\s+phrase\b/i, "recovery phrase browser flow"],
  [/window\.ethereum/i, "injected browser wallet"],
  [/WalletConnect/i, "WalletConnect"],
];

const requiredBackendRoutes = [
  "/api/web3-wallet/networks",
  "/api/web3-wallet/wallet",
  "/api/web3-wallet/balances",
  "/api/web3-wallet/portfolio",
  "/api/web3-wallet/send",
  "/api/web3-wallet/swap",
  "/api/web3-wallet/swap/quote",
  "/api/web3-wallet/validate-address",
  "/api/web3-wallet/transactions",
];

test("Web3Wallet contains no browser self-custody primitives or recovery flows", () => {
  for (const [pattern, label] of forbiddenSourcePatterns) {
    assert.doesNotMatch(source, pattern, `forbidden Web3 source primitive: ${label}`);
  }
});

test("Web3Wallet does not persist wallet secrets in localStorage", () => {
  const secretStoragePattern =
    /localStorage\.(?:setItem|getItem)\s*\(\s*["'`](?:[^"'`]*(?:wallet|private|mnemonic|recovery|seed|phrase|secret)[^"'`]*)["'`]/i;
  assert.doesNotMatch(source, secretStoragePattern);
});

test("Web3Wallet requires the complete backend-custodied API contract", () => {
  for (const route of requiredBackendRoutes) {
    assert.ok(source.includes(route), `missing backend custody route: ${route}`);
  }
});
