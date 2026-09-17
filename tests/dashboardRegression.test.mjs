import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/components/Dashboard.jsx", import.meta.url), "utf8");

test("Dashboard loads every golden backend data source", () => {
  for (const endpoint of [
    "/api/wallets/me",
    "/api/orders/my",
    "/api/transactions",
    "/api/referrals/me",
    "/api/rewards/dashboard",
    "/api/market/live",
  ]) {
    assert.ok(source.includes(endpoint), `missing ${endpoint}`);
  }
});

test("Dashboard preserves certificate access", () => {
  assert.match(source, /setPage\("certificates"\)/);
  // The original assertion here required literal, untranslated JSX
  // text - itself a real i18n gap. The redesign routes this
  // through the same translateWithFallback pattern every other
  // label in this file uses, reusing the same "certificates" key
  // the main nav item already uses (avoiding a duplicate synonym
  // key), added to i18n/locales/*/navigation.json for all six
  // languages.
  assert.match(
    source,
    /translateWithFallback\(\s*"certificates",\s*"My Certificates",\s*"navigation"\s*\)/
  );
});
