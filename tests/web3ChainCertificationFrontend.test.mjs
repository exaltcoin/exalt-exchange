import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/components/Web3Wallet.jsx", import.meta.url), "utf8");

test("Web3 UI displays chain readiness and disables uncertified sends/swaps", () => {
  assert.match(source, /certification\?\.ready/);
  assert.match(source, /Chain execution is locked/);
  assert.match(source, /disabled=\{!chainReady \|\|/);
});
