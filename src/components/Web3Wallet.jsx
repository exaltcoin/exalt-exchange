import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

import exaltLogo from "../assets/exalt-coin.png";
import PageShell from "./PageShell";
import "./Web3Wallet.css";
import { API_ORIGIN } from "../lib/apiClient";

/* =========================================================
   WEB3 WALLET — EXALT EXCHANGE

   Batch K rebuild (see _audit/EXALT-BATCH-K-REPORT.md,
   WEB3-SECURITY-REPORT.md). This is a NEW component - the old
   Web3Wallet.jsx (self-custodial, browser-held signing secrets and client-side signing) was deleted in
   Batch F/H as a non-negotiable security violation and is not
   reused here in any form.

   This page talks ONLY to /api/web3-wallet - a backend-custodied
   wallet where the private key is generated and encrypted
   server-side and never leaves the backend. There is no
   injected-provider or third-party connector flow anywhere in this file. See the CEX-vs-Web3 balance
   separation note in the portfolio tab below - these are two
   distinct products and must never be presented as one balance.

   RC4 (multichain): this used to be a BSC-only page with every
   network/coin/explorer link hardcoded. It now threads a real
   `selectedNetwork` through every API call and renders whatever the
   backend's /networks + /balances responses actually say for that
   network - no network, coin list, or explorer URL is hardcoded
   here any more. Per the RC4 directive, this is a targeted
   extension of the existing UI, not a redesign - the tab structure,
   styling classes, and overall layout are unchanged.

   LAUNCH-CANDIDATE (directive §12/§13/§14): this used to open
   straight into the per-network "Portfolio" tab - a flat, linear
   utility screen with no landing view, no cross-chain total, and no
   Web3-specific mobile navigation of its own (mobile fell back to a
   horizontally-scrolling copy of the same desktop tab strip). This
   pass adds:
     - a "Home" tab (now the default) - a real branded welcome
       screen built entirely from real backend data: the cross-chain
       portfolio total from GET /api/web3-wallet/portfolio (never a
       fabricated number - it is null/marked partial exactly when the
       backend itself could not price or read every asset, see that
       endpoint's own header comment), a top-assets preview, a
       per-network health strip derived from the SAME portfolio
       response's real hasWallet/balanceAvailable flags (never a
       fake "all green" status), a cross-chain recent-activity
       preview (GET /api/web3-wallet/transactions with no `network`
       filter - a real endpoint capability that already existed,
       simply not called from this page before), and entry cards to
       every other tab.
     - a "Networks" tab - the real GET /networks list (already
       fetched by this page) rendered as its own dedicated view
       rather than only living inside the NetworkBar dropdown.
     - a Web3-specific fixed mobile bottom nav (Home / Assets / a
       raised Send+Receive pair / Swap / Activity), following the
       EXACT fixed-position/safe-area-inset mechanics already
       established by Dashboard.jsx's `.mobile-bottom-nav` and
       Futures.jsx's `.bm-bottom-nav` (see Web3Wallet.css) - but with
       its own Web3-only item set and its own `.w3-` styling, never
       merged into or reusing the CEX app's own bottom
       nav/menuGroups. This is the literal "distinct from the full
       CEX sidebar" / "clear separation between EXALT Exchange CEX
       and EXALT Web3" requirement - the global hamburger/sidebar in
       app.jsx (which already lists "Web3 Wallet" as its own
       always-visible group) remains the only way back to the CEX
       app from here, unchanged.
   The existing Portfolio/Receive/Send/Swap/Activity tabs and their
   underlying logic are UNTOUCHED by this pass - this only adds a
   landing view, a networks view, and mobile-specific navigation
   chrome around them.
========================================================= */

const COIN_LOGOS = {
  BNB: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
  ETH: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  POL: "https://s2.coinmarketcap.com/static/img/coins/64x64/28321.png",
  AVAX: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
  SOL: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
  TRX: "https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png",
  BTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
  USDT: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
  USDC: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png",
  WBTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/3717.png",
  CBBTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/32994.png",
  CAKE: "https://s2.coinmarketcap.com/static/img/coins/64x64/7186.png",
  EXALT: exaltLogo,
};

