import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/Markets.jsx", import.meta.url),
  "utf8"
);

/*
  Verifies the real backend-backed Favorites/Watchlist and Price
  Alert wiring added to Markets.jsx - not a second, parallel
  localStorage-only implementation, and no client-side fabrication
  of success/trigger state.
*/

test("favorites are loaded from and persisted to the real backend endpoint, not localStorage alone", () => {
  assert.match(source, /\/api\/market\/favorites/);
  assert.match(source, /const \[favoriteSymbols, setFavoriteSymbols\] = useState\(new Set\(\)\)/);
});

test("toggling a favorite calls the real POST/DELETE endpoints and only updates local state after the request completes", () => {
  const toggleFn = source.match(
    /const toggleFavorite = useCallback\([\s\S]*?\n {2}\);/
  );
  assert.ok(toggleFn, "toggleFavorite function not found");

  const body = toggleFn[0];
  assert.match(body, /method: "DELETE"/);
  assert.match(body, /method: "POST"/);

  // The real local-state update must happen AFTER the await fetch(...)
  // calls, not before (no optimistic-before-confirmed update).
  const fetchIndex = body.lastIndexOf("await fetch(");
  const setStateIndex = body.indexOf("setFavoriteSymbols((previous)");
  assert.ok(fetchIndex !== -1 && setStateIndex !== -1);
  assert.ok(
    setStateIndex > fetchIndex,
    "local favorite state must only update after the real request completes"
  );
});

test("price alert creation calls the real backend endpoint and never fabricates its own success/trigger state", () => {
  assert.match(source, /\/api\/market\/price-alerts/);

  const createFn = source.match(
    /const createPriceAlert = useCallback\([\s\S]*?\n {2}\);/
  );
  assert.ok(createFn, "createPriceAlert function not found");

  const body = createFn[0];
  assert.match(body, /method: "POST"/);
  // Success message only comes from the real response, not set
  // unconditionally before or without checking response.ok/data.success.
  assert.match(body, /if \(!response\.ok \|\| !data\?\.success\)/);
});

test("price alert condition supports above/below/change_percent - matching the real backend's supported conditions exactly", () => {
  assert.match(source, /value="above"/);
  assert.match(source, /value="below"/);
  assert.match(source, /value="change_percent"/);
});

test("the favorite toggle button has real accessible state (aria-pressed) reflecting the real favoriteSymbols set, not a static icon", () => {
  assert.match(source, /aria-pressed=\{favoriteSymbols\.has\(/);
});

test("no client-side invention of alert-triggered state anywhere in Markets.jsx - triggering only happens server-side via the worker", () => {
  assert.doesNotMatch(source, /status:\s*"triggered"/);
});
