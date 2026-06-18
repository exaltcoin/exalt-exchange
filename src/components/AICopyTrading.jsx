import "./AICopyTrading.css";

export default function AICopyTrading() {
  const traders = [
    {
      name: "Alpha AI Trader",
      roi: "+128%",
      winRate: "86%",
      risk: "Low",
      followers: "12.4K",
      copyAmount: "50 USDT",
    },
    {
      name: "Smart Whale Bot",
      roi: "+92%",
      winRate: "78%",
      risk: "Medium",
      followers: "8.9K",
      copyAmount: "100 USDT",
    },
    {
      name: "EXALT Quant AI",
      roi: "+156%",
      winRate: "91%",
      risk: "Low",
      followers: "15.7K",
      copyAmount: "75 USDT",
    },
  ];

  return (
    <div className="copy-page">
      <div className="copy-header">
        <h1>AI Copy Trading</h1>
        <p>Follow AI-ranked traders and copy strategies automatically.</p>
      </div>

      <div className="copy-stats">
        <div>
          <span>Total Copiers</span>
          <h2>0</h2>
        </div>
        <div>
          <span>Active Strategies</span>
          <h2>3</h2>
        </div>
        <div>
          <span>AI Risk Engine</span>
          <h2>Enabled</h2>
        </div>
      </div>

      <div className="trader-list">
        {traders.map((trader, index) => (
          <div className="copy-card" key={index}>
            <div className="trader-head">
              <div className="trader-icon">
                {trader.name.charAt(0)}
              </div>

              <div>
                <h3>{trader.name}</h3>
                <p>AI Ranked Trader #{index + 1}</p>
              </div>
            </div>

            <div className="copy-metrics">
              <div>
                <span>ROI</span>
                <strong>{trader.roi}</strong>
              </div>
              <div>
                <span>Win Rate</span>
                <strong>{trader.winRate}</strong>
              </div>
              <div>
                <span>Risk</span>
                <strong>{trader.risk}</strong>
              </div>
              <div>
                <span>Followers</span>
                <strong>{trader.followers}</strong>
              </div>
            </div>

            <div className="copy-footer">
              <span>Suggested Copy: {trader.copyAmount}</span>
              <button>Copy Trader</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}