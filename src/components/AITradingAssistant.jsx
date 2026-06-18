import "./AITradingAssistant.css";
import { useEffect, useState } from "react";
import { getModuleData } from "../aiService";

export default function AITradingAssistant() {

  const [records, setRecords] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getModuleData("ai_trading_assistant");
      setRecords(res.records || []);
    } catch (err) {
      console.log(err);
    }
  };
  const latest = records[0] || {};
  return (
    <div className="ai-page">

      <div className="ai-header">
        <h1>AI Trading Assistant</h1>
        <p>Smart AI signals and market insights</p>
      </div>

      <div className="ai-grid">

        <div className="ai-card">
          <h3>Trend</h3>
        <h2>{latest.signal || "Bullish"}</h2>
        </div>

        <div className="ai-card">
          <h3>Entry Price</h3>
         <h2>{latest.metadata?.entryPrice || "--"}</h2>
        </div>

        <div className="ai-card">
          <h3>Take Profit</h3>
          <h2>{latest.metadata?.takeProfit || "--"}</h2>
        </div>

        <div className="ai-card">
          <h3>Stop Loss</h3>
         <h2>{latest.metadata?.stopLoss || "--"}</h2>
        </div>

        <div className="ai-card">
          <h3>Confidence Score</h3>
         <h2>{latest.confidence ? `${latest.confidence}%` : "--"}</h2>
        </div>

      </div>

      <div className="signal-box">
        <h2>AI Signal</h2>

        <div className="signal-card">
  <span>{latest.symbol || "BTCUSDT"}</span>
  <strong>{latest.signal || "BUY"}</strong>
</div>

        <button className="signal-btn">
          View Details
        </button>
      </div>

    </div>
  );
}