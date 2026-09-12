import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Staking.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 6 staking fix regression tests. Three real, confirmed bugs
  fixed: (1) hardcoded coin: "EXALT" / durationDays: 30 despite the
  backend genuinely supporting real selection, (2) global unstake/
  claim buttons that sent an empty request body to endpoints that
  REQUIRE req.body.stakeId (guaranteed 400 failure every time), and
  (3) a hardcoded apr: 15 fallback shown forever because the called
  GET /api/staking/stats endpoint does not exist anywhere in
  routes/stakingRoutes.js.
*/

test("stake creation sends the real user-selected coin and duration, not hardcoded EXALT/30", () => {
  assert.doesNotMatch(source, /durationDays:\s*30,\s*\n\s*coin:\s*"EXALT",/);
  assert.match(source, /durationDays:\s*selectedDuration/);
  assert.match(source, /coin:\s*selectedCoin/);
});

test("a real coin selector offers exactly the three real backend-supported coins", () => {
  assert.match(source, /const SUPPORTED_COINS = \["EXALT", "USDT", "BNB"\]/);
  assert.match(source, /SUPPORTED_COINS\.map\(\(coin\) =>/);
});

test("a real duration selector offers exactly the five real backend-supported durations with their real APY", () => {
  assert.match(
    source,
    /const DURATION_APY_MAP = \{ 30: 8, 60: 10, 90: 12, 180: 16, 365: 20 \}/
  );
  assert.match(source, /SUPPORTED_DURATIONS\.map\(\(days\) =>/);
});

test("unstake and claim actions send the real stake._id - never an empty body to an endpoint that requires it", () => {
  assert.match(source, /const handleUnstake = async \(stakeId\) => \{/);
  assert.match(source, /const handleClaimRewards = async \(stakeId\) => \{/);

  const unstakeCallMatch = source.match(
    /\/api\/staking\/unstake["']?,[\s\S]*?body:\s*JSON\.stringify\(\{ stakeId \}\)/
  );
  const claimCallMatch = source.match(
    /\/api\/staking\/claim["']?,[\s\S]*?body:\s*JSON\.stringify\(\{ stakeId \}\)/
  );
  assert.ok(unstakeCallMatch, "unstake call does not send { stakeId }");
  assert.ok(claimCallMatch, "claim call does not send { stakeId }");

  // No global (empty-body) call remains.
  assert.doesNotMatch(source, /\/api\/staking\/unstake`,\s*\n\s*\{\},/);
  assert.doesNotMatch(source, /\/api\/staking\/claim`,\s*\n\s*\{\},/);
});

test("per-stake action buttons are rendered inside the stakes table, keyed by the real stake, not global buttons outside it", () => {
  assert.match(source, /onClick=\{\(\) => handleClaimRewards\(stake\._id\)\}/);
  assert.match(source, /onClick=\{\(\) => handleUnstake\(stake\._id\)\}/);
});

test("no call is made to the nonexistent GET /api/staking/stats endpoint", () => {
  // The endpoint name may appear once, in the explanatory comment
  // documenting why it was removed - what matters is no actual
  // axios call targets it.
  assert.doesNotMatch(source, /axios\.get\(`\$\{API_BASE\}\/api\/staking\/stats`/);
});

test("stats are derived from the real, live my-stakes response - no hardcoded apr fallback remains", () => {
  // "apr: 15" may appear once, in the explanatory comment
  // documenting the fabricated default that was removed - what
  // matters is no actual state initializer sets it.
  assert.doesNotMatch(source, /useState\(\{[\s\S]{0,100}apr:\s*15/);
  assert.match(source, /const derivedStats = useMemo/);
  assert.match(source, /\/api\/staking\/my-stakes/);
});

test("weighted APR is only shown when genuinely derivable (active principal > 0) - never a fabricated flat number when there is nothing to weight", () => {
  const derivedMatch = source.match(
    /const weightedApy =[\s\S]{0,200}/
  );
  assert.ok(derivedMatch, "weightedApy computation not found");
  assert.match(derivedMatch[0], /totalActivePrincipal > 0/);
  assert.match(derivedMatch[0], /: null/);
});

test("reward currency label uses the stake's own real coin, not a hardcoded EXALT suffix", () => {
  assert.match(source, /\{stake\.pendingReward \|\| 0\} \{stake\.coin\}/);
});
