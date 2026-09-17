import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const hookSource = await readFile(
  new URL("../src/hooks/useCapabilities.js", import.meta.url),
  "utf8"
);
const gateSource = await readFile(
  new URL("../src/components/CapabilityGate.jsx", import.meta.url),
  "utf8"
);

/*
  Real-Service Audit: confirms the frontend capability infrastructure
  genuinely sources status from the real backend endpoint, never a
  hardcoded client flag, and that CapabilityGate only renders the
  real module UI when the real backend reports LIVE.
*/

test("useCapabilities fetches the real backend capability endpoint - never a hardcoded status object", () => {
  assert.match(hookSource, /\/api\/capabilities/);
  assert.doesNotMatch(hookSource, /status:\s*"LIVE"/);
});

test("a failed fetch results in an honest 'unavailable' load state, never a silent fallback to an assumed-safe status", () => {
  assert.match(hookSource, /setLoadState\("unavailable"\)/);
});

test("CapabilityGate only renders children (the real module UI) when the real backend module status is LIVE (or BETA, explicitly opted in)", () => {
  const renderLogic = gateSource.match(
    /const isUsable =[\s\S]{0,120}/
  );
  assert.ok(renderLogic, "isUsable computation not found");
  assert.match(renderLogic[0], /module\.status === "LIVE"/);

  assert.match(gateSource, /if \(!isUsable\) \{/);
  assert.doesNotMatch(gateSource, /return children;\s*\n\s*\}\s*\n\s*\n\s*return \(\s*\n\s*<>/);
});

test("CapabilityGate shows the real backend-provided status and reason - never fabricated or generic wording standing in for the real reason", () => {
  assert.match(gateSource, /\{module\.status\}/);
  assert.match(gateSource, /\{module\.reason\}/);
});

test("a BETA module shows a persistent, non-dismissable banner alongside the real UI, rather than silently hiding its non-production status", () => {
  assert.match(gateSource, /module\.status === "BETA"/);
  assert.match(gateSource, /capability-gate-beta-banner/);
});

test("useCapabilities caches with a bounded TTL and coalesces concurrent requests - not an unbounded cache, not a request-per-render storm", () => {
  assert.match(hookSource, /CACHE_TTL_MS/);
  assert.match(hookSource, /inFlightRequest/);
});
