import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tradFiSource = await readFile(
  new URL("../src/components/TradFi.jsx", import.meta.url),
  "utf8"
);
const appSource = await readFile(
  new URL("../src/app.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 5 (Part B) frontend tests. Confirms TradFi.jsx talks only to
  the real backend CFD status/instrument endpoints, never fabricates
  instrument cards or quotes, and is correctly wired into routing
  without disturbing the existing, verified Futures module.
*/

test("TradFi.jsx fetches the real backend CFD status endpoint - no hardcoded provider state", () => {
  assert.match(tradFiSource, /\/api\/cfd\/status/);
  assert.doesNotMatch(tradFiSource, /providerState:\s*"READY"/);
});

test("no fabricated instrument list is ever rendered - an honest EmptyState is shown instead", () => {
  assert.match(tradFiSource, /<EmptyState/);
  // The category names may appear once, in the honest description
  // explaining what WILL show up once a real provider connects -
  // what matters is no actual instrument DATA/cards are rendered.
  assert.doesNotMatch(tradFiSource, /\.map\(\s*\(instrument/);
  assert.doesNotMatch(tradFiSource, /instrument-card/);
});

test("no random or hardcoded quote/price values exist anywhere in the TradFi module shell", () => {
  assert.doesNotMatch(tradFiSource, /Math\.random\(\)/);
  assert.doesNotMatch(tradFiSource, /bid:\s*[\d.]+/);
  assert.doesNotMatch(tradFiSource, /ask:\s*[\d.]+/);
});

test("TradFi is wired into routing as a genuinely new page, not replacing the existing verified Futures route", () => {
  assert.match(appSource, /if \(page === "tradfi"\) \{\s*\n\s*return <TradFi \/>;/);
  // The existing Futures route is untouched.
  assert.match(appSource, /if \(page === "futures"\) \{/);
  assert.match(appSource, /\["tradfi", "📊 TradFi"\]/);
  assert.match(appSource, /\["futures", "📉 Futures"\]/);
});
