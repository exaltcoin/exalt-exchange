export function isExternalWalletDisabled() {
  return true;
}

export async function switchToBSC() {
  throw new Error("External wallets are disabled. Please use Exalt Wallet.");
}

export async function connectInjectedWallet() {
  throw new Error(
    "MetaMask / external wallet connection is disabled. Please create or import Exalt Wallet."
  );
}

export async function connectWalletConnect() {
  throw new Error(
    "WalletConnect is disabled. Please create or import Exalt Wallet."
  );
}

export async function disconnectWalletConnect() {
  return true;
}

export function getWalletConnectProvider() {
  return null;
}

export async function getInjectedSigner() {
  throw new Error("External wallet signer is disabled. Please use Exalt Wallet.");
}

export async function getWalletConnectSigner() {
  throw new Error("WalletConnect signer is disabled. Please use Exalt Wallet.");
}