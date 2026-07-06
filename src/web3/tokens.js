import { DEFAULT_TOKENS } from "./web3Config";

export const TOKENS = DEFAULT_TOKENS.map((token) => ({
  ...token,
  visible: true,
  favorite: ["BNB", "USDT", "EXALT"].includes(token.symbol),
  network: token.network || "BEP20",
  chain: token.chain || "bsc",
}));

export function normalizeSymbol(symbol = "BNB") {
  return String(symbol || "BNB").trim().toUpperCase();
}

export function getTokenBySymbol(symbol = "BNB") {
  const target = normalizeSymbol(symbol);
  return TOKENS.find((token) => token.symbol === target) || TOKENS[0];
}

export function getTokenByAddress(address = "") {
  const target = String(address || "").toLowerCase();

  if (!target) return null;

  return (
    TOKENS.find((token) => String(token.address || "").toLowerCase() === target) ||
    null
  );
}

export function getTokensByChain(chainKey = "bsc") {
  return TOKENS.filter(
    (token) => token.chain === chainKey || token.chainKey === chainKey
  );
}

export function getReceiveAddressForToken(tokenSymbol, activeWalletAddress) {
  if (!activeWalletAddress) return "";

  const token = getTokenBySymbol(tokenSymbol);

  if (token.chain === "bsc" || token.chainKey === "bsc") {
    return activeWalletAddress;
  }

  return "";
}

export function getTokenWarning(symbol = "") {
  const token = getTokenBySymbol(symbol);

  if (token.symbol === "BTCB") {
    return "BTCB is Bitcoin token on BNB Smart Chain. Do not send native BTC to this address.";
  }

  if (token.symbol === "ETH") {
    return "This ETH is BEP20 token on BNB Smart Chain. Do not send native ETH unless native ETH network is supported.";
  }

  if (token.symbol === "USDT") {
    return "Only send USDT BEP20 on BNB Smart Chain to this address.";
  }

  if (token.symbol === "EXALT") {
    return "Only send EXALT BEP20 to this Exalt Wallet address.";
  }

  return `Only send ${token.symbol} on ${token.network || "BEP20"} / BNB Smart Chain.`;
}

export function getTokenNetworkLabel(symbol = "") {
  const token = getTokenBySymbol(symbol);
  return token.network || token.chain?.toUpperCase?.() || "BEP20";
}

export function getTokenLogo(token, localExaltLogo = "") {
  const symbol = normalizeSymbol(token?.symbol);

  if (symbol === "EXALT" && localExaltLogo) return localExaltLogo;

  return (
    token?.logo ||
    token?.image ||
    token?.icon ||
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

export function searchTokens(tokens = TOKENS, query = "") {
  const q = String(query || "").toLowerCase();

  if (!q) return tokens;

  return tokens.filter((token) => {
    return (
      String(token.symbol || "").toLowerCase().includes(q) ||
      String(token.name || "").toLowerCase().includes(q) ||
      String(token.address || "").toLowerCase().includes(q)
    );
  });
}

export function sortTokensByFavorites(tokens = TOKENS) {
  return [...tokens].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return a.symbol.localeCompare(b.symbol);
  });
}