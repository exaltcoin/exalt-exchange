import { DEFAULT_TOKENS } from "./web3Config";

export const TOKENS = DEFAULT_TOKENS.map((token) => ({
  ...token,
  visible: true,
  favorite: ["BNB", "USDT", "EXALT"].includes(token.symbol),
}));

export function getTokenBySymbol(symbol = "BNB") {
  const target = String(symbol || "").toUpperCase();
  return TOKENS.find((token) => token.symbol === target) || TOKENS[0];
}

export function getTokenByAddress(address = "") {
  const target = String(address || "").toLowerCase();
  return (
    TOKENS.find((token) => String(token.address || "").toLowerCase() === target) ||
    null
  );
}

export function getTokensByChain(chainKey = "bsc") {
  return TOKENS.filter((token) => token.chain === chainKey || token.chainKey === chainKey);
}

export function getReceiveAddressForToken(tokenSymbol, activeWalletAddress) {
  const token = getTokenBySymbol(tokenSymbol);

  if (!activeWalletAddress) return "";

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
    return "This ETH is BEP20 token on BNB Smart Chain. Do not send native Ethereum unless supported.";
  }

  return `Only send ${token.symbol} on ${token.chain?.toUpperCase?.() || "BSC"} / BEP20 network.`;
}

export function formatTokenAmount(value, decimals = 4) {
  const num = Number(value || 0);

  if (num === 0) return "0.0000";
  if (num > 0 && num < 0.0001) return num.toFixed(8);

  return num.toLocaleString(undefined, {
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
      token.symbol.toLowerCase().includes(q) ||
      token.name.toLowerCase().includes(q) ||
      String(token.address || "").toLowerCase().includes(q)
    );
  });
}