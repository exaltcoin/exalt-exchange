import "./AIPortfolioManager.css";

export default function AIPortfolioManager() {
  const holdings = [
    { asset: "EXALT", value: "$4,250", allocation: "42%", change: "+8.4%" },
    { asset: "USDT", value: "$2,800", allocation: "28%", change: "0.0%" },
    { asset: "BNB", value: "$1,950", allocation: "19%", change: "+3.2%" },
    { asset: "BTC", value: "$1,100", allocation: "11%", change: "+1.7%" },
  ];

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <h1>AI Portfolio Manager</h1>
        <p>AI-powered portfolio tracking, risk analysis, and smart rebalancing.</p>
      </div>

      <div className="portfolio-stats">
        <div className="portfolio-card">
          <span>Total Portfolio Value</span>
          <h2>$10,100</h2>
        </div>

        <div className="portfolio-card">
          <span>Total Profit / Loss</span>
          <h2 className="profit">+$1,280</h2>
        </div>

        <div className="portfolio-card">
          <span>AI Risk Score</span>
          <h2>Low Risk</h2>
        </div>

        <div className="portfolio-card">
          <span>Diversification</span>
          <h2>72%</h2>
        </div>
      </div>

      <div className="portfolio-main">
        <div className="portfolio-box">
          <h2>Top Holdings</h2>

          {holdings.map((coin, index) => (
            <div className="holding-row" key={index}>
              <div>
                <strong>{coin.asset}</strong>
                <p>{coin.allocation} allocation</p>
              </div>

              <div>
                <strong>{coin.value}</strong>
                <p className={coin.change.includes("+") ? "profit" : ""}>
                  {coin.change}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="portfolio-box">
          <h2>AI Recommendation</h2>

          <div className="ai-recommendation">
            <h3>Rebalance Suggested</h3>
            <p>
              AI suggests reducing high exposure assets and increasing stable
              holdings to improve risk control.
            </p>

            <button>Apply AI Rebalance</button>
          </div>

          <div className="risk-meter">
            <span>Risk Level</span>
            <div className="risk-bar">
              <div className="risk-fill"></div>
            </div>
            <strong>Low to Medium</strong>
          </div>
        </div>
      </div>
    </div>
  );
}