import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { findUnboundRenderedComponents } from "./componentParity.mjs";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("app.jsx and AdminPanel.jsx have import parity for rendered components", () => {
  assert.deepEqual(findUnboundRenderedComponents("src/app.jsx"), []);
  assert.deepEqual(findUnboundRenderedComponents("src/AdminPanel.jsx"), []);
});

test("all release-critical sidebar destinations have explicit render branches", () => {
  const source = read("src/app.jsx");
  const requiredPages = [
    "dashboard", "trade", "futures", "p2p", "wallets", "web3wallet",
    "transactions", "certificates", "support", "referral", "rewards",
    "kyc", "admin-p2p", "admin-learn", "admin-referrals", "admin-rewards",
    "admin", "owner-control", "super-admin", "moderator-panel",
  ];

  for (const page of requiredPages) {
    assert.match(source, new RegExp(`page === ["']${page}["']`), `missing render branch for ${page}`);
    assert.match(source, new RegExp(`["']${page}["']\\s*,`), `missing menu entry for ${page}`);
  }
});

test("AdminPanel tab buttons have matching rendered content branches", () => {
  const source = read("src/AdminPanel.jsx");
  const clickedTabs = [...source.matchAll(/setAdminTab\(["']([^"']+)["']\)/g)].map((match) => match[1]);
  assert.ok(clickedTabs.length > 0, "no AdminPanel tab navigation found");

  for (const tab of new Set(clickedTabs)) {
    assert.match(source, new RegExp(`adminTab === ["']${tab}["']`), `missing AdminPanel render branch for ${tab}`);
  }
});

test("certificate public, verification, personal, QR and admin flows remain wired", () => {
  const app = read("src/app.jsx");
  const certificates = read("src/components/Certificates.jsx");

  assert.match(app, /path === "\/certificates"/);
  assert.match(app, /path === "\/certificates\/verify"/);
  assert.match(app, /<Certificates mode="my"/);
  assert.match(certificates, /\/api\/certificates\/public/);
  assert.match(certificates, /\/api\/certificates\/verify\//);
  assert.match(certificates, /\/api\/certificates\/my\/.*\/qr/);
  assert.match(certificates, /\/api\/certificates\/admin\/issue/);
  assert.match(certificates, /\/api\/certificates\/admin\/.*\/revoke/);
});

test("latest Wallet and Web3 feature implementations remain selected", () => {
  const app = read("src/app.jsx");
  const wallets = read("src/components/Wallets.jsx");
  const web3 = read("src/components/Web3Wallet.jsx");

  assert.match(app, /import\("\.\/components\/Wallets"\)/);
  assert.match(app, /import\("\.\/components\/Web3Wallet"\)/);
  assert.ok(wallets.length > 70000, "Wallets.jsx unexpectedly replaced by a reduced legacy implementation");
  assert.ok(web3.length > 50000, "Web3Wallet.jsx unexpectedly replaced by a reduced legacy implementation");
});
