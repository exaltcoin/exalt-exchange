import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const files = readdirSync(testsDir)
  .filter((f) => f.startsWith("designSystem") && f.endsWith(".test.mjs"))
  .sort();

if (files.length === 0) {
  console.error("No designSystem*.test.mjs files found.");
  process.exit(1);
}

const loaderRegister =
  'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("./tests/helpers/jsxLoader.mjs", pathToFileURL("./"));';

let totalPass = 0;
let totalFail = 0;
let anyFailed = false;

for (const file of files) {
  const result = spawnSync(
    process.execPath,
    ["--import", loaderRegister, "--test", `tests/${file}`],
    { stdio: "inherit", cwd: path.join(testsDir, "..") }
  );

  if (result.status !== 0) {
    anyFailed = true;
    console.error(`\nFAILED: ${file} (exit code ${result.status}, signal ${result.signal})\n`);
  }
}

if (anyFailed) {
  console.error("\nOne or more design-system test files failed.");
  process.exit(1);
}

console.log("\nAll design-system test files passed (run in isolated processes).");
