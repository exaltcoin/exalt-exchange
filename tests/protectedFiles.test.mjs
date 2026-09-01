import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const expected = {
  "src/components/Web3Wallet.jsx": "9E465096B6B1B0348DBBB0AC6C598A236989C9E1183904FB9A09089B85073D07",
  "src/components/Web3Wallet.css": "46ED83537A98C6D18FC6FA287867059A0467E40E912EAE301CCAC00A1234A78D",
  "src/lib/apiClient.js": "5CD254E1FCD1417AA17EBC51D74DC52ED6659FF6333F597F77F40D7EC873CEF4",
  "src/components/OwnerControl.jsx": "BF4FF7252C0ACDB53E8F03180A45E83894ECAFD33776581B078B7E716ABCF6A0",
  "src/AdminPanel.jsx": "C11993EDFC6D0A4D832732E64B2105D70B36B5B6F5500292AB6CD1FF8985A97D",
  "src/components/ModeratorPanel.jsx": "A47F7ADEFCE169CA799D37601E52684AE494C4C327B2C3EA3928E950C9D6764B",
  "src/components/Wallets.jsx": "A207096C3AC1E6D4B51BA1421B797789BDAE78A1ECAA030E71427AEA6468EBF5",
  "src/components/Wallets.css": "FEB8D7D7F5DEFB76659C090AAE721105D55C2DF890A2FB6F2EBF1D33A2672376",
  "src/components/Certificates.jsx": "89A4DBAC142D18B2539DD8BDEA69C3DFACD74BE16612A8430690E6D8825CBEC9",
  "src/components/Certificates.css": "772FDE46A0A5E2FF446DFC31832497101BD0DDCE8FB2C931626EA8BCE24084A8",
};

test("protected accepted files are byte-for-byte unchanged", async () => {
  for (const [file, digest] of Object.entries(expected)) {
    const bytes = await readFile(new URL(`../${file}`, import.meta.url));
    const actual = createHash("sha256").update(bytes).digest("hex").toUpperCase();
    assert.equal(actual, digest, `${file} changed`);
  }
});

test("accepted Web3 architecture still passes its security contract", async () => {
  const web3 = await readFile(new URL("../src/components/Web3Wallet.jsx", import.meta.url), "utf8");
  for (const endpoint of ["networks", "wallet", "balances", "portfolio", "send", "swap", "swap/quote", "validate-address", "transactions"]) {
    assert.ok(web3.includes(`/api/web3-wallet/${endpoint}`), `missing web3 ${endpoint}`);
  }
});
