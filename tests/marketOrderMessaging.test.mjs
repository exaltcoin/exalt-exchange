import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Trade.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 4 fix: Trade.jsx used to always show the same generic "Order
  submitted successfully" alert regardless of what actually happened
  - including for a market order that ended up fully cancelled with
  zero fill (no liquidity) or partially filled with the remainder
  cancelled (the new IOC behavior). These tests confirm the real,
  differentiated backend message is now used, and that a real
  pre-submit explanation exists for market orders.
*/

test("the post-submit alert uses the real backend-provided message, not a hardcoded generic success string", () => {
  const alertMatch = source.match(
    /window\.alert\(\s*\n\s*data\?\.message[\s\S]{0,200}/
  );
  assert.ok(
    alertMatch,
    "post-submit alert does not use the real data.message from the backend"
  );
  assert.match(alertMatch[0], /orderPlacedSuccessfully/);
});

test("a real pre-submit explanation is shown for market orders, in both the mobile and desktop order panels", () => {
  const noticeOccurrences = (
    source.match(/orderMode === "market" &&[\s\S]{0,50}market-order-notice/g) ||
    []
  ).length;

  assert.ok(
    noticeOccurrences >= 2,
    `expected the market order notice in both panels, found ${noticeOccurrences}`
  );
});

test("the market order notice honestly explains immediate execution and non-resting cancellation - not a generic disclaimer", () => {
  assert.match(source, /marketOrderNotice/);
  assert.match(
    source,
    /any unfilled portion will not remain open - it is cancelled immediately/
  );
});
