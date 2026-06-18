import "./AIArbitrageScanner.css";

export default function AIArbitrageScanner() {
  const opportunities = [
    {
      pair: "BTC/USDT",
      buyExchange: "Binance",
      sellExchange: "Bybit",
      buyPrice: "105,200",
      sellPrice: "105,680",
      spread: "0.46%",
      profit: "+$48",
      risk: "Low",
    },
    {
      pair: "ETH/USDT",
      buyExchange: "OKX",
      sellExchange: "KuCoin",
      buyPrice: "3,420",
      sellPrice: "3,452",
      spread: "0.93%",
      profit: "+$32",
      risk: "Medium",
    },
    {
      pair: "SOL/USDT",
      buyExchange: "Gate",
      sellExchange: "Binance",
      buyPrice: "148.20",
      sellPrice: "150.10",
      spread: "1.28%",
      profit: "+$19",
      risk: "Low",
    },
  ];

  return (
    <div className="arbitrage-page">
      <div className="arbitrage-header">
        <h1>AI Arbitrage Scanner</h1>
        <p>Find price differences across exchanges and detect smart arbitrage opportunities.</p>
      </div>

      <div className="arbitrage-stats">
        <div>
          <span>Live Opportunities</span>
          <h2>3</h2>
        </div>
        <div>
          <span>Best Spread</span>
          <h2>1.28%</h2>
        </div>
        <div>
          <span>AI Confidence</span>
          <h2>91%</h2>
        </div>
        <div>
          <span>Risk Level</span>
          <h2>Low</h2>
        </div>
      </div>

      <div className="arbitrage-table">
        <div className="arbitrage-table-head">
          <span>Pair</span>
          <span>Buy From</span>
          <span>Sell On</span>
          <span>Buy Price</span>
          <span>Sell Price</span>
          <span>Spread</span>
          <span>Profit</span>
          <span>Risk</span>
          <span>Action</span>
        </div>

        {opportunities.map((item, index) => (
          <div className="arbitrage-row" key={index}>
            <strong>{item.pair}</strong>
            <span>{item.buyExchange}</span>
            <span>{item.sellExchange}</span>
            <span>{item.buyPrice}</span>
            <span>{item.sellPrice}</span>
            <b className="spread">{item.spread}</b>
            <b className="profit">{item.profit}</b>
            <span className={item.risk === "Low" ? "risk-low" : "risk-medium"}>
              {item.risk}
            </span>
            <button>Scan Route</button>
          </div>
        ))}
      </div>

      <div className="arbitrage-ai-box">
        <h2>AI Recommendation</h2>
        <p>
          SOL/USDT currently shows the strongest arbitrage opportunity with low risk
          and the highest spread. Always check fees and withdrawal limits before execution.
        </p>
      </div>
    </div>
  );
}