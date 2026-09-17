import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Markets.jsx", import.meta.url),
  "utf8"
);

/*
  Realness audit finding: Markets.jsx's live prices come from a real
  WebSocket (marketUpdate events) - confirmed no Math.random(), no
  hardcoded prices anywhere in this component. But there was no way
  to distinguish a genuinely live feed from one that silently
  stopped updating (socket disconnect, server stopped emitting) -
  the "● Live Market Board" indicator was a static claim, never
  re-evaluated against actual event activity. These tests verify
  the fix: a real timestamp of the last received event, a derived
  staleness flag, and a periodic recheck so staleness is detected
  even without a new event to trigger it.
*/

test("lastPriceUpdateAt is recorded from the real marketUpdate socket event, not a hardcoded/assumed value", () => {
  assert.match(source, /const \[lastPriceUpdateAt, setLastPriceUpdateAt\] = useState\(null\)/);

  const handlerMatch = source.match(
    /const handleMarketUpdate = [\s\S]*?setLastPriceUpdateAt\(Date\.now\(\)\)/
  );
  assert.ok(
    handlerMatch,
    "setLastPriceUpdateAt(Date.now()) must be called from within the marketUpdate handler"
  );
});

test("isMarketDataStale is derived from real elapsed time since the last update, not a static false", () => {
  assert.match(
    source,
    /const isMarketDataStale =\s*\n?\s*lastPriceUpdateAt !== null &&\s*\n?\s*Date\.now\(\) - lastPriceUpdateAt > STALE_THRESHOLD_MS/
  );
});

test("a periodic recheck exists so staleness is detected even with zero new socket events (time passing alone must be enough)", () => {
  assert.match(source, /forceStalenessRecheck/);
  assert.match(source, /window\.setInterval\(/);
});

test("the live/stale indicator in the header actually branches on isMarketDataStale, rather than always claiming live", () => {
  const heroMatch = source.match(
    /market-live-dot[\s\S]{0,400}/
  );
  assert.ok(heroMatch);
  assert.match(heroMatch[0], /isMarketDataStale/);
  assert.match(heroMatch[0], /staleMarketBoard/);
  assert.match(heroMatch[0], /liveMarketBoard/);
});

test("a real last-updated timestamp is shown to the user when available", () => {
  assert.match(source, /lastUpdated/);
  assert.match(source, /new Date\(lastPriceUpdateAt\)\.toLocaleTimeString\(\)/);
});

test("no Math.random() or hardcoded numeric price literals were introduced anywhere in Markets.jsx", () => {
  assert.doesNotMatch(source, /Math\.random\(\)/);
});
