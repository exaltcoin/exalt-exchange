import exchangeLogo from "./assets/exalt-exchange.png";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
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
import VerifyEmail from "./components/VerifyEmail";

function App() {
  const path = window.location.pathname;

  if (path.startsWith("/verify-email/")) {
    return <VerifyEmail />;
  }
if (path.startsWith("/ref/")) {
  const referralCode = path.split("/ref/")[1];

  if (referralCode) {
    localStorage.setItem("pendingReferralCode", referralCode);
    window.history.replaceState({}, "", "/");
  }
}
 const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
  const [page, setPage] = useState(() =>
    localStorage.getItem("token") ? "dashboard" : "auth"
  );

  const [wallet, setWallet] = useState("");
  const [bnbBalance, setBnbBalance] = useState("0.0000");
  const [menuOpen, setMenuOpen] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!localStorage.getItem("token");
  const userEmail = storedUser?.email || "User";
  const isAdmin = storedUser?.role === "admin";

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setPage("auth");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem("user", JSON.stringify(data.user));
          setPage("dashboard");
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setPage("auth");
        }
      } catch (error) {
        console.log(error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setPage("auth");
      }
    };

    checkAuth();
  }, [API_BASE]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setWallet("");
    setBnbBalance("0.0000");
    setPage("auth");

    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const connectWallet = async () => {
    try {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const siteUrl = "exaltexchange.io";

      if (!window.ethereum) {
        if (isMobile) {
          window.location.href = `https://metamask.app.link/dapp/${siteUrl}`;
          return;
        }

        alert("Please install MetaMask extension");
        return;
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (!accounts || !accounts.length) {
        alert("No wallet account found");
        return;
      }

      const address = accounts[0];
      const balance = await provider.getBalance(address);

      setWallet(address);
      setBnbBalance(Number(ethers.formatEther(balance)).toFixed(4));

      alert("Wallet Connected Successfully");
    } catch (error) {
      console.log(error);
      alert("Wallet connection failed");
    }
  };

  const shortWallet = wallet
    ? wallet.slice(0, 6) + "..." + wallet.slice(-4)
    : "Connect Wallet";

  if (!isLoggedIn) {
    return (
      <div className="app">
        <main className="main auth-only">
          <AuthPanel setPage={setPage} />
        </main>
      </div>
    );
  }

  const adminOnlyPanel = (Component) => {
    if (!isAdmin) {
      return (
        <div className="panel">
          <h2>Access Denied</h2>
          <p>Only admin can access this panel.</p>
        </div>
      );
    }

    return <Component />;
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

    if (page === "markets") return <Markets />;
   if (page === "trade") return <Trade setPage={setPage} />;
    if (page === "buy") return <BuyCrypto />;
    if (page === "futures") return <Futures setPage={setPage} />;
    if (page === "wallets") return <Wallets />;
    if (page === "web3wallet") return <Web3Wallet />;
    if (page === "transactions") return <Transactions />;
    if (page === "orders") return <Orders />;
    if (page === "p2p") return <P2P />;
    if (page === "kyc") return adminOnlyPanel(AdminKycPanel);
    if (page === "kyc-submit") return <KycVerification />;
    if (page === "referral") return <Referral />;
    if (page === "rewards") return <ReplitRewards />;
    if (page === "support") return <Support />;
    if (page === "listings") return <ListingForm />;
    if (page === "profile") return <Profile setPage={setPage} />;
    if (page === "staking") return <Staking />;
    if (page === "learnearn") return <LearnEarn />;
    if (page === "ai-assistant") return <AITradingAssistant />;
    if (page === "ai-copy-trading") return <AICopyTrading />;
    if (page === "ai-portfolio") return <AIPortfolioManager />;
    if (page === "social-trading") return <SocialTrading />;
    if (page === "ai-risk-manager") return <AIRiskManager />;
    if (page === "ai-profit-calculator") return <AIProfitCalculator />;
    if (page === "ai-market-scanner") return <AIMarketScanner />;
    if (page === "ai-news") return <AINews />;
    if (page === "ai-whale-tracker") return <AIWhaleTracker />;
    if (page === "ai-arbitrage-scanner") return <AIArbitrageScanner />;
    if (page === "ai-grid-trading") return <AIGridTrading />;
    if (page === "ai-smart-alerts") return <AISmartAlerts />;
    if (page === "ai-launchpad") return <AILaunchpad />;
    if (page === "ai-whale-heatmap") return <AIWhaleHeatmap />;
    if (page === "ai-trust-score") return <AITrustScore />;
    if (page === "ai-whale-alerts") return <AIWhaleAlert />;
    if (page === "exalt-utility-center") return <ExaltUtilityCenter />;
    if (page === "reputation-center") return <ReputationCenter />;
    if (page === "achievement-center") return <AchievementCenter />;
    if (page === "notification-center") return <NotificationCenter />;
    if (page === "admin-p2p") return adminOnlyPanel(AdminP2P);
    if (page === "admin") return adminOnlyPanel(AdminPanel);
    if (page === "admin-rewards") return adminOnlyPanel(AdminRewards);
    if (page === "admin-learn") return adminOnlyPanel(AdminLearnEarn);
    if (page === "admin-referrals") return adminOnlyPanel(AdminReferrals);
    if (page === "settings") return <Settings />;

    return (
      <div className="panel">
        <h2>{page.toUpperCase()}</h2>
        <p>This section is coming soon.</p>
        <button className="buy-btn" onClick={() => setPage("transactions")}>
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
    ["ai-profit-calculator", "💰 AI Profit Calculator"],
    ["ai-market-scanner", "🔎 AI Market Scanner"],
    ["ai-news", "📰 AI News"],
    ["ai-whale-tracker", "🐋 AI Whale Tracker"],
    ["ai-arbitrage-scanner", "⚡ AI Arbitrage Scanner"],
    ["ai-grid-trading", "🧮 AI Grid Trading"],
    ["ai-smart-alerts", "🚨 AI Smart Alerts"],
    ["ai-launchpad", "🚀 AI Launchpad"],
    ["ai-whale-heatmap", "🔥 AI Whale Heatmap"],
    ["ai-trust-score", "✅ AI Trust Score"],
    ["ai-whale-alerts", "🐳 AI Whale Alerts"],
    ["exalt-utility-center", "🧰 Exalt Utility Center"],
    ["reputation-center", "⭐ Community Reputation"],
    ["achievement-center", "🏆 Achievement Center"],
    ["notification-center", "🔔 Notification Center"],
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
  ["admin", "⚙️ Admin"],
];
  const openPage = (pageName) => {
    setPage(pageName);
    setMenuOpen(false);
  };

  return (
    <div className="app">
      <button
        className="mobile-menu-btn"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <img src={exchangeLogo} alt="Exalt Exchange" className="main-logo" />

        <div className="user-profile sidebar-profile">
          <div className="user-avatar">{userEmail.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{userEmail}</strong>
            <p>{wallet ? shortWallet : "Wallet not connected"}</p>
          </div>
        </div>

        <div className="menu">
          {menuItems.map(([key, label]) => (
            <button
              key={key}
              className={`menu-btn ${page === key ? "active" : ""}`}
              onClick={() => openPage(key)}
            >
              {label}
            </button>
          ))}

          {isAdmin &&
            adminMenuItems.map(([key, label]) => (
              <button
                key={key}
                className={`menu-btn ${page === key ? "active" : ""}`}
                onClick={() => openPage(key)}
              >
                {label}
              </button>
            ))}
        </div>

        <div className="coin-box">
       
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h2>{page === "trade" ? "SPOT TRADING" : page.toUpperCase()}</h2>
            <p>
              {page === "trade"
                ? "Professional Spot Trading Engine Powered by Exalt Exchange"
                : "Secure • Fast • Global Digital Asset Exchange"}
            </p>
            {wallet && <p>BNB Balance: {bnbBalance} BNB</p>}
          </div>

          <button className="connect-btn" onClick={connectWallet}>
            {shortWallet}
          </button>
        </div>

        <button className="connect-btn" onClick={logout}>
          Logout
        </button>

        {renderPage()}
      </main>
    </div>
  );
}

export default App;