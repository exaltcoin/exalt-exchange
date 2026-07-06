export const APP_NAME = "Exalt Wallet";
export const WALLET_VERSION = "EXALT_WALLET_MULTI_CHAIN_V2";

export const EVM_CHAINS = {
  bsc: {
    key: "bsc",
    chainId: 56,
    chainIdHex: "0x38",
    name: "BNB Smart Chain",
    shortName: "BSC",
    symbol: "BNB",
    nativeName: "BNB",
    network: "BEP20",
    rpc: "https://bsc-rpc.publicnode.com",
    explorer: "https://bscscan.com",
    router: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    wrappedNative: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
  },

  ethereum: {
    key: "ethereum",
    chainId: 1,
    chainIdHex: "0x1",
    name: "Ethereum",
    shortName: "ETH",
    symbol: "ETH",
    nativeName: "Ethereum",
    network: "ERC20",
    rpc: "https://ethereum-rpc.publicnode.com",
    explorer: "https://etherscan.io",
    router: "",
    wrappedNative: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  },

  polygon: {
    key: "polygon",
    chainId: 137,
    chainIdHex: "0x89",
    name: "Polygon",
    shortName: "POL",
    symbol: "POL",
    nativeName: "Polygon",
    network: "Polygon",
    rpc: "https://polygon-bor-rpc.publicnode.com",
    explorer: "https://polygonscan.com",
    router: "",
    wrappedNative: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
  },

  arbitrum: {
    key: "arbitrum",
    chainId: 42161,
    chainIdHex: "0xa4b1",
    name: "Arbitrum One",
    shortName: "ARB",
    symbol: "ETH",
    nativeName: "Ethereum",
    network: "Arbitrum",
    rpc: "https://arbitrum-one-rpc.publicnode.com",
    explorer: "https://arbiscan.io",
    router: "",
    wrappedNative: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png",
  },

  optimism: {
    key: "optimism",
    chainId: 10,
    chainIdHex: "0xa",
    name: "Optimism",
    shortName: "OP",
    symbol: "ETH",
    nativeName: "Ethereum",
    network: "Optimism",
    rpc: "https://optimism-rpc.publicnode.com",
    explorer: "https://optimistic.etherscan.io",
    router: "",
    wrappedNative: "0x4200000000000000000000000000000000000006",
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png",
  },

  base: {
    key: "base",
    chainId: 8453,
    chainIdHex: "0x2105",
    name: "Base",
    shortName: "BASE",
    symbol: "ETH",
    nativeName: "Ethereum",
    network: "Base",
    rpc: "https://base-rpc.publicnode.com",
    explorer: "https://basescan.org",
    router: "",
    wrappedNative: "0x4200000000000000000000000000000000000006",
    logo: "https://avatars.githubusercontent.com/u/108554348?s=200&v=4",
  },

  avalanche: {
    key: "avalanche",
    chainId: 43114,
    chainIdHex: "0xa86a",
    name: "Avalanche C-Chain",
    shortName: "AVAX",
    symbol: "AVAX",
    nativeName: "Avalanche",
    network: "Avalanche",
    rpc: "https://avalanche-c-chain-rpc.publicnode.com",
    explorer: "https://snowtrace.io",
    router: "",
    wrappedNative: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
  },

  fantom: {
    key: "fantom",
    chainId: 250,
    chainIdHex: "0xfa",
    name: "Fantom",
    shortName: "FTM",
    symbol: "FTM",
    nativeName: "Fantom",
    network: "Fantom",
    rpc: "https://fantom-rpc.publicnode.com",
    explorer: "https://ftmscan.com",
    router: "",
    wrappedNative: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3513.png",
  },

  cronos: {
    key: "cronos",
    chainId: 25,
    chainIdHex: "0x19",
    name: "Cronos",
    shortName: "CRO",
    symbol: "CRO",
    nativeName: "Cronos",
    network: "Cronos",
    rpc: "https://cronos-evm-rpc.publicnode.com",
    explorer: "https://cronoscan.com",
    router: "",
    wrappedNative: "0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23",
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3635.png",
  },
};

