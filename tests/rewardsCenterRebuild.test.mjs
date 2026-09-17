import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Rewards.jsx", import.meta.url),
  "utf8"
);

// The explanatory header comment legitimately quotes the OLD
// fabricated content to document what was removed and why (the same
// pattern used elsewhere in this codebase for stale-comment fixes).
// These tests check only the real component code that follows it.
const codeOnly = source.slice(source.indexOf("function Rewards() {"));

/*
  Batch 6 mining-truth-audit finding: Rewards.jsx was the single most
  severe fake-data page found in this entire engagement - a
  hardcoded "1,250 EXALT" balance, a hardcoded "Status: Active", a
  "Claim Rewards" button whose onClick was a bare alert() with no
  backend call, and a fabricated "Community Tasks" section (with a
  matching fake "Submit Task" button) backed by nothing real
  anywhere in the backend. These tests confirm the rebuild is
  genuinely real: only backend-sourced referral/staking data, no
  fabricated balance, no fake success alerts, no mining or
  community-tasks section (per BATCH6-MINING-TRUTH-AUDIT.md's
  conclusion that no real mining integration exists to represent).
*/

test("no hardcoded fake balance, status, or reward amounts remain anywhere", () => {
  assert.doesNotMatch(codeOnly, /1,?250/);
  assert.doesNotMatch(codeOnly, /Status:\s*Active/);
  assert.doesNotMatch(codeOnly, /100 EXALT/);
  assert.doesNotMatch(codeOnly, /250 EXALT/);
});

test("no fake claim/submit success alert exists - no alert() call with no real backend request behind it", () => {
  assert.doesNotMatch(codeOnly, /alert\("Reward claim request submitted"\)/);
  assert.doesNotMatch(codeOnly, /alert\("Task reward request submitted"\)/);
  // No bare fetch-less onClick alert of any kind for a claim action.
  assert.doesNotMatch(codeOnly, /onClick=\{\(\) => alert\(/);
});

test("no 'Community Tasks' section exists - zero real backend support was confirmed for it", () => {
  assert.doesNotMatch(codeOnly, /<h3>Community Tasks<\/h3>/);
  assert.doesNotMatch(codeOnly, /Join Telegram: \d+ EXALT/i);
  assert.doesNotMatch(codeOnly, /<button[^>]*>\s*Submit Task\s*<\/button>/i);
});

test("no Mining Rewards section exists as an active feature - the mining truth audit confirmed zero real integration exists to represent", () => {
  assert.doesNotMatch(source, /<h3>Mining Rewards<\/h3>/);
  assert.match(source, /BATCH6-MINING-TRUTH-AUDIT\.md/);
});

test("real referral rewards are fetched from the real, existing endpoint", () => {
  assert.match(source, /\/api\/referrals\/me/);
});

test("real staking rewards are fetched from the real, existing endpoint - not a duplicated/fabricated source", () => {
  assert.match(source, /\/api\/staking\/my-stakes/);
});

test("reward rows use each item's own real asset/coin field - never a hardcoded EXALT label regardless of the real reward's actual coin", () => {
  assert.match(source, /reward\.coin \|\| "EXALT"/);
  assert.match(source, /asset:\s*stake\.coin/);
});

test("an honest unavailable state is shown when both real sources fail to load - never a silently empty or fabricated table", () => {
  assert.match(source, /bothUnavailable/);
});

test("an honest empty state (not a fake balance) is shown when the user genuinely has zero real rewards", () => {
  assert.match(source, /allRows\.length === 0/);
  assert.match(source, /noRewardsYet/);
});
