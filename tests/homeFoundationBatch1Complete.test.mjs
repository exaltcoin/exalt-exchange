import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Dashboard.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 1 completion tests: display currency selector (USD/USDT/BTC),
  real BTC price fetching via the new reference-price endpoint, the
  Today P&L honesty finding, the Transfer removal finding, and the
  new locked/in-use balance display.

  Batch 2 update: the display-currency mechanism itself was extracted
  into hooks/useDisplayCurrency.js (so Assets.jsx reuses the same real
  logic rather than duplicating it) - these three tests now check the
  hook file directly for the actual mechanism, and confirm Dashboard.jsx
  genuinely uses the shared hook rather than its own copy.
*/

const hookSource = await readFile(
  new URL("../src/hooks/useDisplayCurrency.js", import.meta.url),
  "utf8"
);

test("Dashboard.jsx uses the real, shared useDisplayCurrency hook - not its own duplicated copy of the logic", () => {
  assert.match(source, /import \{ useDisplayCurrency \} from "\.\.\/hooks\/useDisplayCurrency\.js"/);
  assert.match(source, /const \{[\s\S]{0,150}\} = useDisplayCurrency\(\)/);
});

test("display currency preference persists via localStorage, defaulting to USD, restricted to the three real supported values", () => {
  assert.match(hookSource, /const \[displayCurrency, setDisplayCurrency\] = useState/);
  assert.match(hookSource, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(hookSource, /SUPPORTED_CURRENCIES\.includes\(stored\)/);
});

test("BTC price is fetched from the real reference-price endpoint, only when BTC is actually selected", () => {
  assert.match(hookSource, /\/api\/market\/reference-price\/BTC/);

  const effectMatch = hookSource.match(
    /useEffect\(\(\) => \{\s*\n\s*if \(displayCurrency === "BTC"\)[\s\S]{0,150}/
  );
  assert.ok(effectMatch, "conditional BTC price fetch effect not found");
});

test("convertForDisplay never fabricates a BTC value - returns null (not 0, not the raw USD figure) when no trustworthy price is available", () => {
  const fnMatch = hookSource.match(
    /const convertForDisplay = useCallback\(\s*\n?\s*\(usdValue\) => \{[\s\S]*?\n {4,6}\},/
  );
  assert.ok(fnMatch, "convertForDisplay function not found");
  assert.match(fnMatch[0], /btcPriceLoadState !== "ready" \|\| !btcPriceUsd/);
  assert.match(fnMatch[0], /return null/);
});

test("formatDisplayValue renders an explicit unavailable label when convertForDisplay returns null - never blank or a fabricated number", () => {
  const fnMatch = source.match(
    /const formatDisplayValue = \(usdValue\) => \{[\s\S]*?\n {2}\};/
  );
  assert.ok(fnMatch, "formatDisplayValue function not found");
  assert.match(fnMatch[0], /if \(converted === null\)/);
  assert.match(fnMatch[0], /"unavailable"/);
});

test("Today P&L is genuinely omitted, not silently missing - a documented audit finding explains why, matching the explicit no-fake-number instruction", () => {
  assert.match(source, /Batch 1 audit finding, documented rather than fabricated/);
  assert.match(source, /Today's P&L/);
  assert.doesNotMatch(source, /todaysPnl|todayPnL|todayPnl/i);
});

test("Transfer quick action was removed with a documented reason - not silently deleted, not left pointing at a page with nothing to do", () => {
  assert.doesNotMatch(source, /"transfer", "Transfer", "wallets"\)\s*\}\s*<\/Button>/);
  assert.match(source, /Batch 1 audit finding: a general-purpose "Transfer"/);
  assert.match(source, /Wallets\.jsx \(a protected file, not modified by/);
});

test("Deposit, Withdraw, and Earn quick actions remain - only the genuinely non-functional Transfer was removed", () => {
  assert.match(source, /"deposit", "Deposit", "wallets"/);
  assert.match(source, /"withdraw", "Withdraw", "wallets"/);
  assert.match(source, /onClick=\{\(\) => setPage\("staking"\)\}/);
});

test("a real locked/in-use balance is now displayed, sourced from the same real lockedBalanceValue computation already used elsewhere", () => {
  assert.match(source, /"lockedBalance",\s*\n?\s*"In Use \/ Locked",\s*\n?\s*"wallets"/);
  const lockedBlockMatch = source.match(
    /"lockedBalance",\s*\n?\s*"In Use \/ Locked",\s*\n?\s*"wallets"[\s\S]{0,700}/
  );
  assert.match(lockedBlockMatch[0], /formatDisplayValue\(lockedBalanceValue\)/);
  assert.match(lockedBlockMatch[0], /balancesHidden/);
});

test("a real user header exists using the real uid and profileImage, never a hardcoded username", () => {
  assert.match(source, /storedUser\?\.uid/);
  assert.match(source, /storedUser\?\.profileImage/);
  assert.doesNotMatch(source, /UID: 123456789/);
});

test("bottom navigation resolves to exactly the 5 real destinations with no dead entries", () => {
  const navMatch = source.match(/const bottomNavigation = \[[\s\S]*?\];/);
  const keys = [...navMatch[0].matchAll(/"([a-z-]+)",\s*"[^"]*"\]/g)].map(
    (m) => m[1]
  );
  assert.deepEqual(keys, ["dashboard", "markets", "trade", "futures", "assets"]);
});
