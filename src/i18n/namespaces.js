export const DEFAULT_NAMESPACE = "common";

export const NAMESPACES = Object.freeze([
  "common",
  "navigation",
  "auth",
  "dashboard",
  "markets",
  "trading",
  "futures",
  "wallets",
  "web3",
  "p2p",
  "staking",
  "learnEarn",
  "social",
  "ai",
  "profile",
  "settings",
  "admin",
  "security",
  "notifications",
  "support",
  "legal",
]);

export const PAGE_NAMESPACE_MAP = Object.freeze({
  auth: "auth",

  dashboard: "dashboard",

  markets: "markets",

  trade: "trading",
  orders: "trading",
  transactions: "trading",
  buy: "trading",

  futures: "futures",

  wallets: "wallets",
  web3wallet: "web3",

  p2p: "p2p",
  "admin-p2p": "p2p",

  staking: "staking",

  learnearn: "learnEarn",
  "admin-learn": "learnEarn",

  "social-trading": "social",
  "reputation-center": "social",
  "achievement-center": "social",

  "ai-assistant": "ai",
  "ai-copy-trading": "ai",
  "ai-portfolio": "ai",
  "ai-risk-manager": "ai",
  "ai-profit-calculator": "ai",
  "ai-market-scanner": "ai",
  "ai-news": "ai",
  "ai-whale-tracker": "ai",
  "ai-arbitrage-scanner": "ai",
  "ai-grid-trading": "ai",
  "ai-smart-alerts": "ai",
  "ai-launchpad": "ai",
  "ai-whale-heatmap": "ai",
  "ai-trust-score": "ai",
  "ai-whale-alerts": "ai",
  "exalt-utility-center": "ai",

  profile: "profile",

  settings: "settings",

  admin: "admin",
  kyc: "admin",
  "admin-rewards": "admin",
  "admin-referrals": "admin",

  "notification-center": "notifications",

  support: "support",

  legal: "legal",
  privacy: "legal",
  terms: "legal",
  aml: "legal",
  "kyc-policy": "legal",
  risk: "legal",
  cookies: "legal",
  refund: "legal",
  compliance: "legal",
  "delete-account": "legal",
});

export const getNamespaceForPage = (pageName) => {
  if (!pageName || typeof pageName !== "string") {
    return DEFAULT_NAMESPACE;
  }

  return PAGE_NAMESPACE_MAP[pageName] || DEFAULT_NAMESPACE;
};

export const isValidNamespace = (namespace) =>
  NAMESPACES.includes(namespace);

export const normalizeNamespace = (namespace) =>
  isValidNamespace(namespace)
    ? namespace
    : DEFAULT_NAMESPACE;