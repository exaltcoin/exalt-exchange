import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";

import exchangeLogo from "../assets/exalt-exchange-logo.png";
import { useI18n } from "../i18n/index.js";
import "./Dashboard.css";

const DEFAULT_API_BASE =
  "https://exalt-real-backend-6b6v.onrender.com";

const EXALT_ADDRESS =
  "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

const EXALT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

const normalizeApiBase = (value) => {
  const normalizedBase = String(value || DEFAULT_API_BASE)
    .trim()
    .replace(/\/+$/, "");

  return normalizedBase.endsWith("/api")
    ? normalizedBase.slice(0, -4)
    : normalizedBase;
};

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    console.error("Invalid stored user data:", error);
    return {};
  }
};

function Dashboard({ setPage }) {
  const { t } = useI18n();

  const API = normalizeApiBase(
    import.meta.env.VITE_API_URL
  );

  const [coins, setCoins] = useState([]);
  const [exaltPrice, setExaltPrice] =
    useState(0.02456);
  const [exaltHoldings, setExaltHoldings] =
    useState(0);
  const [marketCap, setMarketCap] = useState(0);
  const [liquidity, setLiquidity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [
    showExchangeWelcome,
    setShowExchangeWelcome,
  ] = useState(true);

  const [rewardStats, setRewardStats] = useState({
    approvedAmount: 0,
    pendingAmount: 0,
    pendingClaims: 0,
    todayClaims: 0,
    activeMiners: 0,
    miningRemaining: 0,
  });

  const portfolioValue =
    Number(exaltHoldings || 0) *
    Number(exaltPrice || 0);

  const translateWithFallback = (
    key,
    fallback,
    namespace = "dashboard"
  ) => {
    try {
      const translatedValue = t(key, {
        ns: namespace,
        defaultValue: fallback,
      });

      if (
        translatedValue === undefined ||
        translatedValue === null ||
        translatedValue === key ||
        String(translatedValue).trim() === ""
      ) {
        return fallback;
      }

      return translatedValue;
    } catch (error) {
      console.error(
        `Dashboard translation failed for "${key}":`,
        error
      );

      return fallback;
    }
  };

  const formatUsd = (value, digits = 2) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });

  const loadLiveMarkets = useCallback(async () => {
    try {
      const response = await fetch(
        `${API}/api/market/live`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Market request failed"
        );
      }

      const pairs = data?.data?.pairs;

      const normalizedPairs = Array.isArray(pairs)
        ? pairs
        : [];

      setCoins(normalizedPairs.slice(0, 6));

      const exaltPair = normalizedPairs.find(
        (coin) =>
          coin?.baseToken?.symbol?.toUpperCase() ===
          "EXALT"
      );

      if (exaltPair?.priceUsd) {
        setExaltPrice(
          Number(exaltPair.priceUsd) || 0
        );
      }
    } catch (error) {
      console.error(
        "Dashboard market API error:",
        error
      );
    }
  }, [API]);

  const loadDexData = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${EXALT_ADDRESS}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "DexScreener request failed"
        );
      }

      const pair = Array.isArray(data?.pairs)
        ? data.pairs[0]
        : null;

      if (!pair) {
        return;
      }

      setExaltPrice(Number(pair.priceUsd || 0));

      setMarketCap(
        Number(pair.marketCap || pair.fdv || 0)
      );

      setLiquidity(
        Number(pair.liquidity?.usd || 0)
      );
    } catch (error) {
      console.error(
        "Dashboard DexScreener error:",
        error
      );
    }
  }, []);

  const loadRewardStats = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/rewards/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (response.status === 401) {
        return;
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Reward dashboard request failed"
        );
      }

      setRewardStats({
        approvedAmount:
          Number(
            data?.data?.myStats?.approvedAmount
          ) || 0,

        pendingAmount:
          Number(
            data?.data?.myStats?.pendingAmount
          ) || 0,

        pendingClaims:
          Number(
            data?.data?.myStats?.pendingClaims
          ) || 0,

        todayClaims:
          Number(
            data?.data?.platformStats?.todayClaims
          ) || 0,

        activeMiners:
          Number(
            data?.data?.platformStats?.activeMiners
          ) || 0,

        miningRemaining:
          Number(
            data?.data?.pools?.mining?.remaining
          ) || 0,
      });
    } catch (error) {
      console.error(
        "Dashboard reward API error:",
        error
      );
    }
  }, [API]);

  const loadExaltWalletBalance =
    useCallback(async () => {
      try {
        if (!window.ethereum) {
          setExaltHoldings(0);
          return;
        }

        const provider =
          new ethers.BrowserProvider(
            window.ethereum
          );

        const network = await provider.getNetwork();

        if (Number(network.chainId) !== 56) {
          setExaltHoldings(0);
          return;
        }

        const accounts = await provider.send(
          "eth_accounts",
          []
        );

        if (!accounts?.length) {
          setExaltHoldings(0);
          return;
        }

        const contract = new ethers.Contract(
          EXALT_ADDRESS,
          EXALT_ABI,
          provider
        );

        const rawBalance =
          await contract.balanceOf(accounts[0]);

        const formattedBalance =
          ethers.formatUnits(rawBalance, 18);

        const numericBalance =
          Number(formattedBalance || 0);

        setExaltHoldings(
          Number.isFinite(numericBalance)
            ? Number(numericBalance.toFixed(2))
            : 0
        );
      } catch (error) {
        console.error(
          "Dashboard EXALT balance fallback:",
          error?.message || error
        );

        setExaltHoldings(0);
      }
    }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      await Promise.allSettled([
        loadLiveMarkets(),
        loadDexData(),
        loadRewardStats(),
        loadExaltWalletBalance(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    loadDexData,
    loadExaltWalletBalance,
    loadLiveMarkets,
    loadRewardStats,
  ]);

  useEffect(() => {
    loadDashboard();

    const refreshInterval = window.setInterval(
      loadDashboard,
      30000
    );

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [loadDashboard]);

  useEffect(() => {
    const welcomeTimer = window.setTimeout(() => {
      setShowExchangeWelcome(false);
    }, 2200);

    return () => {
      window.clearTimeout(welcomeTimer);
    };
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm(
      translateWithFallback(
        "logoutConfirmation",
        "Are you sure you want to logout?",
        "auth"
      )
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("wallet");
    localStorage.removeItem("walletAddress");

    window.location.href = "/";
  };

  const mobileActions = [
    ["👤", "profile", "Profile"],
    ["📊", "markets", "Markets"],
    ["📈", "trade", "Spot Trading"],
    ["⚡", "futures", "Futures"],
    ["💳", "buy", "Buy Crypto"],
    ["🔁", "p2p", "P2P"],
    ["🔒", "staking", "Staking"],
    ["🎓", "learnearn", "Learn & Earn"],
    [
      "🤖",
      "ai-assistant",
      "AI Trading Assistant",
    ],
    [
      "🔁",
      "ai-copy-trading",
      "AI Copy Trading",
    ],
    [
      "📂",
      "ai-portfolio",
      "AI Portfolio Manager",
    ],
    [
      "👥",
      "social-trading",
      "Social Trading",
    ],
    [
      "🛡️",
      "ai-risk-manager",
      "AI Risk Manager",
    ],
    [
      "💰",
      "ai-profit-calculator",
      "AI Profit Calculator",
    ],
    [
      "🔎",
      "ai-market-scanner",
      "AI Market Scanner",
    ],
    ["📰", "ai-news", "AI News"],
    [
      "🐋",
      "ai-whale-tracker",
      "AI Whale Tracker",
    ],
    [
      "⚡",
      "ai-arbitrage-scanner",
      "AI Arbitrage Scanner",
    ],
    [
      "🧮",
      "ai-grid-trading",
      "AI Grid Trading",
    ],
    [
      "🚨",
      "ai-smart-alerts",
      "AI Smart Alerts",
    ],
    ["🚀", "ai-launchpad", "AI Launchpad"],
    [
      "🔥",
      "ai-whale-heatmap",
      "AI Whale Heatmap",
    ],
    [
      "✅",
      "ai-trust-score",
      "AI Trust Score",
    ],
    [
      "🐳",
      "ai-whale-alerts",
      "AI Whale Alerts",
    ],
    [
      "🧰",
      "exalt-utility-center",
      "Exalt Utility Center",
    ],
    [
      "⭐",
      "reputation-center",
      "Community Reputation",
    ],
    [
      "🏆",
      "achievement-center",
      "Achievement Center",
    ],
    [
      "🔔",
      "notification-center",
      "Notification Center",
    ],
    ["💼", "wallets", "Wallets"],
    ["🌐", "web3wallet", "Web3 Wallet"],
    ["📦", "orders", "Orders"],
    ["📝", "kyc-submit", "Submit KYC"],
    ["📌", "listings", "Submit Listing"],
    ["🤝", "referral", "Referral"],
    [
      "📜",
      "transactions",
      "Transaction History",
    ],
    ["🎁", "rewards", "Rewards"],
    ["🎧", "support", "Support"],
    ["⚙️", "settings", "Settings"],
  ];

  const bottomNavigation = [
    ["🏠", "dashboard", "Home"],
    ["📊", "markets", "Markets"],
    ["📈", "trade", "Trade"],
    ["⚡", "futures", "Futures"],
    ["💼", "wallets", "Assets"],
  ];

  const storedUser = readStoredUser();

  return (
    <>
      <section
        className="mobile-home-view"
        aria-label={translateWithFallback(
          "dashboardTitle",
          "Dashboard"
        )}
      >
        {showExchangeWelcome && (
          <div
            className="exchange-welcome-overlay"
            role="status"
            aria-live="polite"
          >
            <img
              src={exchangeLogo}
              alt="Exalt Exchange"
              className="exchange-welcome-logo"
            />

            <h3>
              {translateWithFallback(
                "welcomeTo",
                "Welcome To"
              )}
            </h3>

            <h1>Exalt Exchange</h1>

            <p>
              {translateWithFallback(
                "exchangeTradingTagline",
                "Secure • Fast • Global Trading"
              )}
            </p>
          </div>
        )}

        <header className="mobile-premium-header">
          <div className="mobile-brand-row">
            <div className="mobile-brand">
              <img
                src={exchangeLogo}
                alt="Exalt Exchange"
                className="mobile-brand-logo"
              />

              <div className="mobile-brand-copy">
                <h2>Exalt Exchange</h2>

                <p>
                  {translateWithFallback(
                    "exchangeTagline",
                    "Secure • Fast • Global"
                  )}
                </p>
              </div>
            </div>

            <div className="mobile-header-actions">
              <button
                type="button"
                className="mobile-profile-btn"
                aria-label={translateWithFallback(
                  "profile",
                  "Profile",
                  "navigation"
                )}
                title={
                  storedUser?.name ||
                  translateWithFallback(
                    "profile",
                    "Profile",
                    "navigation"
                  )
                }
                onClick={() => setPage("profile")}
              >
                👤
              </button>

              <button
                type="button"
                className="mobile-logout-btn"
                aria-label={translateWithFallback(
                  "logout",
                  "Logout",
                  "auth"
                )}
                onClick={handleLogout}
              >
                ⏻
              </button>
            </div>
          </div>

          <div className="mobile-tabs">
            <button
              type="button"
              className="mobile-tab active"
              aria-current="page"
            >
              {translateWithFallback(
                "exchange",
                "Exchange",
                "common"
              )}
            </button>

            <button
              type="button"
              className="mobile-tab"
              onClick={() => setPage("web3wallet")}
            >
              Web3
            </button>
          </div>
        </header>

        <div className="mobile-balance-card">
          <p>
            {translateWithFallback(
              "portfolioValue",
              "Portfolio Value"
            )}{" "}
            (USDT)
          </p>

          <h1>${formatUsd(portfolioValue, 2)}</h1>

          <button
            type="button"
            onClick={() => setPage("buy")}
          >
            {translateWithFallback(
              "buy",
              "Buy Crypto",
              "navigation"
            )}
          </button>
        </div>

        <div className="mobile-action-grid">
          {mobileActions.map(
            ([icon, pageName, fallbackLabel]) => (
              <button
                type="button"
                key={pageName}
                onClick={() => setPage(pageName)}
              >
                <span
                  className="mobile-action-icon"
                  aria-hidden="true"
                >
                  {icon}
                </span>

                <span className="mobile-action-label">
                  {translateWithFallback(
                    pageName,
                    fallbackLabel,
                    "navigation"
                  )}
                </span>
              </button>
            )
          )}
        </div>

        <div className="mobile-feature-row">
          <button
            type="button"
            onClick={() => setPage("p2p")}
            className="mobile-feature-card"
          >
            <span className="icon" aria-hidden="true">
              🔁
            </span>

            <h3>P2P</h3>

            <p>
              {translateWithFallback(
                "buySellCrypto",
                "Buy and Sell Crypto",
                "p2p"
              )}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPage("wallets")}
            className="mobile-feature-card"
          >
            <span className="icon" aria-hidden="true">
              💳
            </span>

            <h3>
              {translateWithFallback(
                "deposit",
                "Deposit",
                "wallets"
              )}
            </h3>

            <p>
              {translateWithFallback(
                "bankTransferCrypto",
                "Bank Transfer / Crypto",
                "wallets"
              )}
            </p>
          </button>
        </div>

        <section className="mobile-trending-section">
          <h3>
            {translateWithFallback(
              "trendingCoins",
              "Trending Coins"
            )}
          </h3>

          {coins.length > 0 ? (
            coins.slice(0, 5).map((coin, index) => (
              <div
                className="mobile-coin-row"
                key={
                  coin?.pairAddress ||
                  `${coin?.baseToken?.symbol || "coin"}-${index}`
                }
              >
                <div>
                  <strong>
                    {coin?.baseToken?.symbol || "COIN"}
                  </strong>

                  <p>
                    $
                    {Number(
                      coin?.priceUsd || 0
                    ).toFixed(6)}
                  </p>
                </div>

                <span
                  className={
                    Number(
                      coin?.priceChange?.h24 || 0
                    ) >= 0
                      ? "green-text"
                      : "red-text"
                  }
                >
                  {Number(
                    coin?.priceChange?.h24 || 0
                  ).toFixed(2)}
                  %
                </span>
              </div>
            ))
          ) : (
            <p className="dashboard-empty-state">
              {loading
                ? translateWithFallback(
                    "loadingMarkets",
                    "Loading markets...",
                    "markets"
                  )
                : translateWithFallback(
                    "noMarketData",
                    "No market data found.",
                    "markets"
                  )}
            </p>
          )}
        </section>
      </section>

      <nav
        className="mobile-bottom-nav"
        aria-label="Mobile navigation"
      >
        {bottomNavigation.map(
          ([icon, pageName, fallbackLabel]) => (
            <button
              type="button"
              key={pageName}
              onClick={() => setPage(pageName)}
            >
              <span aria-hidden="true">{icon}</span>

              <span>
                {translateWithFallback(
                  pageName,
                  fallbackLabel,
                  "navigation"
                )}
              </span>
            </button>
          )
        )}
      </nav>

      <section className="desktop-dashboard-view">
        <div className="dashboard-page">
          <div className="hero-banner">
            <div className="hero-content">
              <img
                src={exchangeLogo}
                alt="Exalt Exchange"
                className="exchange-logo"
              />

              <div>
                <h1>Exalt Exchange</h1>

                <p>
                  {translateWithFallback(
                    "dashboardSubtitle",
                    "Professional Digital Asset Exchange"
                  )}
                </p>

                <span className="live-status">
                  {loading
                    ? translateWithFallback(
                        "loadingMarkets",
                        "Loading market...",
                        "markets"
                      )
                    : translateWithFallback(
                        "liveMarketActive",
                        "Live Market Active"
                      )}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="action-btn yellow-btn hero-refresh-btn"
              onClick={loadDashboard}
              disabled={loading}
            >
              {loading
                ? translateWithFallback(
                    "loading",
                    "Loading...",
                    "common"
                  )
                : translateWithFallback(
                    "refreshDashboard",
                    "Refresh Dashboard"
                  )}
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card glow-yellow">
              <h3>
                {translateWithFallback(
                  "portfolioValue",
                  "Portfolio Value"
                )}
              </h3>

              <h1>${formatUsd(portfolioValue, 2)}</h1>

              <span className="green-text">
                {translateWithFallback(
                  "exaltPrice",
                  "EXALT Price"
                )}
                : $
                {Number(exaltPrice || 0).toFixed(8)}
              </span>
            </div>

            <div className="stat-card glow-blue">
              <h3>
                {translateWithFallback(
                  "exaltHoldings",
                  "EXALT Holdings"
                )}
              </h3>

              <h1>
                {Number(
                  exaltHoldings || 0
                ).toLocaleString()}{" "}
                EXALT
              </h1>

              <span>
                {translateWithFallback(
                  "liveWalletBalance",
                  "Live Wallet Balance"
                )}
              </span>
            </div>

            <div className="stat-card glow-green">
              <h3>
                {translateWithFallback(
                  "marketCap",
                  "Market Cap"
                )}
              </h3>

              <h1>${formatUsd(marketCap, 0)}</h1>

              <span>
                {translateWithFallback(
                  "liveMarket",
                  "Live Market"
                )}
              </span>
            </div>

            <div className="stat-card glow-red">
              <h3>
                {translateWithFallback(
                  "liquidity",
                  "Liquidity",
                  "markets"
                )}
              </h3>

              <h1>${formatUsd(liquidity, 0)}</h1>

              <span>PancakeSwap LP</span>
            </div>

            <div className="stat-card glow-yellow reward-stat-card">
              <h3>
                {translateWithFallback(
                  "approvedRewards",
                  "Approved Rewards"
                )}
              </h3>

              <h1>
                {Number(
                  rewardStats.approvedAmount || 0
                ).toLocaleString()}{" "}
                EXALT
              </h1>

              <span>
                {translateWithFallback(
                  "realCreditedRewards",
                  "Credited Rewards"
                )}
              </span>
            </div>

            <div className="stat-card glow-blue reward-stat-card">
              <h3>
                {translateWithFallback(
                  "pendingRewards",
                  "Pending Rewards"
                )}
              </h3>

              <h1>
                {Number(
                  rewardStats.pendingAmount || 0
                ).toLocaleString()}{" "}
                EXALT
              </h1>

              <span>
                {rewardStats.pendingClaims}{" "}
                {translateWithFallback(
                  "claimsUnderReview",
                  "Claims Under Review"
                )}
              </span>
            </div>

            <div className="stat-card glow-green reward-stat-card">
              <h3>
                {translateWithFallback(
                  "activeMiners",
                  "Active Miners"
                )}
              </h3>

              <h1>{rewardStats.activeMiners}</h1>

              <span>
                {translateWithFallback(
                  "todayClaims",
                  "Today's Claims"
                )}
                : {rewardStats.todayClaims}
              </span>
            </div>

            <div className="stat-card glow-red reward-stat-card">
              <h3>
                {translateWithFallback(
                  "miningPool",
                  "Mining Pool"
                )}
              </h3>

              <h1>
                {Number(
                  rewardStats.miningRemaining || 0
                ).toLocaleString()}
              </h1>

              <span>
                {translateWithFallback(
                  "exaltRemaining",
                  "EXALT Remaining"
                )}
              </span>
            </div>
          </div>

          <div className="dashboard-row">
            <section className="big-panel">
              <div className="panel-header">
                <h2>
                  {translateWithFallback(
                    "trendingCoins",
                    "Trending Coins"
                  )}
                </h2>
              </div>

              {coins.length > 0 ? (
                coins.map((coin, index) => (
                  <div
                    className="coin-row"
                    key={
                      coin?.pairAddress ||
                      `${coin?.baseToken?.symbol || "coin"}-${index}`
                    }
                  >
                    <span>
                      {coin?.baseToken?.symbol ||
                        "COIN"}
                    </span>

                    <span>
                      $
                      {Number(
                        coin?.priceUsd || 0
                      ).toFixed(6)}
                    </span>

                    <span
                      className={
                        Number(
                          coin?.priceChange?.h24 || 0
                        ) >= 0
                          ? "green-text"
                          : "red-text"
                      }
                    >
                      {Number(
                        coin?.priceChange?.h24 || 0
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                ))
              ) : (
                <p className="dashboard-empty-state">
                  {loading
                    ? translateWithFallback(
                        "loadingMarkets",
                        "Loading markets...",
                        "markets"
                      )
                    : translateWithFallback(
                        "noMarketData",
                        "No market data found.",
                        "markets"
                      )}
                </p>
              )}
            </section>

            <section className="big-panel">
              <div className="panel-header">
                <h2>
                  {translateWithFallback(
                    "quickActions",
                    "Quick Actions"
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  window.open(
                    `https://pancakeswap.finance/swap?outputCurrency=${EXALT_ADDRESS}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                className="action-btn yellow-btn"
              >
                {translateWithFallback(
                  "buyExalt",
                  "Buy EXALT"
                )}
              </button>

              <button
                type="button"
                onClick={() => setPage("trade")}
                className="action-btn green-btn"
              >
                {translateWithFallback(
                  "spotTrading",
                  "Spot Trading",
                  "trading"
                )}
              </button>

              <button
                type="button"
                onClick={() => setPage("listings")}
                className="action-btn blue-btn"
              >
                {translateWithFallback(
                  "submitListing",
                  "Submit Listing"
                )}
              </button>

              <button
                type="button"
                onClick={() => setPage("markets")}
                className="action-btn red-btn"
              >
                {translateWithFallback(
                  "viewMarketBoard",
                  "View Market Board"
                )}
              </button>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

export default Dashboard;