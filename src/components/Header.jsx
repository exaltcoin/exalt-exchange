import exchangeLogo from "../assets/exalt-exchange.png";
function Header() {
  return (
    <header className="topbar">
<img
  src={exchangeLogo}
  alt="Exalt Exchange"
  style={{
    width: "55px",
    height: "55px",
    objectFit: "contain"
  }}
/>
      <div className="menu">
        <span>Markets</span>
        <span>Trade</span>
        <span>Launchpad</span>
        <span>Earn</span>
      </div>

      <button className="deposit-btn">
        Deposit
      </button>

    </header>
  );
}

export default Header;