import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const COMPONENTS_DIR = new URL("../src/components/", import.meta.url);

/*
  Real bug class found during the final completion audit: four
  components (AdminP2P.jsx, AdminCopyTrading.jsx, AdminStaking.jsx,
  ListingForm.jsx) defined a base-URL variable as `API_BASE` but
  then referenced a DIFFERENT, never-defined `API` variable in their
  actual fetch/axios calls - every request in each of these
  components resolved to a broken "undefined/api/..." URL. This
  test scans every real component file for the same pattern so a
  future regression of this exact class is caught automatically,
  not just the four instances found this pass.
*/

test("no component references an API-base template variable it never defined", async () => {
  const files = await readdir(COMPONENTS_DIR, { withFileTypes: true });
  const violations = [];

  for (const entry of files) {
    if (!entry.isFile() || !entry.name.endsWith(".jsx")) continue;

    const content = await readFile(
      new URL(entry.name, COMPONENTS_DIR),
      "utf8"
    );

    const definedVars = new Set(
      [...content.matchAll(/const\s+(API|API_BASE|BASE_URL|API_URL)\s*=/g)].map(
        (m) => m[1]
      )
    );

    const usedVars = new Set(
      [...content.matchAll(/\$\{(API|API_BASE|BASE_URL|API_URL)\}/g)].map(
        (m) => m[1]
      )
    );

    for (const used of usedVars) {
      if (!definedVars.has(used)) {
        violations.push(`${entry.name}: uses undefined \${${used}}`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Found component(s) referencing an undefined API-base variable:\n${violations.join("\n")}`
  );
});

test("the four specific files fixed this pass now consistently use their real, defined API_BASE variable", async () => {
  for (const file of [
    "AdminP2P.jsx",
    "AdminCopyTrading.jsx",
    "AdminStaking.jsx",
    "ListingForm.jsx",
  ]) {
    const content = await readFile(new URL(file, COMPONENTS_DIR), "utf8");
    assert.match(content, /const API_BASE\s*=/, `${file} missing API_BASE definition`);
    assert.doesNotMatch(content, /\$\{API\}/, `${file} still references undefined \${API}`);
  }
});
