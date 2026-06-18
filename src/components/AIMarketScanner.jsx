import "./AIMarketScanner.css";

export default function AIMarketScanner() {
  const bullish = [
    { pair: "BTCUSDT", signal: "Strong Buy", confidence: "94%", volume: "+28%" },
    { pair: "ETHUSDT", signal: "Buy", confidence: "88%", volume: "+19%" },
    { pair: "SOLUSDT", signal: "Buy", confidence: "84%", volume: "+35%" },
  ];

  const bearish = [
    { pair: "DOGEUSDT", signal: "Sell", confidence: "71%", volume: "-12%" },
    { pair: "ADAUSDT", signal: "Weak", confidence: "68%", volume: "-9%" },
    { pair: "XRPUSDT", signal: "Sell", confidence: "74%", volume: "-15%" },
  ];

  return (
    <div className="scanner-page">
      <div className="scanner-header">
        <h1>AI Market Scanner</h1>
        <p>Scan bullish coins, bearish coins, volume spikes, and AI market opportunities.</p>
      </div>

      <div className="scanner-stats">
        <div>
          <span>Market Status</span>
          <h2>Bullish</h2>
        </div>
        <div>
          <span>Volume Spikes</span>
          <h2>12</h2>
        </div>
        <div>
          <span>AI Confidence</span>
          <h2>91%</h2>
        </div>
        <div>
          <span>Trending Assets</span>
          <h2>24</h2>
        </div>
      </div>

      <div className="scanner-grid">
        <div className="scanner-box">
          <h2>Bullish Coins</h2>
          {bullish.map((coin, index) => (
            <div className="scan-row" key={index}>
              <strong>{coin.pair}</strong>
              <span>{coin.signal}</span>
              <b className="green">{coin.confidence}</b>
              <small>{coin.volume}</small>
            </div>
          ))}
        </div>

        <div className="scanner-box">
          <h2>Bearish Coins</h2>
          {bearish.map((coin, index) => (
            <div className="scan-row" key={index}>
              <strong>{coin.pair}</strong>
              <span>{coin.signal}</span>
              <b className="red">{coin.confidence}</b>
              <small>{coin.volume}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="scanner-recommend">
        <h2>AI Recommendation</h2>
        <p>BTCUSDT shows strong bullish momentum with high confidence and increasing volume.</p>
        <button>Open Signal</button>
      </div>
    </div>
  );
}