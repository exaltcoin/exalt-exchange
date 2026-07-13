export const PROTECTED_TERMS = Object.freeze([
  "EXALT",
  "Exalt Exchange",
  "Exalt Coin",
  "Web3",
  "MetaMask",
  "Trust Wallet",
  "WalletConnect",
  "Google Authenticator",

  "BNB",
  "BTC",
  "ETH",
  "USDT",
  "USDC",

  "P2P",
  "KYC",
  "AML",
  "API",
  "UID",
  "OTP",
  "QR",

  "TP",
  "SL",
  "ROI",
  "APR",
  "APY",

  "DEX",
  "CEX",
  "DAO",
  "NFT",

  "TradingView",
  "PancakeSwap",
  "BscScan",
  "Binance",

  "Gas Fee",
  "Liquidity",
  "Market Cap",
  "Order Book",
  "Spot Trading",
  "Futures",
  "Margin",
  "Leverage",
  "Escrow",

  "AI",
  "Smart Alert",
  "Whale Alert",

  "TX Hash",
  "Blockchain",
  "Seed Phrase",
  "Private Key",
  "Public Key",
]);

export const SHOULD_NOT_TRANSLATE = new Set(PROTECTED_TERMS);

export const isProtectedTerm = (value) => {
  if (!value) return false;

  return SHOULD_NOT_TRANSLATE.has(String(value).trim());
};

export const protectTerm = (value) => {
  if (!value) return value;

  return isProtectedTerm(value) ? value : value;
};

export default {
  PROTECTED_TERMS,
  SHOULD_NOT_TRANSLATE,
  isProtectedTerm,
  protectTerm,
};