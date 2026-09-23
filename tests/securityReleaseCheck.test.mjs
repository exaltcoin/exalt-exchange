import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

const scriptUrl = new URL("../scripts/security-release-check.mjs", import.meta.url);

const loadSubject = async () => {
  let exists = true;
  try {
    await access(scriptUrl);
  } catch {
    exists = false;
  }
  assert.equal(exists, true, "security-release-check.mjs must exist");
  if (!exists) return null;
  return import(scriptUrl.href);
};

test("blocks critical and high runtime audit findings", async () => {
  const subject = await loadSubject();
  if (!subject) return;
  assert.deepEqual(
    subject.auditBlockers({ critical: 1, high: 2, moderate: 5 }),
    [
      "runtime audit contains 1 critical vulnerability",
      "runtime audit contains 2 high vulnerabilities",
    ]
  );
});

test("detects sensitive tracked paths but permits .env.example", async () => {
  const subject = await loadSubject();
  if (!subject) return;
  assert.deepEqual(
    subject.findSensitivePaths([
      "src/app.jsx",
      ".env.production",
      "android/app/release/app-release.aab",
      "android/app/release/key.jks",
      ".env.example",
    ]),
    [
      ".env.production",
      "android/app/release/app-release.aab",
      "android/app/release/key.jks",
    ]
  );
});

test("detects Android release cleartext configuration", async () => {
  const subject = await loadSubject();
  if (!subject) return;
  assert.deepEqual(
    subject.androidCleartextBlockers({
      manifest: '<application android:usesCleartextTraffic="true">',
      networkPolicy:
        '<base-config cleartextTrafficPermitted="true" />',
    }),
    [
      "release Android manifest permits cleartext traffic",
      "release Android network policy permits cleartext traffic",
    ]
  );
  assert.deepEqual(
    subject.androidCleartextBlockers({
      manifest: '<application android:usesCleartextTraffic="false">',
      networkPolicy:
        '<base-config cleartextTrafficPermitted="false" />',
    }),
    []
  );
});
