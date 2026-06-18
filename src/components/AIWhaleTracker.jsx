import "./AIWhaleTracker.css";

export default function AIWhaleTracker() {
  const whales = [
    {
      wallet: "0x8D3A...B521",
      asset: "BTC",
      action: "BUY",
      amount: "$12.4M",
      confidence: "96%"
    },
    {
      wallet: "0xA7F2...C881",
      asset: "ETH",
      action: "SELL",
      amount: "$8.7M",
      confidence: "89%"
    },
    {
      wallet: "0x3D81...F991",
      asset: "SOL",
      action: "BUY",
      amount: "$5.1M",
      confidence: "91%"
    }
  ];

  return (
    <div className="whale-page">

      <div className="whale-header">
        <h1>AI Whale Tracker</h1>
        <p>
          Track smart money, whale movements, and large market transactions.
        </p>
      </div>

      <div className="whale-stats">

        <div className="whale-card">
          <span>Whale Buy Signals</span>
          <h2>24</h2>
        </div>

        <div className="whale-card">
          <span>Whale Sell Signals</span>
          <h2>9</h2>
        </div>

        <div className="whale-card">
          <span>Large Transactions</span>
          <h2>71</h2>
        </div>

        <div className="whale-card">
          <span>AI Confidence</span>
          <h2>94%</h2>
        </div>

      </div>

      <div className="whale-box">

        <h2>Live Whale Activity</h2>

        {whales.map((item, index) => (

          <div className="whale-row" key={index}>

            <div>
              <h3>{item.wallet}</h3>
              <p>{item.asset}</p>
            </div>

            <div className={item.action === "BUY" ? "buy-tag" : "sell-tag"}>
              {item.action}
            </div>

            <div>
              <h3>{item.amount}</h3>
            </div>

            <div className="confidence">
              {item.confidence}
            </div>

          </div>

        ))}

      </div>

      <div className="recommend-box">

        <h2>AI Recommendation</h2>

        <p>
          Multiple whale wallets are accumulating BTC and SOL. Market sentiment remains bullish.
        </p>

        <button>
          View Smart Money
        </button>

      </div>

    </div>
  );
}