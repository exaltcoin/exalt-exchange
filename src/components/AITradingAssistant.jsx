import "./AITradingAssistant.css";
import { useEffect, useState } from "react";
import { getModuleData } from "../aiService";

export default function AITradingAssistant() {

  const [records, setRecords] = useState([]);
const [showDetails, setShowDetails] = useState(false);
const [selectedCoin, setSelectedCoin] = useState("BTC-USD");
const [search, setSearch] = useState("");
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
"LINK-USD",
"MATIC-USD",
"AVAX-USD",
"ATOM-USD",
"LTC-USD",
"BCH-USD",
"UNI-USD",
"AAVE-USD",
"NEAR-USD",
"APT-USD",
"ARB-USD",
"OP-USD",
"FIL-USD",
"ETC-USD",
"HBAR-USD",
"ICP-USD",
"SUI-USD",
"TON-USD",
"SHIB-USD",
"PEPE-USD",
"XLM-USD"
];

const filteredCoins = coins.filter((coin) =>
  coin.toLowerCase().includes(search.toLowerCase())
);-
  useEffect(() => {
    loadData();
 }, [selectedCoin]);
useEffect(() => {
  const interval = setInterval(() => {
    loadData();
  }, 5000);

  return () => clearInterval(interval);
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
  const topGainers = [
{ symbol: "BTC", change: "+3.2%" },
{ symbol: "ETH", change: "+2.8%" },
{ symbol: "SOL", change: "+7.5%" },
{ symbol: "BNB", change: "+1.6%" }
];

const topLosers = [
{ symbol: "XRP", change: "-2.1%" },
{ symbol: "DOGE", change: "-3.8%" },
{ symbol: "ADA", change: "-1.5%" },
{ symbol: "TRX", change: "-0.9%" }
];
const fearGreed = 68;

const marketSentiment =
fearGreed >= 75
? "Extreme Greed"
: fearGreed >= 55
? "Greed"
: fearGreed >= 45
? "Neutral"
: fearGreed >= 25
? "Fear"
: "Extreme Fear";
  return (

    <div className="ai-page">

      <div className="ai-header">
        <h1>AI Trading Assistant</h1>
        <p>Smart AI signals and market insights</p>
      </div>
      <input
  type="text"
  placeholder="Search Coin..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="coin-search"
/>
<select
  className="coin-select"
  value={selectedCoin}
  onChange={(e) => setSelectedCoin(e.target.value)}
>
 {filteredCoins.map((coin) => (
    <option key={coin} value={coin}>
      {coin}
    </option>
  ))}
</select>
      <div className="ai-grid">

        <div className="ai-card">
          <h3>Trend</h3>
      <h2
className={
latest.signal === "buy"
? "buy-signal"
: latest.signal === "sell"
? "sell-signal"
: "neutral-signal"
}
>
{latest.signal || "neutral"}
</h2>
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
<div className="market-section">

<div className="gainers-card">
<h3>🚀 Top Gainers</h3>

{topGainers.map((coin)=>(
<div key={coin.symbol}>
{coin.symbol} {coin.change}
</div>
))}
</div>

<div className="losers-card">
<h3>📉 Top Losers</h3>

{topLosers.map((coin)=>(
<div key={coin.symbol}>
{coin.symbol} {coin.change}
</div>
))}
</div>
<div className="sentiment-card">
  <h3>📊 Market Sentiment</h3>

  <div className="fear-score">
    Fear & Greed Index : {fearGreed}
  </div>

  <div className="sentiment-status">
    {marketSentiment}
  </div>
</div>
</div>
    </div>
  );
}