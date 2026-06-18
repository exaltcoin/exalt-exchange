import "./AIWhaleHeatmap.css";

export default function AIWhaleHeatmap() {
  const whales = [
    {
      coin: "BTCUSDT",
      volume: "$12.8M",
      signal: "Strong Buy",
      confidence: "96%",
      flow: "Bullish",
    },
    {
      coin: "ETHUSDT",
      volume: "$8.2M",
      signal: "Buy",
      confidence: "91%",
      flow: "Bullish",
    },
    {
      coin: "SOLUSDT",
      volume: "$5.7M",
      signal: "Neutral",
      confidence: "83%",
      flow: "Mixed",
    },
  ];

  return (
    <div className="heatmap-page">

      <div className="heatmap-header">
        <h1>AI Whale Heatmap</h1>
        <p>
          Track whale activity, smart money movement and AI liquidity analysis.
        </p>
      </div>

      <div className="heatmap-stats">

        <div className="heatmap-card">
          <span>Whale Transactions</span>
          <h2>132</h2>
        </div>

        <div className="heatmap-card">
          <span>AI Confidence</span>
          <h2>94%</h2>
        </div>

        <div className="heatmap-card">
          <span>Bullish Flow</span>
          <h2>71%</h2>
        </div>

        <div className="heatmap-card">
          <span>Large Wallets</span>
          <h2>28</h2>
        </div>

      </div>

      <div className="heatmap-table">

        <div className="heatmap-head">
          <span>Coin</span>
          <span>Whale Volume</span>
          <span>Signal</span>
          <span>Confidence</span>
          <span>Flow</span>
          <span>Action</span>
        </div>

        {whales.map((item, index) => (
          <div className="heatmap-row" key={index}>

            <strong>{item.coin}</strong>

            <span>{item.volume}</span>

            <span className="signal-color">{item.signal}</span>

            <span className="confidence-color">
              {item.confidence}
            </span>

            <span className="flow-color">{item.flow}</span>

            <button>View Heatmap</button>

          </div>
        ))}
      </div>

      <div className="heatmap-ai">

        <h2>AI Recommendation</h2>

        <p>
          BTCUSDT currently shows strong whale accumulation. Smart money
          flow remains bullish with high confidence.
        </p>

      </div>

    </div>
  );
}