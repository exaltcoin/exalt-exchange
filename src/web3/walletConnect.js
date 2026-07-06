import EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";
import { BSC_CHAIN } from "./web3Config";
import {
  addWallet,
  createWalletRecord,
  getSavedWallets,
  saveWallets,
  walletExists,
} from "./walletStore";

let wcProvider = null;

export async function switchToBSC() {
  if (!window.ethereum) {
    throw new Error("Wallet browser not found.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_CHAIN.chainIdHex }],
    });
  } catch (error) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BSC_CHAIN.chainIdHex,
            chainName: BSC_CHAIN.name,
            nativeCurrency: {
              name: BSC_CHAIN.symbol,
              symbol: BSC_CHAIN.symbol,
              decimals: 18,
            },
            rpcUrls: [BSC_CHAIN.rpc],
            blockExplorerUrls: [BSC_CHAIN.explorer],
          },
        ],
      });
      return;
    }

    throw error;
  }
}

export async function connectInjectedWallet() {
  if (!window.ethereum) {
    throw new Error("Please open in MetaMask, Trust Wallet, Binance Wallet, or OKX Wallet browser.");
  }

  await switchToBSC();

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);

  if (!accounts?.length) {
    throw new Error("No wallet account found.");
  }

  const address = accounts[0];
  const wallets = getSavedWallets();

  const record = createWalletRecord({
    name: walletExists(wallets, address)
      ? "External Wallet"
      : `External Wallet ${wallets.length + 1}`,
    address,
    type: "External",
    chainKey: "bsc",
    keyless: true,
  });

  const nextWallets = walletExists(wallets, address)
    ? wallets
    : addWallet(wallets, record);

  saveWallets(nextWallets, address);

  return {
    address,
    wallets: nextWallets,
    provider,
    source: "injected",
  };
}

export async function connectWalletConnect(projectId) {
  if (!projectId) {
    throw new Error(
      "WalletConnect Project ID missing. Add VITE_WALLETCONNECT_PROJECT_ID in frontend .env"
    );
  }

  wcProvider = await EthereumProvider.init({
    projectId,
    chains: [BSC_CHAIN.chainId],
    optionalChains: [BSC_CHAIN.chainId],
    showQrModal: true,
    metadata: {
      name: "Exalt Exchange",
      description: "Exalt Exchange Web3 Wallet",
      url: "https://exaltexchange.io",
      icons: ["https://exaltexchange.io/icon.png"],
    },
  });

  await wcProvider.connect();

  const accounts = wcProvider.accounts || [];
  if (!accounts.length) {
    throw new Error("WalletConnect account not found.");
  }

  const address = accounts[0];
  const wallets = getSavedWallets();

  const record = createWalletRecord({
    name: `WalletConnect ${wallets.length + 1}`,
    address,
    type: "WalletConnect",
    chainKey: "bsc",
    keyless: true,
  });

  const nextWallets = walletExists(wallets, address)
    ? wallets
    : addWallet(wallets, record);

  saveWallets(nextWallets, address);

  const provider = new ethers.BrowserProvider(wcProvider);

  return {
    address,
    wallets: nextWallets,
    provider,
    source: "walletconnect",
  };
}

export async function disconnectWalletConnect() {
  if (wcProvider) {
    await wcProvider.disconnect();
    wcProvider = null;
  }

  return true;
}

export function getWalletConnectProvider() {
  return wcProvider;
}

export async function getInjectedSigner() {
  if (!window.ethereum) {
    throw new Error("Wallet browser not found.");
  }

  await switchToBSC();

  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
}

export async function getWalletConnectSigner() {
  if (!wcProvider) {
    throw new Error("WalletConnect provider not connected.");
  }

  const provider = new ethers.BrowserProvider(wcProvider);
  return provider.getSigner();
}