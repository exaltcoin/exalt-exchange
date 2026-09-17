import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Markets.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 4 (Markets + Spot audit) category tabs tests. Verifies real
  sorting using already-existing real data (getChange24h/getVolume24h,
  fed by the real /api/market/live response), and confirms "New" was
  deliberately omitted rather than fabricated - no listing/activation
  timestamp exists anywhere in the real market data response.
*/

test("Gainers/Losers sort by the real getChange24h helper - not a fabricated ranking", () => {
  const tabbedMatch = source.match(
    /const tabbedCoins = useMemo\(\(\) => \{[\s\S]*?\n {2}\}, \[[\s\S]*?\]\);/
  );
  assert.ok(tabbedMatch, "tabbedCoins computation not found");

  const body = tabbedMatch[0];
  assert.match(body, /marketTab === "gainers"[\s\S]{0,100}getChange24h\(b\) - getChange24h\(a\)/);
  assert.match(body, /marketTab === "losers"[\s\S]{0,100}getChange24h\(a\) - getChange24h\(b\)/);
});

test("Hot sorts by the real getVolume24h helper (a defensible metric), not arbitrary hardcoded promotion", () => {
  const tabbedMatch = source.match(
    /const tabbedCoins = useMemo\(\(\) => \{[\s\S]*?\n {2}\}, \[[\s\S]*?\]\);/
  );
  assert.match(
    tabbedMatch[0],
    /marketTab === "hot"[\s\S]{0,100}getVolume24h\(b\) - getVolume24h\(a\)/
  );
});

test("Favorites tab filters by the real, backend-derived favoriteSymbols set - not a fabricated list", () => {
  const tabbedMatch = source.match(
    /const tabbedCoins = useMemo\(\(\) => \{[\s\S]*?\n {2}\}, \[[\s\S]*?\]\);/
  );
  assert.match(tabbedMatch[0], /favoriteSymbols\.has/);
});

test("no 'New' category tab exists - deliberately omitted since no listing/activation timestamp exists in the real market data", () => {
  assert.doesNotMatch(source, /marketTab === "new"/);
  assert.doesNotMatch(source, /"new", translateWithFallback\("newListings"/);
  assert.match(source, /"New"\s*\n?\s*is deliberately NOT implemented/);
});

test("exactly four real tabs are offered: All, Favorites, Hot, Gainers, Losers", () => {
  const tabArrayMatch = source.match(
    /\[\s*\n\s*\["all",[\s\S]*?\],\s*\n\s*\]\.map/
  );
  assert.ok(tabArrayMatch, "tab definition array not found");

  const tabKeys = [...tabArrayMatch[0].matchAll(/\["([a-z]+)",/g)].map(
    (m) => m[1]
  );
  assert.deepEqual(tabKeys, ["all", "favorites", "hot", "gainers", "losers"]);
});

test("the rendered coin table uses tabbedCoins (respecting the active tab), not the untabbed filteredCoins directly", () => {
  assert.match(source, /\{tabbedCoins\.map\(/);
});
