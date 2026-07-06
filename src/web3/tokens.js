import { ethers } from "ethers";
import {
  DEFAULT_TOKENS,
  STORAGE_KEYS,
  TOKEN_ABI,
  getChain,
  getChainList,
} from "./web3Config";

const CUSTOM_TOKEN_LIMIT = 1000;

export function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeSymbol(symbol = "BNB") {
  return String(symbol || "BNB").trim().toUpperCase();
}

export function normalizeAddress(address = "") {
  return String(address || "").trim().toLowerCase();
}

export function normalizeChainKey(chainKey = "bsc") {
  return String(chainKey || "bsc").trim().toLowerCase();
}

export function makeTokenId(token = {}) {
  const chainKey = normalizeChainKey(token.chainKey || token.chain || "bsc");
  const symbol = normalizeSymbol(token.symbol || "TOKEN");
  const address = normalizeAddress(token.address || "");
  const nativeKey = token.native ? "native" : address;

  return `${chainKey}:${symbol}:${nativeKey}`;
}

export function normalizeToken(token = {}) {
  const chainKey = normalizeChainKey(token.chainKey || token.chain || "bsc");
  const chain = getChain(chainKey);

  const normalized = {
    id: token.id || makeTokenId({ ...token, chainKey }),
    symbol: normalizeSymbol(token.symbol || chain.symbol),
    name: token.name || token.symbol || chain.name,
    chain: chainKey,
    chainKey,
    network: token.network || chain.network || chain.shortName,
    decimals: Number(token.decimals ?? 18),
    native: Boolean(token.native),
    address: token.native ? chain.wrappedNative : token.address || "",
    logo: token.logo || chain.logo || "",
    logoType: token.logoType || "",
    fallbackPrice: Number(token.fallbackPrice || 0),
    visible: token.visible !== false,
    favorite: Boolean(token.favorite),
    custom: Boolean(token.custom),
    importedAt: token.importedAt || "",
    verified: Boolean(token.verified),
    spam: Boolean(token.spam),
    watchOnly: Boolean(token.watchOnly),
marketOnly: Boolean(token.marketOnly),
rank: Number(token.rank || 9999),
  };

  normalized.id = makeTokenId(normalized);
  return normalized;
}

