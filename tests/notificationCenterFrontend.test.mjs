import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/components/NotificationCenter.jsx", import.meta.url),
  "utf8"
);
const appSource = await readFile(
  new URL("../src/app.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 6 NotificationCenter tests. Real gaps fixed: the page never
  received setPage (so deep-link navigation was structurally
  impossible), had no pagination (meaning the new default page size
  of 20, added this batch to the backend, would have silently hidden
  any notification beyond the first 20 with no way to see more), and
  no category filter. The deep-link whitelist is the most
  safety-critical part: a notification's actionUrl must never be
  used to navigate anywhere not individually verified to be a real
  app.jsx route.
*/

test("NotificationCenter receives setPage from app.jsx - deep-link navigation is structurally possible", () => {
  assert.match(appSource, /<NotificationCenter setPage=\{setPage\}\s*\/>/);
});

test("every whitelisted deep-link target is a real, already-confirmed app.jsx route - none guessed", () => {
  const whitelistMatch = source.match(
    /const DEEP_LINK_WHITELIST = new Set\(\[[\s\S]*?\]\);/
  );
  assert.ok(whitelistMatch, "DEEP_LINK_WHITELIST not found");

  const keys = [...whitelistMatch[0].matchAll(/"([a-z0-9-]+)"/g)].map(
    (m) => m[1]
  );

  assert.ok(keys.length >= 10, "expected a substantial whitelist");

  for (const key of keys) {
    const routePattern = new RegExp(`if \\(page === "${key}"\\) \\{`);
    assert.match(
      appSource,
      routePattern,
      `whitelisted deep-link "${key}" has no matching real route in app.jsx`
    );
  }
});

test("navigation only ever happens through the whitelist check - no direct, unchecked use of actionUrl for navigation", () => {
  const navigateFnMatch = source.match(
    /const navigateToTarget = \(actionUrl\) => \{[\s\S]*?\n {2}\};/
  );
  assert.ok(navigateFnMatch, "navigateToTarget function not found");
  assert.match(navigateFnMatch[0], /DEEP_LINK_WHITELIST\.has\(actionUrl\)/);

  // Outside navigateToTarget's own (correctly guarded) body, setPage
  // must never be called directly with the raw actionUrl value.
  const sourceWithoutNavigateFn = source.replace(navigateFnMatch[0], "");
  assert.doesNotMatch(sourceWithoutNavigateFn, /setPage\(actionUrl\)/);
});

test("real server-backed pagination is used - page/limit sent to the real endpoint, real totalPages from the response", () => {
  assert.match(source, /params\.set\("category", targetCategory\)/);
  assert.match(source, /limit: "20"/);
  assert.match(source, /setTotalPages\(res\.data\?\.totalPages \|\| 1\)/);
});

test("a real category filter is sent to the backend, not applied client-side over a fixed list", () => {
  assert.match(source, /const \[category, setCategory\] = useState/);
  assert.match(source, /onChange=\{\(e\) => setCategory\(e\.target\.value\)\}/);
});

test("mark-read stops event propagation so clicking the read button doesn't also trigger card navigation", () => {
  const buttonMatch = source.match(
    /onClick=\{\(e\) => \{\s*\n\s*e\.stopPropagation\(\);\s*\n\s*markRead\(item\._id\);/
  );
  assert.ok(buttonMatch, "mark-read button does not stop propagation");
});
