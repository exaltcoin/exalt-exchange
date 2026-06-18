import { useState } from "react";
import "./AIProfitCalculator.css";

export default function AIProfitCalculator() {
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [amount, setAmount] = useState("");
  const [leverage, setLeverage] = useState("1");

  const pnl =
    entry && exit && amount
      ? ((Number(exit) - Number(entry)) / Number(entry)) *
        Number(amount) *
        Number(leverage)
      : 0;

  const roi =
    entry && exit
      ? ((Number(exit) - Number(entry)) / Number(entry)) *
        100 *
        Number(leverage)
      : 0;

  return (
    <div className="profit-page">
      <div className="profit-header">
        <h1>AI Profit Calculator</h1>
        <p>Calculate futures profit, ROI, leverage impact, and AI trade outcome.</p>
      </div>

      <div className="profit-grid">
        <div className="profit-form">
          <h2>Trade Calculator</h2>

          <input
            type="number"
            placeholder="Entry Price"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
          />

          <input
            type="number"
            placeholder="Exit Price"
            value={exit}
            onChange={(e) => setExit(e.target.value)}
          />

          <input
            type="number"
            placeholder="Margin Amount USDT"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select value={leverage} onChange={(e) => setLeverage(e.target.value)}>
            <option value="1">1x Leverage</option>
            <option value="3">3x Leverage</option>
            <option value="5">5x Leverage</option>
            <option value="10">10x Leverage</option>
            <option value="20">20x Leverage</option>
            <option value="50">50x Leverage</option>
          </select>

          <button>Calculate Profit</button>
        </div>

        <div className="profit-result">
          <h2>AI Result</h2>

          <div className="result-card">
            <span>Estimated PNL</span>
            <h1 className={pnl >= 0 ? "profit-green" : "profit-red"}>
              {pnl.toFixed(2)} USDT
            </h1>
          </div>

          <div className="result-card">
            <span>ROI</span>
            <h1 className={roi >= 0 ? "profit-green" : "profit-red"}>
              {roi.toFixed(2)}%
            </h1>
          </div>

          <div className="ai-note">
            <strong>AI Note:</strong>
            <p>
              Use lower leverage during high volatility. Always apply stop-loss
              and risk only a small percentage of your portfolio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}