import "./AITradingAssistant.css";

export default function AITradingAssistant() {
  return (
    <div className="ai-page">

      <div className="ai-header">
        <h1>AI Trading Assistant</h1>
        <p>Smart AI signals and market insights</p>
      </div>

      <div className="ai-grid">

        <div className="ai-card">
          <h3>Trend</h3>
          <h2>Bullish 📈</h2>
        </div>

        <div className="ai-card">
          <h3>Entry Price</h3>
          <h2>105,250 USDT</h2>
        </div>

        <div className="ai-card">
          <h3>Take Profit</h3>
          <h2>108,000 USDT</h2>
        </div>

        <div className="ai-card">
          <h3>Stop Loss</h3>
          <h2>103,800 USDT</h2>
        </div>

        <div className="ai-card">
          <h3>Confidence Score</h3>
          <h2>92%</h2>
        </div>

      </div>

      <div className="signal-box">
        <h2>AI Signal</h2>

        <div className="signal-card">
          <span>BTCUSDT</span>
          <strong>BUY</strong>
        </div>

        <button className="signal-btn">
          View Details
        </button>
      </div>

    </div>
  );
}