const genIdempotencyKey = () =>
  `web3_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const formatAmount = (value, decimals = 6) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  if (n === 0) return "0";
  if (n < 0.000001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
};

// Real values only - GET /api/web3-wallet/portfolio returns null for
// any amount it could not honestly compute (no live balance, no
// trustworthy price); this never substitutes a fabricated "$0.00".
const formatUsd = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/*
   RC2 fix (directive §21 - "Users must never normally see raw
   technical errors such as: Route not found - /api/..."): every
   catch block in this file used to surface `error.message` straight
   from the backend/fetch layer onto the screen verbatim - including
   the literal Express 404 body ("Route not found - /api/web3-wallet/
   wallet") if the backend ever genuinely returned one (see
   WEB3-API-CONTRACT.md for the real root cause that was fixed
   separately - a boot-time crash on a missing optional env var,
   authRoutes.js). This is a defense-in-depth layer on top of that
   root-cause fix, not a replacement for it: the raw detail is still
   logged to the console for real debugging, but the user only ever
   sees a safe, professional message mapped from the error's HTTP
   status (or the absence of one, for a genuine network failure).
*/
const describeError = (error, context = "Web3 wallet") => {
  console.error(`[${context}]`, error);

  const status = error?.status;

  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }
  if (status === 403 && error?.data?.emailNotVerified === true) {
    return "Verify your email before using Web3 Wallet.";
  }
  if (status === 403 && error?.data?.kycRequired === true) {
    const kycStatus = String(error?.data?.kycStatus || "").toLowerCase();

    if (kycStatus === "pending") {
      return "Your KYC verification is under review. Web3 transactions will unlock after approval.";
    }

    if (kycStatus === "rejected") {
      return "Your KYC verification was not approved. Open KYC Verification to review and resubmit it.";
    }

    return "Complete KYC verification to create a Web3 wallet and use Web3 transactions.";
  }
  if (status === 404) {
    return "This feature is temporarily unavailable. Please try again shortly, or contact support if this continues.";
  }
  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (typeof status === "number" && status >= 500) {
    return "Exalt Exchange is temporarily unavailable. Please try again shortly.";
  }
  if (!status || status === 0) {
    return "Unable to reach Exalt Exchange. Please check your connection and try again.";
  }
  return "Something went wrong. Please try again, or contact support if this continues.";
};

const statusBadge = (status) => {
  switch (status) {
    case "CONFIRMED":
      return { label: "Confirmed", className: "w3-badge w3-badge-success" };
    case "BROADCASTED":
      return { label: "Pending", className: "w3-badge w3-badge-pending" };
    case "FAILED":
      return { label: "Failed", className: "w3-badge w3-badge-failed" };
    default:
      return { label: "Pending", className: "w3-badge w3-badge-pending" };
  }
};

const withNetworkQuery = (path, network) =>
  `${path}${path.includes("?") ? "&" : "?"}network=${encodeURIComponent(network)}`;

export default function Web3Wallet({ setPage }) {
  const API = API_ORIGIN;

  const requestJson = useCallback(
    async (path, options = {}) => {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          ...(options.headers || {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(
          data?.message || `Request failed with status ${response.status}`
        );
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    },
    [API]
  );

  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedNetwork, setSelectedNetwork] = useState("BSC");
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState([]);
  const [balancesAvailable, setBalancesAvailable] = useState(true);
  const [networks, setNetworks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState("");

  // Cross-chain data for the Home tab - loaded once, independent of
  // `selectedNetwork` (portfolio spans every chain the user has a
  // wallet on; recent activity omits the `network` query param so
  // the backend returns every chain's transactions, newest first -
  // see routes/web3WalletRoutes.js's GET /transactions).
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  // The list of real, implemented networks only needs to load once -
  // it does not depend on which one is currently selected.
  useEffect(() => {
    requestJson("/api/web3-wallet/networks")
      .then((res) => setNetworks(res.networks || []))
      .catch(() => {});
  }, [requestJson]);

  useEffect(() => {
    setPortfolioLoading(true);
    requestJson("/api/web3-wallet/portfolio")
      .then((res) => setPortfolio(res))
      .catch(() => setPortfolio(null))
      .finally(() => setPortfolioLoading(false));

    requestJson("/api/web3-wallet/transactions?limit=5")
      .then((res) => setRecentActivity(res.transactions || []))
      .catch(() => setRecentActivity([]));
  }, [requestJson]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const walletRes = await requestJson(
        withNetworkQuery("/api/web3-wallet/wallet", selectedNetwork)
      );
      setWallet(walletRes.wallet);

      const [balancesRes, txRes] = await Promise.all([
        requestJson(
          withNetworkQuery("/api/web3-wallet/balances", selectedNetwork)
        ).catch(() => null),
        requestJson(
          withNetworkQuery("/api/web3-wallet/transactions", selectedNetwork)
        ).catch(() => null),
      ]);

      if (balancesRes) {
        setBalances(balancesRes.balances || []);
        setBalancesAvailable(balancesRes.available !== false);
      } else {
        setBalances([]);
        setBalancesAvailable(true);
      }
      if (txRes) setTransactions(txRes.transactions || []);
      else setTransactions([]);
    } catch (error) {
      setLoadError(describeError(error, "Web3 wallet load"));
    } finally {
      setLoading(false);
    }
  }, [requestJson, selectedNetwork]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const activeNetworkInfo = useMemo(
    () => networks.find((n) => n.network === selectedNetwork) || null,
    [networks, selectedNetwork]
  );

  const copyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard
      .writeText(wallet.address)
      .then(() => {
        setCopyFeedback("Address copied");
        setTimeout(() => setCopyFeedback(""), 2000);
      })
      .catch(() => {});
  };

  if (loading) {
    return (
      <PageShell titleKey="web3Wallet" subtitleKey="web3walletSubtitle">
        <div className="web3-wallet-page">
          <div className="w3-loading">Loading your Web3 wallet…</div>
        </div>
      </PageShell>
    );
  }

  if (loadError && !wallet) {
    const requiresKyc = loadError.includes("KYC");

    return (
      <PageShell titleKey="web3Wallet" subtitleKey="web3walletSubtitle">
        <div className="web3-wallet-page">
          <div className="w3-error-state">
            <p>{loadError}</p>
            <button
              className="w3-btn w3-btn-primary"
              onClick={() =>
                requiresKyc && typeof setPage === "function"
                  ? setPage("kyc-submit")
                  : loadAll()
              }
            >
              {requiresKyc ? "Open KYC Verification" : "Retry"}
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="web3Wallet" subtitleKey="web3walletSubtitle">
      <main className="web3-wallet-page">
        <div className="w3-separation-notice">
          Your <strong>Web3 Wallet</strong> is separate from your Exalt Exchange
          balance. Funds here live on-chain at your own Web3 address and are
          not part of your Spot/Funding balance until you deposit them into
          Exalt.
        </div>

        <NetworkBar
          networks={networks}
          selectedNetwork={selectedNetwork}
          onSelect={setSelectedNetwork}
        />

        <nav className="w3-tabs">
          {[
            ["home", "Home"],
            ["portfolio", "Portfolio"],
            ["receive", "Receive"],
            ["send", "Send"],
            ["swap", "Swap"],
            ["networks", "Networks"],
            ["activity", "Activity"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={activeTab === key ? "active" : ""}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "home" && (
          <HomeTab
            portfolio={portfolio}
            portfolioLoading={portfolioLoading}
            recentActivity={recentActivity}
            networks={networks}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === "portfolio" && (
          <PortfolioTab
            wallet={wallet}
            balances={balances}
            balancesAvailable={balancesAvailable}
            networkInfo={activeNetworkInfo}
            portfolio={portfolio}
            onRefresh={loadAll}
          />
        )}

        {activeTab === "receive" && (
          <ReceiveTab
            wallet={wallet}
            networkInfo={activeNetworkInfo}
            onCopy={copyAddress}
            copyFeedback={copyFeedback}
          />
        )}

        {activeTab === "send" && (
          <SendTab
            wallet={wallet}
            balances={balances}
            networkInfo={activeNetworkInfo}
            selectedNetwork={selectedNetwork}
            requestJson={requestJson}
            onSent={loadAll}
          />
        )}

        {activeTab === "swap" && (
          <SwapTab
            wallet={wallet}
            balances={balances}
            networkInfo={activeNetworkInfo}
            selectedNetwork={selectedNetwork}
            requestJson={requestJson}
            onSwapped={loadAll}
          />
        )}

        {activeTab === "networks" && (
          <NetworksTab
            networks={networks}
            selectedNetwork={selectedNetwork}
            onSelect={(network) => {
              setSelectedNetwork(network);
              setActiveTab("portfolio");
            }}
          />
        )}

        {activeTab === "activity" && (
          <ActivityTab
            transactions={transactions}
            selectedNetwork={selectedNetwork}
            requestJson={requestJson}
            onRefresh={loadAll}
          />
        )}
      </main>

      <Web3BottomNav activeTab={activeTab} onNavigate={setActiveTab} />
    </PageShell>
  );

  // ---- inline sub-renders below share `balanceOf`/formatAmount/etc. ----
}

/* =========================================================
   WEB3 BOTTOM NAV (mobile only, directive §13)

   A fixed bottom nav SCOPED TO THIS PAGE - it switches this page's
   own `activeTab` state, never the CEX app's `page` state. Mirrors
   the fixed-position/safe-area-inset/backdrop-blur mechanics already
   established by Dashboard.jsx's `.mobile-bottom-nav` and
   Futures.jsx's `.bm-bottom-nav` (see Web3Wallet.css), but with its
   own Web3-only item set (Home / Assets / Swap / Activity, plus a
   visually raised Send+Receive pair) and its own `.w3-` class
   namespace - deliberately never merged into those other navs, so
   "EXALT Exchange CEX" and "EXALT Web3" always read as two distinct
   navigational contexts (directive §14). Always rendered - CSS alone
   hides it above the 768px breakpoint, same convention as those
   other pages' bottom navs.
========================================================= */
function Web3BottomNav({ activeTab, onNavigate }) {
  const isActive = (key) => activeTab === key;

  return (
    <nav className="w3-bottom-nav" aria-label="EXALT Web3 navigation">
      <button
        type="button"
        className={isActive("home") ? "active" : ""}
        onClick={() => onNavigate("home")}
      >
        <span aria-hidden="true">⌂</span>
        <span>Home</span>
      </button>

      <button
        type="button"
        className={isActive("portfolio") ? "active" : ""}
        onClick={() => onNavigate("portfolio")}
      >
        <span aria-hidden="true">▤</span>
        <span>Assets</span>
      </button>

      <div className="w3-bottom-nav-quick">
        <button
          type="button"
          className={
            "w3-bottom-nav-fab" + (isActive("send") ? " active" : "")
          }
          onClick={() => onNavigate("send")}
          aria-label="Send"
        >
          <span aria-hidden="true">↑</span>
          <span>Send</span>
        </button>
        <button
          type="button"
          className={
            "w3-bottom-nav-fab" + (isActive("receive") ? " active" : "")
          }
          onClick={() => onNavigate("receive")}
          aria-label="Receive"
        >
          <span aria-hidden="true">↓</span>
          <span>Receive</span>
        </button>
      </div>

      <button
        type="button"
        className={isActive("swap") ? "active" : ""}
        onClick={() => onNavigate("swap")}
      >
        <span aria-hidden="true">⇄</span>
        <span>Swap</span>
      </button>

      <button
        type="button"
        className={isActive("activity") ? "active" : ""}
        onClick={() => onNavigate("activity")}
      >
        <span aria-hidden="true">🕒</span>
        <span>Activity</span>
      </button>
    </nav>
  );
}

/* =========================================================
   NETWORK BAR

   RC4: this is now a real, controlled network switcher - selecting
   a network reloads the wallet/balances/transactions for THAT
   network (see `selectedNetwork` in the parent component). Every
   network shown here has a genuine, implemented backend adapter -
   there is no "coming soon" placeholder state any more.
========================================================= */
function NetworkBar({ networks, selectedNetwork, onSelect }) {
  const [open, setOpen] = useState(false);
  const active = networks.find((n) => n.network === selectedNetwork) || {
    displayName: selectedNetwork,
  };

  return (
    <div className="w3-network-bar">
      <button className="w3-network-pill" onClick={() => setOpen((v) => !v)}>
        <span className="w3-dot-live" /> {active.displayName}
        <span className="w3-caret">▾</span>
      </button>
      {open && (
        <div className="w3-network-dropdown">
          {networks.map((n) => (
            <div
              key={n.network}
              className={
                "w3-network-row" +
                (n.network === selectedNetwork ? " w3-network-row-active" : "")
              }
              role="button"
              tabIndex={0}
              onClick={() => {
                onSelect(n.network);
                setOpen(false);
              }}
            >
              <span>{n.displayName}</span>
              {n.mainnetSendGated ? (
                <span className="w3-tag-soon">Send/Swap testnet-gated</span>
              ) : (
                <span className="w3-tag-live">Live</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   HOME TAB (directive §12 - "Welcome to EXALT Web3")

   The branded landing screen for the Web3 product. Every figure here
   comes from a real backend response - GET /api/web3-wallet/portfolio
   for the total/top-assets/network-health, GET /api/web3-wallet/
   transactions (no network filter) for recent activity - never a
   client-side placeholder. See that endpoint's own header comment
   (backend/controllers/web3WalletController.js's getPortfolio()) for
   the exact rules on when a value is null/marked partial rather than
   fabricated.
========================================================= */
function HomeTab({ portfolio, portfolioLoading, recentActivity, networks, onNavigate }) {
  const totalUsd = portfolio ? formatUsd(portfolio.totalUsdValue) : null;
  const isPartial = Boolean(portfolio?.totalUsdValueIsPartial);

  const topAssets = useMemo(() => {
    if (!portfolio?.networks) return [];

    const flattened = portfolio.networks.flatMap((net) =>
      (net.assets || [])
        .filter((asset) => asset.balanceAvailable && Number(asset.balance) > 0)
        .map((asset) => ({ ...asset, network: net.network, displayName: net.displayName }))
    );

    return flattened
      .sort((a, b) => {
        const av = typeof a.valueUsd === "number" ? a.valueUsd : -1;
        const bv = typeof b.valueUsd === "number" ? b.valueUsd : -1;
        return bv - av;
      })
      .slice(0, 5);
  }, [portfolio]);

  // Real, derived-from-response status per chain - never a fabricated
  // "all green" indicator. "hasWallet" and "balanceAvailable" both
  // come straight off the portfolio response.
  const networkHealth = useMemo(() => {
    if (!portfolio?.networks) return [];

    return portfolio.networks.map((net) => {
      if (!net.hasWallet) {
        return { network: net.network, displayName: net.displayName, status: "not-set-up", label: "Not set up" };
      }
      const anyAvailable = (net.assets || []).some((a) => a.balanceAvailable);
      return anyAvailable
        ? { network: net.network, displayName: net.displayName, status: "live", label: "Balances live" }
        : { network: net.network, displayName: net.displayName, status: "unavailable", label: "Unavailable" };
    });
  }, [portfolio]);

  const entryCards = [
    ["portfolio", "▤", "Portfolio", "View every asset on this network"],
    ["receive", "↓", "Receive", "Get your deposit address"],
    ["send", "↑", "Send", "Send an on-chain asset"],
    ["swap", "⇄", "Swap", "Trade one asset for another"],
    ["networks", "◈", "Networks", "See all 10 supported chains"],
    ["activity", "🕒", "Activity", "Your Web3 transaction history"],
  ];

  return (
    <div className="w3-home">
      <div className="w3-hero">
        <div className="w3-hero-title">Welcome to EXALT Web3</div>
        <p className="w3-hero-subtitle">
          Your own multi-chain, backend-secured wallet - separate from your
          Exalt Exchange Spot/Funding balance.
        </p>

        <div className="w3-total-card">
          <div className="w3-total-label">Total Web3 Portfolio Value</div>
          {portfolioLoading ? (
            <div className="w3-total-value w3-total-loading">Loading…</div>
          ) : totalUsd ? (
            <div className="w3-total-value">
              {totalUsd}
              {isPartial && (
                <span className="w3-total-partial-chip">Partial</span>
              )}
            </div>
          ) : (
            <div className="w3-total-value w3-total-unavailable">Unavailable</div>
          )}
          {!portfolioLoading && isPartial && (
            <div className="w3-total-note">
              Some balances or prices are currently unavailable, so this total
              may understate your real holdings - never a fabricated figure.
            </div>
          )}
        </div>
      </div>

      {networkHealth.length > 0 && (
        <div className="w3-home-section">
          <div className="w3-home-section-title">Network Health</div>
          <div className="w3-health-strip">
            {networkHealth.map((entry) => (
              <div key={entry.network} className={`w3-health-chip w3-health-${entry.status}`}>
                <span className="w3-health-dot" />
                <span>{entry.displayName}</span>
                <span className="w3-health-label">{entry.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w3-home-section">
        <div className="w3-home-section-title">Top Assets</div>
        {topAssets.length === 0 ? (
          <div className="w3-panel w3-empty">
            {portfolioLoading ? "Loading your assets…" : "No assets found yet across your Web3 wallets."}
          </div>
        ) : (
          <div className="w3-panel w3-asset-list">
            {topAssets.map((asset) => (
              <div className="w3-asset-row" key={`${asset.network}-${asset.coin}`}>
                <img
                  className="w3-asset-logo"
                  src={COIN_LOGOS[asset.coin] || exaltLogo}
                  alt={asset.coin}
                  onError={(e) => {
                    e.currentTarget.src = exaltLogo;
                  }}
                />
                <div className="w3-asset-info">
                  <div className="w3-asset-symbol">{asset.coin}</div>
                  <div className="w3-asset-network">{asset.displayName}</div>
                </div>
                <div className="w3-asset-balance">
                  <div>{formatAmount(asset.balance)}</div>
                  <div className="w3-asset-value">
                    {typeof asset.valueUsd === "number" ? formatUsd(asset.valueUsd) : "Value unavailable"}
                  </div>
                  <div className="w3-asset-value">
                    {asset.priceAvailable && typeof asset.priceUsd === "number"
                      ? `${formatUsd(asset.priceUsd)} / ${asset.coin}`
                      : "Price unavailable"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w3-home-section">
        <div className="w3-home-section-title-row">
          <div className="w3-home-section-title">Recent Activity</div>
          <button className="w3-link-btn" onClick={() => onNavigate("activity")}>
            View all
          </button>
        </div>
        {recentActivity.length === 0 ? (
          <div className="w3-panel w3-empty">No Web3 transactions yet.</div>
        ) : (
          <div className="w3-panel">
            {recentActivity.slice(0, 3).map((tx) => {
              const badge = statusBadge(tx.status);
              return (
                <div className="w3-tx-row" key={tx._id}>
                  <div className="w3-tx-type">{tx.type}</div>
                  <div className="w3-tx-detail">
                    <div>
                      {tx.type === "SWAP"
                        ? `${tx.amount} ${tx.coin} → ${tx.toAmount || "?"} ${tx.toCoin}`
                        : `${tx.amount} ${tx.coin}`}
                    </div>
                    <div className="w3-asset-network">{tx.network}</div>
                  </div>
                  <span className={badge.className}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="w3-home-section">
        <div className="w3-entry-cards">
          {entryCards.map(([key, icon, label, blurb]) => (
            <button
              key={key}
              type="button"
              className="w3-entry-card"
              onClick={() => onNavigate(key)}
            >
              <span className="w3-entry-card-icon" aria-hidden="true">{icon}</span>
              <span className="w3-entry-card-label">{label}</span>
              <span className="w3-entry-card-blurb">{blurb}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w3-home-footer-note">
        {networks.length} real, independently-implemented chains supported -
        no "coming soon" placeholders.
      </div>
    </div>
  );
}

/* =========================================================
   NETWORKS TAB

   The full GET /networks list as its own dedicated view (directive
   §12's "Networks" entry card) rather than only living inside the
   NetworkBar dropdown - every network here has a genuine, implemented
   backend adapter.
========================================================= */
function NetworksTab({ networks, selectedNetwork, onSelect }) {
  return (
    <div className="w3-panel w3-networks-list">
      {networks.map((n) => (
        <div
          key={n.network}
          className={
            "w3-networks-row" +
            (n.network === selectedNetwork ? " w3-networks-row-active" : "")
          }
          role="button"
          tabIndex={0}
          onClick={() => onSelect(n.network)}
        >
          <div>
            <div className="w3-asset-symbol">{n.displayName}</div>
            <div className="w3-asset-network">
              {n.chainType} · Native asset {n.nativeCoin}
            </div>
          </div>
          <div className="w3-networks-tags">
            {n.mainnetSendGated ? (
              <span className="w3-tag-soon">Send/Swap testnet-gated</span>
            ) : (
              <span className="w3-tag-live">Live</span>
            )}
            {n.swapSupported && <span className="w3-tag-live">Swap available</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   PORTFOLIO TAB
========================================================= */
function PortfolioTab({
  wallet,
  balances,
  balancesAvailable,
  networkInfo,
  portfolio,
  onRefresh,
}) {
  const networkLabel =
    networkInfo?.displayName || wallet?.network || "";

  const pricedAssets = useMemo(() => {
    const selected = portfolio?.networks?.find(
      (entry) => entry.network === wallet?.network
    );

    return new Map(
      (selected?.assets || []).map((asset) => [
        asset.coin,
        asset,
      ])
    );
  }, [portfolio, wallet?.network]);

  return (
    <div className="w3-panel">
      <div className="w3-portfolio-header">
        <div>
          <div className="w3-portfolio-label">
            Web3 Wallet Address ({networkLabel})
          </div>
          <div className="w3-address-mono">{wallet?.address}</div>
        </div>
        <button className="w3-btn w3-btn-ghost" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {!balancesAvailable && (
        <div className="w3-unavailable-banner">
          Balances are Unavailable right now — the {networkLabel} network
          connection is not configured in this environment. This is not a
          zero balance; it is unknown until the connection is restored.
        </div>
      )}

      <div className="w3-asset-list">
        {balances.length === 0 && balancesAvailable && (
          <div className="w3-empty">No balances loaded yet.</div>
        )}

        {balances.map((b) => (
          <div className="w3-asset-row" key={b.coin}>
            <img
              className="w3-asset-logo"
              src={COIN_LOGOS[b.coin] || exaltLogo}
              alt={b.coin}
              onError={(e) => {
                e.currentTarget.src = exaltLogo;
              }}
            />
            <div className="w3-asset-info">
              <div className="w3-asset-symbol">{b.coin}</div>
              <div className="w3-asset-network">{networkLabel}</div>
            </div>
            <div className="w3-asset-balance">
              <div>
                {b.available
                  ? formatAmount(b.balance)
                  : "Unavailable"}
              </div>

              <div className="w3-asset-value">
                {pricedAssets.get(b.coin)?.priceAvailable &&
                typeof pricedAssets.get(b.coin)?.priceUsd ===
                  "number"
                  ? `${formatUsd(
                      pricedAssets.get(b.coin).priceUsd
                    )} / ${b.coin}`
                  : "Price unavailable"}
              </div>

              <div className="w3-asset-value">
                {typeof pricedAssets.get(b.coin)?.valueUsd ===
                "number"
                  ? formatUsd(
                      pricedAssets.get(b.coin).valueUsd
                    )
                  : "Value unavailable"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   RECEIVE TAB
========================================================= */
function ReceiveTab({ wallet, networkInfo, onCopy, copyFeedback }) {
  const networkLabel = networkInfo?.displayName || wallet?.network || "this network";

  return (
    <div className="w3-panel w3-panel-center">
      <div className="w3-qr-wrap">
        <QRCodeCanvas value={wallet?.address || ""} size={180} includeMargin />
      </div>

      <div className="w3-address-mono w3-address-large">{wallet?.address}</div>

      <div className="w3-receive-actions">
        <button className="w3-btn w3-btn-primary" onClick={onCopy}>
          {copyFeedback || "Copy Address"}
        </button>
        {wallet?.explorerAddressUrl && (
          <a
            className="w3-btn w3-btn-ghost"
            href={wallet.explorerAddressUrl}
            target="_blank"
            rel="noreferrer"
          >
            View on Explorer
          </a>
        )}
      </div>

      <p className="w3-hint">
        Only send {networkLabel} assets to this address. Sending assets from
        another network to this address may result in permanent loss.
      </p>
    </div>
  );
}

/* =========================================================
   SEND TAB
========================================================= */
function SendTab({ wallet, balances, networkInfo, selectedNetwork, requestJson, onSent }) {
  const availableCoins = useMemo(() => {
    const coins = balances.map((b) => b.coin);
    if (networkInfo?.nativeCoin && !coins.includes(networkInfo.nativeCoin)) {
      coins.unshift(networkInfo.nativeCoin);
    }
    return coins.length ? coins : [networkInfo?.nativeCoin].filter(Boolean);
  }, [balances, networkInfo]);

  const [coin, setCoin] = useState(networkInfo?.nativeCoin || "");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [addressValid, setAddressValid] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [gasLoading, setGasLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  // LAUNCH-CANDIDATE fix: generated ONCE when the confirm modal opens
  // (see the "Review Send" button below) and reused for the actual
  // API call - previously genIdempotencyKey() was called fresh inside
  // submitSend on every invocation, so a genuine fast double-click
  // could fire two DIFFERENT idempotency keys and the backend's dedup
  // could not catch it.
  const [sendIdempotencyKey, setSendIdempotencyKey] = useState(null);
  // Synchronous re-entrancy guard: `submitting` state above is not
  // enough on its own - a second synchronous click before React
  // re-renders with `busy=true` would still fire a second submitSend
  // call. Checked/set at the very top of submitSend, before any
  // await, so that second call is a no-op instead.
  const submittingRef = useRef(false);

  // Reset the form's asset/address/amount whenever the network
  // changes underneath it - a coin symbol or a "valid" address from
  // one chain is meaningless (or actively dangerous) on another.
  useEffect(() => {
    setCoin(networkInfo?.nativeCoin || "");
    setToAddress("");
    setAmount("");
    setAddressValid(null);
    setGasEstimate(null);
    setResult(null);
    setSendIdempotencyKey(null);
  }, [selectedNetwork, networkInfo?.nativeCoin]);

  const balance = balances.find((b) => b.coin === coin);

  useEffect(() => {
    setGasEstimate(null);

    if (!toAddress || !amount) return;

    let cancelled = false;
    setGasLoading(true);

    requestJson("/api/web3-wallet/estimate-gas", {
      method: "POST",
      body: JSON.stringify({ network: selectedNetwork, toAddress, coin, amount }),
    })
      .then((res) => {
        if (!cancelled) setGasEstimate(res);
      })
      .catch(() => {
        if (!cancelled) setGasEstimate({ available: false });
      })
      .finally(() => {
        if (!cancelled) setGasLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toAddress, coin, amount, selectedNetwork, requestJson]);

  const checkAddress = (value) => {
    setToAddress(value);
    setAddressValid(null);

    if (!value) return;

    requestJson("/api/web3-wallet/validate-address", {
      method: "POST",
      body: JSON.stringify({ network: selectedNetwork, address: value }),
    })
      .then((res) => setAddressValid(res.valid))
      .catch(() => setAddressValid(false));
  };

  const submitSend = async () => {
    // Synchronous re-entrancy guard - see submittingRef's declaration
    // above. Must be the very first thing this function does, before
    // any `await`, so a second synchronous call (fast double-click)
    // lands here as a no-op rather than racing the first call.
    if (submittingRef.current) return;
    submittingRef.current = true;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await requestJson("/api/web3-wallet/send", {
        method: "POST",
        body: JSON.stringify({
          network: selectedNetwork,
          // Reuses the SAME key generated when the confirm modal was
          // opened (see "Review Send" below) - never regenerated here.
          idempotencyKey: sendIdempotencyKey,
          toAddress,
          coin,
          amount,
        }),
      });

      setResult({ ok: true, txHash: res.transaction?.txHash, explorerTxUrl: res.transaction?.explorerTxUrl });
      setConfirming(false);
      setToAddress("");
      setAmount("");
      onSent();
    } catch (error) {
      const comingSoon = error.status === 503;
      setResult({
        ok: false,
        comingSoon,
        // A 503 here is a deliberate, backend-authored "not enabled
        // yet" message (safe to show verbatim - see
        // WEB3_WALLET_SEND_ENABLED in web3WalletController.js), not a
        // raw technical error - only sanitize the unexpected cases.
        message: comingSoon
          ? error.message
          : describeError(error, "Web3 send"),
      });
      setConfirming(false);
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="w3-panel">
      {result?.comingSoon && (
        <div className="w3-unavailable-banner">
          Sending is not yet enabled in this environment — it must be
          verified against a live {networkInfo?.displayName || selectedNetwork}{" "}
          test network before real funds can be sent. Everything else on this
          screen (address validation, gas estimate) is fully functional.
        </div>
      )}
      {result && !result.ok && !result.comingSoon && (
        <div className="w3-error-banner">{result.message}</div>
      )}
      {result?.ok && (
        <div className="w3-success-banner">
          Transaction broadcast.{" "}
          {result.explorerTxUrl && (
            <a href={result.explorerTxUrl} target="_blank" rel="noreferrer">
              View on Explorer
            </a>
          )}
        </div>
      )}

      <label className="w3-label">Asset</label>
      <select
        className="w3-input"
        value={coin}
        onChange={(e) => setCoin(e.target.value)}
      >
        {availableCoins.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <div className="w3-balance-hint">
        Available: {balance?.available ? formatAmount(balance.balance) : "Unavailable"}{" "}
        {coin}
      </div>

      <label className="w3-label">Recipient Address</label>
      <input
        className="w3-input"
        placeholder="Recipient address"
        value={toAddress}
        onChange={(e) => checkAddress(e.target.value.trim())}
      />
      {addressValid === false && (
        <div className="w3-field-error">
          Not a valid {networkInfo?.displayName || selectedNetwork} address.
        </div>
      )}
      {addressValid === true && (
        <div className="w3-field-ok">Address looks valid.</div>
      )}

      <label className="w3-label">Amount</label>
      <input
        className="w3-input"
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="w3-fee-preview">
        {gasLoading && <span>Estimating network fee…</span>}
        {!gasLoading && gasEstimate?.available === false && (
          <span>Fee estimate Unavailable</span>
        )}
        {!gasLoading && gasEstimate?.available && (
          <span>
            Estimated network fee: {formatAmount(gasEstimate.estimatedFee)}{" "}
            {gasEstimate.feeCoin}
          </span>
        )}
      </div>

      <button
        className="w3-btn w3-btn-primary w3-btn-block"
        disabled={!toAddress || !amount || addressValid === false}
        onClick={() => {
          // Generated ONCE per confirm attempt, here at modal-open
          // time - reused as-is by submitSend, never regenerated on
          // the actual submit call.
          setSendIdempotencyKey(genIdempotencyKey());
          setConfirming(true);
        }}
      >
        Review Send
      </button>

      {confirming && (
        <ConfirmModal
          title="Confirm Send"
          lines={[
            ["Network", networkInfo?.displayName || selectedNetwork],
            ["Asset", coin],
            ["Amount", amount],
            ["To", toAddress],
            [
              "Network fee",
              gasEstimate?.available
                ? `${formatAmount(gasEstimate.estimatedFee)} ${gasEstimate.feeCoin}`
                : "Unavailable",
            ],
          ]}
          busy={submitting}
          onCancel={() => setConfirming(false)}
          onConfirm={submitSend}
        />
      )}
    </div>
  );
}

/* =========================================================
   SWAP TAB
========================================================= */
function SwapTab({ wallet, balances, networkInfo, selectedNetwork, requestJson, onSwapped }) {
  const balanceCoins = useMemo(() => {
    const list = balances.map((b) => b.coin);
    if (networkInfo?.nativeCoin && !list.includes(networkInfo.nativeCoin)) {
      list.unshift(networkInfo.nativeCoin);
    }
    return list;
  }, [balances, networkInfo]);
  const crossChainTargets = useMemo(
    () => (networkInfo?.swapTargets || []).map((target) => target.coin),
    [networkInfo]
  );
  const fromCoins = balanceCoins;
  const toCoins = crossChainTargets.length ? crossChainTargets : balanceCoins;

  const [fromCoin, setFromCoin] = useState("");
  const [toCoin, setToCoin] = useState("");
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  // LAUNCH-CANDIDATE fix: same pattern as SendTab's sendIdempotencyKey
  // above - generated ONCE when the confirm modal opens (see "Review
  // Swap" below) and reused for the actual API call, never
  // regenerated inside submitSwap itself.
  const [swapIdempotencyKey, setSwapIdempotencyKey] = useState(null);
  // Synchronous re-entrancy guard, mirroring SendTab's submittingRef -
  // checked/set at the very top of submitSwap, before any await.
  const submittingRef = useRef(false);

  useEffect(() => {
    setFromCoin(fromCoins[0] || "");
    setToCoin(toCoins.find((coin) => coin !== fromCoins[0]) || toCoins[0] || "");
    setAmount("");
    setQuote(null);
    setResult(null);
    setSwapIdempotencyKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNetwork]);

  useEffect(() => {
    setQuote(null);
    if (!amount || !fromCoin || !toCoin || fromCoin === toCoin) return;

    let cancelled = false;
    setQuoteLoading(true);

    // THORChain limits quote traffic to one request/second per IP.
    // Debounce Bitcoin more heavily; a small debounce also prevents
    // wasteful on-chain quote calls while typing on other networks.
    const timer = window.setTimeout(() => {
      requestJson("/api/web3-wallet/swap/quote", {
        method: "POST",
        body: JSON.stringify({
          network: selectedNetwork,
          fromCoin,
          toCoin,
          amount,
          slippageBps,
        }),
      })
        .then((res) => {
          if (!cancelled) setQuote(res);
        })
        .catch(() => {
          if (!cancelled) setQuote({ available: false });
        })
        .finally(() => {
          if (!cancelled) setQuoteLoading(false);
        });
    }, selectedNetwork === "BITCOIN" ? 1100 : 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fromCoin, toCoin, amount, slippageBps, selectedNetwork, requestJson]);

  const submitSwap = async () => {
    // Synchronous re-entrancy guard - see submittingRef's declaration
    // above. Must run before any `await` so a second synchronous call
    // (fast double-click) is a no-op rather than racing the first.
    if (submittingRef.current) return;
    submittingRef.current = true;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await requestJson("/api/web3-wallet/swap", {
        method: "POST",
        body: JSON.stringify({
          network: selectedNetwork,
          // Reuses the SAME key generated when the confirm modal was
          // opened (see "Review Swap" below) - never regenerated here.
          idempotencyKey: swapIdempotencyKey,
          fromCoin,
          toCoin,
          amount,
          minimumReceived: quote?.minimumReceived,
          slippageBps,
        }),
      });

      setResult({ ok: true, txHash: res.transaction?.txHash, explorerTxUrl: res.transaction?.explorerTxUrl });
      setConfirming(false);
      setAmount("");
      onSwapped();
    } catch (error) {
      const comingSoon = error.status === 503;
      setResult({
        ok: false,
        comingSoon,
        // A 503 here is a deliberate, backend-authored "not enabled
        // yet" message (safe to show verbatim - see
        // WEB3_WALLET_SWAP_ENABLED in web3WalletController.js), not a
        // raw technical error - only sanitize the unexpected cases.
        message: comingSoon
          ? error.message
          : describeError(error, "Web3 swap"),
      });
      setConfirming(false);
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (networkInfo && !networkInfo.swapSupported) {
    return (
      <div className="w3-panel">
        <div className="w3-unavailable-banner">
          Swaps are not available on {networkInfo.displayName} — there is no
          verified swap router configured for this network. Send and Receive
          are still fully functional.
        </div>
      </div>
    );
  }

  return (
    <div className="w3-panel">
      {result?.comingSoon && (
        <div className="w3-unavailable-banner">
          Swaps are not yet enabled in this environment — execution must be
          verified against a live {networkInfo?.displayName || selectedNetwork}{" "}
          test network before real funds can be swapped. Quotes above are
          fully live from on-chain liquidity.
        </div>
      )}
      {result && !result.ok && !result.comingSoon && (
        <div className="w3-error-banner">{result.message}</div>
      )}
      {result?.ok && (
        <div className="w3-success-banner">
          Swap broadcast.{" "}
          {result.explorerTxUrl && (
            <a href={result.explorerTxUrl} target="_blank" rel="noreferrer">
              View on Explorer
            </a>
          )}
        </div>
      )}

      <div className="w3-swap-row">
        <div>
          <label className="w3-label">From</label>
          <select
            className="w3-input"
            value={fromCoin}
            onChange={(e) => setFromCoin(e.target.value)}
          >
            {fromCoins.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          className="w3-swap-flip"
          disabled={crossChainTargets.length > 0}
          title={crossChainTargets.length ? "Cross-chain direction is fixed" : "Flip assets"}
          onClick={() => {
            if (crossChainTargets.length) return;
            setFromCoin(toCoin);
            setToCoin(fromCoin);
          }}
        >
          ⇅
        </button>
        <div>
          <label className="w3-label">To</label>
          <select
            className="w3-input"
            value={toCoin}
            onChange={(e) => setToCoin(e.target.value)}
          >
            {toCoins.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="w3-label">Amount ({fromCoin})</label>
      <input
        className="w3-input"
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <label className="w3-label">Slippage Tolerance</label>
      <div className="w3-slippage-row">
        {[10, 50, 100].map((bps) => (
          <button
            key={bps}
            className={
              "w3-slippage-btn " + (slippageBps === bps ? "active" : "")
            }
            onClick={() => setSlippageBps(bps)}
          >
            {(bps / 100).toFixed(2)}%
          </button>
        ))}
      </div>

      <div className="w3-quote-box">
        {quoteLoading && <span>Fetching live quote…</span>}
        {!quoteLoading && quote?.available === false && (
          <span>{quote.message || "Quote Unavailable — no on-chain liquidity route found."}</span>
        )}
        {!quoteLoading && quote?.available && (
          <>
            <div>
              You receive ≈ {formatAmount(quote.amountOut)} {toCoin}
            </div>
            <div className="w3-quote-min">
              Minimum received: {formatAmount(quote.minimumReceived)} {toCoin}
            </div>
          </>
        )}
      </div>

      <button
        className="w3-btn w3-btn-primary w3-btn-block"
        disabled={!amount || fromCoin === toCoin || !quote?.available}
        onClick={() => {
          // Generated ONCE per confirm attempt, here at modal-open
          // time - reused as-is by submitSwap, never regenerated on
          // the actual submit call.
          setSwapIdempotencyKey(genIdempotencyKey());
          setConfirming(true);
        }}
      >
        Review Swap
      </button>

      {confirming && (
        <ConfirmModal
          title="Confirm Swap"
          lines={[
            ["Network", networkInfo?.displayName || selectedNetwork],
            ["You pay", `${amount} ${fromCoin}`],
            ["You receive (est.)", `${formatAmount(quote?.amountOut)} ${toCoin}`],
            ...(quote?.destinationNetwork
              ? [["Destination network", quote.destinationNetwork]]
              : []),
            ["Minimum received", `${formatAmount(quote?.minimumReceived)} ${toCoin}`],
            ["Slippage", `${(slippageBps / 100).toFixed(2)}%`],
          ]}
          busy={submitting}
          onCancel={() => setConfirming(false)}
          onConfirm={submitSwap}
        />
      )}
    </div>
  );
}

/* =========================================================
   ACTIVITY TAB
========================================================= */
function ActivityTab({ transactions, selectedNetwork, requestJson, onRefresh }) {
  const [checking, setChecking] = useState(null);

  const checkStatus = async (id) => {
    setChecking(id);
    try {
      await requestJson(`/api/web3-wallet/transactions/${id}/status`);
      onRefresh();
    } catch (error) {
      // Non-fatal - leave the row as-is rather than surfacing a
      // toast for a background status poll.
    } finally {
      setChecking(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="w3-panel">
        <div className="w3-empty">
          No Web3 wallet transactions yet on {selectedNetwork}.
        </div>
      </div>
    );
  }

  return (
    <div className="w3-panel">
      {transactions.map((tx) => {
        const badge = statusBadge(tx.status);
        return (
          <div className="w3-tx-row" key={tx._id}>
            <div className="w3-tx-type">{tx.type}</div>
            <div className="w3-tx-detail">
              <div>
                {tx.type === "SWAP"
                  ? `${tx.amount} ${tx.coin} → ${tx.toAmount || "?"} ${tx.toCoin}`
                  : `${tx.amount} ${tx.coin}`}
              </div>
              {tx.txHash && tx.explorerTxUrl && (
                <a
                  className="w3-tx-hash"
                  href={tx.explorerTxUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {tx.txHash.slice(0, 10)}…{tx.txHash.slice(-6)}
                </a>
              )}
              {tx.txHash && !tx.explorerTxUrl && (
                <span className="w3-tx-hash">
                  {tx.txHash.slice(0, 10)}…{tx.txHash.slice(-6)}
                </span>
              )}
            </div>
            <span className={badge.className}>{badge.label}</span>
            {tx.status === "BROADCASTED" && (
              <button
                className="w3-btn w3-btn-ghost w3-btn-small"
                disabled={checking === tx._id}
                onClick={() => checkStatus(tx._id)}
              >
                {checking === tx._id ? "…" : "Check"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   CONFIRM MODAL (shared by Send/Swap)
========================================================= */
function ConfirmModal({ title, lines, busy, onCancel, onConfirm }) {
  return (
    <div className="w3-modal-overlay" role="dialog" aria-modal="true">
      <div className="w3-modal">
        <h3>{title}</h3>
        <div className="w3-modal-lines">
          {lines.map(([label, value]) => (
            <div className="w3-modal-line" key={label}>
              <span>{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
        <div className="w3-modal-actions">
          <button className="w3-btn w3-btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className="w3-btn w3-btn-primary"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Submitting…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
