import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const assetsSource = await readFile(
  new URL("../src/components/Assets.jsx", import.meta.url),
  "utf8"
);
const dashboardSource = await readFile(
  new URL("../src/components/Dashboard.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 3 (Deposit/Withdraw/Transfer/Convert) frontend gating tests.
  Central invariant: buttons must reflect real backend capability.
  Convert has zero executable pairs (confirmed by
  backend/config/convertPairs.js and tests/convertRoutes.test.js) so
  no Convert action may appear anywhere. Transfer, unlike Batch 1's
  finding, is now confirmed real and reachable, so it's expected to
  appear.
*/

test("no Convert action exists anywhere in Assets.jsx or Dashboard.jsx - zero executable pairs exist in the real backend registry", () => {
  assert.doesNotMatch(assetsSource, /setPage\("convert"\)/);
  assert.doesNotMatch(dashboardSource, /setPage\("convert"\)/);
  assert.doesNotMatch(assetsSource, /api\/convert\/quote/);
});

test("a real Transfer entry point exists in Assets.jsx's Futures section, now that Batch 2/3 confirmed the path is real and reachable", () => {
  const futuresBlockMatch = assetsSource.match(
    /manageFutures[\s\S]{0,1200}/
  );
  assert.ok(futuresBlockMatch, "Futures section action block not found");
  assert.match(futuresBlockMatch[0], /"transfer", "Transfer"/);
});

test("Assets.jsx's Transfer button routes to the real Futures page, which owns the actual tested transfer control - not a duplicated transfer UI", () => {
  const transferButtonMatch = assetsSource.match(
    /variant="outline"\s*\n\s*onClick=\{\(\) => setPage\("futures"\)\}\s*\n\s*>\s*\n\s*\{translateWithFallback\("transfer"/
  );
  assert.ok(
    transferButtonMatch,
    "Transfer button not found routing to the real futures page"
  );
});
