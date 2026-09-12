import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

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
  "src/components/OwnerControl.jsx": "77003F804ECC2D99B9E306F354205CD34CC02AF0E5B8018152B0D5CEC31C1A7D",
  "src/AdminPanel.jsx": "4D9556C77AE1B4A253D7F2309443CD2FBA4003294BD28B3335884767B658F7A9",
  "src/components/ModeratorPanel.jsx": "B50947BC3852EB37ACABA7C2D342876D8DA4B55C94E011A7F374FCAAC9C65207",
  "src/components/Wallets.jsx": "FD0DF10AE7A4CA2A18851F101E787FF06751E2930E5D6437B11C790D3C090B79",
  "src/components/Wallets.css": "414F54C63792A05C59827B8B1FCFDAB1090793B94EB9B847C4A145A4673AD900",
  "src/components/Certificates.jsx": "89A4DBAC142D18B2539DD8BDEA69C3DFACD74BE16612A8430690E6D8825CBEC9",
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