export const TOKENS = DEFAULT_TOKENS.map((token) => 
  normalizeToken({
    ...token,
    visible: true,
    favorite: ["BNB", "USDT", "EXALT"].includes(token.symbol),
    custom: false,
    verified: true,
  })
);
export const MARKET_TOKENS = [
  ["BTC","Bitcoin",1,103000,1],["ETH","Ethereum",1027,2400,2],["USDT","Tether USD",825,1,3],
  ["BNB","BNB",1839,650,4],["SOL","Solana",5426,150,5],["XRP","XRP",52,0.55,6],
  ["USDC","USD Coin",3408,1,7],["DOGE","Dogecoin",74,0.12,8],["ADA","Cardano",2010,0.45,9],
  ["TRX","TRON",1958,0.13,10],["AVAX","Avalanche",5805,25,11],["SHIB","Shiba Inu",5994,0.00002,12],
  ["TON","Toncoin",11419,5.5,13],["DOT","Polkadot",6636,6,14],["LINK","Chainlink",1975,14,15],
  ["MATIC","Polygon",3890,0.4,16],["BCH","Bitcoin Cash",1831,430,17],["LTC","Litecoin",2,80,18],
  ["NEAR","NEAR Protocol",6535,5,19],["UNI","Uniswap",7083,8,20],["ICP","Internet Computer",8916,9,21],
  ["APT","Aptos",21794,7,22],["ETC","Ethereum Classic",1321,25,23],["XLM","Stellar",512,0.1,24],
  ["ATOM","Cosmos",3794,7,25],["FIL","Filecoin",2280,5,26],["HBAR","Hedera",4642,0.08,27],
  ["ARB","Arbitrum",11841,1.1,28],["OP","Optimism",11840,2,29],["VET","VeChain",3077,0.03,30],
  ["INJ","Injective",7226,25,31],["IMX","Immutable",10603,1.5,32],["SUI","Sui",20947,1.2,33],
  ["TAO","Bittensor",22974,300,34],["GRT","The Graph",6719,0.2,35],["AAVE","Aave",7278,100,36],
  ["MKR","Maker",1518,2400,37],["RUNE","THORChain",4157,5,38],["ALGO","Algorand",4030,0.18,39],
  ["EGLD","MultiversX",6892,35,40],["FLOW","Flow",4558,0.7,41],["SAND","The Sandbox",6210,0.35,42],
  ["MANA","Decentraland",1966,0.35,43],["AXS","Axie Infinity",6783,6,44],["CHZ","Chiliz",4066,0.07,45],
  ["XTZ","Tezos",2011,0.9,46],["EOS","EOS",1765,0.7,47],["KAS","Kaspa",20396,0.15,48],
  ["QNT","Quant",3155,90,49],["STX","Stacks",4847,1.8,50],["THETA","Theta Network",2416,1.4,51],
  ["FTM","Fantom",3513,0.4,52],["KAVA","Kava",4846,0.5,53],["ZEC","Zcash",1437,30,54],
  ["DASH","Dash",131,28,55],["MINA","Mina",8646,0.6,56],["ROSE","Oasis Network",7653,0.08,57],
  ["CFX","Conflux",7334,0.18,58],["SNX","Synthetix",2586,2,59],["CRV","Curve DAO",6538,0.35,60],
  ["LDO","Lido DAO",8000,2,61],["DYDX","dYdX",11156,1.4,62],["COMP","Compound",5692,55,63],
  ["1INCH","1inch",8104,0.4,64],["ENJ","Enjin Coin",2130,0.2,65],["BAT","Basic Attention Token",1697,0.2,66],
  ["ZIL","Zilliqa",2469,0.02,67],["ANKR","Ankr",3783,0.03,68],["HOT","Holo",2682,0.002,69],
  ["GALA","Gala",7080,0.03,70],["PEPE","Pepe",24478,0.00001,71],["FLOKI","FLOKI",10804,0.00018,72],
  ["BONK","Bonk",23095,0.000025,73],["WIF","dogwifhat",28752,2,74],["SEI","Sei",23149,0.35,75],
  ["TIA","Celestia",22861,6,76],["JUP","Jupiter",29210,0.9,77],["PYTH","Pyth Network",28177,0.4,78],
  ["RNDR","Render",5690,7,79],["FET","Artificial Superintelligence",3773,1.3,80],["OCEAN","Ocean Protocol",3911,0.7,81],
  ["AGIX","SingularityNET",2424,0.7,82],["IOTA","IOTA",1720,0.18,83],["KSM","Kusama",5034,28,84],
  ["WLD","Worldcoin",13502,2.5,85],["AR","Arweave",5632,30,86],["GMT","STEPN",18069,0.18,87],
  ["LUNC","Terra Classic",4172,0.0001,88],["XEC","eCash",10791,0.00004,89],["RVN","Ravencoin",2577,0.02,90],
  ["CELO","Celo",5567,0.6,91],["GLMR","Moonbeam",6836,0.25,92],["ONE","Harmony",3945,0.02,93],
  ["SKL","SKALE",5691,0.06,94],["ICX","ICON",2099,0.18,95],["QTUM","Qtum",1684,3,96],
  ["ONT","Ontology",2566,0.2,97],["WAVES","Waves",1274,2,98],["SXP","Solar",4279,0.3,99],
  ["EXALT","Exalt Coin",0,0,100],
].map(([symbol, name, cmcId, fallbackPrice, rank]) =>
  normalizeToken({
    symbol,
    name,
    chainKey: "bsc",
    chain: "bsc",
    network: "Market",
    decimals: 18,
    native: false,
    address: "",
    fallbackPrice,
    logo: cmcId
      ? `https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png`
      : "",
    watchOnly: true,
    marketOnly: true,
    visible: true,
    verified: true,
    rank,
  })
);
export function getCustomTokens() {
  const list = safeJsonParse(localStorage.getItem(STORAGE_KEYS.CUSTOM_TOKENS), []);
  return Array.isArray(list) ? list.map(normalizeToken) : [];
}

