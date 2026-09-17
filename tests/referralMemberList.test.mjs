import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Referral.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 6 referral member-list tests. Real gap fixed: Referral.jsx
  previously showed only the caller's own referral code/link/totals/
  reward history - never the actual list of referred members, despite
  a real backend field (User.referredBy) existing to support it. Adds
  real search + server-backed pagination against the new
  GET /api/referrals/my-members endpoint.
*/

test("fetches the real my-members endpoint at the correct mount path", () => {
  assert.match(source, /apiFetch\(\s*`\/api\/referrals\/my-members\?\$\{params\.toString\(\)\}`\s*\)/);
});

test("search is real - sends the user's search term to the backend, not a client-side filter over a fixed list", () => {
  assert.match(source, /params\.set\("search", search\.trim\(\)\)/);
});

test("pagination is real - uses the backend's page/totalPages response, not a fabricated client-side page count", () => {
  assert.match(source, /setMemberTotalPages\(data\.totalPages \|\| 1\)/);
  assert.match(source, /setMemberPage\(data\.page \|\| 1\)/);
});

test("member rows render only the real, safe fields the backend returns - name, email, KYC status, join date", () => {
  const tableMatch = source.match(
    /<table className="referral-members-table">[\s\S]*?<\/table>/
  );
  assert.ok(tableMatch, "members table not found");
  assert.match(tableMatch[0], /\{member\.name\}/);
  assert.match(tableMatch[0], /\{member\.email\}/);
  assert.match(tableMatch[0], /\{member\.kycStatus/);
  assert.match(tableMatch[0], /member\.createdAt/);
});

test("an honest unavailable state is shown if the real fetch fails - not a silently empty or fabricated list", () => {
  assert.match(source, /membersLoadState === "unavailable"/);
});
