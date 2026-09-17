import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/AdminP2P.jsx", import.meta.url),
  "utf8"
);

/*
  Realness audit findings in AdminP2P.jsx:
  1. Every fetch() referenced an undefined `API` variable - only
     `API_BASE` was ever defined - meaning every request resolved
     to a broken URL and this page never actually loaded real data.
  2. No request anywhere sent an Authorization header, despite
     every endpoint this page calls requiring `protect, adminOnly`
     on the backend (routes/p2pRoutes.js) - meaning even with a
     correct URL, every request would fail with 401.
  3. The backend's dispute-resolution endpoint
     (POST /:id/admin/resolve-dispute, already tested in
     tests/p2pEscrowLifecycle.test.js) had no UI path to reach it
     at all - a "Disputed" badge rendered with no available action.
*/

test("no fetch call references the undefined API variable - all use the real, defined API_BASE", () => {
  assert.doesNotMatch(source, /\$\{API\}/);
  assert.match(source, /\$\{API_BASE\}\/api\/p2p\/admin\/all/);
  assert.match(source, /\$\{API_BASE\}\/api\/p2p\/\$\{id\}\/release/);
  assert.match(source, /\$\{API_BASE\}\/api\/p2p\/\$\{id\}\/cancel/);
});

test("every real fetch to the p2p admin API sends a real Authorization header derived from the stored token", () => {
  const authHelperMatch = source.match(
    /const authHeaders = \(\) => \{[\s\S]*?\n {2}\};/
  );
  assert.ok(authHelperMatch, "authHeaders helper not found");
  assert.match(authHelperMatch[0], /localStorage\.getItem\("token"\)/);
  assert.match(authHelperMatch[0], /Authorization: `Bearer \$\{token\}`/);

  // Every admin p2p fetch call includes authHeaders().
  const fetchCallSites = [...source.matchAll(/fetch\(\s*[\s\S]{0,300}/g)].map(
    (m) => m[0]
  );
  const adminP2pCalls = fetchCallSites.filter((call) =>
    call.includes("/api/p2p/")
  );
  assert.ok(adminP2pCalls.length >= 4, "expected at least 4 real API calls");

  for (const call of adminP2pCalls) {
    assert.match(call, /authHeaders\(\)/);
  }
});

test("dispute resolution is wired to the real backend endpoint with the exact resolution values the backend expects", () => {
  assert.match(source, /\/api\/p2p\/\$\{id\}\/admin\/resolve-dispute/);
  assert.match(source, /"release_to_buyer"/);
  assert.match(source, /"refund_to_seller"/);

  // Not the wrong/guessed values that would be silently rejected by
  // the backend's own validation (resolution must be exactly
  // "release_to_buyer" or "refund_to_seller").
  assert.doesNotMatch(source, /resolveDispute\([^)]*"buyer"\)/);
  assert.doesNotMatch(source, /resolveDispute\([^)]*"seller"\)/);
});

test("a disputed order shows real resolve actions, not just a static badge with no path to act on it", () => {
  const disputedSectionMatch = source.match(
    /order\.status === "disputed" && \([\s\S]{0,900}/
  );
  assert.ok(disputedSectionMatch, "disputed order action section not found");
  assert.match(disputedSectionMatch[0], /resolveDispute\(order\._id, "release_to_buyer"\)/);
  assert.match(disputedSectionMatch[0], /resolveDispute\(order\._id, "refund_to_seller"\)/);
});
