import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Dashboard.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 1 (Home foundation) regression tests, per the product spec:
  bottom nav = exactly Home/Markets/Trade/Futures/Assets (5 items,
  replacing the previous 6-item set); a real hide/show balance
  toggle; a real Earn quick action (wired to the existing staking
  page, not a placeholder); and confirmation that no fake "Convert"
  action was added despite being requested, since no Convert backend
  exists anywhere in this sandbox.
*/

test("bottom navigation matches the exact 5-item product spec: Home, Markets, Trade, Futures, Assets", () => {
  const navMatch = source.match(
    /const bottomNavigation = \[[\s\S]*?\];/
  );
  assert.ok(navMatch, "bottomNavigation array not found");

  const keys = [...navMatch[0].matchAll(/"([a-z-]+)",\s*"[^"]*"\]/g)].map(
    (m) => m[1]
  );

  assert.deepEqual(keys, ["dashboard", "markets", "trade", "futures", "assets"]);
});

test("a real hide/show balance toggle exists, persisted via localStorage (a UI preference, not financial data)", () => {
  assert.match(source, /const \[balancesHidden, setBalancesHidden\] = useState/);
  assert.match(source, /localStorage\.getItem\("exalt_balances_hidden"\)/);
  assert.match(source, /localStorage\.setItem\(\s*\n?\s*"exalt_balances_hidden"/);
});

test("total and available balance both respect the hide/show toggle - masked consistently, not just one of the two", () => {
  const totalBlockMatch = source.match(
    /totalPortfolioValue[\s\S]{0,700}/
  );
  const availableBlockMatch = source.match(
    /"availableBalance",\s*\n?\s*"Available Balance"[\s\S]{0,600}/
  );

  assert.match(totalBlockMatch[0], /balancesHidden/);
  assert.ok(availableBlockMatch, "availableBalance render block not found");
  assert.match(availableBlockMatch[0], /balancesHidden/);
});

test("Earn links to the real, existing staking page - not a placeholder route", () => {
  const earnButtonMatch = source.match(
    /onClick=\{\(\) => setPage\("staking"\)\}[\s\S]{0,100}/
  );
  assert.ok(earnButtonMatch, "Earn quick action not found or not wired to setPage(\"staking\")");
  assert.match(earnButtonMatch[0], /"earn", "Earn"/);
});

test("no fake Convert quick action was added - no Convert backend exists in this sandbox, so none is offered", () => {
  assert.doesNotMatch(source, /setPage\("convert"\)/);
});