export const DEFAULT_CHAIN_KEY = "bsc";
export const BSC_CHAIN = EVM_CHAINS.bsc;
export const DEFAULT_NETWORK = BSC_CHAIN;

export const STORAGE_KEYS = {
  WALLETS: "exalt_web3_wallets",
  ACTIVE_WALLET: "exalt_active_wallet",
  ACTIVE_CHAIN: "exalt_active_chain",
  TX_HISTORY: "exalt_tx_history",
  CUSTOM_TOKENS: "exalt_custom_tokens",
  SETTINGS: "exalt_web3_settings",
  SECURITY: "exalt_wallet_security",
  BACKUP_STATUS: "exalt_wallet_backup_status",
};

export const PANCAKE_ROUTER = EVM_CHAINS.bsc.router;

export const WBNB_ADDRESS = EVM_CHAINS.bsc.wrappedNative;
export const WETH_ADDRESS = EVM_CHAINS.ethereum.wrappedNative;

export const USDT_BSC_ADDRESS =
  "0x55d398326f99059fF775485246999027B3197955";

export const USDT_ETH_ADDRESS =
  "0xdAC17F958D2ee523a2206206994597C13D831ec7";

export const EXALT_ADDRESS =
  "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

export const BTCB_ADDRESS =
  "0x7130d2A12B9BCbF4fF2634d864A1Ee1Ce3Ead9c";

export const ETH_BEP20_ADDRESS =
  "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";

export function getChain(chainKey = DEFAULT_CHAIN_KEY) {
  return EVM_CHAINS[chainKey] || EVM_CHAINS[DEFAULT_CHAIN_KEY];
}

export function getChainList() {
  return Object.values(EVM_CHAINS);
}

export const DEFAULT_TOKENS = [
  {
    symbol: "BNB",
    name: "BNB",
    chain: "bsc",
    chainKey: "bsc",
    network: "BEP20",
    decimals: 18,
    native: true,
    address: WBNB_ADDRESS,
    fallbackPrice: 650,
    logo: EVM_CHAINS.bsc.logo,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chain: "bsc",
    chainKey: "bsc",
    network: "BEP20",
    decimals: 18,
    native: false,
    address: USDT_BSC_ADDRESS,
    fallbackPrice: 1,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
  },
  {
    symbol: "EXALT",
    name: "Exalt Coin",
    chain: "bsc",
    chainKey: "bsc",
    network: "BEP20",
    decimals: 18,
    native: false,
    address: EXALT_ADDRESS,
    fallbackPrice: 0,
    logoType: "local-exalt",
    logo: "/exalt.png",
  },
  {
    symbol: "BTCB",
    name: "Bitcoin BEP20",
    chain: "bsc",
    chainKey: "bsc",
    network: "BEP20",
    decimals: 18,
    native: false,
    address: BTCB_ADDRESS,
    fallbackPrice: 103000,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
  },
  {
    symbol: "ETH",
    name: "Ethereum BEP20",
    chain: "bsc",
    chainKey: "bsc",
    network: "BEP20",
    decimals: 18,
    native: false,
    address: ETH_BEP20_ADDRESS,
    fallbackPrice: 2400,
    logo: EVM_CHAINS.ethereum.logo,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    chain: "ethereum",
    chainKey: "ethereum",
    network: "ERC20",
    decimals: 18,
    native: true,
    address: WETH_ADDRESS,
    fallbackPrice: 2400,
    logo: EVM_CHAINS.ethereum.logo,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chain: "ethereum",
    chainKey: "ethereum",
    network: "ERC20",
    decimals: 6,
    native: false,
    address: USDT_ETH_ADDRESS,
    fallbackPrice: 1,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
  },
  {
    symbol: "POL",
    name: "Polygon",
    chain: "polygon",
    chainKey: "polygon",
    network: "Polygon",
    decimals: 18,
    native: true,
    address: EVM_CHAINS.polygon.wrappedNative,
    fallbackPrice: 0.4,
    logo: EVM_CHAINS.polygon.logo,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    chain: "base",
    chainKey: "base",
    network: "Base",
    decimals: 18,
    native: true,
    address: EVM_CHAINS.base.wrappedNative,
    fallbackPrice: 2400,
    logo: EVM_CHAINS.base.logo,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    chain: "arbitrum",
    chainKey: "arbitrum",
    network: "Arbitrum",
    decimals: 18,
    native: true,
    address: EVM_CHAINS.arbitrum.wrappedNative,
    fallbackPrice: 2400,
    logo: EVM_CHAINS.arbitrum.logo,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    chain: "optimism",
    chainKey: "optimism",
    network: "Optimism",
    decimals: 18,
    native: true,
    address: EVM_CHAINS.optimism.wrappedNative,
    fallbackPrice: 2400,
    logo: EVM_CHAINS.optimism.logo,
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    chain: "avalanche",
    chainKey: "avalanche",
    network: "Avalanche",
    decimals: 18,
    native: true,
    address: EVM_CHAINS.avalanche.wrappedNative,
    fallbackPrice: 25,
    logo: EVM_CHAINS.avalanche.logo,
  },
  {
    symbol: "FTM",
    name: "Fantom",
    chain: "fantom",
    chainKey: "fantom",
    network: "Fantom",
    decimals: 18,
    native: true,
    address: EVM_CHAINS.fantom.wrappedNative,
    fallbackPrice: 0.4,
    logo: EVM_CHAINS.fantom.logo,
  },
  {
    symbol: "CRO",
    name: "Cronos",
    chain: "cronos",
    chainKey: "cronos",
    network: "Cronos",
    decimals: 18,
    native: true,
    address: EVM_CHAINS.cronos.wrappedNative,
    fallbackPrice: 0.1,
    logo: EVM_CHAINS.cronos.logo,
  },
];

