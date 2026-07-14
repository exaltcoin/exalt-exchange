import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

import exchangeLogo from "./assets/exalt-exchange-logo.png";
import { useI18n } from "./i18n/index.js";
import LanguageSwitcher from "./components/LanguageSwitcher";
import "./style.css";

import Dashboard from "./components/Dashboard";
import Markets from "./components/Markets";
import Trade from "./components/Trade";
import BuyCrypto from "./components/BuyCrypto";
import ListingForm from "./components/ListingForm";
import Orders from "./components/Orders";
import Referral from "./components/Referral";
import Support from "./components/Support";
import AdminPanel from "./AdminPanel";
import Wallets from "./components/Wallets";
import Web3Wallet from "./components/Web3Wallet";
import Settings from "./components/Settings";
import Transactions from "./components/Transactions";
import AuthPanel from "./components/AuthPanel";
import TradingPanel from "./components/TradingPanel";
import OrderBook from "./components/OrderBook";
import P2P from "./components/P2P";
import AdminKycPanel from "./components/AdminKycPanel";
import KycVerification from "./components/kycVerification";
import AdminP2P from "./components/AdminP2P";
import Futures from "./components/Futures";
import ReplitRewards from "./replit_ui/Rewards";
import Profile from "./components/Profile";
import Staking from "./components/Staking";
import LearnEarn from "./components/LearnEarn";
import AITradingAssistant from "./components/AITradingAssistant";
import AICopyTrading from "./components/AICopyTrading";
import AIPortfolioManager from "./components/AIPortfolioManager";
import SocialTrading from "./components/SocialTrading";
import AIRiskManager from "./components/AIRiskManager";
import AIProfitCalculator from "./components/AIProfitCalculator";
import AIMarketScanner from "./components/AIMarketScanner";
import AINews from "./components/AINews";
import AIWhaleTracker from "./components/AIWhaleTracker";
import AIArbitrageScanner from "./components/AIArbitrageScanner";
import AIGridTrading from "./components/AIGridTrading";
import AISmartAlerts from "./components/AISmartAlerts";
import AILaunchpad from "./components/AILaunchpad";
import AIWhaleHeatmap from "./components/AIWhaleHeatmap";
import AITrustScore from "./components/AITrustScore";
import AIWhaleAlert from "./components/AIWhaleAlert";
import ExaltUtilityCenter from "./components/ExaltUtilityCenter";
import AdminLearnEarn from "./components/AdminLearnEarn";
import AdminReferrals from "./components/AdminReferrals";
import ReputationCenter from "./components/ReputationCenter";
import AchievementCenter from "./components/AchievementCenter";
import AdminRewards from "./components/AdminRewards";
import NotificationCenter from "./components/NotificationCenter";
import NotificationBell from "./components/NotificationBell";
import VerifyEmail from "./components/VerifyEmail";
import ResetPassword from "./components/ResetPassword";
import ForgotPassword from "./components/ForgotPassword";
import VerifyResetCode from "./components/VerifyResetCode";

import LegalHome from "./pages/legal/LegalHome.jsx";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy.jsx";
import TermsOfService from "./pages/legal/TermsOfService.jsx";
import AMLPolicy from "./pages/legal/AMLPolicy.jsx";
import KYCPolicy from "./pages/legal/KYCPolicy.jsx";
import RiskDisclosure from "./pages/legal/RiskDisclosure.jsx";
import CookiePolicy from "./pages/legal/CookiePolicy.jsx";
import RefundPolicy from "./pages/legal/RefundPolicy.jsx";
import Compliance from "./pages/legal/Compliance.jsx";
import DeleteAccount from "./pages/legal/DeleteAccount.jsx";
import OwnerControl from "./components/OwnerControl";
import SuperAdminPanel from "./components/SuperAdminPanel";
import ModeratorPanel from "./components/ModeratorPanel";
const DEFAULT_API_BASE =
  "https://exalt-real-backend-6b6v.onrender.com";

