import { useCallback, useEffect, useState } from "react";

import exchangeLogo from "../assets/exalt-exchange-logo.png";
import { useI18n } from "../i18n/index.js";
import { getLatestBlogPosts } from "../pages/blog/blogData.js";
import LanguageSwitcher from "./LanguageSwitcher";
import "./Dashboard.css";
import { API_ORIGIN } from "../lib/apiClient";
import { useDisplayCurrency } from "../hooks/useDisplayCurrency.js";
import {
  PageContainer,
  Section,
  Stack,
  Grid,
  Toolbar,
  DataTable,
  Badge,
  StatusBadge,
  Button,
  SkeletonText,
  Select,
} from "../design-system/index.js";

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
  /*
    Finding 1 fix (docs/DASHBOARD_DATA_SOURCE_MAP.md): marketCap/
    liquidity used to have no way to distinguish "genuinely $0" from
    "the DexScreener request failed" - both rendered as the same
    numeric 0. This tracks real request state so the UI can show an
    honest unavailable/error state instead of a fabricated zero.
  */
  const [marketDataStatus, setMarketDataStatus] = useState("loading");
  const [loading, setLoading] = useState(true);

  /*
    Batch 1 (Home foundation): hide/show balance toggle. This is a
    display preference, not financial/user data, so it's genuinely
    appropriate to persist in localStorage rather than requiring a
    backend-backed feature the way Markets' Favorites/Watchlist did
    (that was real per-user financial-adjacent state; this is purely
    "should numbers be masked on this device").
  */
  const [balancesHidden, setBalancesHidden] = useState(() => {
    try {
      return localStorage.getItem("exalt_balances_hidden") === "true";
    } catch (error) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "exalt_balances_hidden",
        balancesHidden ? "true" : "false"
      );
    } catch (error) {
      // localStorage unavailable (private browsing, etc.) - the
      // toggle still works for the current session, it just won't
      // persist across reloads. Not a functional failure.
    }
  }, [balancesHidden]);

  /*
    Batch 2: this used to be ~90 lines of inline display-currency
    logic (Batch 1). Extracted into hooks/useDisplayCurrency.js so
    Assets.jsx (Batch 2) reuses the exact same real conversion path
    instead of duplicating it, per the explicit "one canonical
    conversion utility/state path should be used where practical"
    instruction. Behavior is unchanged - this is a pure extraction,
    verified by the existing Batch 1 tests still passing unmodified.
  */
  const {
    displayCurrency,
    setDisplayCurrency,
    btcPriceLoadState,
    convertForDisplay,
  } = useDisplayCurrency();

  const formatDisplayValue = (usdValue) => {
    const converted = convertForDisplay(usdValue);

    if (converted === null) {
      return translateWithFallback(
        "unavailable",
        "Unavailable",
        "dashboard"
      );
    }

    if (displayCurrency === "BTC") {
      return `${formatUsd(converted, 8)} BTC`;
    }

    const symbol = displayCurrency === "USDT" ? "" : "$";
    const suffix = displayCurrency === "USDT" ? " USDT" : "";
    return `${symbol}${formatUsd(converted, 2)}${suffix}`;
  };

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
  /*
    Finding 2 fix (docs/DASHBOARD_DATA_SOURCE_MAP.md): same class of
    gap as marketDataStatus above - an authenticated user with a
    genuine $0 reward balance and a user whose /api/rewards/dashboard
    request failed used to render identically. This lets the UI show
    an honest unavailable state instead of a fabricated zero.
  */
  const [rewardStatsStatus, setRewardStatsStatus] = useState("loading");

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

  /*
    KYC/security status and notification count: real sources that
    already exist elsewhere in the app (GET /api/kyc/user/:email -
    the exact same endpoint Profile.jsx already uses; GET
    /api/notifications/me - the exact same endpoint NotificationBell.jsx
    already uses). Dashboard reuses both rather than creating a
    second implementation of either.
  */
  const [kycStatus, setKycStatus] = useState(null);
  const [kycStatusLoadState, setKycStatusLoadState] = useState("loading");
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationLoadState, setNotificationLoadState] =
    useState("loading");

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
        // A successful request with no pair data is a genuine
        // "nothing to show yet" state, not a failure - distinct
        // from marketDataStatus="unavailable" below.
        setMarketDataStatus("ready");
        return;
      }

      setExaltPrice(Number(pair.priceUsd || 0));

      setMarketCap(
        Number(pair.marketCap || pair.fdv || 0)
      );

      setLiquidity(
        Number(pair.liquidity?.usd || 0)
      );

      setMarketDataStatus("ready");
    } catch (error) {
      console.error(
        "Dashboard DexScreener error:",
        error
      );

      // Finding 1 fix: do not leave marketCap/liquidity looking
      // like a real $0 - mark this data as unavailable so the UI
      // can render an honest state instead.
      setMarketDataStatus("unavailable");
    }
  }, []);

  const loadRewardStats = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setRewardStatsStatus("unavailable");
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
        setRewardStatsStatus("unavailable");
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

      // Finding 2 fix: only mark this "ready" (a real value the UI
      // can trust, including a genuine 0) once the request actually
      // succeeds - never implicitly.
      setRewardStatsStatus("ready");
    } catch (error) {
      console.error(
        "Dashboard reward API error:",
        error
      );

      setRewardStatsStatus("unavailable");
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

  /*
    KYC status: reuses the exact same authenticated endpoint
    Profile.jsx already calls (GET /api/kyc/user/:email) - same
    request shape, same response handling, no second implementation.
  */
  const loadKycStatus = useCallback(async () => {
    const token = localStorage.getItem("token");
    const storedUser = readStoredUser();
    const email = storedUser?.email;

    if (!token || !email) {
      setKycStatusLoadState("unavailable");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/kyc/user/${encodeURIComponent(email)}`,
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
        setKycStatusLoadState("unavailable");
        return;
      }

      setKycStatus(data.status || "not_submitted");
      setKycStatusLoadState("ready");
    } catch (error) {
      describeRequestError(
        error,
        "Unable to load your verification status right now.",
        "Dashboard KYC status"
      );

      setKycStatusLoadState("unavailable");
    }
  }, [API]);

  /*
    Notification count: reuses the exact same authenticated endpoint
    NotificationBell.jsx already calls (GET /api/notifications/me) -
    same request shape, same response field names, no second
    implementation.
  */
  const loadNotificationCount = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setNotificationLoadState("unavailable");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/notifications/me`,
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
        setNotificationLoadState("unavailable");
        return;
      }

      setNotificationCount(Number(data.unreadCount || 0));
      setNotificationLoadState("ready");
    } catch (error) {
      describeRequestError(
        error,
        "Unable to load your notifications right now.",
        "Dashboard notification count"
      );

      setNotificationLoadState("unavailable");
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
        loadKycStatus(),
        loadNotificationCount(),
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
    loadKycStatus,
    loadNotificationCount,
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

  /*
    Phase: Dashboard redesign. This 6-item quick-access bar is
    reviewed (not removed) per the redesign instructions: it serves
    a genuinely distinct purpose from the AppShell's mobile
    navigation drawer - a zero-tap always-visible shortcut row for
    the most common destinations, vs. the drawer's full menu behind
    one extra tap. Retained as intentional.

    Updated to the explicit 5-item product spec (Batch 1): Home,
    Markets, Trade, Futures/TradFi, Assets - replacing the previous
    6-item set (which included Orders/P2P) to match the persistent
    bottom-tab-bar architecture requested, rather than the broader
    "most common destinations" set this was originally built with.

    Batch 2: "Assets" now points to the new real Assets.jsx screen
    (page key "assets") instead of "wallets" - Wallets.jsx remains
    fully reachable via its own entry in the full nav menu, this
    only changes where the bottom-tab shortcut lands, since the new
    screen is the purpose-built one for this exact destination.
  */
  const bottomNavigation = [
    ["\ud83c\udfe0", "dashboard", "Home"],
    ["\ud83d\udcca", "markets", "Markets"],
    ["\ud83d\udcc8", "trade", "Trade"],
    ["\ud83d\udcc9", "futures", "Futures"],
    ["\ud83d\udcbc", "assets", "Assets"],
  ];

  const storedUser = readStoredUser();

  const kycToneMap = {
    approved: "success",
    verified: "success",
    pending: "warning",
    under_review: "warning",
    rejected: "danger",
    not_submitted: "neutral",
  };

  const kycLabelMap = {
    approved: translateWithFallback("verified", "Verified", "profile"),
    verified: translateWithFallback("verified", "Verified", "profile"),
    pending: translateWithFallback("pending", "Pending", "profile"),
    under_review: translateWithFallback("pending", "Pending", "profile"),
    rejected: translateWithFallback("rejected", "Rejected", "profile"),
    not_submitted: translateWithFallback(
      "notSubmitted",
      "Not Submitted",
      "profile"
    ),
  };

  const orderColumns = [
    { key: "pair", header: translateWithFallback("pair", "Pair", "trading") },
    {
      key: "side",
      header: translateWithFallback("side", "Side", "trading"),
    },
    {
      key: "amount",
      header: translateWithFallback("amount", "Amount", "trading"),
      align: "end",
    },
    {
      key: "price",
      header: translateWithFallback("price", "Price", "trading"),
      align: "end",
    },
    {
      key: "status",
      header: translateWithFallback("status", "Status", "common"),
    },
  ];

  const renderOrderCell = (order, column) => {
    if (column.key === "side") {
      return (
        <Badge tone={order?.side === "sell" ? "sell" : "buy"}>
          {String(order?.side || "").toUpperCase()}
        </Badge>
      );
    }

    if (column.key === "amount") {
      return Number(order?.remaining ?? order?.amount ?? 0);
    }

    if (column.key === "price") {
      return `$${Number(order?.price || 0)}`;
    }

    if (column.key === "status") {
      return <StatusBadge status={order?.status} />;
    }

    return order?.[column.key] ?? "\u2014";
  };

  const txColumns = [
    {
      key: "type",
      header: translateWithFallback("type", "Type", "common"),
    },
    {
      key: "coin",
      header: translateWithFallback("coin", "Coin", "common"),
    },
    {
      key: "amount",
      header: translateWithFallback("amount", "Amount", "trading"),
      align: "end",
    },
    {
      key: "status",
      header: translateWithFallback("status", "Status", "common"),
    },
  ];

  const renderTxCell = (tx, column) => {
    if (column.key === "type") {
      return String(tx?.type || "").toUpperCase();
    }

    if (column.key === "status") {
      return <StatusBadge status={tx?.status} />;
    }

    return tx?.[column.key] ?? "\u2014";
  };

  return (
    <PageContainer maxWidth="1200px">
      <Stack gap="8">
        {/*
          Batch 1 (Home foundation) - real user header. Uses the
          real uid (always present - included in every login/2FA/
          register response, see backend authRoutes.js's
          serializeAuthenticatedUser) and the real profileImage
          when present (populated once the user has visited
          Profile.jsx, which fetches the full profile and re-saves
          it to localStorage via saveUserLocally() - not fabricated,
          genuinely stale-but-real or absent, never invented). No
          hardcoded username/UID anywhere here.
        */}
        <div className="dashboard-user-header">
          <div className="dashboard-user-header__avatar">
            {storedUser?.profileImage ? (
              <img
                src={storedUser.profileImage}
                alt=""
                className="dashboard-user-header__avatar-image"
              />
            ) : (
              <span aria-hidden="true">
                {(storedUser?.name || storedUser?.email || "?")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <div className="ex2-text-primary ex2-text-md">
              {storedUser?.name ||
                translateWithFallback("trader", "Trader", "p2p")}
            </div>

            {storedUser?.uid ? (
              <div className="ex2-text-secondary ex2-text-sm ex2-nums">
                UID: {storedUser.uid}
              </div>
            ) : null}
          </div>
        </div>

        {/*
          Batch 1 audit finding, documented rather than fabricated:
          "Today's P&L" was explicitly requested for this screen,
          but genuinely cannot be calculated honestly with the
          backend as it currently exists. P&L requires comparing the
          portfolio's value at the start of today against its
          current value - this requires either a periodic balance
          snapshot mechanism or a real "sum of today's realized
          trade P&L specifically, distinguished from deposits/
          withdrawals/transfers" computation. Neither exists
          anywhere in this backend (confirmed by a direct search for
          snapshot/dailyBalance/balanceHistory infrastructure -
          zero results). Per the explicit instruction for this case
          ("do not show a fake number... omit the metric, document
          exactly what backend capability is missing"), this metric
          is intentionally omitted from the Home screen rather than
          shown as a permanent "Unavailable" badge for a feature
          that isn't implemented at all. Building it would require:
          (1) a scheduled job that snapshots each user's total
          portfolio USD value once per day, and (2) a real
          P&L = current_value - most_recent_snapshot_value
          computation exposed via a new endpoint - genuine new
          backend work, not a frontend gap.
        */}

        {/* ---------- Account / Asset Overview ---------- */}
        <Section
          title={translateWithFallback(
            "assetOverview",
            "Account & Assets",
            "dashboard"
          )}
          action={
            <Toolbar>
              <Select
                value={displayCurrency}
                onChange={(event) =>
                  setDisplayCurrency(event.target.value)
                }
                aria-label={translateWithFallback(
                  "displayCurrency",
                  "Display currency"
                )}
              >
                <option value="USD">USD</option>
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                aria-label={
                  balancesHidden
                    ? translateWithFallback(
                        "showBalances",
                        "Show balances"
                      )
                    : translateWithFallback(
                        "hideBalances",
                        "Hide balances"
                      )
                }
                onClick={() =>
                  setBalancesHidden((hidden) => !hidden)
                }
              >
                {balancesHidden ? "\ud83d\udc41\ufe0f\u200d\ud83d\udde8\ufe0f" : "\ud83d\udc41\ufe0f"}
              </Button>
            </Toolbar>
          }
        >
          <Grid minItemWidth="220px" gap="4">
            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback(
                  "totalPortfolioValue",
                  "Total Portfolio Value",
                  "dashboard"
                )}
              </div>
              {loading ? (
                <SkeletonText lines={1} />
              ) : displayCurrency === "BTC" &&
                btcPriceLoadState === "loading" ? (
                <SkeletonText lines={1} />
              ) : (
                <div className="ex2-text-2xl ex2-nums">
                  {balancesHidden
                    ? "\u2022\u2022\u2022\u2022\u2022\u2022"
                    : formatDisplayValue(totalBalanceValue)}
                </div>
              )}
            </div>

            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback(
                  "availableBalance",
                  "Available Balance",
                  "wallets"
                )}
              </div>
              {loading ? (
                <SkeletonText lines={1} />
              ) : displayCurrency === "BTC" &&
                btcPriceLoadState === "loading" ? (
                <SkeletonText lines={1} />
              ) : (
                <div className="ex2-text-2xl ex2-nums">
                  {balancesHidden
                    ? "\u2022\u2022\u2022\u2022\u2022\u2022"
                    : formatDisplayValue(availableBalanceValue)}
                </div>
              )}
            </div>

            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback(
                  "lockedBalance",
                  "In Use / Locked",
                  "wallets"
                )}
              </div>
              {loading ? (
                <SkeletonText lines={1} />
              ) : displayCurrency === "BTC" &&
                btcPriceLoadState === "loading" ? (
                <SkeletonText lines={1} />
              ) : (
                <div className="ex2-text-2xl ex2-nums">
                  {balancesHidden
                    ? "\u2022\u2022\u2022\u2022\u2022\u2022"
                    : formatDisplayValue(lockedBalanceValue)}
                </div>
              )}
            </div>

            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback("kycStatus", "KYC Status", "profile")}
              </div>
              {kycStatusLoadState === "loading" ? (
                <SkeletonText lines={1} />
              ) : kycStatusLoadState === "unavailable" ? (
                <Badge tone="neutral">
                  {translateWithFallback(
                    "unavailable",
                    "Unavailable",
                    "dashboard"
                  )}
                </Badge>
              ) : (
                <Badge tone={kycToneMap[kycStatus] || "neutral"}>
                  {kycLabelMap[kycStatus] || kycStatus}
                </Badge>
              )}
            </div>

            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback(
                  "notifications",
                  "Notifications",
                  "dashboard"
                )}
              </div>
              {notificationLoadState === "loading" ? (
                <SkeletonText lines={1} />
              ) : notificationLoadState === "unavailable" ? (
                <Badge tone="neutral">
                  {translateWithFallback(
                    "unavailable",
                    "Unavailable",
                    "dashboard"
                  )}
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage("notification-center")}
                >
                  {notificationCount > 0 ? (
                    <Badge tone="warning" dot>
                      {notificationCount}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">0</Badge>
                  )}
                </Button>
              )}
            </div>
          </Grid>
        </Section>

        {/* ---------- Portfolio / Wallet Summary + quick actions ---------- */}
        <Section
          title={translateWithFallback(
            "portfolioValue",
            "Wallet Summary",
            "dashboard"
          )}
          action={
            <Toolbar>
              <Button size="sm" onClick={() => setPage("wallets")}>
                {translateWithFallback("deposit", "Deposit", "wallets")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage("wallets")}
              >
                {translateWithFallback("withdraw", "Withdraw", "wallets")}
              </Button>
              {/*
                Batch 1 audit finding: a general-purpose "Transfer"
                quick action used to navigate here to setPage("wallets"),
                but Wallets.jsx (a protected file, not modified by
                this batch) has no internal-transfer UI at all - only
                unrelated P2P "Bank Transfer" payment-method option
                text. A real, tested Spot<->Futures transfer endpoint
                does exist (POST /api/futures/transfer, see
                tests/futuresInternalTransfer.test.js) and has a real
                UI entry point already on the Futures page itself -
                but redirecting a general "Transfer" button from Home
                to the Futures page specifically would be its own
                kind of misleading (implying a general Funding/Spot/
                Futures hub that doesn't exist yet). Removed rather
                than left pointing at a page with nothing to do,
                per the explicit instruction: "if Transfer is not
                actually implemented... do not show it as functional
                either."
              */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPage("staking")}
              >
                {translateWithFallback("earn", "Earn", "dashboard")}
              </Button>
            </Toolbar>
          }
        >
          <DataTable
            ariaLabel={translateWithFallback(
              "portfolioValue",
              "Wallet Summary",
              "dashboard"
            )}
            loading={loading}
            rows={["USDT", "BNB", "EXALT"].map((coin) => ({
              coin,
              balance: walletBalances[coin] || 0,
              locked: walletLocked[coin] || 0,
            }))}
            getRowKey={(row) => row.coin}
            columns={[
              { key: "coin", header: translateWithFallback("coin", "Coin", "common") },
              {
                key: "balance",
                header: translateWithFallback("balance", "Balance", "common"),
                align: "end",
              },
              {
                key: "locked",
                header: translateWithFallback(
                  "lockedBalance",
                  "Locked",
                  "wallets"
                ),
                align: "end",
              },
            ]}
            renderCell={(row, column) => row[column.key]}
          />
        </Section>

        {/* ---------- Market Snapshot ---------- */}
        <Section
          title={translateWithFallback(
            "marketStatus",
            "Market Snapshot",
            "dashboard"
          )}
        >
          <Grid minItemWidth="200px" gap="4">
            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                EXALT {translateWithFallback("price", "Price", "trading")}
              </div>
              {exaltPrice === null ? (
                <SkeletonText lines={1} />
              ) : (
                <div className="ex2-nums">${exaltPrice}</div>
              )}
            </div>

            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback("marketCap", "Market Cap", "dashboard")}
              </div>
              {marketDataStatus === "loading" ? (
                <SkeletonText lines={1} />
              ) : marketDataStatus === "unavailable" ? (
                <Badge tone="neutral">
                  {translateWithFallback(
                    "unavailable",
                    "Unavailable",
                    "dashboard"
                  )}
                </Badge>
              ) : (
                <div className="ex2-nums">${formatUsd(marketCap, 0)}</div>
              )}
            </div>

            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback("liquidity", "Liquidity", "dashboard")}
              </div>
              {marketDataStatus === "loading" ? (
                <SkeletonText lines={1} />
              ) : marketDataStatus === "unavailable" ? (
                <Badge tone="neutral">
                  {translateWithFallback(
                    "unavailable",
                    "Unavailable",
                    "dashboard"
                  )}
                </Badge>
              ) : (
                <div className="ex2-nums">${formatUsd(liquidity, 0)}</div>
              )}
            </div>
          </Grid>

          <div style={{ marginTop: "var(--ex2-space-4)" }}>
            <DataTable
              ariaLabel={translateWithFallback(
                "trendingCoins",
                "Trending Coins",
                "dashboard"
              )}
              loading={loading}
              rows={coins}
              getRowKey={(row, index) =>
                row?.baseToken?.address || row?.pairAddress || index
              }
              emptyTitle={translateWithFallback(
                "noDataFound",
                "No data found.",
                "common"
              )}
              columns={[
                {
                  key: "symbol",
                  header: translateWithFallback("symbol", "Symbol", "markets"),
                },
                {
                  key: "price",
                  header: translateWithFallback("price", "Price", "trading"),
                  align: "end",
                },
                {
                  key: "change24h",
                  header: translateWithFallback(
                    "change24h",
                    "24h Change",
                    "trading"
                  ),
                  align: "end",
                },
              ]}
              renderCell={(row, column) => {
                if (column.key === "symbol") {
                  return row?.baseToken?.symbol || "\u2014";
                }
                if (column.key === "price") {
                  return `$${Number(row?.priceUsd || 0)}`;
                }
                if (column.key === "change24h") {
                  const change = Number(row?.priceChange?.h24 || 0);
                  return (
                    <span
                      className={
                        change >= 0 ? "ex2-buy-text" : "ex2-sell-text"
                      }
                      style={{
                        color:
                          change >= 0
                            ? "var(--ex2-buy)"
                            : "var(--ex2-sell)",
                      }}
                    >
                      {change >= 0 ? "+" : ""}
                      {change.toFixed(2)}%
                    </span>
                  );
                }
                return "\u2014";
              }}
            />
          </div>
        </Section>

        {/* ---------- Recent Orders / Transactions ---------- */}
        <Section
          title={translateWithFallback(
            "recentActivity",
            "Recent Activity",
            "dashboard"
          )}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage("transactions")}
            >
              {translateWithFallback("viewAll", "View All", "common")}
            </Button>
          }
        >
          <Stack gap="6">
            <div>
              <div className="ex2-text-md ex2-text-primary" style={{ marginBottom: "var(--ex2-space-2)" }}>
                {translateWithFallback(
                  "recentOrders",
                  "Recent Orders",
                  "dashboard"
                )}
              </div>
              <DataTable
                ariaLabel={translateWithFallback(
                  "recentOrders",
                  "Recent Orders",
                  "dashboard"
                )}
                loading={loading}
                rows={openOrders}
                getRowKey={(row) => row?._id || row?.id}
                columns={orderColumns}
                renderCell={renderOrderCell}
                emptyTitle={translateWithFallback(
                  "noOpenOrders",
                  "No open orders.",
                  "trading"
                )}
              />
            </div>

            <div>
              <div className="ex2-text-md ex2-text-primary" style={{ marginBottom: "var(--ex2-space-2)" }}>
                {translateWithFallback(
                  "transactionHistory",
                  "Recent Transactions",
                  "trading"
                )}
              </div>
              <DataTable
                ariaLabel={translateWithFallback(
                  "transactionHistory",
                  "Recent Transactions",
                  "trading"
                )}
                loading={loading}
                rows={recentTx}
                getRowKey={(row) => row?._id || row?.id}
                columns={txColumns}
                renderCell={renderTxCell}
                emptyTitle={translateWithFallback(
                  "noTransactionsYet",
                  "No transactions yet.",
                  "trading"
                )}
              />
            </div>
          </Stack>
        </Section>

        {/* ---------- Rewards / Referral ---------- */}
        <Section
          title={translateWithFallback(
            "approvedRewards",
            "Rewards & Referrals",
            "dashboard"
          )}
        >
          <Grid minItemWidth="200px" gap="4">
            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback(
                  "approvedRewards",
                  "Approved Rewards",
                  "dashboard"
                )}
              </div>
              {rewardStatsStatus === "loading" ? (
                <SkeletonText lines={1} />
              ) : rewardStatsStatus === "unavailable" ? (
                <Badge tone="neutral">
                  {translateWithFallback(
                    "unavailable",
                    "Unavailable",
                    "dashboard"
                  )}
                </Badge>
              ) : (
                <div className="ex2-nums">
                  {formatUsd(rewardStats.approvedAmount, 2)}
                </div>
              )}
            </div>

            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback(
                  "pendingRewards",
                  "Pending Rewards",
                  "dashboard"
                )}
              </div>
              {rewardStatsStatus === "loading" ? (
                <SkeletonText lines={1} />
              ) : rewardStatsStatus === "unavailable" ? (
                <Badge tone="neutral">
                  {translateWithFallback(
                    "unavailable",
                    "Unavailable",
                    "dashboard"
                  )}
                </Badge>
              ) : (
                <div className="ex2-nums">
                  {formatUsd(rewardStats.pendingAmount, 2)}
                </div>
              )}
            </div>

            <div>
              <div className="ex2-text-secondary ex2-text-sm">
                {translateWithFallback(
                  "totalReferrals",
                  "Total Referrals",
                  "social"
                )}
              </div>
              <div className="ex2-nums">
                {referralSummary?.referralCount ?? "\u2014"}
              </div>
            </div>
          </Grid>
        </Section>

        {/* ---------- Useful account shortcuts ---------- */}
        <Section
          title={translateWithFallback(
            "quickActions",
            "Quick Actions",
            "dashboard"
          )}
        >
          <Toolbar>
            <Button size="sm" onClick={() => setPage("buy")}>
              {translateWithFallback("buyExalt", "Buy Crypto", "dashboard")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage("certificates")}
            >
              {translateWithFallback(
                "certificates",
                "My Certificates",
                "navigation"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage("referral")}
            >
              {translateWithFallback("referral", "Referral", "navigation")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage("support")}
            >
              {translateWithFallback("support", "Support", "navigation")}
            </Button>
          </Toolbar>
        </Section>

        {/* ---------- Blog (existing real feature, preserved) ---------- */}
        <Section title="Exalt Exchange Blog" action={
          <Button variant="ghost" size="sm" onClick={openBlogHome}>
            {translateWithFallback("viewAll", "View All", "common")}
          </Button>
        }>
          <Grid minItemWidth="220px" gap="4">
            {LATEST_BLOG_POSTS.map((post) => (
              <div
                key={post.slug}
                className="dashboard-blog-card"
                onClick={() => openBlogArticle(post.slug)}
                role="button"
                tabIndex={0}
              >
                <div className="dashboard-blog-card-content">
                  <div className="dashboard-blog-eyebrow">{post.category}</div>
                  <h3>{post.title}</h3>
                </div>
              </div>
            ))}
          </Grid>
        </Section>
      </Stack>

      {/* Mobile quick-access bar - retained intentionally, see comment above bottomNavigation */}
      <nav className="mobile-bottom-nav" aria-label="Quick access">
        {bottomNavigation.map(([icon, key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPage(key)}
            aria-label={translateWithFallback(key, label, "navigation")}
          >
            <span aria-hidden="true">{icon}</span>
          </button>
        ))}
      </nav>
    </PageContainer>
  );
}

export default Dashboard;