export const WALLET_TYPES = ["Exalt Wallet", "Imported Exalt Wallet"];

export const EXPLORER = {
  tx: (hash, chainKey = DEFAULT_CHAIN_KEY) =>
    `${getChain(chainKey).explorer}/tx/${hash}`,
  address: (address, chainKey = DEFAULT_CHAIN_KEY) =>
    `${getChain(chainKey).explorer}/address/${address}`,
  token: (address, chainKey = DEFAULT_CHAIN_KEY) =>
    `${getChain(chainKey).explorer}/token/${address}`,
};

export const SUPPORT_LINK = "/support";
export const EXCHANGE_LINK = "/trade";

export const FEATURES = {
  exaltWalletOnly: true,
  evmMultiChain: true,
  customTokenImport: true,
  multiWallet: true,
  walletConnect: false,
  externalWallet: false,
  qrScanner: true,
  receive: true,
  send: true,
  swap: true,
  history: true,
  browser: false,
  backupPhrase: true,
};

export const TOKEN_ABI = [
  "function name() external view returns(string)",
  "function approve(address spender,uint256 amount) external returns(bool)",
  "function allowance(address owner,address spender) external view returns(uint256)",
  "function balanceOf(address owner) external view returns(uint256)",
  "function decimals() external view returns(uint8)",
  "function symbol() external view returns(string)",
  "function transfer(address to,uint256 amount) external returns(bool)",
];

export const ROUTER_ABI = [
  "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) external payable",
  "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external",
];

export default {
  APP_NAME,
  WALLET_VERSION,
  EVM_CHAINS,
  BSC_CHAIN,
  STORAGE_KEYS,
  DEFAULT_NETWORK,
  DEFAULT_CHAIN_KEY,
  PANCAKE_ROUTER,
  WBNB_ADDRESS,
  WETH_ADDRESS,
  USDT_BSC_ADDRESS,
  USDT_ETH_ADDRESS,
  EXALT_ADDRESS,
  BTCB_ADDRESS,
  ETH_BEP20_ADDRESS,
  DEFAULT_TOKENS,
  WALLET_TYPES,
  getChain,
  getChainList,
  EXPLORER,
  SUPPORT_LINK,
  EXCHANGE_LINK,
  FEATURES,
  TOKEN_ABI,
  ROUTER_ABI,
};