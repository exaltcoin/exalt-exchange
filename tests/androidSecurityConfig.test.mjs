import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("release Android manifest is HTTPS-only and uses the release network policy", async () => {
  const manifest = await read("android/app/src/main/AndroidManifest.xml");
  assert.match(manifest, /android:usesCleartextTraffic="false"/);
  assert.match(
    manifest,
    /android:networkSecurityConfig="@xml\/network_security_config"/
  );
});

test("release network policy denies cleartext and contains no LAN development host", async () => {
  const policy = await read(
    "android/app/src/main/res/xml/network_security_config.xml"
  );
  assert.match(policy, /base-config cleartextTrafficPermitted="false"/);
  assert.doesNotMatch(policy, /192\.168\.8\.33/);
  assert.doesNotMatch(policy, /cleartextTrafficPermitted="true"/);
});

test("LAN cleartext access is isolated to the debug source set", async () => {
  const debugManifest = await read(
    "android/app/src/debug/AndroidManifest.xml"
  );
  const debugPolicy = await read(
    "android/app/src/debug/res/xml/network_security_config.xml"
  );
  assert.match(debugManifest, /android:usesCleartextTraffic="true"/);
  assert.match(debugPolicy, /192\.168\.8\.33/);
});

test("Capacitor configuration remains HTTPS-only", async () => {
  const capacitorConfig = await read("capacitor.config.ts");
  assert.match(capacitorConfig, /androidScheme:\s*['"]https['"]/);
  assert.match(capacitorConfig, /cleartext:\s*false/);
});
