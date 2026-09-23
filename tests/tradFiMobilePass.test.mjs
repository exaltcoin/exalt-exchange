import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";

const tradFiSource = await readFile(
  new URL("../src/components/TradFi.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 5 iOS/mobile pass for the TradFi module shell. Real finding:
  TradFi.jsx has zero custom CSS and zero interactive controls (no
  buttons, forms, inputs, or chart) - it is a pure read-only status
  display built entirely from already-audited design-system
  components (PageContainer, Section, Stack, EmptyState, Badge,
  SkeletonText). This genuinely simplifies the audit: there is no
  keyboard-avoidance, touch-target, or chart-resize surface to check
  on THIS page yet, since none of those elements exist here. What
  matters is confirming it correctly inherits PageContainer's
  already-verified responsive/safe-area behavior rather than
  introducing its own competing layout.
*/

test("TradFi.jsx has no dedicated CSS file - all layout is inherited from the already-audited design system, not a second competing stylesheet", async () => {
  await assert.rejects(
    access(new URL("../src/components/TradFi.css", import.meta.url))
  );
});

test("TradFi.jsx is wrapped in PageContainer - inherits its already-verified responsive breakpoints (640px) and safe-margin-inline padding, not a fixed-width layout", () => {
  assert.match(tradFiSource, /<PageContainer maxWidth="900px">/);
});

test("no fixed pixel widths or viewport-breaking styles exist in TradFi.jsx itself", () => {
  assert.doesNotMatch(tradFiSource, /width:\s*\d+px/);
  assert.doesNotMatch(tradFiSource, /min-width:\s*[89]\d\dpx/);
});

test("TradFi.jsx currently has zero interactive controls (no inputs, buttons, or forms) - the keyboard-avoidance and touch-target checklist items genuinely do not yet apply to this page's real scope", () => {
  assert.doesNotMatch(tradFiSource, /<input/);
  assert.doesNotMatch(tradFiSource, /<button/i);
  assert.doesNotMatch(tradFiSource, /<form/);
});

test("no hover-only interaction exists - the page has no :hover-dependent controls since it has no interactive controls at all", () => {
  assert.doesNotMatch(tradFiSource, /onMouseEnter|onMouseOver/);
});
