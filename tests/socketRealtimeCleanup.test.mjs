import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tradeSource = await readFile(
  new URL("../src/components/Trade.jsx", import.meta.url),
  "utf8"
);
const marketsSource = await readFile(
  new URL("../src/components/Markets.jsx", import.meta.url),
  "utf8"
);
const orderBookSource = await readFile(
  new URL("../src/components/OrderBook.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 4 socket/realtime audit. Confirms the existing shared-client
  architecture (fixed in an earlier batch: exactly one io(...) call
  exists anywhere in the frontend, in lib/apiClient.js) correctly
  cleans up listeners on pair change and unmount in the three real
  components that subscribe to pair-specific realtime data. No new
  socket abstraction was introduced - these tests verify the
  existing pattern, they don't change it.
*/

test("Trade.jsx's trading-update effect depends on tradingPair - cleanup runs (old listeners removed) before every pair change, and on unmount, not just once at mount", () => {
  const effectMatch = tradeSource.match(
    /socket\.on\(\s*\n\s*"marketUpdate"[\s\S]*?\}, \[\s*\n\s*refreshTradeData,\s*\n\s*tradingPair,\s*\n\s*\]\);/
  );
  assert.ok(
    effectMatch,
    "expected the trading-update useEffect to depend on [refreshTradeData, tradingPair]"
  );
});

test("Trade.jsx registers exactly as many socket.off cleanup calls as socket.on registrations, for the trading-update effect - no listener leak", () => {
  const effectMatch = tradeSource.match(
    /useEffect\(\(\) => \{[\s\S]*?socket\.on\(\s*\n\s*"marketUpdate"[\s\S]*?\}, \[\s*\n\s*refreshTradeData,\s*\n\s*tradingPair,\s*\n\s*\]\);/
  );
  assert.ok(effectMatch, "trading-update effect not found");

  const onCount = (effectMatch[0].match(/socket\.on\(/g) || []).length;
  const offCount = (effectMatch[0].match(/socket\.off\(/g) || []).length;

  assert.equal(
    onCount,
    offCount,
    `expected equal socket.on/socket.off counts, found on=${onCount} off=${offCount}`
  );
  assert.ok(onCount >= 4, "expected at least the 4 known event subscriptions");
});

test("Trade.jsx's stale-event guard ignores updates for a pair that is no longer active, using the CURRENT closure's tradingPair - never trusts a stale one", () => {
  const handlerMatch = tradeSource.match(
    /const handleTradingUpdate = \(data\) => \{[\s\S]*?\n {4}\};/
  );
  assert.ok(handlerMatch, "handleTradingUpdate not found");
  assert.match(handlerMatch[0], /data\.pair !== tradingPair/);
});

test("Markets.jsx's realtime price subscription is correctly scoped (mount-once/unmount-cleanup) since it tracks ALL symbols, not one pair - no pair-change re-subscription needed or present", () => {
  const effectMatch = marketsSource.match(
    /socket\.on\(\s*\n\s*"marketUpdate"[\s\S]*?\}, \[\]\);/
  );
  assert.ok(
    effectMatch,
    "expected Markets.jsx's marketUpdate subscription to have an empty dependency array (mount-once)"
  );
  assert.match(effectMatch[0], /socket\.off\(\s*\n\s*"marketUpdate"/);
});

test("OrderBook.jsx re-subscribes on pair change (encodedPair in the dependency array) and cleans up the OLD pair's listeners and interval before doing so", () => {
  const effectMatch = orderBookSource.match(
    /useEffect\(\(\) => \{[\s\S]*?\}, \[encodedPair\]\);/
  );
  assert.ok(effectMatch, "OrderBook.jsx's pair-scoped effect not found");

  const onCount = (effectMatch[0].match(/socket\.on\(/g) || []).length;
  const offCount = (effectMatch[0].match(/socket\.off\(/g) || []).length;
  assert.equal(onCount, offCount, "OrderBook.jsx socket.on/off count mismatch");

  // Real REST fallback (satisfies "REST fallback remains available")
  assert.match(effectMatch[0], /setInterval\(loadOrderBook, 15000\)/);
  assert.match(effectMatch[0], /clearInterval\(interval\)/);
});

test("no component creates its own Socket.IO client - only the canonical shared one (fixed in an earlier batch) is ever imported", () => {
  for (const source of [tradeSource, marketsSource, orderBookSource]) {
    assert.doesNotMatch(source, /=\s*io\(/);
    assert.match(
      source,
      /import\s+(?:[A-Za-z_$][\w$]*\s*,\s*)?\{[^}]*\bsocket\b[^}]*\}\s*from\s*["']\.\.\/api["']/
    );
  }
});
