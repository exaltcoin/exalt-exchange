import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

/*
  Intentional baseline update:
  canonical production API origin was migrated from the legacy Render
  hostname to https://api.exaltexchange.io. AdminPanel also received
  production-safe explorer wording. Dedicated regression coverage:
  tests/canonicalApiOrigin.test.mjs and tests/panelRealness.test.mjs.
*/

const expected = {
  "src/components/Web3Wallet.jsx": "9E465096B6B1B0348DBBB0AC6C598A236989C9E1183904FB9A09089B85073D07",
  "src/components/Web3Wallet.css": "46ED83537A98C6D18FC6FA287867059A0467E40E912EAE301CCAC00A1234A78D",
  /*
    Intentionally updated hash: src/lib/apiClient.js was explicitly,
    deliberately modified per direct user instruction to apply the
    real socket-client consolidation fix (external recovery repo,
    commit f78c11117) - removed the forced transports allow-list
    so Socket.IO negotiates normally. See
    tests/socketClientConsolidation.test.mjs for the dedicated
    regression coverage of that change. This is the new accepted
    baseline going forward, not a drift from the old one.
  */
  "src/lib/apiClient.js": "989BB2A510A3BAFAD9C0B259962CB12F357C86EC769C88D518B6A9BD83469F7A",
  "src/components/OwnerControl.jsx": "09A40A1624F3E7ED12EC549E98BA5A6F8117C7025350682C736B2973229E92C8",
  "src/AdminPanel.jsx": "19BD814CDD764B615407B7A032A771E520AA6DD5304B81D5CBA82C834F6FCFAA",
  "src/components/ModeratorPanel.jsx": "8BADC903EC42D9EFC97B0912ACA5B1C4691DE546865C3654B088B08164621E02",
  "src/components/Wallets.jsx": "94F5B73B6D97CE2563A27E5468E0B9B70E366B253B404BD762795C73B920CB46",
  "src/components/Wallets.css": "414F54C63792A05C59827B8B1FCFDAB1090793B94EB9B847C4A145A4673AD900",
  "src/components/Certificates.jsx": "329D7981258E7E1F2A2D273CD3A118D620D2F4A8DDEAB7EDFB3BE934FE716F4C",
  "src/components/Certificates.css": "772FDE46A0A5E2FF446DFC31832497101BD0DDCE8FB2C931626EA8BCE24084A8",
};

test("protected accepted files are content-identical across platform line endings", async () => {
  for (const [file, digest] of Object.entries(expected)) {
    const bytes = await readFile(new URL(`../${file}`, import.meta.url));
    const normalizedBytes = Buffer.from(
      bytes.toString("utf8").replace(/\r\n/g, "\n"),
      "utf8"
    );
    const actual = createHash("sha256")
      .update(normalizedBytes)
      .digest("hex")
      .toUpperCase();
    assert.equal(actual, digest, `${file} changed`);
  }
});

test("accepted Web3 architecture still passes its security contract", async () => {
  const web3 = await readFile(new URL("../src/components/Web3Wallet.jsx", import.meta.url), "utf8");
  for (const endpoint of ["networks", "wallet", "balances", "portfolio", "send", "swap", "swap/quote", "validate-address", "transactions"]) {
    assert.ok(web3.includes(`/api/web3-wallet/${endpoint}`), `missing web3 ${endpoint}`);
  }
});