const normalizeApiBase = (value) => {
  const base = String(value || DEFAULT_API_BASE)
    .trim()
    .replace(/\/+$/, "");

  return base.endsWith("/api") ? base.slice(0, -4) : base;
};

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return {};
    }

    const parsedUser = JSON.parse(storedUser);

    return parsedUser && typeof parsedUser === "object"
      ? parsedUser
      : {};
  } catch (error) {
    console.error("Invalid stored user data:", error);
    localStorage.removeItem("user");
    return {};
  }
};

const checkAdminAccess = (user) =>
  user?.role === "admin" ||
  user?.role === "super_admin" ||
  user?.role === "owner" ||
  user?.isAdmin === true ||
  user?.isOwner === true;

function App() {
  const { t } = useI18n();

  const path =
    window.location.pathname.replace(/\/+$/, "") || "/";

  const API_BASE = useMemo(
    () => normalizeApiBase(import.meta.env.VITE_API_URL),
    []
  );

  const [page, setPage] = useState(() =>
    localStorage.getItem("token") ? "dashboard" : "auth"
  );

  const [wallet, setWallet] = useState("");
  const [bnbBalance, setBnbBalance] = useState("0.0000");
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(readStoredUser);
  const [authChecking, setAuthChecking] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token);
  const hasAdminAccess = checkAdminAccess(currentUser);

  const currentRole = String(currentUser?.role || "")
    .trim()
    .toLowerCase();

  const hasOwnerAccess =
    currentRole === "owner" &&
    currentUser?.isOwner === true;

  const hasSuperAdminAccess =
    hasOwnerAccess ||
    currentRole === "super_admin";

  const hasModeratorAccess =
    hasSuperAdminAccess ||
    currentRole === "admin" ||
    currentRole === "moderator" ||
    currentUser?.isAdmin === true;

  const translateWithFallback = (
    key,
    fallback,
    namespace
  ) => {
    try {
      const translatedValue = t(key, {
        defaultValue: fallback,
        ...(namespace ? { ns: namespace } : {}),
      });

      if (
        translatedValue === undefined ||
        translatedValue === null ||
        String(translatedValue).trim() === "" ||
        translatedValue === key
      ) {
        return fallback;
      }

      return translatedValue;
    } catch (error) {
      console.error(
        `Translation failed for key "${key}":`,
        error
      );

      return fallback;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setCurrentUser({});
        setPage("auth");
        setAuthChecking(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${storedToken}`,
              Accept: "application/json",
            },
          }
        );

        const data = await response.json().catch(() => ({}));

        if (response.ok && data?.success && data?.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(data.user)
          );

          setCurrentUser(data.user);

          setPage((currentPage) =>
            currentPage === "auth"
              ? "dashboard"
              : currentPage
          );
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          setCurrentUser({});
          setPage("auth");
        }
      } catch (error) {
        console.error(
          "Authentication check failed:",
          error
        );

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setCurrentUser({});
        setPage("auth");
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, [API_BASE]);

  if (path === "/legal") {
    return <LegalHome />;
  }

  if (path === "/privacy") {
    return <PrivacyPolicy />;
  }

  if (path === "/terms") {
    return <TermsOfService />;
  }

  if (path === "/aml") {
    return <AMLPolicy />;
  }

  if (path === "/kyc-policy") {
    return <KYCPolicy />;
  }

  if (path === "/risk") {
    return <RiskDisclosure />;
  }

  if (path === "/cookies") {
    return <CookiePolicy />;
  }

  if (path === "/refund") {
    return <RefundPolicy />;
  }

  if (path === "/compliance") {
    return <Compliance />;
  }

  if (path === "/delete-account") {
    return <DeleteAccount />;
  }

  if (path.startsWith("/verify-email/")) {
    return <VerifyEmail />;
  }

  if (path.startsWith("/reset-password/")) {
    return <ResetPassword />;
  }

  if (path.startsWith("/ref/")) {
    const referralCode = path.split("/ref/")[1];

    if (referralCode) {
      localStorage.setItem(
        "pendingReferralCode",
        decodeURIComponent(referralCode)
      );

      window.history.replaceState({}, "", "/");
    }
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setWallet("");
    setBnbBalance("0.0000");
    setCurrentUser({});
    setMenuOpen(false);
    setPage("auth");

    window.history.replaceState({}, "", "/");
  };

  const connectWallet = async () => {
    try {
      const isMobile =
        /Android|iPhone|iPad|iPod/i.test(
          navigator.userAgent
        );

      const siteUrl = "exaltexchange.io";

      if (!window.ethereum) {
        if (isMobile) {
          window.location.href =
            `https://metamask.app.link/dapp/${siteUrl}`;
          return;
        }

        window.alert("Please install MetaMask extension");
        return;
      }

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }],
        });
      } catch (switchError) {
        if (switchError?.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x38",
                chainName: "BNB Smart Chain",
                nativeCurrency: {
                  name: "BNB",
                  symbol: "BNB",
                  decimals: 18,
                },
                rpcUrls: [
                  "https://bsc-dataseed.binance.org/",
                ],
                blockExplorerUrls: [
                  "https://bscscan.com",
                ],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      const provider = new ethers.BrowserProvider(
        window.ethereum
      );

      const accounts = await provider.send(
        "eth_requestAccounts",
        []
      );

      if (!accounts?.length) {
        window.alert("No wallet account found");
        return;
      }

      const address = accounts[0];
      const balance = await provider.getBalance(address);

      setWallet(address);
      setBnbBalance(
        Number(ethers.formatEther(balance)).toFixed(4)
      );

      window.alert("Wallet Connected Successfully");
    } catch (error) {
      console.error(
        "Wallet connection failed:",
        error
      );

      window.alert("Wallet connection failed");
    }
  };

  const shortWallet = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : translateWithFallback(
        "connectWallet",
        "Connect Wallet",
        "web3"
      );

  const adminOnlyPanel = (
    Component,
    componentProps = {}
  ) => {
    if (!hasAdminAccess) {
      return (
        <div className="panel">
          <h2>
            {translateWithFallback(
              "accessDenied",
              "Access Denied",
              "common"
            )}
          </h2>

          <p>
            Only an authorized Owner, Super Admin or Admin
            can access this panel.
          </p>

          <button
            type="button"
            className="buy-btn"
            onClick={() => setPage("dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    return <Component {...componentProps} />;
  };

  const ownerOnlyPanel = (
    Component,
    componentProps = {}
  ) => {
    if (!hasOwnerAccess) {
      return (
        <div className="panel">
          <h2>
            {translateWithFallback(
              "accessDenied",
              "Access Denied",
              "common"
            )}
          </h2>

          <p>
            Only the verified Exalt Exchange Owner can access
            this control center.
          </p>

          <button
            type="button"
            className="buy-btn"
            onClick={() => setPage("dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    return (
      <Component
        setPage={setPage}
        currentUser={currentUser}
        {...componentProps}
      />
    );
  };

  const superAdminOnlyPanel = (
    Component,
    componentProps = {}
  ) => {
    if (!hasSuperAdminAccess) {
      return (
        <div className="panel">
          <h2>
            {translateWithFallback(
              "accessDenied",
              "Access Denied",
              "common"
            )}
          </h2>

          <p>
            Only the Owner or Super Admin can access this
            operations panel.
          </p>

          <button
            type="button"
            className="buy-btn"
            onClick={() => setPage("dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    return (
      <Component
        setPage={setPage}
        currentUser={currentUser}
        {...componentProps}
      />
    );
  };

  const moderatorOnlyPanel = (
    Component,
    componentProps = {}
  ) => {
    if (!hasModeratorAccess) {
      return (
        <div className="panel">
          <h2>
            {translateWithFallback(
              "accessDenied",
              "Access Denied",
              "common"
            )}
          </h2>

          <p>
            This panel is restricted to authorized management
            and moderator accounts.
          </p>

          <button
            type="button"
            className="buy-btn"
            onClick={() => setPage("dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    return (
      <Component
        setPage={setPage}
        currentUser={currentUser}
        {...componentProps}
      />
    );
  };

  const renderPage = () => {
    if (page === "dashboard") {
      return (
        <>
          <Dashboard setPage={setPage} />
          <TradingPanel />
          <OrderBook />
        </>
      );
    }

    if (page === "forgot-password") {
      return <ForgotPassword setPage={setPage} />;
    }

    if (page === "verify-reset-code") {
      return <VerifyResetCode setPage={setPage} />;
    }

    if (page === "reset-password") {
      return <ResetPassword setPage={setPage} />;
    }

    if (page === "markets") {
      return <Markets />;
    }

    if (page === "trade") {
      return <Trade setPage={setPage} />;
    }

    if (page === "buy") {
      return <BuyCrypto />;
    }

    if (page === "futures") {
      return <Futures setPage={setPage} />;
    }

    if (page === "wallets") {
      return <Wallets />;
    }

    if (page === "web3wallet") {
      return <Web3Wallet setPage={setPage} />;
    }

    if (page === "transactions") {
      return <Transactions />;
    }

    if (page === "orders") {
      return <Orders />;
    }

    if (page === "p2p") {
      return <P2P />;
    }

    if (page === "kyc") {
      return adminOnlyPanel(AdminKycPanel);
    }

    if (page === "kyc-submit") {
      return <KycVerification />;
    }

    if (page === "referral") {
      return <Referral />;
    }

    if (page === "rewards") {
      return <ReplitRewards />;
    }

    if (page === "support") {
      return <Support />;
    }

    if (page === "listings") {
      return <ListingForm />;
    }

    if (page === "profile") {
      return <Profile setPage={setPage} />;
    }

    if (page === "staking") {
      return <Staking />;
    }

    if (page === "learnearn") {
      return <LearnEarn />;
    }

    if (page === "ai-assistant") {
      return <AITradingAssistant />;
    }

    if (page === "ai-copy-trading") {
      return <AICopyTrading />;
    }

    if (page === "ai-portfolio") {
      return <AIPortfolioManager />;
    }

    if (page === "social-trading") {
      return <SocialTrading />;
    }

    if (page === "ai-risk-manager") {
      return <AIRiskManager />;
    }

    if (page === "ai-profit-calculator") {
      return <AIProfitCalculator />;
    }

    if (page === "ai-market-scanner") {
      return <AIMarketScanner />;
    }

    if (page === "ai-news") {
      return <AINews />;
    }

    if (page === "ai-whale-tracker") {
      return <AIWhaleTracker />;
    }

    if (page === "ai-arbitrage-scanner") {
      return <AIArbitrageScanner />;
    }

    if (page === "ai-grid-trading") {
      return <AIGridTrading />;
    }

    if (page === "ai-smart-alerts") {
      return <AISmartAlerts />;
    }

    if (page === "ai-launchpad") {
      return <AILaunchpad />;
    }

    if (page === "ai-whale-heatmap") {
      return <AIWhaleHeatmap />;
    }

    if (page === "ai-trust-score") {
      return <AITrustScore />;
    }

    if (page === "ai-whale-alerts") {
      return <AIWhaleAlert />;
    }

    if (page === "exalt-utility-center") {
      return <ExaltUtilityCenter />;
    }

    if (page === "reputation-center") {
      return <ReputationCenter />;
    }

    if (page === "achievement-center") {
      return <AchievementCenter />;
    }

    if (page === "notification-center") {
      return <NotificationCenter />;
    }

    if (page === "admin-p2p") {
      return adminOnlyPanel(AdminP2P);
    }

    if (page === "admin") {
      return adminOnlyPanel(AdminPanel);
    }

    if (page === "admin-rewards") {
      return adminOnlyPanel(AdminRewards);
    }

    if (page === "admin-learn") {
      return adminOnlyPanel(AdminLearnEarn);
    }

    if (page === "admin-referrals") {
      return adminOnlyPanel(AdminReferrals);
    }

    if (page === "owner-control") {
      return ownerOnlyPanel(OwnerControl);
    }

    if (page === "super-admin") {
      return superAdminOnlyPanel(SuperAdminPanel);
    }

    if (page === "moderator-panel") {
      return moderatorOnlyPanel(ModeratorPanel);
    }

    if (page === "settings") {
      return <Settings setPage={setPage} />;
    }

    return (
      <div className="panel">
        <h2>
          {String(page || "PAGE").toUpperCase()}
        </h2>

        <p>This section is coming soon.</p>

        <button
          type="button"
          className="buy-btn"
          onClick={() => setPage("transactions")}
        >
          Open Transaction History
        </button>
      </div>
    );
  };

  const menuItems = [
    ["profile", "👤 Profile"],
    ["dashboard", "📊 Dashboard"],
    ["markets", "📈 Markets"],
    ["trade", "💱 Spot Trading"],
    ["futures", "📉 Futures"],
    ["buy", "💳 Buy Crypto"],
    ["p2p", "🌍 P2P"],
    ["staking", "🔒 Staking"],
    ["learnearn", "🎓 Learn & Earn"],
    ["ai-assistant", "🤖 AI Trading Assistant"],
    ["ai-copy-trading", "🔁 AI Copy Trading"],
    ["ai-portfolio", "📂 AI Portfolio Manager"],
    ["social-trading", "👥 Social Trading"],
    ["ai-risk-manager", "🛡️ AI Risk Manager"],
    [
      "ai-profit-calculator",
      "💰 AI Profit Calculator",
    ],
    ["ai-market-scanner", "🔎 AI Market Scanner"],
    ["ai-news", "📰 AI News"],
    ["ai-whale-tracker", "🐋 AI Whale Tracker"],
    [
      "ai-arbitrage-scanner",
      "⚡ AI Arbitrage Scanner",
    ],
    ["ai-grid-trading", "🧮 AI Grid Trading"],
    ["ai-smart-alerts", "🚨 AI Smart Alerts"],
    ["ai-launchpad", "🚀 AI Launchpad"],
    ["ai-whale-heatmap", "🔥 AI Whale Heatmap"],
    ["ai-trust-score", "✅ AI Trust Score"],
    ["ai-whale-alerts", "🐳 AI Whale Alerts"],
    [
      "exalt-utility-center",
      "🧰 Exalt Utility Center",
    ],
    [
      "reputation-center",
      "⭐ Community Reputation",
    ],
    [
      "achievement-center",
      "🏆 Achievement Center",
    ],
    [
      "notification-center",
      "🔔 Notification Center",
    ],
    ["wallets", "👛 Wallets"],
    ["web3wallet", "🌐 Web3 Wallet"],
    ["orders", "📦 Orders"],
    ["kyc-submit", "📝 Submit KYC"],
    ["listings", "📌 Submit Listing"],
    ["referral", "🤝 Referral"],
    ["transactions", "📜 Transactions"],
    ["rewards", "🎁 Rewards"],
    ["support", "🎧 Support"],
    ["settings", "⚙️ Settings"],
  ];

  const adminMenuItems = [
    ["admin-p2p", "🧾 Admin P2P"],
    ["kyc", "🪪 KYC Requests"],
    ["admin-learn", "🎓 Admin Learn & Earn"],
    ["admin-referrals", "🤝 Admin Referrals"],
    ["admin-rewards", "🎁 Admin Rewards"],
    ["admin", "⚙️ Admin Panel"],
  ];

  const ownerMenuItems = [
    ["owner-control", "👑 Owner Control"],
  ];

  const superAdminMenuItems = [
    ["super-admin", "🛡️ Super Admin"],
  ];

  const moderatorMenuItems = [
    ["moderator-panel", "🧰 Moderator Panel"],
  ];

  const openPage = (pageName) => {
    setPage(pageName);
    setMenuOpen(false);
  };

  if (authChecking && isLoggedIn) {
    return (
      <div className="app">
        <main className="main auth-only">
          <div className="panel">
            <h2>Verifying secure session...</h2>
            <p>
              Please wait while your account is verified.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="app">
        <main className="main auth-only">
          {page === "forgot-password" && (
            <ForgotPassword setPage={setPage} />
          )}

          {page === "verify-reset-code" && (
            <VerifyResetCode setPage={setPage} />
          )}

          {page === "reset-password" && (
            <ResetPassword setPage={setPage} />
          )}

          {![
            "forgot-password",
            "verify-reset-code",
            "reset-password",
          ].includes(page) && (
            <AuthPanel
              setPage={setPage}
              setCurrentUser={setCurrentUser}
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      {page !== "dashboard" &&
        page !== "web3wallet" && (
          <button
            type="button"
            onClick={() => setPage("dashboard")}
            style={{
              position: "fixed",
              top: "12px",
              left: "12px",
              zIndex: 99999,
              background: "#f5a623",
              color: "#111",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        )}

      <button
        type="button"
        className="mobile-menu-btn"
        aria-label="Open navigation menu"
        aria-expanded={menuOpen}
        onClick={() =>
          setMenuOpen((open) => !open)
        }
      >
        ☰
      </button>

      <aside
        className={`sidebar ${
          menuOpen ? "open" : ""
        }`}
      >
        <img
          src={exchangeLogo}
          alt="Exalt Exchange"
          className="main-logo"
        />

        <div className="menu">
          {menuItems.map(([key, label]) => {
            const firstSpaceIndex =
              label.indexOf(" ");

            const icon =
              firstSpaceIndex >= 0
                ? label.slice(0, firstSpaceIndex)
                : "";

            const fallbackLabel =
              firstSpaceIndex >= 0
                ? label.slice(firstSpaceIndex + 1)
                : label;

            return (
              <button
                type="button"
                key={key}
                className={`menu-btn ${
                  page === key ? "active" : ""
                }`}
                onClick={() => openPage(key)}
              >
                <span aria-hidden="true">
                  {icon}
                </span>{" "}
                {translateWithFallback(
                  key,
                  fallbackLabel,
                  "navigation"
                )}
              </button>
            );
          })}

          {hasAdminAccess &&
            adminMenuItems.map(([key, label]) => {
              const firstSpaceIndex =
                label.indexOf(" ");

              const icon =
                firstSpaceIndex >= 0
                  ? label.slice(
                      0,
                      firstSpaceIndex
                    )
                  : "";

              const fallbackLabel =
                firstSpaceIndex >= 0
                  ? label.slice(
                      firstSpaceIndex + 1
                    )
                  : label;

              return (
                <button
                  type="button"
                  key={key}
                  className={`menu-btn ${
                    page === key ? "active" : ""
                  }`}
                  onClick={() => openPage(key)}
                >
                  <span aria-hidden="true">
                    {icon}
                  </span>{" "}
                  {translateWithFallback(
                    key,
                    fallbackLabel,
                    "navigation"
                  )}
                </button>
              );
            })}

          {hasOwnerAccess &&
            ownerMenuItems.map(([key, label]) => {
              const firstSpaceIndex = label.indexOf(" ");

              const icon =
                firstSpaceIndex >= 0
                  ? label.slice(0, firstSpaceIndex)
                  : "";

              const fallbackLabel =
                firstSpaceIndex >= 0
                  ? label.slice(firstSpaceIndex + 1)
                  : label;

              return (
                <button
                  type="button"
                  key={key}
                  className={`menu-btn ${
                    page === key ? "active" : ""
                  }`}
                  onClick={() => openPage(key)}
                >
                  <span aria-hidden="true">{icon}</span>{" "}
                  {translateWithFallback(
                    key,
                    fallbackLabel,
                    "navigation"
                  )}
                </button>
              );
            })}

          {hasSuperAdminAccess &&
            superAdminMenuItems.map(([key, label]) => {
              const firstSpaceIndex = label.indexOf(" ");

              const icon =
                firstSpaceIndex >= 0
                  ? label.slice(0, firstSpaceIndex)
                  : "";

              const fallbackLabel =
                firstSpaceIndex >= 0
                  ? label.slice(firstSpaceIndex + 1)
                  : label;

              return (
                <button
                  type="button"
                  key={key}
                  className={`menu-btn ${
                    page === key ? "active" : ""
                  }`}
                  onClick={() => openPage(key)}
                >
                  <span aria-hidden="true">{icon}</span>{" "}
                  {translateWithFallback(
                    key,
                    fallbackLabel,
                    "navigation"
                  )}
                </button>
              );
            })}

          {hasModeratorAccess &&
            moderatorMenuItems.map(([key, label]) => {
              const firstSpaceIndex = label.indexOf(" ");

              const icon =
                firstSpaceIndex >= 0
                  ? label.slice(0, firstSpaceIndex)
                  : "";

              const fallbackLabel =
                firstSpaceIndex >= 0
                  ? label.slice(firstSpaceIndex + 1)
                  : label;

              return (
                <button
                  type="button"
                  key={key}
                  className={`menu-btn ${
                    page === key ? "active" : ""
                  }`}
                  onClick={() => openPage(key)}
                >
                  <span aria-hidden="true">{icon}</span>{" "}
                  {translateWithFallback(
                    key,
                    fallbackLabel,
                    "navigation"
                  )}
                </button>
              );
            })}
        </div>

        <div className="coin-box">
          {wallet && (
            <>
              <p>{shortWallet}</p>
              <p>{bnbBalance} BNB</p>
            </>
          )}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topbar-main-row">
            <div className="topbar-brand">
              <img
                src={exchangeLogo}
                alt="Exalt Exchange"
                className="topbar-logo"
              />

              <div>
                <h2>
                  {page === "trade"
                    ? translateWithFallback(
                        "spotTrading",
                        "Spot Trading",
                        "trading"
                      )
                    : translateWithFallback(
                        page,
                        String(
                          page || "Dashboard"
                        ).toUpperCase(),
                        "navigation"
                      )}
                </h2>

                <p>
                  {page === "trade"
                    ? translateWithFallback(
                        "spotTradingSubtitle",
                        "Professional Spot Trading Engine Powered by Exalt Exchange",
                        "trading"
                      )
                    : "Secure • Fast • Global Digital Asset Exchange"}
                </p>

                {wallet && (
                  <p>
                    BNB Balance: {bnbBalance} BNB
                  </p>
                )}
              </div>
            </div>

            <NotificationBell
              setPage={setPage}
            />

            <button
              type="button"
              className="topbar-profile-btn"
              aria-label="Open profile"
              onClick={() => setPage("profile")}
            >
              👤
            </button>
          </div>

          <div className="topbar-language-row">
            <LanguageSwitcher />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          {!wallet && (
            <button
              type="button"
              className="connect-btn"
              onClick={connectWallet}
            >
              {translateWithFallback(
                "connectWallet",
                "Connect Wallet",
                "web3"
              )}
            </button>
          )}

          <button
            type="button"
            className="connect-btn"
            onClick={logout}
          >
            {translateWithFallback(
              "logout",
              "Logout",
              "auth"
            )}
          </button>
        </div>

        {renderPage()}

        <footer className="legal-footer-links">
          <a href="/legal">Legal Center</a>
          <a href="/privacy">
            Privacy Policy
          </a>
          <a href="/terms">Terms</a>
          <a href="/delete-account">
            Delete Account
          </a>
          <a href="/aml">AML</a>
          <a href="/kyc-policy">KYC</a>
          <a href="/risk">Risk</a>
          <a href="/cookies">Cookies</a>
          <a href="/refund">Refund</a>
          <a href="/compliance">
            Compliance
          </a>
        </footer>
      </main>
    </div>
  );
}

export default App;