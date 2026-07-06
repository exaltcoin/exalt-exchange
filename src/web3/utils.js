import { ethers } from "ethers";

export function shortAddress(address = "") {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidAddress(address = "") {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

export function copyToClipboard(text) {
  if (!text) return false;

  navigator.clipboard.writeText(text);
  return true;
}

export function formatBalance(value = 0, decimals = 4) {
  const number = Number(value || 0);

  if (number === 0) return "0.0000";

  if (number < 0.000001) {
    return number.toFixed(10);
  }

  if (number < 0.01) {
    return number.toFixed(8);
  }

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
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

export function randomId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  );
}

export function truncateText(text = "", length = 20) {
  if (!text) return "";

  if (text.length <= length) {
    return text;
  }

  return `${text.substring(0, length)}...`;
}

export function openExplorerTx(hash) {
  if (!hash) return;
  window.open(explorerTx(hash), "_blank");
}

export function openExplorerAddress(address) {
  if (!address) return;
  window.open(explorerAddress(address), "_blank");
}

export function calculatePortfolio(tokens = [], balances = {}, prices = {}) {
  let total = 0;

  tokens.forEach((token) => {
    const symbol = token.symbol;
    const balance = Number(balances[symbol] || 0);
    const price = Number(prices[symbol] || token.fallbackPrice || 0);

    total += balance * price;
  });

  return total;
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
  if (!keyword) return tokens;

  const q = keyword.toLowerCase();

  return tokens.filter((token) => {
    return (
      token.symbol.toLowerCase().includes(q) ||
      token.name.toLowerCase().includes(q)
    );
  });
}