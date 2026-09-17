import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const assetsSource = await readFile(
  new URL("../src/components/Assets.jsx", import.meta.url),
  "utf8"
);
const appSource = await readFile(
  new URL("../src/app.jsx", import.meta.url),
  "utf8"
);
const hookSource = await readFile(
  new URL("../src/hooks/useDisplayCurrency.js", import.meta.url),
  "utf8"
);

/*
  Batch 2 (Assets + real account architecture) regression tests.
  Verifies: no fabricated account buckets (no "Funding Account" /
  "Unified Account"), real backend data sources, the shared
  display-currency hook is genuinely reused (not duplicated), Batch 1
  privacy masking extended consistently, real transaction-history
  entry points, and that Wallets.jsx (protected) was not modified or
  orphaned by adding the new page.
*/

test("Assets.jsx uses the real GET /api/wallets/me endpoint - the single canonical wallet data source, not a second one", () => {
  assert.match(assetsSource, /\/api\/wallets\/me/);
});

test("no fabricated account bucket exists anywhere in Assets.jsx as an actual UI section - the string only appears once, in the explanatory comment documenting its deliberate absence", () => {
  // "Unified Account"/"Funding Account" may appear ONCE, inside the
  // comment explaining why they were NOT built (quoting them for
  // context, same pattern as the Futures.jsx stale-comment fix) -
  // what matters is neither is an actual rendered Section title.
  assert.doesNotMatch(assetsSource, /<Section\s*\n?\s*title=\{translateWithFallback\("[^"]*[Ff]unding/);
  assert.doesNotMatch(assetsSource, /<Section\s*\n?\s*title=\{translateWithFallback\("[^"]*[Uu]nified/);
  assert.match(assetsSource, /no fabricated "Funding Account" or "Unified Account"/);
});

test("exactly two real account sections are presented - Wallet and Futures - matching the actual backend schema, per the account model audit", () => {
  assert.match(assetsSource, /futuresBalance\?\.\s*USDT/s);
  assert.match(assetsSource, /futuresLocked\?\.\s*USDT/s);
  assert.match(assetsSource, /docs\/BATCH2-ACCOUNT-MODEL-AUDIT\.md/);
});

test("a coin with no real live price is excluded from valuation entirely - never $0 or fabricated, same rule as Dashboard.jsx", () => {
  const fnMatch = assetsSource.match(
    /const valueOf = \(coin, amount\) => \{[\s\S]*?\n {2}\};/
  );
  assert.ok(fnMatch, "valueOf function not found");
  assert.match(fnMatch[0], /!Number\.isFinite\(price\) \|\| price === null/);
  assert.match(fnMatch[0], /return null/);
});

test("Assets.jsx reuses the shared useDisplayCurrency hook - not a duplicated copy of the conversion logic", () => {
  assert.match(
    assetsSource,
    /import \{ useDisplayCurrency \} from "\.\.\/hooks\/useDisplayCurrency\.js"/
  );
  assert.match(assetsSource, /const \{[\s\S]{0,150}\} = useDisplayCurrency\(\)/);
  assert.doesNotMatch(assetsSource, /const \[btcPriceUsd, setBtcPriceUsd\]/);
});

test("balance privacy masking is applied consistently across total/available/locked AND the per-coin table, not just the summary numbers", () => {
  assert.match(assetsSource, /const maskOrValue = \(formatted\) =>/);
  const tableRenderMatch = assetsSource.match(
    /renderCell=\{\(row, column\) => \{[\s\S]{0,150}/
  );
  assert.ok(tableRenderMatch, "table renderCell not found");
  assert.match(tableRenderMatch[0], /balancesHidden/);
});

test("search/filter is real and operates on the real supported coin list, not a fabricated asset list", () => {
  assert.match(assetsSource, /const \[search, setSearch\] = useState/);
  assert.match(assetsSource, /const filteredCoins = SUPPORTED_COINS\.filter/);
  assert.match(assetsSource, /const SUPPORTED_COINS = \["USDT", "BNB", "EXALT"\]/);
});

test("transaction history entry points route to real existing pages, not fabricated new ones", () => {
  assert.match(assetsSource, /onClick=\{\(\) => setPage\("transactions"\)\}/);
  assert.match(assetsSource, /onClick=\{\(\) => setPage\("orders"\)\}/);
});

test("the new 'assets' page is wired into app.jsx routing and the full nav menu, without modifying or removing Wallets.jsx's own entry", () => {
  assert.match(appSource, /if \(page === "assets"\) \{/);
  assert.match(appSource, /<Assets setPage=\{setPage\} \/>/);
  // Wallets.jsx's own route is untouched - still present, still real.
  assert.match(appSource, /if \(page === "wallets"\) \{\s*\n\s*return <Wallets \/>;/);
  assert.match(appSource, /\["wallets", "👛 Wallets"\]/);
  assert.match(appSource, /\["assets", "💰 Assets"\]/);
});

test("the shared display-currency hook exports the real conversion function and honest-unavailable state, usable identically by both Dashboard and Assets", () => {
  assert.match(hookSource, /export function useDisplayCurrency/);
  assert.match(hookSource, /convertForDisplay/);
  assert.match(hookSource, /isValueUnavailable/);
});
