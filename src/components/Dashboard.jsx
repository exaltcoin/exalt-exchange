function Dashboard() {
  return (
    <div className="dashboard-page">

      <div className="hero-banner">
        <div>
          <h1>EXALT EXCHANGE</h1>
          <p>
            Next Generation Crypto Market Board & Community Exchange
          </p>
        </div>


      </div>

      <div className="stats-grid">

        <div className="stat-card glow-yellow">
          <h3>Portfolio Value</h3>
          <h1>$24,835</h1>
          <span className="green-text">+18.42%</span>
        </div>

        <div className="stat-card glow-blue">
          <h3>EXALT Holdings</h3>
          <h1>24,564,240 EXALT</h1>
          <span>Live Wallet Balance</span>
        </div>

        <div className="stat-card glow-green">
          <h3>Market Cap</h3>
          <h1>$303K</h1>
          <span>Live Market</span>
        </div>

        <div className="stat-card glow-red">
          <h3>Liquidity</h3>
          <h1>$178K</h1>
          <span>PancakeSwap LP</span>
        </div>

      </div>

      <div className="dashboard-row">

        <div className="big-panel">

          <div className="panel-header">
            <h2>Trending Coins</h2>
          </div>

          <div className="coin-row">
            <span>EXALT</span>
            <span>$0.02456</span>
            <span className="green-text">+8.62%</span>
          </div>

          <div className="coin-row">
            <span>BNB</span>
            <span>$612</span>
            <span className="green-text">+2.10%</span>
          </div>

          <div className="coin-row">
            <span>BTC</span>
            <span>$104,000</span>
            <span className="green-text">+1.12%</span>
          </div>

          <div className="coin-row">
            <span>ETH</span>
            <span>$4,120</span>
            <span className="red-text">-0.42%</span>
          </div>

        </div>

        <div className="big-panel">

          <div className="panel-header">
            <h2>Quick Actions</h2>
          </div>

          <button className="action-btn yellow-btn">
            Buy EXALT
          </button>

          <button className="action-btn green-btn">
            Launch Coin
          </button>

          <button className="action-btn blue-btn">
            Submit Listing
          </button>

          <button className="action-btn red-btn">
            View Market Board
          </button>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;