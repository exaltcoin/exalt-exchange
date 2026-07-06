import { ethers } from "ethers";
import { STORAGE_KEYS } from "./web3Config";

const WALLET_VERSION = "EXALT_WALLET_V1";

export function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeAddress(address = "") {
  return String(address || "").trim().toLowerCase();
}

export function shortAddress(address = "") {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Create Wallet";
}

export function isValidPrivateKey(value = "") {
  try {
    return /^0x[a-fA-F0-9]{64}$/.test(String(value).trim());
  } catch {
    return false;
  }
}

export function isValidPhrase(value = "") {
  try {
    const words = String(value || "").trim().split(/\s+/);
    return words.length === 12 || words.length === 24;
  } catch {
    return false;
  }
}

export function getSavedWallets() {
  const wallets = safeJsonParse(localStorage.getItem(STORAGE_KEYS.WALLETS), []);
  return Array.isArray(wallets) ? wallets : [];
}

export function getActiveWalletAddress() {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_WALLET) || "";
}

export function setActiveWallet(address) {
  if (!address) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_WALLET);
    return "";
  }

  localStorage.setItem(STORAGE_KEYS.ACTIVE_WALLET, address);
  return address;
}

export function saveWallets(wallets = [], activeAddress = "") {
  const cleanWallets = Array.isArray(wallets) ? wallets : [];
  localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(cleanWallets));

  if (activeAddress) {
    setActiveWallet(activeAddress);
  }

  return cleanWallets;
}

export function walletExists(wallets = [], address = "") {
  const target = normalizeAddress(address);
  return wallets.some((wallet) => normalizeAddress(wallet.address) === target);
}

export function findWallet(wallets = [], address = "") {
  const target = normalizeAddress(address);
  return wallets.find((wallet) => normalizeAddress(wallet.address) === target) || null;
}

export function createWalletRecord({
  name = "",
  address = "",
  type = "Exalt Wallet",
  privateKey = "",
  mnemonic = "",
  chainKey = "bsc",
  backedUp = false,
}) {
  if (!address) throw new Error("Wallet address is required.");

  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 999999)}`,
    version: WALLET_VERSION,
    name: name || "Exalt Wallet",
    address,
    type,
    privateKey,
    mnemonic,
    chainKey,
    backedUp,
    source: "EXALT_INTERNAL",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function addWallet(wallets = [], walletRecord, maxWallets = 50) {
  if (!walletRecord?.address) {
    throw new Error("Wallet address is required.");
  }

  if (walletExists(wallets, walletRecord.address)) {
    return wallets;
  }

  return [...wallets, walletRecord].slice(0, maxWallets);
}

export function renameWallet(wallets = [], address = "", newName = "") {
  const target = normalizeAddress(address);
  const cleanName = String(newName || "").trim();

  if (!cleanName) throw new Error("Wallet name is required.");

  return wallets.map((wallet) =>
    normalizeAddress(wallet.address) === target
      ? { ...wallet, name: cleanName, updatedAt: new Date().toISOString() }
      : wallet
  );
}

export function removeWallet(wallets = [], address = "") {
  const target = normalizeAddress(address);
  return wallets.filter((wallet) => normalizeAddress(wallet.address) !== target);
}

export function markWalletBackedUp(wallets = [], address = "") {
  const target = normalizeAddress(address);

  return wallets.map((wallet) =>
    normalizeAddress(wallet.address) === target
      ? { ...wallet, backedUp: true, updatedAt: new Date().toISOString() }
      : wallet
  );
}

export function createLocalWallet(wallets = []) {
  const created = ethers.Wallet.createRandom();
  const phrase = created.mnemonic?.phrase || "";

  const record = createWalletRecord({
    name: `Exalt Wallet ${wallets.length + 1}`,
    address: created.address,
    type: "Exalt Wallet",
    privateKey: created.privateKey,
    mnemonic: phrase,
    chainKey: "bsc",
    backedUp: false,
  });

  return {
    wallet: record,
    phrase,
  };
}

export function importWalletFromValue(value, wallets = []) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    throw new Error("Enter 12-word recovery phrase or private key.");
  }

  let imported;

  if (isValidPhrase(cleanValue)) {
    imported = ethers.Wallet.fromPhrase(cleanValue);
  } else if (isValidPrivateKey(cleanValue)) {
    imported = new ethers.Wallet(cleanValue);
  } else {
    throw new Error("Invalid recovery phrase or private key.");
  }

  if (walletExists(wallets, imported.address)) {
    throw new Error("Wallet already exists.");
  }

  return createWalletRecord({
    name: `Imported Exalt Wallet ${wallets.length + 1}`,
    address: imported.address,
    type: "Imported Exalt Wallet",
    privateKey: imported.privateKey,
    mnemonic: isValidPhrase(cleanValue) ? cleanValue : "",
    chainKey: "bsc",
    backedUp: true,
  });
}

export function exportWalletBackup(wallets = [], address = "") {
  const wallet = findWallet(wallets, address);
  if (!wallet) throw new Error("Wallet not found.");

  return {
    name: wallet.name,
    address: wallet.address,
    type: wallet.type,
    mnemonic: wallet.mnemonic || "",
    privateKey: wallet.privateKey || "",
    createdAt: wallet.createdAt,
  };
}

export function clearWeb3WalletData() {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_WALLET);
  localStorage.removeItem(STORAGE_KEYS.WALLETS);
  localStorage.removeItem(STORAGE_KEYS.TX_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_TOKENS);
}