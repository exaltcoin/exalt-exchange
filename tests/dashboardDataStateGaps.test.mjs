import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Dashboard.jsx", import.meta.url),
  "utf8"
);

/*
  These are source-level checks (matching dashboardRegression.test.mjs's
  existing pattern) rather than full component-render tests, since
  Dashboard.jsx makes real network calls on mount that a render test
  would need to mock extensively. They verify the actual mechanism
  of the fix - a real status flag that failure sets to "unavailable"
  and success sets to "ready", checked BEFORE any numeric value is
  rendered - rather than just checking the fallback numbers exist.
*/

test("marketDataStatus state exists and starts at 'loading', not defaulting to a value that looks like real data", () => {
  assert.match(
    source,
    /const \[marketDataStatus, setMarketDataStatus\] = useState\("loading"\)/
  );
});

test("loadDexData sets marketDataStatus to 'unavailable' in its catch block - a request failure is a real, distinguishable state, not a numeric 0", () => {
  const catchBlockMatch = source.match(
    /const loadDexData = useCallback\(async \(\) => \{[\s\S]*?\n {2}\}, \[\]\);/
  );
  assert.ok(catchBlockMatch, "loadDexData function not found");

  const fnBody = catchBlockMatch[0];
  const catchSection = fnBody.slice(fnBody.indexOf("} catch"));

  assert.match(catchSection, /setMarketDataStatus\("unavailable"\)/);
});

test("loadDexData only sets marketDataStatus to 'ready' on a genuinely successful response - not unconditionally", () => {
  const catchBlockMatch = source.match(
    /const loadDexData = useCallback\(async \(\) => \{[\s\S]*?\n {2}\}, \[\]\);/
  );
  const fnBody = catchBlockMatch[0];
  const trySection = fnBody.slice(0, fnBody.indexOf("} catch"));

  assert.match(trySection, /setMarketDataStatus\("ready"\)/);
});

test("marketCap/liquidity rendering checks marketDataStatus before showing a numeric value - unavailable state takes priority over any stale number", () => {
  // The render must check marketDataStatus === "unavailable" (or
  // "loading") ahead of formatting marketCap/liquidity as a number,
  // for both fields.
  const marketCapRender = source.match(
    /translateWithFallback\("marketCap"[\s\S]{0,800}/
  )[0];

  assert.match(marketCapRender, /marketDataStatus === "loading"/);
  assert.match(marketCapRender, /marketDataStatus === "unavailable"/);
});

test("rewardStatsStatus state exists and starts at 'loading'", () => {
  assert.match(
    source,
    /const \[rewardStatsStatus, setRewardStatsStatus\] = useState\("loading"\)/
  );
});

test("loadRewardStats sets rewardStatsStatus to 'unavailable' on the no-token early return, the 401 branch, AND the catch block - every non-success path, not just one", () => {
  const fnMatch = source.match(
    /const loadRewardStats = useCallback\(async \(\) => \{[\s\S]*?\n {2}\}, \[API\]\);/
  );
  assert.ok(fnMatch, "loadRewardStats function not found");

  const occurrences = (
    fnMatch[0].match(/setRewardStatsStatus\("unavailable"\)/g) || []
  ).length;

  // no-token guard, 401 guard, and the catch block = 3 distinct
  // non-success paths, each explicitly marking the data unavailable
  // rather than leaving a stale/default state in place.
  assert.equal(
    occurrences,
    3,
    `expected 3 "unavailable" sites (no-token/401/catch), found ${occurrences}`
  );
});

test("loadRewardStats only sets rewardStatsStatus to 'ready' after setRewardStats has actually been called with real data", () => {
  const fnMatch = source.match(
    /const loadRewardStats = useCallback\(async \(\) => \{[\s\S]*?\n {2}\}, \[API\]\);/
  );
  const fnBody = fnMatch[0];

  const setRewardStatsIndex = fnBody.indexOf("setRewardStats({");
  const setReadyIndex = fnBody.indexOf('setRewardStatsStatus("ready")');

  assert.ok(setRewardStatsIndex !== -1, "setRewardStats(...) call not found");
  assert.ok(setReadyIndex !== -1, '"ready" status not set anywhere');
  assert.ok(
    setReadyIndex > setRewardStatsIndex,
    "rewardStatsStatus must be set to ready AFTER the real data is stored, not before/instead of it"
  );
});

test("reward stat rendering (approved/pending rewards) checks rewardStatsStatus before showing a numeric amount", () => {
  const approvedRender = source.match(/approvedRewards[\s\S]{0,800}/)[0];

  assert.match(approvedRender, /rewardStatsStatus === "loading"/);
  assert.match(approvedRender, /rewardStatsStatus === "unavailable"/);
});

test("no hardcoded EXALT price fallback reappears - exaltPrice must still initialize to null, never a numeric literal", () => {
  assert.match(source, /const \[exaltPrice, setExaltPrice\] =\s*\n?\s*useState\(null\)/);
  assert.doesNotMatch(source, /useState\(0\.02456\)/);
});

test("duplicated totalBalanceValue/availableBalanceValue rendering is collapsed to a single presentation", () => {
  /*
    Batch 1 update: these are now rendered via formatDisplayValue(...)
    (the real display-currency conversion layer added in Batch 1),
    not the raw ${formatUsd(...)} call directly - the underlying
    invariant this test protects (each real balance value rendered
    exactly once, not duplicated) is unchanged.
  */
  const totalOccurrences = (
    source.match(/formatDisplayValue\(totalBalanceValue\)/g) || []
  ).length;
  const availableOccurrences = (
    source.match(/formatDisplayValue\(availableBalanceValue\)/g) || []
  ).length;

  assert.equal(
    totalOccurrences,
    1,
    `expected totalBalanceValue rendered exactly once, found ${totalOccurrences}`
  );
  assert.equal(
    availableOccurrences,
    1,
    `expected availableBalanceValue rendered exactly once, found ${availableOccurrences}`
  );
});

test("Dashboard's local handleLogout has been removed - the shell's authoritative logout is now the only implementation", () => {
  assert.doesNotMatch(source, /const handleLogout = /);
  assert.doesNotMatch(source, /mobile-logout-btn/);
});

test("bottomNavigation is retained as an intentional shortcut surface, with a comment recording why it was kept", () => {
  assert.match(source, /const bottomNavigation = \[/);
  assert.match(source, /genuinely distinct purpose/);
});

test("KYC status is loaded via the same endpoint Profile.jsx already uses - no second KYC implementation", () => {
  assert.match(source, /\/api\/kyc\/user\/\$\{encodeURIComponent\(email\)\}/);
});

test("notification count is loaded via the same endpoint NotificationBell.jsx already uses - no second notification implementation", () => {
  assert.match(source, /\/api\/notifications\/me/);
  assert.match(source, /setNotificationCount\(Number\(data\.unreadCount \|\| 0\)\)/);
});

test("KYC and notification load states distinguish unavailable from a real value, mirroring the marketData/rewardStats fix", () => {
  assert.match(source, /const \[kycStatusLoadState, setKycStatusLoadState\] = useState\("loading"\)/);
  assert.match(source, /const \[notificationLoadState, setNotificationLoadState\] =\s*\n?\s*useState\("loading"\)/);
});