export function saveCustomTokens(tokens = []) {
  const clean = Array.isArray(tokens)
    ? tokens.map(normalizeToken).slice(0, CUSTOM_TOKEN_LIMIT)
    : [];

  localStorage.setItem(STORAGE_KEYS.CUSTOM_TOKENS, JSON.stringify(clean));
  return clean;
}

export function getAllTokens() {
  const map = new Map();

 [...TOKENS, ...MARKET_TOKENS, ...getCustomTokens()].forEach((token) => {
    const normalized = normalizeToken(token);
    map.set(normalized.id, normalized);
  });

  return Array.from(map.values());
}

export function getTokensByChain(chainKey = "bsc", includeHidden = false) {
  const key = normalizeChainKey(chainKey);

  return getAllTokens().filter((token) => {
    const matchChain = token.chainKey === key || token.chain === key;
    const matchVisible = includeHidden || token.visible !== false;
    return matchChain && matchVisible;
  });
}

export function getTokenBySymbol(symbol = "BNB", chainKey = "bsc") {
  const target = normalizeSymbol(symbol);
  const key = normalizeChainKey(chainKey);

  return (
    getAllTokens().find(
      (token) => token.symbol === target && token.chainKey === key
    ) ||
    getAllTokens().find((token) => token.symbol === target) ||
    getTokensByChain(key)[0] ||
    TOKENS[0]
  );
}

export function getTokenByAddress(address = "", chainKey = "bsc") {
  const target = normalizeAddress(address);
  const key = normalizeChainKey(chainKey);

  if (!target) return null;

  return (
    getAllTokens().find(
      (token) =>
        normalizeAddress(token.address) === target && token.chainKey === key
    ) || null
  );
}

export function tokenExists(address = "", chainKey = "bsc") {
  return Boolean(getTokenByAddress(address, chainKey));
}

export function getNativeToken(chainKey = "bsc") {
  const key = normalizeChainKey(chainKey);
  const chain = getChain(key);

  return (
    getAllTokens().find((token) => token.chainKey === key && token.native) ||
    normalizeToken({
      symbol: chain.symbol,
      name: chain.nativeName || chain.name,
      chainKey: key,
      chain: key,
      network: chain.network,
      decimals: 18,
      native: true,
      address: chain.wrappedNative,
      logo: chain.logo,
      favorite: true,
      verified: true,
    })
  );
}

export function getReceiveAddressForToken(tokenSymbol, activeWalletAddress) {
  if (!activeWalletAddress) return "";
  return activeWalletAddress;
}

export function getTokenNetworkLabel(symbol = "", chainKey = "bsc") {
  const token = getTokenBySymbol(symbol, chainKey);
  return token.network || getChain(token.chainKey).network || "EVM";
}
export function getTokenWarning(symbol = "", chainKey = "bsc") {
  const token = getTokenBySymbol(symbol, chainKey);
  const chain = getChain(token.chainKey);

  if (token.symbol === "BTCB") {
    return "BTCB is Bitcoin token on BNB Smart Chain. Do not send native BTC to this address.";
  }

  if (token.symbol === "ETH" && token.chainKey === "bsc") {
    return "This ETH is BEP20 token on BNB Smart Chain. Do not send native Ethereum mainnet unless ERC20 is selected.";
  }

  if (token.custom) {
    return `Custom token: only send ${token.symbol} on ${chain.network || chain.name}. Verify contract before receiving.`;
  }

  return `Only send ${token.symbol} on ${chain.network || chain.name}. Sending wrong network assets may cause permanent loss.`;
}

export function getTokenLogo(token, localExaltLogo = "") {
  const symbol = normalizeSymbol(token?.symbol);

  if (symbol === "EXALT" && localExaltLogo) return localExaltLogo;

  return (
    token?.logo ||
    token?.image ||
    token?.icon ||
    getChain(token?.chainKey || token?.chain || "bsc").logo ||
    `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`
  );
}

