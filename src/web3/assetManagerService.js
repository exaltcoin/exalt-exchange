import { STORAGE_KEYS } from "./web3Config";
import {
  getAllTokens,
  getCustomTokens,
  saveCustomTokens,
  normalizeChainKey,
  normalizeSymbol,
  getTokenBalanceKey,
} from "./tokens";

const ASSET_SETTINGS_KEY = "exalt_asset_settings_v1";

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function getAssetSettings() {
  return safeJsonParse(localStorage.getItem(ASSET_SETTINGS_KEY), {
    hiddenTokens: [],
    pinnedTokens: [],
    favoriteTokens: [],
    hideZeroBalances: false,
    sortBy: "value",
  });
}

export function saveAssetSettings(settings = {}) {
  const current = getAssetSettings();

  const next = {
    ...current,
    ...settings,
    hiddenTokens: Array.isArray(settings.hiddenTokens)
      ? settings.hiddenTokens
      : current.hiddenTokens,
    pinnedTokens: Array.isArray(settings.pinnedTokens)
      ? settings.pinnedTokens
      : current.pinnedTokens,
    favoriteTokens: Array.isArray(settings.favoriteTokens)
      ? settings.favoriteTokens
      : current.favoriteTokens,
  };

  localStorage.setItem(ASSET_SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function isTokenHidden(tokenId) {
  return getAssetSettings().hiddenTokens.includes(tokenId);
}

export function isTokenPinned(tokenId) {
  return getAssetSettings().pinnedTokens.includes(tokenId);
}

export function isTokenFavorite(tokenId) {
  return getAssetSettings().favoriteTokens.includes(tokenId);
}

export function toggleHiddenToken(tokenId) {
  const settings = getAssetSettings();
  const exists = settings.hiddenTokens.includes(tokenId);

  const hiddenTokens = exists
    ? settings.hiddenTokens.filter((id) => id !== tokenId)
    : [tokenId, ...settings.hiddenTokens];

  return saveAssetSettings({ hiddenTokens });
}

export function togglePinnedToken(tokenId) {
  const settings = getAssetSettings();
  const exists = settings.pinnedTokens.includes(tokenId);

  const pinnedTokens = exists
    ? settings.pinnedTokens.filter((id) => id !== tokenId)
    : [tokenId, ...settings.pinnedTokens];

  return saveAssetSettings({ pinnedTokens });
}

export function toggleFavoriteToken(tokenId) {
  const settings = getAssetSettings();
  const exists = settings.favoriteTokens.includes(tokenId);

  const favoriteTokens = exists
    ? settings.favoriteTokens.filter((id) => id !== tokenId)
    : [tokenId, ...settings.favoriteTokens];

  return saveAssetSettings({ favoriteTokens });
}

export function setHideZeroBalances(value) {
  return saveAssetSettings({ hideZeroBalances: Boolean(value) });
}

export function setAssetSortBy(sortBy = "value") {
  return saveAssetSettings({ sortBy });
}

export function restoreHiddenTokens() {
  return saveAssetSettings({ hiddenTokens: [] });
}

export function getManagedAssetList({
  chainKey = "bsc",
  balances = {},
  prices = {},
  query = "",
} = {}) {
  const settings = getAssetSettings();
  const q = String(query || "").toLowerCase();
  const key = normalizeChainKey(chainKey);

  let tokens = getAllTokens().filter((token) => {
    const matchChain = normalizeChainKey(token.chainKey || token.chain) === key;
    const notMarket = !token.marketOnly && !token.watchOnly;
    const notHidden = !settings.hiddenTokens.includes(token.id);

    return matchChain && notMarket && notHidden;
  });

  if (settings.hideZeroBalances) {
    tokens = tokens.filter((token) => {
      const balanceKey = getTokenBalanceKey(token);
      const balance =
        balances[balanceKey] ??
        balances[token.id] ??
        balances[`${token.chainKey}:${token.symbol}`] ??
        balances[token.symbol] ??
        0;

      return Number(balance) > 0;
    });
  }

  if (q) {
    tokens = tokens.filter((token) => {
      const text = `${token.symbol || ""} ${token.name || ""} ${token.network || ""}`.toLowerCase();
      return text.includes(q);
    });
  }

  tokens = tokens.map((token) => {
    const balanceKey = getTokenBalanceKey(token);
    const balance =
      balances[balanceKey] ??
      balances[token.id] ??
      balances[`${token.chainKey}:${token.symbol}`] ??
      balances[token.symbol] ??
      0;

    const price =
      prices[token.id] ??
      prices[`${token.chainKey}:${token.symbol}`] ??
      prices[token.symbol] ??
      token.fallbackPrice ??
      0;

    return {
      ...token,
      managedFavorite: settings.favoriteTokens.includes(token.id),
      managedPinned: settings.pinnedTokens.includes(token.id),
      managedHidden: settings.hiddenTokens.includes(token.id),
      managedBalance: Number(balance || 0),
      managedValue: Number(balance || 0) * Number(price || 0),
    };
  });

  tokens.sort((a, b) => {
    if (a.managedPinned && !b.managedPinned) return -1;
    if (!a.managedPinned && b.managedPinned) return 1;

    if (a.managedFavorite && !b.managedFavorite) return -1;
    if (!a.managedFavorite && b.managedFavorite) return 1;

    if (settings.sortBy === "name") {
      return String(a.symbol).localeCompare(String(b.symbol));
    }

    if (settings.sortBy === "balance") {
      return Number(b.managedBalance) - Number(a.managedBalance);
    }

    return Number(b.managedValue) - Number(a.managedValue);
  });

  return tokens;
}

export function getHiddenAssetList({ chainKey = "bsc" } = {}) {
  const settings = getAssetSettings();
  const key = normalizeChainKey(chainKey);

  return getAllTokens().filter((token) => {
    const matchChain = normalizeChainKey(token.chainKey || token.chain) === key;
    return settings.hiddenTokens.includes(token.id) && matchChain;
  });
}

export default {
  getAssetSettings,
  saveAssetSettings,
  isTokenHidden,
  isTokenPinned,
  isTokenFavorite,
  toggleHiddenToken,
  togglePinnedToken,
  toggleFavoriteToken,
  setHideZeroBalances,
  setAssetSortBy,
  restoreHiddenTokens,
  getManagedAssetList,
  getHiddenAssetList,
};