import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/P2P.jsx", import.meta.url),
  "utf8"
);

/*
  Realness audit finding: getTraderInfo() used to fabricate a
  hardcoded "4.8" rating, "98%" completion rate, a fake incrementing
  completedOrders count, and even fake verified/online status
  derived from the row's array INDEX - none of which exist anywhere
  in the real P2POrder backend schema. It also checked
  order.traderName/order.sellerName, fields that don't exist in the
  real API response either - the real name lives at
  order.sellerId.name / order.buyerId.name (GET /api/p2p/orders
  populates sellerId/buyerId with {name, email}), so even the one
  genuinely real piece of data was never reaching the screen.
*/

test("getTraderInfo reads the real populated seller/buyer name, not a nonexistent flat traderName/sellerName field", () => {
  const fnMatch = source.match(
    /const getTraderInfo = \(order\) => \{[\s\S]*?\n {2}\};/
  );
  assert.ok(fnMatch, "getTraderInfo function not found");

  const body = fnMatch[0];
  assert.match(body, /order\.sellerId/);
  assert.match(body, /order\.buyerId/);
  assert.doesNotMatch(body, /order\.traderName/);
  assert.doesNotMatch(body, /order\.sellerName/);
});

test("no fabricated rating, completion rate, completed-order count, verified badge, or online status remain anywhere in P2P.jsx", () => {
  for (const fabricated of [
    /rating:\s*order\.rating \|\| "4\.8"/,
    /completionRate:\s*order\.completionRate \|\| "98%"/,
    /completedOrders:\s*order\.completedOrders \|\| 120/,
    /verified:\s*order\.verified \?\?/,
    /online:\s*order\.online \?\?/,
  ]) {
    assert.doesNotMatch(source, fabricated);
  }
});

test("no verified/online/rating/completion badges are rendered in the trader row JSX", () => {
  assert.doesNotMatch(source, /verified-badge/);
  assert.doesNotMatch(source, /rating-badge/);
  assert.doesNotMatch(source, /completion-badge/);
  assert.doesNotMatch(source, /merchant-badge/);
  assert.doesNotMatch(source, /online-status/);
  assert.doesNotMatch(source, /offline-status/);
});

test("getTraderInfo falls back to a real, honest generic label only when no real name is present - never a fabricated identity", () => {
  const fnMatch = source.match(
    /const getTraderInfo = \(order\) => \{[\s\S]*?\n {2}\};/
  );
  const body = fnMatch[0];

  assert.match(body, /traderAccount\?\.name/);
  assert.match(body, /unknownTrader/);
});

test("the trader-side lookup correctly distinguishes a sell ad (seller is the trader) from a buy ad (buyer is the trader)", () => {
  const fnMatch = source.match(
    /const getTraderInfo = \(order\) => \{[\s\S]*?\n {2}\};/
  );
  const body = fnMatch[0];

  assert.match(body, /order\.type === "sell" \? order\.sellerId : order\.buyerId/);
});
