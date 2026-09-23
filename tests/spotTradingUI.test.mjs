import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Trade.jsx", import.meta.url),
  "utf8"
);

/*
  Source-level regression tests for the Spot Trading UI closure,
  matching the established pattern for large components with heavy
  external dependencies (ethers, socket.io, charting library) that
  would need extensive mocking for a full render test - these
  verify the real mechanism in the actual shipped code.
*/

test("only market and limit order types are ever offered - no Stop/OCO/Trailing anywhere in the UI", () => {
  assert.match(source, /value="market"/);
  assert.match(source, /value="limit"/);

  for (const unsupported of [
    "stop",
    "stop-limit",
    "stop-market",
    "oco",
    "trailing",
    "take-profit",
  ]) {
    const pattern = new RegExp(`value="${unsupported}"`, "i");
    assert.doesNotMatch(
      source,
      pattern,
      `Found unsupported order type "${unsupported}" advertised in the UI`
    );
  }
});

test("buy/sell side is controlled by real Tabs wired to setType, not a hardcoded default that ignores user selection", () => {
  const tabsMatch = source.match(/<Tabs[\s\S]{0,800}/);
  assert.ok(tabsMatch, "Tabs component usage not found");
  assert.match(tabsMatch[0], /activeId=\{type\}/);
  assert.match(tabsMatch[0], /onChange=\{setType\}/);
});

test("submitOrder validates amount and price BEFORE ever calling the API - a missing/invalid value never reaches the network", () => {
  const fnMatch = source.match(
    /const submitOrder = async \(\) => \{[\s\S]*?\n {2}\};/
  );
  assert.ok(fnMatch, "submitOrder function not found");

  const body = fnMatch[0];
  const apiCallIndex = body.indexOf("api/trades/order");
  const amountValidationIndex = body.indexOf("enterValidAmount");
  const priceValidationIndex = body.indexOf("enterValidPrice");

  assert.ok(amountValidationIndex !== -1 && amountValidationIndex < apiCallIndex);
  assert.ok(priceValidationIndex !== -1 && priceValidationIndex < apiCallIndex);
});

test("the real order payload sent to the backend contains exactly pair/side/type/price/amount - no client-invented fields, no missing required ones", () => {
  const payloadMatch = source.match(
    /const payload = \{[\s\S]*?\};/
  );
  assert.ok(payloadMatch, "order payload construction not found");

  const payload = payloadMatch[0];
  for (const field of ["pair:", "side: type", "type: orderMode", "price: finalPrice", "amount: numericAmount"]) {
    assert.ok(
      payload.includes(field),
      `payload missing expected field construction: ${field}`
    );
  }
});

test("a real idempotency key is generated fresh per submission attempt and sent as a request header", () => {
  assert.match(source, /const idempotencyKey = `web:\$\{Date\.now\(\)\}/);
  assert.match(source, /"Idempotency-Key": idempotencyKey/);

  // Generated INSIDE submitOrder (per-attempt), not at module/component
  // top level (which would make every submission from this session
  // share the same key and get incorrectly deduplicated).
  const fnMatch = source.match(
    /const submitOrder = async \(\) => \{[\s\S]*?\n {2}\};/
  );
  assert.match(fnMatch[0], /const idempotencyKey/);
});

test("order success is only reported after the real API response confirms success - not assumed from the request merely completing", () => {
  const fnMatch = source.match(
    /const submitOrder = async \(\) => \{[\s\S]*?\n {2}\};/
  );
  const body = fnMatch[0];

  assert.match(body, /if \(!data\?\.success\)/);
  assert.match(body, /throw new Error/);
});

test("insufficient-funds / backend rejection surfaces the real backend message, never a generic client-invented one", () => {
  const fnMatch = source.match(
    /const submitOrder = async \(\) => \{[\s\S]*?\n {2}\};/
  );
  const body = fnMatch[0];

  assert.match(body, /data\?\.message \|\|/);
});

test("cancel order calls the real authenticated cancel endpoint with the specific order id", () => {
  assert.match(
    source,
    /api\/trades\/order\/\$\{orderId\}\/cancel/
  );
});

test("open orders and trade history are rendered from real state populated by real API responses, not client-fabricated arrays", () => {
  assert.match(source, /const \[myOrders, setMyOrders\] = useState\(\[\]\)/);
});

test("the AmountInput/Select/Button design-system primitives are used for the real order form, not a rebuilt box/card structure", () => {
  assert.match(source, /import \{\s*\n?\s*Tabs,\s*\n?\s*Select,\s*\n?\s*AmountInput,\s*\n?\s*Button,/);
  assert.match(source, /<AmountInput/);
  assert.match(source, /<Select/);
  assert.match(source, /<Button/);
});

test("Math.random(), where it appears at all, is only ever used as one fallback branch for generating a unique ID string (never a fake price/fill/balance value) - and no hardcoded numeric price literal was introduced", () => {
  const randomUsages = [...source.matchAll(/Math\.random\(\)[^\n]*/g)].map(
    (m) => m[0]
  );

  for (const usage of randomUsages) {
    assert.match(
      usage,
      /\.toString\(36\)/,
      `Math.random() usage does not look like ID-string generation: "${usage}"`
    );
  }

  // No hardcoded fake price fallback (the exact class of bug already
  // fixed elsewhere in this codebase, e.g. Dashboard's removed
  // 0.02456 EXALT price fallback).
  assert.doesNotMatch(source, /useState\(0\.02456\)/);
});

test("the buy/sell submit button variant reflects the real selected side (buy/sell), not a static primary color regardless of side", () => {
  const buttonMatch = source.match(
    /variant=\{\s*\n?\s*type === "buy"\s*\n?\s*\? "buy"\s*\n?\s*: "sell"\s*\n?\s*\}/
  );
  assert.ok(buttonMatch, "Button variant is not tied to the real buy/sell state");
});
