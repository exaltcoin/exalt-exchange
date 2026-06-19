import "./AITradingAssistant.css";
import { useEffect, useState } from "react";
import { getModuleData } from "../aiService";

export default function AITradingAssistant() {

  const [records, setRecords] = useState([]);
const [showDetails, setShowDetails] = useState(false);
const [selectedCoin, setSelectedCoin] = useState("BTC-USD");
const coins = [
  "BTC-USD",
  "ETH-USD",
  "BNB-USD",
  "SOL-USD",
  "XRP-USD",
  "ADA-USD",
  "DOGE-USD",
  "TRX-USD",
  "DOT-USD",
  "AVAX-USD"
];
  useEffect(() => {
    loadData();
 }, [selectedCoin]);

  const loadData = async () => {
    try {
      const res = await getModuleData(`ai_trading_assistant?symbol=${selectedCoin}`);
      setRecords(res.records || []);
    } catch (err) {
      console.log(err);
    }
  };
  const latest = records[0] || {};

  const meta = latest.metadata || latest.metaData || {};
  return (
    <div className="ai-page">

      <div className="ai-header">
        <h1>AI Trading Assistant</h1>
        <p>Smart AI signals and market insights</p>
      </div>
<select
  className="coin-select"
  value={selectedCoin}
  onChange={(e) => setSelectedCoin(e.target.value)}
>
  {coins.map((coin) => (
    <option key={coin} value={coin}>
      {coin}
    </option>
  ))}
</select>
      <div className="ai-grid">

        <div className="ai-card">
          <h3>Trend</h3>
      <h2>{latest.signal || "neutral"}</h2>
        </div>

        <div className="ai-card">
          <h3>Entry Price</h3>
        <h2>{meta.entryPrice || "--"}</h2>
        </div>

        <div className="ai-card">
        <h3>Take Profit</h3>
<h2>{meta.takeProfit || "--"}</h2>
        </div>

        <div className="ai-card">
          <h3>Stop Loss</h3>
         <h2>{meta.stopLoss || "--"}</h2>
        </div>

        <div className="ai-card">
          <h3>Confidence Score</h3>
        <h2>{latest.confidence ?? "--"}%</h2>
        </div>

      </div>

      <div className="signal-box">
        <h2>AI Signal</h2>

        <div className="signal-card">
  <span>{latest.symbol || "BTCUSDT"}</span>
  <strong>{latest.signal || "neutral"}</strong>
</div>
<button
  className="signal-btn"
  onClick={() => setShowDetails(!showDetails)}
>
  View Details
</button>
{showDetails && (
  <div className="signal-details">
    <p><strong>Symbol:</strong> {latest.symbol}</p>
    <p><strong>Signal:</strong> {latest.signal}</p>
    <p><strong>Entry Price:</strong> {meta.entryPrice}</p>
    <p><strong>Take Profit:</strong> {meta.takeProfit}</p>
    <p><strong>Stop Loss:</strong> {meta.stopLoss}</p>
    <p><strong>Confidence:</strong> {latest.confidence}%</p>
  </div>
)}
      </div>

    </div>
  );
}