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
  assert.match(source, />My Certificates</);
});
