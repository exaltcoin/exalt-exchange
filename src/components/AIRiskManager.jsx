import "./AIRiskManager.css";

export default function AIRiskManager() {
  return (
    <div className="risk-page">

      <div className="risk-header">
        <h1>AI Risk Manager</h1>
        <p>Smart risk analysis and capital protection.</p>
      </div>

      <div className="risk-grid">

        <div className="risk-card">
          <span>Risk Level</span>
          <h2>Low</h2>
        </div>

        <div className="risk-card">
          <span>Portfolio Exposure</span>
          <h2>42%</h2>
        </div>

        <div className="risk-card">
          <span>Suggested Leverage</span>
          <h2>3x</h2>
        </div>

        <div className="risk-card">
          <span>Capital Protection</span>
          <h2>92%</h2>
        </div>

      </div>

      <div className="recommend-box">

        <h2>AI Recommendation</h2>

        <p>
          Market volatility is increasing.
          Reduce leverage and diversify holdings.
        </p>

        <button>
          Apply Safe Mode
        </button>

      </div>

    </div>
  );
}