export function formatTokenAmount(value, decimals = 4) {
  const num = Number(value || 0);

  if (num === 0) return "0.0000";
  if (num > 0 && num < 0.000001) return num.toFixed(10);
  if (num > 0 && num < 0.0001) return num.toFixed(8);

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatTokenPrice(value) {
  const num = Number(value || 0);

  if (num === 0) return "0.000000";
  if (num < 0.000001) return num.toFixed(10);
  if (num < 0.01) return num.toFixed(8);

  return num.toFixed(6);
}

export function searchTokens(tokens = getAllTokens(), query = "") {
  const q = String(query || "").toLowerCase();

  if (!q) return tokens;

  return tokens.filter((token) => {
    return (
      String(token.symbol || "").toLowerCase().includes(q) ||
      String(token.name || "").toLowerCase().includes(q) ||
      String(token.network || "").toLowerCase().includes(q) ||
      String(token.chainKey || "").toLowerCase().includes(q) ||
      String(token.address || "").toLowerCase().includes(q)
    );
  });
}

export function sortTokensByFavorites(tokens = getAllTokens()) {
  return [...tokens].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return a.symbol.localeCompare(b.symbol);
  });
}

export function sortTokensByValue(tokens = [], balances = {}, prices = {}) {
  return [...tokens].sort((a, b) => {
    const aKey = `${a.chainKey}:${a.symbol}`;
    const bKey = `${b.chainKey}:${b.symbol}`;

    const valueA =
      Number(balances[a.id] ?? balances[aKey] ?? balances[a.symbol] ?? 0) *
      Number(prices[a.id] ?? prices[aKey] ?? prices[a.symbol] ?? a.fallbackPrice ?? 0);

    const valueB =
      Number(balances[b.id] ?? balances[bKey] ?? balances[b.symbol] ?? 0) *
      Number(prices[b.id] ?? prices[bKey] ?? prices[b.symbol] ?? b.fallbackPrice ?? 0);

    return valueB - valueA;
  });
}

export function hideToken(tokenId) {
  const custom = getCustomTokens();

  const updated = custom.map((token) =>
    token.id === tokenId ? { ...token, visible: false } : token
  );

  return saveCustomTokens(updated);
}

export function showToken(tokenId) {
  const custom = getCustomTokens();

  const updated = custom.map((token) =>
    token.id === tokenId ? { ...token, visible: true } : token
  );

  return saveCustomTokens(updated);
}

export function removeCustomToken(tokenId) {
  const updated = getCustomTokens().filter((token) => token.id !== tokenId);
  return saveCustomTokens(updated);
}

export function setTokenFavorite(tokenId, favorite = true) {
  const custom = getCustomTokens();

  const updated = custom.map((token) =>
    token.id === tokenId ? { ...token, favorite } : token
  );

  return saveCustomTokens(updated);
}

export async function readTokenFromContract({
  address,
  chainKey = "bsc",
}) {
  const cleanAddress = String(address || "").trim();

  if (!ethers.isAddress(cleanAddress)) {
    throw new Error("Invalid token contract address.");
  }

  const chain = getChain(chainKey);
  const provider = new ethers.JsonRpcProvider(chain.rpc);
  const contract = new ethers.Contract(cleanAddress, TOKEN_ABI, provider);

  const [name, symbol, decimals] = await Promise.all([
    contract.name().catch(() => "Unknown Token"),
    contract.symbol().catch(() => "TOKEN"),
    contract.decimals().catch(() => 18),
  ]);

  return normalizeToken({
    name,
    symbol,
    decimals: Number(decimals || 18),
    address: cleanAddress,
    chainKey,
    chain: chainKey,
    network: chain.network,
    native: false,
    custom: true,
    visible: true,
    favorite: false,
    verified: false,
    importedAt: new Date().toISOString(),
  });
}
export function addCustomToken(token) {
  const normalized = normalizeToken({
    ...token,
    custom: true,
    visible: true,
    importedAt: token.importedAt || new Date().toISOString(),
  });

  const customTokens = getCustomTokens();

  const exists = customTokens.some(
    (item) =>
      normalizeAddress(item.address) === normalizeAddress(normalized.address) &&
      normalizeChainKey(item.chainKey) === normalizeChainKey(normalized.chainKey)
  );

  if (exists) {
    throw new Error("Token already imported on this network.");
  }

  const updated = [normalized, ...customTokens].slice(0, CUSTOM_TOKEN_LIMIT);
  saveCustomTokens(updated);

  return updated;
}

