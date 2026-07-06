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

  [...TOKENS, ...getCustomTokens()].forEach((token) => {
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