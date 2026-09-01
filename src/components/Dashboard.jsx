import { useCallback, useEffect, useState } from "react";

import exchangeLogo from "../assets/exalt-exchange-logo.png";
import { useI18n } from "../i18n/index.js";
import { getLatestBlogPosts } from "../pages/blog/blogData.js";
import LanguageSwitcher from "./LanguageSwitcher";
import "./Dashboard.css";
import { API_ORIGIN } from "../lib/apiClient";

const TRUSTED_MESSAGE_STATUSES = new Set([
  400, 401, 403, 404, 409, 422, 423, 429, 503,
]);
const INFRA_NOT_FOUND_PATTERN = /^Route not found\s*-/i;

const describeRequestError = (error, fallback, context = "Request") => {
  console.error(`[${context}]`, error);
  const status = error && typeof error === "object" ? error.status : undefined;
  const message =
    error && typeof error === "object" && typeof error.message === "string"
      ? error.message
      : null;

  return typeof status === "number" &&
    TRUSTED_MESSAGE_STATUSES.has(status) &&
    message &&
    !INFRA_NOT_FOUND_PATTERN.test(message)
    ? message
    : fallback;
};

const EXALT_ADDRESS =
  "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

const LATEST_BLOG_POSTS = getLatestBlogPosts(3);

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

  const API = API_ORIGIN;

  const [coins, setCoins] = useState([]);
  // Phase 4/17 fix: this used to default to a hardcoded 0.02456 - a
  // fabricated EXALT price that passes the `> 0` "do we have a real
  // price" guard below (coinPriceMap) even before any live fetch
  // succeeds, and stays in place forever if both price sources
  // (internal /api/coins market data and the external DexScreener
  // call) fail, as DexScreener does in this sandbox (no route to
  // external hosts) and can in production too (rate limits, an
  // outage). A holder's real EXALT balance would then be valued
  // using that fake price with nothing to show it wasn't live. null
  // correctly falls through the existing `> 0` guard as "no price
  // yet" until a real fetch sets a genuine value.
  const [exaltPrice, setExaltPrice] =
    useState(null);
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

  // Batch K: real, account-level dashboard data (directive section 7 -
  // "total/available balance ... recent transactions, open orders,
  // security status, referral/rewards summary"). All sourced from the
  // same authenticated endpoints the dedicated Wallets/Orders/
  // Transactions/Referral pages already use - nothing here is invented.
  const [walletBalances, setWalletBalances] = useState({
    USDT: 0,
    BNB: 0,
    EXALT: 0,
  });
  const [walletLocked, setWalletLocked] = useState({
    USDT: 0,
    BNB: 0,
    EXALT: 0,
  });
  const [bnbPrice, setBnbPrice] = useState(0);
  const [openOrders, setOpenOrders] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [referralSummary, setReferralSummary] =
    useState(null);

  const portfolioValue =
    Number(exaltHoldings || 0) *
    Number(exaltPrice || 0);

  // Only value a held coin if we actually have a real, live price for
  // it (USDT is definitionally $1). A coin with no matched price is
  // left out of the total rather than assumed to be worth $0 or
  // fabricated - consistent with the project's "Unavailable, not fake
  // values" rule.
  const coinPriceMap = {
    USDT: 1,
    BNB: Number(bnbPrice || 0) > 0 ? Number(bnbPrice) : null,
    EXALT: Number(exaltPrice || 0) > 0 ? Number(exaltPrice) : null,
  };

  const valueBalances = (balancesMap) =>
    Object.entries(balancesMap || {}).reduce(
      (sum, [coin, amount]) => {
        const price = coinPriceMap[coin];

        if (!Number.isFinite(price) || price === null) {
          return sum;
        }

        return sum + Number(amount || 0) * price;
      },
      0
    );

  const totalBalanceValue = valueBalances(walletBalances);
  const lockedBalanceValue = valueBalances(walletLocked);
  const availableBalanceValue = Math.max(
    0,
    totalBalanceValue - lockedBalanceValue
  );

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

      // Batch K: BNB is one of the 3 coins the exchange actually
      // custodies (SUPPORTED_COINS in walletController.js), so its
      // live price is needed to value real BNB wallet balances - the
      // full (unsliced) pairs list is searched since BNB may not be
      // in the top-6 "trending" slice above.
      const bnbPair = normalizedPairs.find(
        (coin) =>
          coin?.baseToken?.symbol?.toUpperCase() === "BNB"
      );

      if (bnbPair?.priceUsd) {
        setBnbPrice(Number(bnbPair.priceUsd) || 0);
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

  /*
    Batch F - non-negotiable Web3 architecture fix (see
    _audit/EXALT-BATCH-F-REPORT.md). This previously read the
    user's EXALT holdings from whatever wallet happened to be
    injected into the browser via window.ethereum/ethers.
    BrowserProvider - reading a private balance from a third-party
    injected wallet on every dashboard load has no place in a
    centralized-exchange architecture. EXALT holdings now come from
    the user's real internal custodial wallet (the same
    GET /api/wallets/me endpoint the Wallets page itself uses),
    which is also the number that is actually accurate for what the
    user can trade/withdraw on this exchange.
  */
  const loadExaltWalletBalance =
    useCallback(async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setExaltHoldings(0);
        return;
      }

      try {
        const response = await fetch(
          `${API}/api/wallets/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        const rawBalance = Number(
          data?.wallet?.balances?.EXALT || 0
        );

        setExaltHoldings(
          Number.isFinite(rawBalance)
            ? Number(rawBalance.toFixed(2))
            : 0
        );

        // Batch K: capture the full multi-coin balance/locked maps
        // (not just EXALT) so the dashboard can show a real total
        // account balance across every coin the exchange custodies.
        if (data?.wallet?.balances) {
          setWalletBalances({
            USDT: Number(data.wallet.balances.USDT || 0),
            BNB: Number(data.wallet.balances.BNB || 0),
            EXALT: Number(data.wallet.balances.EXALT || 0),
          });
        }

        if (data?.wallet?.locked) {
          setWalletLocked({
            USDT: Number(data.wallet.locked.USDT || 0),
            BNB: Number(data.wallet.locked.BNB || 0),
            EXALT: Number(data.wallet.locked.EXALT || 0),
          });
        }
      } catch (error) {
        // RC2 fix (directive - never let a raw error object reach a
        // user-facing surface, where it would stringify to the
        // literal text "[object Object]"): describeRequestError logs
        // the real error for debugging and returns a safe string.
        // Nothing here currently displays that string to the user
        // (this widget just falls back to a zero balance), but this
        // keeps the derivation safe defense-in-depth, consistent with
        // every other request-error site in this file.
        describeRequestError(
          error,
          "Unable to load your EXALT balance right now.",
          "Dashboard EXALT balance"
        );

        setExaltHoldings(0);
      }
    }, [API]);

  // Batch K: user's own open Spot orders - GET /api/orders/my is the
  // same authenticated, ownership-scoped endpoint the Orders page can
  // use; scoped here to open/partial only and capped small since this
  // is a dashboard summary, not the full Orders page.
  const loadOpenOrders = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setOpenOrders([]);
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/orders/my?status=open,partial&limit=5`,
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

      if (!response.ok || !data?.success) {
        setOpenOrders([]);
        return;
      }

      setOpenOrders(
        Array.isArray(data?.orders) ? data.orders : []
      );
    } catch (error) {
      // RC2 fix - see loadExaltWalletBalance above for the full
      // rationale: route the caught error through the shared
      // describeRequestError helper instead of falling back to the
      // raw `error` object (which stringifies as "[object Object]").
      describeRequestError(
        error,
        "Unable to load your open orders right now.",
        "Dashboard open orders"
      );

      setOpenOrders([]);
    }
  }, [API]);

  // Batch K: user's own recent transactions (deposits/withdrawals/
  // trades/etc.) - same GET /api/transactions endpoint the dedicated
  // Transactions page uses, capped to the 5 most recent for a summary.
  const loadRecentTransactions = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setRecentTx([]);
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/transactions?limit=5`,
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

      if (!response.ok || !data?.success) {
        setRecentTx([]);
        return;
      }

      setRecentTx(
        Array.isArray(data?.transactions)
          ? data.transactions
          : []
      );
    } catch (error) {
      // RC2 fix - see loadExaltWalletBalance above for the full
      // rationale.
      describeRequestError(
        error,
        "Unable to load your recent transactions right now.",
        "Dashboard transactions"
      );

      setRecentTx([]);
    }
  }, [API]);

  // Batch K: referral summary - same GET /api/referrals/me endpoint
  // the dedicated Referral page uses.
  const loadReferralSummary = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setReferralSummary(null);
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/referrals/me`,
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

      if (!response.ok || !data?.success) {
        setReferralSummary(null);
        return;
      }

      setReferralSummary(data?.referral || null);
    } catch (error) {
      // RC2 fix - see loadExaltWalletBalance above for the full
      // rationale.
      describeRequestError(
        error,
        "Unable to load your referral summary right now.",
        "Dashboard referral summary"
      );

      setReferralSummary(null);
    }
  }, [API]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      await Promise.allSettled([
        loadLiveMarkets(),
        loadDexData(),
        loadRewardStats(),
        loadExaltWalletBalance(),
        loadOpenOrders(),
        loadRecentTransactions(),
        loadReferralSummary(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    loadDexData,
    loadExaltWalletBalance,
    loadLiveMarkets,
    loadRewardStats,
    loadOpenOrders,
    loadRecentTransactions,
    loadReferralSummary,
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
  const openBlogArticle = (slug) => {
    if (!slug) {
      return;
    }

    window.location.href = `/blog/${encodeURIComponent(
      slug
    )}`;
  };

  const openBlogHome = () => {
    window.location.href = "/blog";
  };
  // RC2 (directive §5/§6): the dense 35-item `mobileActions` icon
  // grid that used to be defined here was removed from the render
  // below - see the comment at its former call site for the full
  // rationale. Every item it listed remains reachable via the
  // hamburger sidebar (app.jsx's menuGroups) and/or `bottomNavigation`
  // just below.

  // Release blocker fix (see MASTER-AUDIT.md "Web3 missing from
  // mobile navigation"): the desktop sidebar's "Wallet & Web3" group
  // includes a web3wallet item, but this mobile bottom nav - the only
  // primary navigation surface on small screens - never did. Added
  // web3wallet as a 6th item; see Dashboard.css's
  // .mobile-bottom-nav grid-template-columns for the matching layout
  // change (5 -> 6 columns).
  // Phase 5 shell rebuild: aligned to the directive's required primary
  // priority (Markets, Trade, Assets, Orders, P2P, Security) for this
  // 6-slot quick-access bar. Web3 and Futures moved out of this
  // specific quick bar to make room - both remain fully reachable on
  // mobile via the hamburger sidebar (app.jsx's "web3" and "trade"
  // menu groups), so the Phase 3 "Web3 missing from mobile
  // navigation" fix is not being regressed, only moved out of this
  // one 6-icon shortcut row to match the new priority order.
  const bottomNavigation = [
    ["🏠", "dashboard", "Home"],
    ["📊", "markets", "Markets"],
    ["📈", "trade", "Trade"],
    ["💼", "wallets", "Assets"],
    ["📦", "orders", "Orders"],
    ["🌍", "p2p", "P2P"],
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
                <h2>
                  {translateWithFallback(
                    "dashboardTitle",
                    "Dashboard"
                  )}
                </h2>

                <p>
                  {translateWithFallback(
                    "exchangeTagline",
                    "Secure • Fast • Global Digital Asset Exchange"
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

          <div className="mobile-language-switcher">
         <LanguageSwitcher
  showActiveLanguage={false}
/>
          </div>
        </header>

        <div className="mobile-balance-card">
          <p>
            {translateWithFallback(
              "totalBalance",
              "Total Balance"
            )}{" "}
            (USD)
          </p>

          <h1>${formatUsd(totalBalanceValue, 2)}</h1>

          <p className="mobile-balance-available">
            {translateWithFallback(
              "availableBalance",
              "Available"
            )}
            : ${formatUsd(availableBalanceValue, 2)}
          </p>

          <p className="mobile-balance-web3-note">
            {translateWithFallback(
              "excludesWeb3Note",
              "Excludes Web3 wallet assets",
              "wallets"
            )}
            {" — "}
            <button
              type="button"
              className="mobile-balance-web3-link"
              onClick={() => setPage("web3wallet")}
            >
              {translateWithFallback(
                "viewWeb3Wallet",
                "View Web3 Wallet",
                "wallets"
              )}
            </button>
          </p>

          <div className="mobile-balance-actions">
            <button
              type="button"
              onClick={() => setPage("wallets")}
            >
              {translateWithFallback(
                "deposit",
                "Deposit",
                "wallets"
              )}
            </button>

            <button
              type="button"
              onClick={() => setPage("wallets")}
            >
              {translateWithFallback(
                "withdraw",
                "Withdraw",
                "wallets"
              )}
            </button>

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

            <button
              type="button"
              onClick={() => setPage("trade")}
            >
              {translateWithFallback(
                "trade",
                "Spot Trading",
                "navigation"
              )}
            </button>
          </div>
        </div>

        {
          /*
             RC2 fix (directive §5/§6 - "Do NOT solve mobile navigation
             by placing dozens of modules into one giant grid" /
             "Dashboard should prioritize financial/trading information
             instead of looking like an application launcher"): this
             used to render a 35-button icon grid (every AI tool,
             community feature, secondary module - `mobileActions`
             below) directly in the main scroll flow, immediately
             after the balance card and before any real portfolio/
             market content - exactly the "app launcher" pattern real
             manual mobile testing flagged. A redundant 2-card
             "feature row" (P2P, Deposit) duplicating both the balance
             card's own quick actions and the bottom nav sat right
             after it.

             Removed both. Every single item that was in that grid
             remains fully reachable on mobile through two other
             surfaces that already existed and were already correct:
             the hamburger sidebar (app.jsx's `menuGroups` - verified
             by cross-checking every `mobileActions` entry against it,
             all 35 present) and the curated 6-item `bottomNavigation`
             bar below (Home/Markets/Trade/Assets/Orders/P2P, matching
             the directive's required mobile priority order exactly).
             Nothing became unreachable; the dashboard now goes
             straight from the balance card into real financial
             content (Trending Coins), matching the required hierarchy
             (portfolio overview -> assets/market info -> recent
             activity -> quick actions via the bottom nav + sidebar).
          */
        }

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
                <section className="dashboard-blog-section mobile-dashboard-blog">
          <div className="dashboard-blog-header">
            <div>
              <span className="dashboard-blog-eyebrow">
                Exalt Insights
              </span>

              <h3>Latest from Our Blog</h3>
            </div>

            <button
              type="button"
              className="dashboard-blog-view-all"
              onClick={openBlogHome}
            >
              View All
            </button>
          </div>

          <div className="dashboard-blog-grid">
            {LATEST_BLOG_POSTS.map((post) => (
              <article
                className="dashboard-blog-card"
                key={post.slug}
              >
                {post.image && (
                  <button
                    type="button"
                    className="dashboard-blog-image-button"
                    onClick={() =>
                      openBlogArticle(post.slug)
                    }
                    aria-label={`Read ${post.title}`}
                  >
                    <img
                      src={post.image}
                      alt={post.imageAlt || post.title}
                      className="dashboard-blog-image"
                      loading="lazy"
                    />
                  </button>
                )}

                <div className="dashboard-blog-card-content">
                  <div className="dashboard-blog-meta">
                    <span>{post.category}</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h4>{post.title}</h4>

                  <p>{post.excerpt}</p>

                  <button
                    type="button"
                    className="dashboard-blog-read-more"
                    onClick={() =>
                      openBlogArticle(post.slug)
                    }
                  >
                    Read Article →
                  </button>
                </div>
              </article>
            ))}
          </div>
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
                  "totalBalance",
                  "Total Balance"
                )}
              </h3>

              <h1>${formatUsd(totalBalanceValue, 2)}</h1>

              <span className="green-text">
                {translateWithFallback(
                  "availableBalance",
                  "Available"
                )}
                : ${formatUsd(availableBalanceValue, 2)}
              </span>

              <div className="stat-card-web3-note">
                {translateWithFallback(
                  "excludesWeb3Note",
                  "Excludes Web3 wallet assets",
                  "wallets"
                )}
                {" — "}
                <button
                  type="button"
                  className="stat-card-web3-link"
                  onClick={() => setPage("web3wallet")}
                >
                  {translateWithFallback(
                    "viewWeb3Wallet",
                    "View Web3 Wallet",
                    "wallets"
                  )}
                </button>
              </div>
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
                {" · $"}
                {formatUsd(portfolioValue, 2)}
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

            <button
              type="button"
              className="stat-card glow-yellow reward-stat-card"
              onClick={() => setPage("certificates")}
            >
              <h3>My Certificates</h3>
              <h1>🏅</h1>
              <span>View and verify credentials</span>
            </button>
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

              {/*
                Batch F fix: this button previously sent users off
                to an external PancakeSwap DEX link to buy EXALT -
                EXALT bought there sits in an external wallet, not
                the user's EXALT Exchange custodial balance, which
                is confusing at best and undermines the centralized-
                exchange architecture at worst. It now opens the
                real internal Spot trading page instead, the same
                canonical buy/sell path used everywhere else in the
                app.
              */}
              <button
                type="button"
                onClick={() => setPage("wallets")}
                className="action-btn yellow-btn"
              >
                {translateWithFallback(
                  "deposit",
                  "Deposit",
                  "wallets"
                )}
              </button>

              <button
                type="button"
                onClick={() => setPage("wallets")}
                className="action-btn"
              >
                {translateWithFallback(
                  "withdraw",
                  "Withdraw",
                  "wallets"
                )}
              </button>

              <button
                type="button"
                onClick={() => setPage("buy")}
                className="action-btn"
              >
                {translateWithFallback(
                  "buy",
                  "Buy Crypto",
                  "navigation"
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

          {/*
            Batch K: real account-activity panels (directive section 7 -
            "recent transactions, open orders, security status,
            referral/rewards summary"). Every value below comes from the
            same authenticated endpoints the dedicated Orders/
            Transactions/Referral/Settings pages already use; nothing is
            invented, and each panel shows an honest empty state instead
            of a fabricated one when there is nothing to show.
          */}
          <div className="dashboard-row">
            <section className="big-panel">
              <div className="panel-header">
                <h2>
                  {translateWithFallback(
                    "openOrders",
                    "Open Orders",
                    "trading"
                  )}
                </h2>

                <button
                  type="button"
                  className="panel-header-link"
                  onClick={() => setPage("orders")}
                >
                  {translateWithFallback(
                    "viewAll",
                    "View All",
                    "common"
                  )}
                </button>
              </div>

              {openOrders.length > 0 ? (
                openOrders.map((order) => (
                  <div
                    className="coin-row"
                    key={order?._id || order?.id}
                  >
                    <span>
                      {order?.pair || "—"}
                      {" · "}
                      <span
                        className={
                          order?.side === "sell"
                            ? "red-text"
                            : "green-text"
                        }
                      >
                        {String(
                          order?.side || ""
                        ).toUpperCase()}
                      </span>
                    </span>

                    <span>
                      {Number(
                        order?.remaining ??
                          order?.amount ??
                          0
                      )}{" "}
                      @ $
                      {Number(
                        order?.price || 0
                      )}
                    </span>

                    <span>
                      {String(
                        order?.status || ""
                      ).toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="dashboard-empty-state">
                  {translateWithFallback(
                    "noOpenOrders",
                    "No open orders.",
                    "trading"
                  )}
                </p>
              )}
            </section>

            <section className="big-panel">
              <div className="panel-header">
                <h2>
                  {translateWithFallback(
                    "recentTransactions",
                    "Recent Transactions"
                  )}
                </h2>

                <button
                  type="button"
                  className="panel-header-link"
                  onClick={() => setPage("transactions")}
                >
                  {translateWithFallback(
                    "viewAll",
                    "View All",
                    "common"
                  )}
                </button>
              </div>

              {recentTx.length > 0 ? (
                recentTx.map((tx) => (
                  <div
                    className="coin-row"
                    key={tx?._id || tx?.id}
                  >
                    <span>
                      {String(
                        tx?.type || ""
                      ).toUpperCase()}{" "}
                      {tx?.coin || ""}
                    </span>

                    <span>
                      {Number(tx?.amount || 0)}
                    </span>

                    <span
                      className={
                        [
                          "completed",
                          "confirmed",
                          "success",
                          "filled",
                        ].includes(
                          String(
                            tx?.status || ""
                          ).toLowerCase()
                        )
                          ? "green-text"
                          : [
                                "failed",
                                "cancelled",
                                "rejected",
                              ].includes(
                                String(
                                  tx?.status || ""
                                ).toLowerCase()
                              )
                            ? "red-text"
                            : ""
                      }
                    >
                      {String(
                        tx?.status || ""
                      ).toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="dashboard-empty-state">
                  {translateWithFallback(
                    "noTransactionsYet",
                    "No transactions yet.",
                    "web3"
                  )}
                </p>
              )}
            </section>
          </div>

          <div className="dashboard-row">
            <section className="big-panel">
              <div className="panel-header">
                <h2>
                  {translateWithFallback(
                    "securityStatus",
                    "Security Status",
                    "profile"
                  )}
                </h2>

                <button
                  type="button"
                  className="panel-header-link"
                  onClick={() => setPage("settings")}
                >
                  {translateWithFallback(
                    "manage",
                    "Manage",
                    "common"
                  )}
                </button>
              </div>

              <div className="coin-row">
                <span>
                  {translateWithFallback(
                    "emailVerification",
                    "Email Verification",
                    "profile"
                  )}
                </span>

                <span
                  className={
                    storedUser?.isEmailVerified
                      ? "green-text"
                      : "red-text"
                  }
                >
                  {storedUser?.isEmailVerified
                    ? translateWithFallback(
                        "verified",
                        "Verified",
                        "profile"
                      )
                    : translateWithFallback(
                        "notVerified",
                        "Not Verified",
                        "profile"
                      )}
                </span>
              </div>

              <div className="coin-row">
                <span>
                  {translateWithFallback(
                    "twoFactorAuth",
                    "Two-Factor Authentication",
                    "profile"
                  )}
                </span>

                <span
                  className={
                    storedUser?.twoFactorEnabled
                      ? "green-text"
                      : "red-text"
                  }
                >
                  {storedUser?.twoFactorEnabled
                    ? translateWithFallback(
                        "enabled",
                        "Enabled",
                        "profile"
                      )
                    : translateWithFallback(
                        "disabled",
                        "Disabled",
                        "profile"
                      )}
                </span>
              </div>
            </section>

            <section className="big-panel">
              <div className="panel-header">
                <h2>
                  {translateWithFallback(
                    "referralRewardsSummary",
                    "Referral & Rewards"
                  )}
                </h2>

                <button
                  type="button"
                  className="panel-header-link"
                  onClick={() => setPage("referral")}
                >
                  {translateWithFallback(
                    "viewAll",
                    "View All",
                    "common"
                  )}
                </button>
              </div>

              {referralSummary ? (
                <>
                  <div className="coin-row">
                    <span>
                      {translateWithFallback(
                        "referralCount",
                        "Referrals",
                        "dashboard"
                      )}
                    </span>

                    <span>
                      {Number(
                        referralSummary.referralCount ||
                          0
                      )}
                    </span>
                  </div>

                  <div className="coin-row">
                    <span>
                      {translateWithFallback(
                        "approvedReferralRewards",
                        "Approved Rewards",
                        "dashboard"
                      )}
                    </span>

                    <span className="green-text">
                      {Number(
                        referralSummary.approvedReferralRewards ||
                          0
                      ).toLocaleString()}{" "}
                      EXALT
                    </span>
                  </div>
                </>
              ) : (
                <p className="dashboard-empty-state">
                  {translateWithFallback(
                    "loading",
                    "Loading...",
                    "common"
                  )}
                </p>
              )}
            </section>
          </div>

                    <section className="dashboard-blog-section desktop-dashboard-blog">
            <div className="dashboard-blog-header">
              <div>
                <span className="dashboard-blog-eyebrow">
                  Exalt Exchange Insights
                </span>

                <h2>Latest from Our Blog</h2>

                <p>
                  Explore cryptocurrency education, trading
                  guides, Web3 insights, and Exalt ecosystem
                  updates.
                </p>
              </div>

              <button
                type="button"
                className="dashboard-blog-view-all"
                onClick={openBlogHome}
              >
                View All Articles
              </button>
            </div>

            <div className="dashboard-blog-grid">
              {LATEST_BLOG_POSTS.map((post) => (
                <article
                  className="dashboard-blog-card"
                  key={post.slug}
                >
                  {post.image && (
                    <button
                      type="button"
                      className="dashboard-blog-image-button"
                      onClick={() =>
                        openBlogArticle(post.slug)
                      }
                      aria-label={`Read ${post.title}`}
                    >
                      <img
                        src={post.image}
                        alt={post.imageAlt || post.title}
                        className="dashboard-blog-image"
                        loading="lazy"
                      />
                    </button>
                  )}

                  <div className="dashboard-blog-card-content">
                    <div className="dashboard-blog-meta">
                      <span>{post.category}</span>
                      <span>{post.readTime}</span>
                    </div>

                    <h3>{post.title}</h3>

                    <p>{post.excerpt}</p>

                    <button
                      type="button"
                      className="dashboard-blog-read-more"
                      onClick={() =>
                        openBlogArticle(post.slug)
                      }
                    >
                      Read Article →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}

export default Dashboard;