export async function importCustomToken({
  address,
  chainKey = "bsc",
}) {
  const token = await readTokenFromContract({
    address,
    chainKey,
  });

  addCustomToken(token);

  return token;
}

export function getImportableChains() {
  return getChainList().map((chain) => ({
    key: chain.key,
    name: chain.name,
    network: chain.network,
    symbol: chain.symbol,
    explorer: chain.explorer,
    logo: chain.logo,
  }));
}

export function getTokenExplorerUrl(token = {}) {
  const chain = getChain(token.chainKey || token.chain || "bsc");

  if (token.native) {
    return `${chain.explorer}/address/${token.address || chain.wrappedNative}`;
  }

  return `${chain.explorer}/token/${token.address}`;
}

export function getAddressExplorerUrl(address = "", chainKey = "bsc") {
  const chain = getChain(chainKey);
  return `${chain.explorer}/address/${address}`;
}

export function getTokenBalanceKey(token = {}) {
  return `${normalizeChainKey(token.chainKey || token.chain)}:${normalizeSymbol(
    token.symbol
  )}:${normalizeAddress(token.address || "")}`;
}

export function buildTokenDisplayName(token = {}) {
  const network = token.network || getChain(token.chainKey || "bsc").network;
  return `${token.symbol} • ${network}`;
}

export function groupTokensByChain(tokens = getAllTokens()) {
  return tokens.reduce((groups, token) => {
    const key = normalizeChainKey(token.chainKey || token.chain || "bsc");

    if (!groups[key]) groups[key] = [];
    groups[key].push(token);

    return groups;
  }, {});
}

export function filterSpamTokens(tokens = []) {
  const spamWords = [
    "airdrop",
    "claim",
    "reward",
    "voucher",
    "visit",
    "free",
    "scam",
    "bonus",
  ];

  return tokens.filter((token) => {
    const text = `${token.name || ""} ${token.symbol || ""}`.toLowerCase();
    return !spamWords.some((word) => text.includes(word));
  });
}

export function getWalletTokenList({
  chainKey = "bsc",
  includeHidden = false,
  includeSpam = false,
  query = "",
} = {}) {
  let tokens = getTokensByChain(chainKey, includeHidden);

  if (!includeSpam) {
    tokens = filterSpamTokens(tokens);
  }

  if (query) {
    tokens = searchTokens(tokens, query);
  }

  return sortTokensByFavorites(tokens);
}

export function resetCustomTokens() {
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_TOKENS);
  return [];
}

export default {
  TOKENS,
  getCustomTokens,
  saveCustomTokens,
  getAllTokens,
  getTokensByChain,
  getTokenBySymbol,
  getTokenByAddress,
  getNativeToken,
  getReceiveAddressForToken,
  getTokenWarning,
  getTokenNetworkLabel,
  getTokenLogo,
  formatTokenAmount,
  formatTokenPrice,
  searchTokens,
  sortTokensByFavorites,
  sortTokensByValue,
  readTokenFromContract,
  addCustomToken,
  importCustomToken,
  removeCustomToken,
  setTokenFavorite,
  hideToken,
  showToken,
  getImportableChains,
  getTokenExplorerUrl,
  getAddressExplorerUrl,
  getTokenBalanceKey,
  buildTokenDisplayName,
  groupTokensByChain,
  getWalletTokenList,
  resetCustomTokens,
};