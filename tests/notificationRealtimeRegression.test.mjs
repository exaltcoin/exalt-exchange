import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const bellSource = await readFile(
  new URL("../src/components/NotificationBell.jsx", import.meta.url),
  "utf8"
);

/*
  Batch 6 dedicated realtime notification tests. NotificationBell.jsx
  already existed and was already largely correct - these tests lock
  in that correctness rather than fix new bugs, per the explicit
  "the current socket architecture needs dedicated regression
  coverage" instruction (coverage, not a rewrite).
*/

test("NotificationBell.jsx imports the canonical shared socket - no second Socket.IO client", () => {
  assert.doesNotMatch(bellSource, /=\s*io\(/);
  assert.match(
    bellSource,
    /import\s+(?:[A-Za-z_$][\w$]*\s*,\s*)?\{[^}]*\bsocket\b[^}]*\}\s*from\s*["']\.\.\/api["']/
  );
});

test("every socket.on registration has a matching socket.off in the cleanup function - no listener leak on unmount", () => {
  const effectMatch = bellSource.match(
    /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/
  );
  assert.ok(effectMatch, "the realtime subscription effect was not found");

  const onEvents = [...effectMatch[0].matchAll(/socket\.on\("([\w:]+)"/g)].map(
    (m) => m[1]
  );
  const offEvents = [...effectMatch[0].matchAll(/socket\.off\("([\w:]+)"/g)].map(
    (m) => m[1]
  );

  assert.deepEqual(
    [...onEvents].sort(),
    [...offEvents].sort(),
    "on/off event name sets do not match"
  );
  assert.ok(onEvents.length >= 2, "expected at least the 2 known real-time events");
});

test("a real notification event increments the unread badge by exactly one, not a re-fetch-and-possibly-miscount", () => {
  const handlerMatch = bellSource.match(
    /const handleNewNotification = \(notification\) => \{[\s\S]*?\n {4}\};/
  );
  assert.ok(handlerMatch, "handleNewNotification not found");
  assert.match(handlerMatch[0], /setUnreadCount\(\(prev\) => prev \+ 1\)/);
});

test("the subscription effect has an empty dependency array - subscribes once on mount, cleans up once on unmount, never re-subscribes on every render", () => {
  assert.match(bellSource, /socket\.off\("notification:admin", handleNewNotification\);\s*\n\s*\};\s*\n\s*\}, \[\]\);/);
});

test("both the per-user event and the admin/global event use the same real handler - a global notification updates the badge through the identical, already-tested increment path", () => {
  assert.match(bellSource, /socket\.on\("notification:new", handleNewNotification\)/);
  assert.match(bellSource, /socket\.on\("notification:admin", handleNewNotification\)/);
});

test("mark-all-read resets the unread count to a real zero, not merely hiding the badge visually", () => {
  const markAllMatch = bellSource.match(
    /const markAllRead = async \(\) => \{[\s\S]*?\n {2}\};/
  );
  assert.ok(markAllMatch, "markAllRead not found");
  assert.match(markAllMatch[0], /setUnreadCount\(0\)/);
});
