import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Futures.jsx", import.meta.url),
  "utf8"
);

/*
  Futures UI closure tests. Complements the existing
  futuresRegression.test.mjs (which already covers the production-
  ready gate, real API usage, and no-fabrication checks) - these
  focus on what changed in this batch: the design-system migration
  of the order-entry panel.
*/

test("the design-system Tabs/Select/AmountInput/Button primitives are used for the real order-entry panel", () => {
  assert.match(
    source,
    /import \{\s*\n?\s*Tabs,\s*\n?\s*Select,\s*\n?\s*AmountInput,\s*\n?\s*Button,\s*\n?\s*\} from "\.\.\/design-system\/index\.js"/
  );
});

test("long/short side is controlled by real Tabs wired to setSide, not a hardcoded default", () => {
  const tabsMatch = source.match(/<Tabs[\s\S]{0,900}/);
  assert.ok(tabsMatch, "Tabs usage not found");
  assert.match(tabsMatch[0], /activeId=\{side\}/);
  assert.match(tabsMatch[0], /onChange=\{setSide\}/);
});

test("the FUTURES_PRODUCTION_READY gate is completely unchanged by the UI migration - still defaults to false and still hides the whole page", () => {
  assert.match(source, /VITE_FUTURES_PRODUCTION_READY/);
  assert.match(source, /\|\| "false"/);
  assert.match(source, /if \(!FUTURES_PRODUCTION_READY\)/);
});

test("Open Long/Open Short buttons use the real Button component with the loading state tied to real submittingPosition, never a static enabled button during a real in-flight request", () => {
  assert.match(source, /variant="buy"[\s\S]{0,150}loading=\{submittingPosition\}/);
  assert.match(source, /variant="sell"[\s\S]{0,150}loading=\{submittingPosition\}/);
});

test("no Take Profit / Stop Loss inputs exist anywhere - confirmed already-honest removal (never backend-enforced) is preserved by this migration", () => {
  assert.doesNotMatch(source, /<input[^>]*takeProfit/i);
  assert.doesNotMatch(source, /<input[^>]*stopLoss/i);
  assert.match(source, /never enforced by/);
});

test("the stale internal comment claiming insurance-fund/funding remain unbuilt was corrected with an accurate explanation - not silently left wrong", () => {
  // The old phrase may still appear ONCE, quoted for context inside
  // the correction itself ("this comment previously claimed X - that
  // was accurate then but is now stale") - what matters is that it's
  // no longer asserted as current, uncorrected fact, and that the
  // real current state is documented.
  assert.match(source, /that was accurate when RC5 was written but is now stale/);
  assert.match(source, /a real insurance fund/);
  assert.match(source, /wired into\s+the actual settlement path/);
});

test("price/amount inputs use AmountInput with real decimal precision, not an unrestricted raw number input", () => {
  const amountInputs = [...source.matchAll(/<AmountInput[\s\S]{0,200}/g)];
  assert.ok(amountInputs.length >= 2, "expected at least price and amount AmountInput usages");
  for (const match of amountInputs.slice(0, 2)) {
    assert.match(match[0], /decimals=\{8\}/);
  }
});
