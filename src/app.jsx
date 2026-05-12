import { useState } from "react";
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

function App() {
  const [page, setPage] = useState("dashboard");
  const [wallet, setWallet] = useState("");
  const [bnbBalance, setBnbBalance] = useState("0.0000");

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask یا Trust Wallet browser install/open کریں");
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
    if (page === "orders") return <Orders />;
    if (page === "referral") return <Referral />;
    if (page === "rewards") return <Rewards />;
    if (page === "support") return <Support />;
    if (page === "listings") return <ListingForm />;
    if (page === "admin") return <AdminPanel />;

    return (
      <div className="panel">
        <h2>{page.toUpperCase()}</h2>
        <p>This section is coming soon.</p>
      </div>
    );
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="logo">EXALTEXCHANGE</h1>

        <div className="menu">
          <button onClick={() => setPage("dashboard")}>Dashboard</button>
          <button onClick={() => setPage("markets")}>Markets</button>
          <button onClick={() => setPage("trade")}>Trade</button>
          <button onClick={() => setPage("buy")}>Buy Crypto</button>
          <button onClick={() => setPage("wallets")}>Wallets</button>
          <button onClick={() => setPage("orders")}>Orders</button>
          <button onClick={() => setPage("listings")}>Submit Listing</button>
          <button onClick={() => setPage("referral")}>Referral</button>
          <button onClick={() => setPage("rewards")}>Rewards</button>
          <button onClick={() => setPage("support")}>Support</button>
          <button onClick={() => setPage("admin")}>Admin</button>
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

        {renderPage()}
      </main>
    </div>
  );
}

export default App;