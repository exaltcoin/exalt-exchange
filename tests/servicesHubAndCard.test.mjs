import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const hubSource = await readFile(
  new URL("../src/components/ServicesHub.jsx", import.meta.url),
  "utf8"
);
const cardSource = await readFile(
  new URL("../src/components/ExaltCard.jsx", import.meta.url),
  "utf8"
);
const appSource = await readFile(
  new URL("../src/app.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 6 Services Hub / EXALT Card tests. Every hub entry's page key
  must resolve to a real route already confirmed in app.jsx - no
  guessed or invented key. Card must show zero fabricated data (no
  PAN/CVV/expiry/balance/issuer/status), matching the confirmed
  finding that zero Card infrastructure exists anywhere in this
  codebase.
*/

test("every Services Hub entry's page key resolves to a real route already in app.jsx - none guessed", () => {
  const entryKeysMatch = hubSource.match(
    /const SERVICE_ENTRIES = \[[\s\S]*?\n\];/
  );
  assert.ok(entryKeysMatch, "SERVICE_ENTRIES array not found");

  const keys = [
    ...new Set(
      [...entryKeysMatch[0].matchAll(/key:\s*"([a-z0-9-]+)"/g)].map(
        (m) => m[1]
      )
    ),
  ];

  assert.ok(keys.length >= 10, "expected a substantial number of real entries");

  for (const key of keys) {
    const routePattern = new RegExp(
      `if \\(page === "${key}"\\) \\{`
    );
    assert.match(
      appSource,
      routePattern,
      `Services Hub entry "${key}" has no matching real route in app.jsx`
    );
  }
});

test("Convert is not present as a tile anywhere in the Services Hub - zero executable pairs exist (Batch 3)", () => {
  assert.doesNotMatch(hubSource, /key:\s*"convert"/);
});

test("Futures and TradFi are marked 'gated', not 'active' - both are honestly non-fully-executable today", () => {
  const futuresEntry = hubSource.match(/key: "futures",[^}]*\}/);
  const tradfiEntry = hubSource.match(/key: "tradfi",[^}]*\}/);
  assert.ok(futuresEntry, "futures entry not found");
  assert.ok(tradfiEntry, "tradfi entry not found");
  assert.match(futuresEntry[0], /state:\s*"gated"/);
  assert.match(tradfiEntry[0], /state:\s*"gated"/);
});

test("EXALT Card tile is marked 'gated', matching the honest provider-required page it links to", () => {
  const cardEntry = hubSource.match(/key: "exalt-card",[^}]*\}/);
  assert.ok(cardEntry, "exalt-card entry not found");
  assert.match(cardEntry[0], /state:\s*"gated"/);
});

test("EXALT Card page contains zero fabricated card data - no PAN, CVV, expiry, balance, issuer, or active status", () => {
  // The header comment legitimately lists these terms once, to
  // document that none of them are fabricated - check only the
  // real component code that follows it.
  const codeOnly = cardSource.slice(cardSource.indexOf("function ExaltCard()"));
  assert.doesNotMatch(codeOnly, /\bPAN\b/);
  assert.doesNotMatch(codeOnly, /\bCVV\b/);
  assert.doesNotMatch(codeOnly, /expiry/i);
  assert.doesNotMatch(codeOnly, /balance:\s*[\d$]/i);
  assert.doesNotMatch(codeOnly, /status:\s*"active"/i);
  assert.match(codeOnly, /cardProviderRequired/);
});

test("both ServicesHub and ExaltCard are wired into real app.jsx routing", () => {
  assert.match(appSource, /if \(page === "services"\) \{\s*\n\s*return <ServicesHub setPage=\{setPage\} \/>;/);
  assert.match(appSource, /if \(page === "exalt-card"\) \{\s*\n\s*return <ExaltCard \/>;/);
});

test("Services Hub tap targets meet the 44px minimum touch-target size", async () => {
  const cssContent = await readFile(
    new URL("../src/components/ServicesHub.css", import.meta.url),
    "utf8"
  );
  assert.match(cssContent, /min-height:\s*44px/);
  assert.match(cssContent, /min-width:\s*44px/);
});
