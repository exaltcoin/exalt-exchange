import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const wallets = await readFile(new URL("../src/components/AdminWallets.jsx", import.meta.url), "utf8");
const dialog = await readFile(new URL("../src/features/earnedExalt/OwnerStepUpDialog.jsx", import.meta.url), "utf8");

test("owner wallet reconciliation requires preview, explicit selection and step-up header", () => {
  assert.match(wallets, /wallet-ledger-report/);
  assert.match(wallets, /wallet-ledger-repair/);
  assert.match(wallets, /X-Owner-Step-Up/);
  assert.match(wallets, /wallet_reconciliation/);
  assert.match(wallets, /fingerprint/);
});

test("OwnerStepUpDialog supports a caller-selected scope", () => {
  assert.match(dialog, /scope = "earned_exalt"/);
  assert.match(dialog, /\{ token: totp, scope \}/);
  assert.match(dialog, /result\.scope !== scope/);
});
