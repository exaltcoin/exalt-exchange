import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const read = (rel) =>
  fs.readFileSync(path.join(root, rel), "utf8");

const panelFiles = [
  "src/components/OwnerControl.jsx",
  "src/components/SuperAdminPanel.jsx",
  "src/components/ModeratorPanel.jsx",
  "src/components/AdminKycPanel.jsx",
  "src/components/AdminP2P.jsx",
  "src/components/AdminRewards.jsx",
  "src/components/AdminLearnEarn.jsx",
  "src/components/AdminReferrals.jsx",
  "src/components/AdminStaking.jsx",
];

test("all privileged panels use the canonical production API fallback", () => {
  for (const rel of panelFiles) {
    const src = read(rel);

    assert.equal(
      src.includes("https://exalt-real-backend-6b6v.onrender.com"),
      false,
      `${rel} still contains the legacy Render backend fallback`
    );

    assert.equal(
      src.includes("https://api.exaltexchange.io"),
      true,
      `${rel} does not contain the canonical production API fallback`
    );
  }
});

test("app has no generic coming-soon fallback for authenticated panel navigation", () => {
  const src = read("src/app.jsx");

  assert.equal(
    src.includes("This section is coming soon."),
    false,
    "app.jsx still exposes a generic coming-soon panel"
  );
});

test("admin Web3 explorer does not label real missing explorer data as a test transaction", () => {
  const src = read("src/AdminPanel.jsx");

  assert.equal(
    src.includes("Test transaction hash. Explorer not available."),
    false,
    "AdminPanel still contains test-only transaction wording"
  );
});

test("privileged panel routing remains role protected", () => {
  const src = read("src/app.jsx");

  assert.match(src, /adminOnlyPanel\(AdminRewards\)/);
  assert.match(src, /adminOnlyPanel\(AdminLearnEarn\)/);
  assert.match(src, /adminOnlyPanel\(AdminReferrals\)/);
  assert.match(src, /ownerOnlyPanel\(OwnerControl\)/);
  assert.match(src, /superAdminOnlyPanel\(SuperAdminPanel\)/);
  assert.match(src, /moderatorOnlyPanel\(ModeratorPanel\)/);
});