import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcRoot = path.join(root, "src");

const LEGACY = "https://exalt-real-backend-6b6v.onrender.com";
const CANONICAL = "https://api.exaltexchange.io";

function collectFiles(dir) {
  const out = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...collectFiles(full));
      continue;
    }

    if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }

  return out;
}

test("frontend source contains no legacy Render production API origin", () => {
  const offenders = [];

  for (const file of collectFiles(srcRoot)) {
    const src = fs.readFileSync(file, "utf8");

    if (src.includes(LEGACY)) {
      offenders.push(path.relative(root, file).replaceAll("\\", "/"));
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Legacy Render API origin remains in:\n${offenders.join("\n")}`
  );
});

test("frontend retains canonical EXALT Exchange API origin", () => {
  const all = collectFiles(srcRoot)
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");

  assert.equal(
    all.includes(CANONICAL),
    true,
    "Canonical EXALT API origin is missing from frontend source"
  );
});