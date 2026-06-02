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
import Rewards from "./components/Rewards";
import Support from "./components/Support";
import AdminPanel from "./AdminPanel";
import Wallets from "./components/Wallets";
import Settings from "./components/Settings";
import Transactions from "./components/Transactions";
import AuthPanel from "./components/AuthPanel";
import TradingPanel from "./components/TradingPanel";
import OrderBook from "./components/OrderBook";
import P2P from "./components/P2P";
import AdminP2P from "./components/AdminP2P";
import Futures from "./components/Futures";
import ReplitRewards from "./replit_ui/Rewards";
import ReplitTrade from "./replit_ui/Trade";
import ReplitFutures from "./replit_ui/Futures";
function App() {
 const [page, setPage] = useState("auth"); 
  const [wallet, setWallet] = useState("");
  const [bnbBalance, setBnbBalance] = useState("0.0000");
const [menuOpen, setMenuOpen] = useState(false);
useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setPage("auth");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
}, []);
const isLoggedIn =
  typeof window !== "undefined" &&
  !!localStorage.getItem("token");
/*
if (!isLoggedIn) {
  return (
    <div className="app">
      <main className="main auth-only">
        <AuthPanel setPage={setPage} />
      </main>
    </div>
  );
}
  */
const logout = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setWallet("");
    setBnbBalance("0.0000");

    setPage("auth");

    alert("Logout successful");

    setTimeout(() => {
      window.location.reload();
    }, 300);
  } catch (error) {
    console.log(error);
  }
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
const storedUser = JSON.parse(
  localStorage.getItem("user") || "{}"
);

const userEmail = storedUser?.email || "User";
  const renderPage = () => {
    if (page === "dashboard")
  return (
    <>
     <Dashboard setPage={setPage} />
      <TradingPanel />
      <OrderBook />
    </>
  );
    if (page === "markets") return <Markets />;
    if (page === "trade") return <Trade />;
    if (page === "buy") return <BuyCrypto />;
    if (page === "futures") return <Futures />;
    if (page === "wallets") return <Wallets />;
    if (page === "transactions") return <Transactions />;
    if (page === "orders") return <Orders />;
    if (page === "p2p") return <P2P />;
    if (page === "referral") return <Referral />;
    if (page === "rewards") return <ReplitRewards />;
    if (page === "support") return <Support />;
    if (page === "listings") return <ListingForm />;
    if (page === "admin-p2p") return <AdminP2P />;
    if (page === "admin") {
 const user =
  JSON.parse(localStorage.getItem("user") || "{}") || {};
  if (user.role !== "admin") {
    return (
      <div className="panel">
        <h2>Access Denied</h2>
        <p>Only admin can access this panel.</p>
      </div>
    );
  }

  return <AdminPanel />;
}
    if (page === "settings") return <Settings />;
    if (page === "auth") return <AuthPanel setPage={setPage} />;
    return (
      <div className="panel">
        <h2>{page.toUpperCase()}</h2>
        <p>This section is coming soon.</p>
        <button
  className="buy-btn"
  onClick={() => setPage("transactions")}
>
  Open Transaction History
</button>
      </div>
    );
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
      
       <img
  src={exchangeLogo}
  alt="Exalt Exchange"
  className="main-logo"
/>
      <div className="user-profile sidebar-profile">
  <div className="user-avatar">
    {userEmail.charAt(0).toUpperCase()}
  </div>
  <div>
    <strong>{userEmail}</strong>
    <p>{wallet ? shortWallet : "Wallet not connected"}</p>
  </div>
</div>
       <div className="menu">

  <button
    onClick={() => {
      setPage("dashboard");
      setMenuOpen(false);
    }}
  >
    Dashboard
  </button>

  <button
    onClick={() => {
      setPage("markets");
      setMenuOpen(false);
    }}
  >
    Markets
  </button>

  <button
    onClick={() => {
      setPage("trade");
      setMenuOpen(false);
    }}
  >
    Trade
  </button>
<button
  onClick={() => {
    setPage("futures");
    setMenuOpen(false);
  }}
>
  Futures
</button>
  <button
    onClick={() => {
      setPage("buy");
      setMenuOpen(false);
    }}
  >
    Buy Crypto
  </button>

  <button
  onClick={() => {
    setPage("p2p");
    setMenuOpen(false);
  }}
>
  P2P
</button>

<button
  onClick={() => {
    setPage("wallets");
    setMenuOpen(false);
  }}
>
  Wallets
</button>

  <button
    onClick={() => {
      setPage("orders");
      setMenuOpen(false);
    }}
  >
    Orders
  </button>
<button
  onClick={() => {
    setPage("admin-p2p");
    setMenuOpen(false);
  }}
>
  Admin P2P
</button>
  <button
    onClick={() => {
      setPage("listings");
      setMenuOpen(false);
    }}
  >
    Submit Listing
  </button>

  <button
    onClick={() => {
      setPage("referral");
      setMenuOpen(false);
    }}
  >
    Referral
  </button>
<button
  onClick={() => {
    setPage("transactions");
    setMenuOpen(false);
  }}
>
  Transactions
</button>
  <button
    onClick={() => {
      setPage("rewards");
      setMenuOpen(false);
    }}
  >
    Rewards
  </button>

  <button
    onClick={() => {
      setPage("support");
      setMenuOpen(false);
    }}
  >
    Support
  </button>
<button
  onClick={() => {
    setPage("admin");
    setMenuOpen(false);
  }}
>
  Admin
</button>

  <button
    onClick={() => {
      setPage("settings");
      setMenuOpen(false);
    }}
  >
    Settings
  </button>

</div>

        <div className="coin-box">
          <h3>EXALT Coin</h3>
          <p>$0.02456</p>
          <span>+8.62%</span>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h2>{page.toUpperCase()}</h2>
            <p>Exalt Exchange Live Market System</p>
            {wallet && <p>BNB Balance: {bnbBalance} BNB</p>}
            </div>
          <button className="connect-btn" onClick={connectWallet}>
            {shortWallet}
          </button>
        </div>
{localStorage.getItem("token") && (
  <button className="connect-btn" onClick={logout}>
    Logout
  </button>
)}
        {renderPage()}
      </main>
    </div>
  );
}

export default App;