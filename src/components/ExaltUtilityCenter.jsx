import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ExaltUtilityCenter.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function ExaltUtilityCenter() {
  const [tools, setTools] = useState([]);
  const [calculator, setCalculator] = useState({
    capital: 1000,
    riskPercent: 2,
    entry: 62000,
    stopLoss: 61000,
    takeProfit: 65000,
    leverage: 1,
  });

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchTools = async () => {
    const res = await axios.get(`${API_BASE}/api/exalt-utility`, authHeaders);
    setTools(res.data?.tools || []);
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const update = (e) => {
    const { name, value } = e.target;
    setCalculator((prev) => ({ ...prev, [name]: value }));
  };

  const result = useMemo(() => {
    const capital = Number(calculator.capital || 0);
    const riskPercent = Number(calculator.riskPercent || 0);
    const entry = Number(calculator.entry || 0);
    const stopLoss = Number(calculator.stopLoss || 0);
    const takeProfit = Number(calculator.takeProfit || 0);
    const leverage = Number(calculator.leverage || 1);

    const riskAmount = capital * (riskPercent / 100);
    const stopDistance = Math.abs(entry - stopLoss);
    const rewardDistance = Math.abs(takeProfit - entry);
    const positionSize = stopDistance > 0 ? riskAmount / stopDistance : 0;
    const positionValue = positionSize * entry;
    const leveragedValue = positionValue * leverage;
    const estimatedProfit = positionSize * rewardDistance * leverage;
    const rr = stopDistance > 0 ? rewardDistance / stopDistance : 0;
    const liquidation =
      leverage > 0 ? entry - entry / leverage : 0;

    return {
      riskAmount,
      positionSize,
      positionValue,
      leveragedValue,
      estimatedProfit,
      rr,
      liquidation,
    };
  }, [calculator]);

  return (
    <div className="utility-page">
      <div className="utility-header">
        <div>
          <h1>Exalt Utility Center</h1>
          <p>
            Premium trading utilities for risk control, position sizing,
            liquidation planning and EXALT holder tools.
          </p>
        </div>

        <button onClick={fetchTools}>Refresh</button>
      </div>

      <div className="utility-layout">
        <div className="utility-calculator">
          <h2>Risk & Position Calculator</h2>

          <div className="utility-input-grid">
            <label>Capital
              <input name="capital" type="number" value={calculator.capital} onChange={update} />
            </label>

            <label>Risk %
              <input name="riskPercent" type="number" value={calculator.riskPercent} onChange={update} />
            </label>

            <label>Entry Price
              <input name="entry" type="number" value={calculator.entry} onChange={update} />
            </label>

            <label>Stop Loss
              <input name="stopLoss" type="number" value={calculator.stopLoss} onChange={update} />
            </label>

            <label>Take Profit
              <input name="takeProfit" type="number" value={calculator.takeProfit} onChange={update} />
            </label>

            <label>Leverage
              <input name="leverage" type="number" value={calculator.leverage} onChange={update} />
            </label>
          </div>
        </div>

        <div className="utility-result-grid">
          <div><span>Risk Amount</span><strong>{formatMoney(result.riskAmount)}</strong></div>
          <div><span>Position Size</span><strong>{result.positionSize.toFixed(6)}</strong></div>
          <div><span>Risk / Reward</span><strong>{result.rr.toFixed(2)}R</strong></div>
          <div><span>Estimated Profit</span><strong>{formatMoney(result.estimatedProfit)}</strong></div>
          <div><span>Position Value</span><strong>{formatMoney(result.positionValue)}</strong></div>
          <div><span>Liquidation Zone</span><strong>{formatMoney(result.liquidation)}</strong></div>
        </div>
      </div>

      <div className="utility-tools-box">
        <div className="utility-tools-head">
          <h2>Utility Tools</h2>
          <span>{tools.length} tools</span>
        </div>

        <div className="utility-tools-grid">
          {tools.map((tool) => (
            <div className="utility-tool" key={tool._id}>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>

              <div className="utility-tool-meta">
                <span>{tool.category}</span>
                <span>{tool.accessType}</span>
                <span>{tool.status}</span>
              </div>

              <button>
                {tool.requiredExalt > 0
                  ? `${tool.requiredExalt} EXALT Required`
                  : "Open Tool"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}