import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);
const lockfile = JSON.parse(
  await readFile(new URL("../package-lock.json", import.meta.url), "utf8")
);

const requiredNativePackages = {
  "@rolldown/binding-linux-x64-gnu": "1.0.3",
  "@rolldown/binding-win32-x64-msvc": "1.0.3",
  "lightningcss-linux-x64-gnu": "1.32.0",
  "lightningcss-win32-x64-msvc": "1.32.0",
};

test("Windows and Linux native build bindings are explicit optional dependencies", () => {
  for (const [name, version] of Object.entries(requiredNativePackages)) {
    assert.equal(packageJson.optionalDependencies?.[name], version);
  }
});

test("lockfile contains every supported native build binding", () => {
  for (const name of Object.keys(requiredNativePackages)) {
    assert.ok(
      lockfile.packages?.[`node_modules/${name}`],
      `lockfile is missing node_modules/${name}`
    );
  }
});

test("Lighthouse is not installed as an application dependency", () => {
  assert.equal(packageJson.dependencies?.lighthouse, undefined);
  assert.equal(packageJson.devDependencies?.lighthouse, undefined);
});
