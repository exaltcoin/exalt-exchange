import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const SRC_ROOT = new URL("../src/", import.meta.url);

async function walk(dirUrl) {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules") continue;
    const entryUrl = new URL(entry.name, dirUrl);
    if (entry.isDirectory()) {
      files.push(...(await walk(new URL(entryUrl.href + "/"))));
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".jsx")) {
      files.push(entryUrl);
    }
  }
  return files;
}

/*
  External recovery-repo fix (commit f78c11117), applied to this
  sandbox: src/api.js used to create its own, separate Socket.IO
  client (a real duplicate of the canonical shared client in
  lib/apiClient.js), and the canonical client forced
  transports: ["websocket", "polling"] instead of letting Socket.IO
  negotiate polling-first and upgrade to WebSocket normally. Both
  are fixed - these tests lock the fix in.
*/

test("exactly one Socket.IO client (io(...) call) exists anywhere in the frontend source", async () => {
  const files = await walk(SRC_ROOT);
  const ioCallSites = [];

  for (const fileUrl of files) {
    const content = await readFile(fileUrl, "utf8");
    const matches = content.match(/=\s*io\(/g);
    if (matches) {
      ioCallSites.push({
        file: path.relative(
          new URL(SRC_ROOT).pathname,
          fileUrl.pathname
        ),
        count: matches.length,
      });
    }
  }

  const totalCallSites = ioCallSites.reduce((sum, entry) => sum + entry.count, 0);

  assert.equal(
    totalCallSites,
    1,
    `expected exactly 1 io(...) client creation, found ${totalCallSites}: ${JSON.stringify(ioCallSites)}`
  );
});

test("the canonical socket client does not force a transports allow-list - Socket.IO negotiates normally (polling-first, upgrades to WebSocket)", async () => {
  const source = await readFile(
    new URL("../src/lib/apiClient.js", import.meta.url),
    "utf8"
  );

  const getSocketFn = source.match(
    /export function getSocket\(\) \{[\s\S]*?\n\}/
  );
  assert.ok(getSocketFn, "getSocket function not found");
  assert.doesNotMatch(getSocketFn[0], /transports:\s*\[/);
});

test("api.js reuses the canonical shared socket instead of creating its own - same exported name, so existing import sites are unaffected", async () => {
  const source = await readFile(
    new URL("../src/api.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /import\s*\{\s*io\s*\}\s*from\s*["']socket\.io-client["']/);
  assert.match(source, /import\s*\{\s*getSocket\s*\}\s*from\s*["']\.\/lib\/apiClient\.js["']/);
  assert.match(source, /export const socket = getSocket\(\)/);
});

test("existing call sites that import socket from api.js are unaffected by the consolidation (same export shape)", async () => {
  const files = await walk(SRC_ROOT);
  let importCount = 0;

  for (const fileUrl of files) {
    if (fileUrl.pathname.endsWith("/api.js")) continue;
    const content = await readFile(fileUrl, "utf8");
    if (/import\s*\{[^}]*\bsocket\b[^}]*\}\s*from\s*["']\.\.?\/api["']/.test(content)) {
      importCount += 1;
    }
  }

  // At least a handful of real call sites still import `socket`
  // from "../api" or "./api" exactly as before - the fix changed
  // WHERE the client is created, not the public shape callers rely on.
  assert.ok(
    importCount >= 1,
    "expected at least one existing call site still importing socket from api.js unchanged"
  );
});
