import { ethers } from "ethers";

export function shortAddress(address = "", start = 6, end = 4) {
  if (!address) return "";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function isValidAddress(address = "") {
  try {
    return ethers.isAddress(String(address || "").trim());
  } catch {
    return false;
  }
}

export function isValidPrivateKey(value = "") {
  return /^0x[a-fA-F0-9]{64}$/.test(String(value || "").trim());
}

export function isValidRecoveryPhrase(value = "") {
  const words = String(value || "").trim().split(/\s+/);
  return words.length === 12 || words.length === 24;
}

export async function copyToClipboard(text) {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(String(text));
    return true;
  } catch {
    return false;
  }
}

export function formatBalance(value = 0, decimals = 4) {
  const number = Number(value || 0);

  if (number === 0) return "0.0000";
  if (number < 0.000001) return number.toFixed(10);
  if (number < 0.01) return number.toFixed(8);

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatUsd(value = 0) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function explorerTx(hash = "") {
  if (!hash) return "";
  return `https://bscscan.com/tx/${hash}`;
}

export function explorerAddress(address = "") {
  if (!address) return "";
  return `https://bscscan.com/address/${address}`;
}

export function explorerToken(address = "") {
  if (!address) return "";
  return `https://bscscan.com/token/${address}`;
}

export function sleep(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomId(prefix = "exalt") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}

export function truncateText(text = "", length = 20) {
  const value = String(text || "");
  if (value.length <= length) return value;
  return `${value.substring(0, length)}...`;
}

export function openExplorerTx(hash) {
  if (!hash) return;
  window.open(explorerTx(hash), "_blank", "noopener,noreferrer");
}

export function openExplorerAddress(address) {
  if (!address) return;
  window.open(explorerAddress(address), "_blank", "noopener,noreferrer");
}

export function calculatePortfolio(tokens = [], balances = {}, prices = {}) {
  return tokens.reduce((total, token) => {
    const symbol = token.symbol;
    const balance = Number(balances[symbol] || 0);
    const price = Number(prices[symbol] || token.fallbackPrice || 0);
    return total + balance * price;
  }, 0);
}

export function sortTokensByValue(tokens = [], balances = {}, prices = {}) {
  return [...tokens].sort((a, b) => {
    const valueA =
      Number(balances[a.symbol] || 0) *
      Number(prices[a.symbol] || a.fallbackPrice || 0);

    const valueB =
      Number(balances[b.symbol] || 0) *
      Number(prices[b.symbol] || b.fallbackPrice || 0);

    return valueB - valueA;
  });
}

export function searchTokens(tokens = [], keyword = "") {
  const q = String(keyword || "").toLowerCase();
  if (!q) return tokens;

  return tokens.filter((token) => {
    return (
      String(token.symbol || "").toLowerCase().includes(q) ||
      String(token.name || "").toLowerCase().includes(q) ||
      String(token.address || "").toLowerCase().includes(q)
    );
  });
}