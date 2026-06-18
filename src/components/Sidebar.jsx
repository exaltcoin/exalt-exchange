import { useState } from "react";
import exchangeLogo from "../assets/exalt-exchange.png";
function Sidebar({ activePage, setActivePage }) {
  const [mobileOpen, setMobileOpen] = useState(false);
 const menuItems = [
  "Profile",
  "Dashboard",
  "P2P",
  "Markets",
  " Spot Trading",
  "Futures",
  "Buy Crypto",
  "Staking",
  "LearnEarn",
  "AI Assistant",
  "AI Copy Trading",
  "AI Portfolio Manager",
  "Social Trading",
  "AI Risk Manager",
  "AI Profit Calculator",
  "AI Market Scanner",
  "AI News",
  "AI Whale Tracker",
  "AI Arbitrage Scanner",
  "AI Grid Trading",
  "AI Smart Alerts",
  "Wallets",
  "Orders",
  "Listings",
  "Referral",
  "transactions",
  "Rewards",
  "Support",
  "Admin",
  "KYC Requests",
  "Submit KYC",
  "Admin-P2P",
  "Settings",
];

 return (
  <>
    <button
      className="mobile-menu-btn"
      onClick={() => setMobileOpen(!mobileOpen)}
    >
      ☰
    </button>

    <aside className={mobileOpen ? "sidebar show" : "sidebar"}>
  <div className="exchange-brand">
    <img
      src={exchangeLogo}
      alt="Exalt Exchange"
      className="exchange-logo"
    />

    <div>
      <h2>EXALT</h2>
      <p>EXCHANGE</p>
    </div>
  </div>

  <ul>
      {menuItems.map((item) => (
        <li
            key={item}
            className={activePage === item ? "active" : ""}
          onClick={() => setActivePage(item.toLowerCase())}
            style={{ cursor: "pointer" }}
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="coin-card">
        <h3>EXALT Coin</h3>
        <p>$0.02456</p>
        <span>+8.62%</span>
      </div>
    </aside>
    </>
  );
}

export default Sidebar;