function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    "Dashboard",
    "Markets",
    "Trade",
    "Wallets",
    "Orders",
    "Listings",
    "Referral",
    "Rewards",
    "Support",
    "Admin",
  ];

  return (
    <aside className="sidebar">
      <h2>EXALTEXCHANGE</h2>

      <ul>
        {menuItems.map((item) => (
          <li
            key={item}
            className={activePage === item ? "active" : ""}
            onClick={() => setActivePage(item)}
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
  );
}

export default Sidebar;