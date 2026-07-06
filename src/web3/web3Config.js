export const APP_NAME = "Exalt Wallet";

export const WALLET_VERSION = "EXALT_WALLET_V1";

export const BSC_CHAIN = {
  key: "bsc",
  chainId: 56,
  chainIdHex: "0x38",
  name: "BNB Smart Chain",
  symbol: "BNB",
  rpc: "https://bsc-dataseed.binance.org/",
  explorer: "https://bscscan.com",
};

export const STORAGE_KEYS = {
  WALLETS: "exalt_web3_wallets",
  ACTIVE_WALLET: "exalt_active_wallet",
  TX_HISTORY: "exalt_tx_history",
  CUSTOM_TOKENS: "exalt_custom_tokens",
  SETTINGS: "exalt_web3_settings",
  SECURITY: "exalt_wallet_security",
  BACKUP_STATUS: "exalt_wallet_backup_status",
};

export const DEFAULT_NETWORK = BSC_CHAIN;

export const PANCAKE_ROUTER =
  "0x10ED43C718714eb63d5aA57B78B54704E256024E";

export const WBNB_ADDRESS =
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

export const USDT_ADDRESS =
  "0x55d398326f99059fF775485246999027B3197955";

export const EXALT_ADDRESS =
  "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

export const BTCB_ADDRESS =
  "0x7130d2A12B9BCbF4fF2634d864A1Ee1Ce3Ead9c";

export const ETH_BEP20_ADDRESS =
  "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";

export const DEFAULT_TOKENS = [
  {
    symbol: "BNB",
    name: "BNB",
    chain: "bsc",
    network: "BEP20",
    decimals: 18,
    native: true,
    address: WBNB_ADDRESS,
    fallbackPrice: 650,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chain: "bsc",
    network: "BEP20",
    decimals: 18,
    native: false,
    address: USDT_ADDRESS,
    fallbackPrice: 1,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
  },
  {
    symbol: "EXALT",
    name: "Exalt Coin",
    chain: "bsc",
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
    network: "BEP20",
    decimals: 18,
    native: false,
    address: ETH_BEP20_ADDRESS,
    fallbackPrice: 2400,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  },
];

export const WALLET_TYPES = ["Exalt Wallet", "Imported Exalt Wallet"];

export const EXPLORER = {
  tx: (hash) => `${BSC_CHAIN.explorer}/tx/${hash}`,
  address: (address) => `${BSC_CHAIN.explorer}/address/${address}`,
  token: (address) => `${BSC_CHAIN.explorer}/token/${address}`,
};

export const SUPPORT_LINK = "/support";
export const EXCHANGE_LINK = "/trade";

export const FEATURES = {
  exaltWalletOnly: true,
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
  BSC_CHAIN,
  STORAGE_KEYS,
  DEFAULT_NETWORK,
  PANCAKE_ROUTER,
  WBNB_ADDRESS,
  USDT_ADDRESS,
  EXALT_ADDRESS,
  BTCB_ADDRESS,
  ETH_BEP20_ADDRESS,
  DEFAULT_TOKENS,
  WALLET_TYPES,
  EXPLORER,
  SUPPORT_LINK,
  EXCHANGE_LINK,
  FEATURES,
  TOKEN_ABI,
  ROUTER_ABI,
};