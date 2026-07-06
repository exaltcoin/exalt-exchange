import { BSC_CHAIN } from "./web3Config";

export const CHAINS = [
  {
    ...BSC_CHAIN,
    active: true,
    evm: true,
    native: true,
    receiveEnabled: true,
    sendEnabled: true,
    swapEnabled: true,
    historyEnabled: true,
  },
  {
    key: "ethereum",
    chainId: 1,
    chainIdHex: "0x1",
    name: "Ethereum",
    symbol: "ETH",
    rpc: "https://ethereum.publicnode.com",
    explorer: "https://etherscan.io",
    active: false,
    evm: true,
    note: "Coming soon after Ethereum backend/RPC limits setup.",
  },
  {
    key: "polygon",
    chainId: 137,
    chainIdHex: "0x89",
    name: "Polygon",
    symbol: "POL",
    rpc: "https://polygon-rpc.com",
    explorer: "https://polygonscan.com",
    active: false,
    evm: true,
    note: "Coming soon.",
  },
  {
    key: "base",
    chainId: 8453,
    chainIdHex: "0x2105",
    name: "Base",
    symbol: "ETH",
    rpc: "https://mainnet.base.org",
    explorer: "https://basescan.org",
    active: false,
    evm: true,
    note: "Coming soon.",
  },
  {
    key: "bitcoin",
    chainId: null,
    chainIdHex: null,
    name: "Bitcoin",
    symbol: "BTC",
    rpc: "",
    explorer: "https://www.blockchain.com/explorer",
    active: false,
    evm: false,
    receiveEnabled: false,
    sendEnabled: false,
    note: "Native BTC requires dedicated Bitcoin wallet/backend service. Use BTCB on BSC now.",
  },
  {
    key: "tron",
    chainId: null,
    chainIdHex: null,
    name: "TRON",
    symbol: "TRX",
    rpc: "",
    explorer: "https://tronscan.org",
    active: false,
    evm: false,
    receiveEnabled: false,
    sendEnabled: false,
    note: "TRON requires TronWeb integration.",
  },
  {
    key: "solana",
    chainId: null,
    chainIdHex: null,
    name: "Solana",
    symbol: "SOL",
    rpc: "",
    explorer: "https://solscan.io",
    active: false,
    evm: false,
    receiveEnabled: false,
    sendEnabled: false,
    note: "Solana requires Solana wallet adapter integration.",
  },
];

export function getChainByKey(key = "bsc") {
  return CHAINS.find((chain) => chain.key === key) || CHAINS[0];
}

export function getActiveChains() {
  return CHAINS.filter((chain) => chain.active);
}

export function getComingSoonChains() {
  return CHAINS.filter((chain) => !chain.active);
}

export function isEvmChain(key = "bsc") {
  return Boolean(getChainByKey(key)?.evm);
}

export function getExplorerTx(chainKey = "bsc", hash = "") {
  const chain = getChainByKey(chainKey);
  if (!hash) return chain.explorer;
  return `${chain.explorer}/tx/${hash}`;
}

export function getExplorerAddress(chainKey = "bsc", address = "") {
  const chain = getChainByKey(chainKey);
  if (!address) return chain.explorer;
  return `${chain.explorer}/address/${address}`;
}