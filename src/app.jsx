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
import AuthPanel from "./components/AuthPanel";
import Settings from "./components/Settings";

function App() {
 const [page, setPage] = useState("auth"); 
  const [wallet, setWallet] = useState("");
  const [bnbBalance, setBnbBalance] = useState("0.0000");
const [menuOpen, setMenuOpen] = useState(false);
useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    setPage("auth");
  } else {
    setPage("dashboard");
  }
}, []);
const isLoggedIn = !!localStorage.getItem("token");

if (!isLoggedIn) {
  return (
    <div className="app">
      <main className="main auth-only">
        <AuthPanel setPage={setPage} />
      </main>
    </div>
  );
}
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  setPage("auth");

  alert("Logout successful");

  window.location.reload();
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

  const renderPage = () => {
    if (page === "dashboard") return <Dashboard />;
    if (page === "markets") return <Markets />;
    if (page === "trade") return <Trade />;
    if (page === "buy") return <BuyCrypto />;
    if (page === "wallets") return <Wallets />;
    if (page === "orders") return <Orders />;
    if (page === "referral") return <Referral />;
    if (page === "rewards") return <Rewards />;
    if (page === "support") return <Support />;
    if (page === "listings") return <ListingForm />;
    if (page === "admin") return <AdminPanel />;
    if (page === "settings") return <Settings />;
    if (page === "auth") return <AuthPanel setPage={setPage} />;
    return (
      <div className="panel">
        <h2>{page.toUpperCase()}</h2>
        <p>This section is coming soon.</p>
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
      
        <h1 className="logo">EXALTEXCHANGE</h1>

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
      setPage("buy");
      setMenuOpen(false);
    }}
  >
    Buy Crypto
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