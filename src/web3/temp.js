import { ethers } from "ethers";
import { STORAGE_KEYS } from "./web3Config";

export function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function getSavedWallets() {
  return safeJsonParse(localStorage.getItem(STORAGE_KEYS.WALLETS), []);
}

export function getActiveWalletAddress() {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_WALLET) || "";
}

export function saveWallets(wallets, activeAddress = "") {
  const cleanWallets = Array.isArray(wallets) ? wallets : [];

  localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(cleanWallets));

  if (activeAddress) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WALLET, activeAddress);
  }

  return cleanWallets;
}

export function setActiveWallet(address) {
  if (!address) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_WALLET);
    return "";
  }

  localStorage.setItem(STORAGE_KEYS.ACTIVE_WALLET, address);
  return address;
}

export function shortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet";
}

export function normalizeAddress(address) {
  return String(address || "").trim().toLowerCase();
}

export function walletExists(wallets, address) {
  const target = normalizeAddress(address);
  return wallets.some((wallet) => normalizeAddress(wallet.address) === target);
}

export function createWalletRecord({
  name,
  address,
  type = "External",
  privateKey = "",
  mnemonic = "",
  chainKey = "bsc",
  keyless = true,
}) {
  return {
    id: Date.now() + Math.floor(Math.random() * 9999),
    name: name || "My Wallet",
    address,
    type,
    privateKey,
    mnemonic,
    chainKey,
    keyless,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function addWallet(wallets, walletRecord, maxWallets = 50) {
  if (!walletRecord?.address) {
    throw new Error("Wallet address is required.");
  }

  if (walletExists(wallets, walletRecord.address)) {
    return wallets;
  }

  return [...wallets, walletRecord].slice(0, maxWallets);
}

export function renameWallet(wallets, address, newName) {
  const target = normalizeAddress(address);

  return wallets.map((wallet) =>
    normalizeAddress(wallet.address) === target
      ? {
          ...wallet,
          name: newName,
          updatedAt: new Date().toISOString(),
        }
      : wallet
  );
}

export function removeWallet(wallets, address) {
  const target = normalizeAddress(address);
  return wallets.filter((wallet) => normalizeAddress(wallet.address) !== target);
}

export function findWallet(wallets, address) {
  const target = normalizeAddress(address);
  return wallets.find((wallet) => normalizeAddress(wallet.address) === target) || null;
}

export function createLocalWallet(wallets = []) {
  const created = ethers.Wallet.createRandom();

  const record = createWalletRecord({
    name: `My Wallet ${wallets.length + 1}`,
    address: created.address,
    type: "Keyless",
    privateKey: created.privateKey,
    mnemonic: created.mnemonic?.phrase || "",
    chainKey: "bsc",
    keyless: false,
  });

  return {
    wallet: record,
    phrase: created.mnemonic?.phrase || "",
  };
}

export function importWalletFromValue(value, wallets = []) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    throw new Error("Enter recovery phrase or private key.");
  }

  const imported =
    cleanValue.split(" ").length >= 12
      ? ethers.Wallet.fromPhrase(cleanValue)
      : new ethers.Wallet(cleanValue);

  if (walletExists(wallets, imported.address)) {
    throw new Error("Wallet already exists.");
  }

  const record = createWalletRecord({
    name: `Imported Wallet ${wallets.length + 1}`,
    address: imported.address,
    type: "Imported",
    privateKey: imported.privateKey,
    mnemonic: cleanValue.split(" ").length >= 12 ? cleanValue : "",
    chainKey: "bsc",
    keyless: false,
  });

  return record;
}

export function clearWeb3WalletData() {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_WALLET);
  localStorage.removeItem(STORAGE_KEYS.WALLETS);
  localStorage.removeItem(STORAGE_KEYS.TX_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_TOKENS);
}