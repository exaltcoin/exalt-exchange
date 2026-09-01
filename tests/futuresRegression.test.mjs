import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/components/Futures.jsx", import.meta.url), "utf8");
const executableSource = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

test("Futures uses real account and funding APIs", () => {
  assert.match(source, /apiFetch\("\/api\/wallets\/me"\)/);
  assert.match(source, /apiFetch\("\/api\/futures\/transfer"/);
  assert.match(source, /\/api\/futures\/funding-rate\/\$\{encodeURIComponent\(symbol\)\}/);
});

test("Futures remains production-disabled by default", () => {
  assert.match(source, /VITE_FUTURES_PRODUCTION_READY/);
  assert.match(source, /\|\| "false"/);
  assert.match(source, /if \(!FUTURES_PRODUCTION_READY\)/);
});

test("Futures has no fabricated account or PnL fallback", () => {
  assert.doesNotMatch(executableSource, /useState\(5000\)/);
  assert.doesNotMatch(executableSource, /calculatePositionPnl/);
  assert.doesNotMatch(executableSource, /mock(?:Balance|Pnl|Position|Order)/i);
});

test("open, close, and transfer actions are backend-bound", () => {
  assert.match(source, /await apiOpenPosition\(/);
  assert.match(source, /await apiClosePosition\(/);
  assert.match(source, /await transferFuturesMargin\(/);
  assert.match(source, /"Idempotency-Key"/);
});
