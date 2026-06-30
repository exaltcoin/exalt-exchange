import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AIProfitCalculator.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

const formatDate = (date) => {
  if (!date) return "No date";
  return new Date(date).toLocaleString();
};

export default function AIProfitCalculator() {
  const [form, setForm] = useState({
    symbol: "BTC/USDT",
    marketType: "Futures",
    capital: 100,
    entryPrice: 60000,
    exitPrice: 62000,
    stopLossPrice: 59000,
    takeProfitPrice: 62500,
    leverage: 3,
    positionType: "Long",
    compoundEnabled: false,
    compoundDays: 30,
  });

  const [calculations, setCalculations] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchMyCalculations = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-profit/my`, authHeaders);
      setCalculations(res.data?.calculations || []);
      setLatest(res.data?.calculations?.[0] || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI Profit Calculator");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCalculations();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const calculateProfit = async (e) => {
    e.preventDefault();

    if (!form.capital || Number(form.capital) <= 0) {
      alert("Capital must be greater than 0");
      return;
    }

    try {
      setCalculating(true);
      setError("");

      const res = await axios.post(
        `${API_BASE}/api/ai-profit/calculate`,
        {
          ...form,
          capital: Number(form.capital),
          entryPrice: Number(form.entryPrice),
          exitPrice: Number(form.exitPrice),
          stopLossPrice: Number(form.stopLossPrice),
          takeProfitPrice: Number(form.takeProfitPrice),
          leverage: Number(form.leverage),
          compoundDays: Number(form.compoundDays),
        },
        authHeaders
      );

      setLatest(res.data?.calculation || null);
      fetchMyCalculations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to calculate profit");
    } finally {
      setCalculating(false);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-profit/my/${id}/favorite`, {}, authHeaders);
      fetchMyCalculations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update favorite");
    }
  };

  const deleteCalculation = async (id) => {
    const confirmDelete = window.confirm("Delete this calculation?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/api/ai-profit/my/${id}`, authHeaders);
      fetchMyCalculations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete calculation");
    }
  };

  if (loading) {
    return <div className="ai-profit-page">Loading AI Profit Calculator...</div>;
  }

  return (
    <div className="ai-profit-page">
      <div className="ai-profit-header">
        <div>
          <h1>AI Profit Calculator</h1>
          <p>
            Calculate expected profit, ROI, risk/reward, compounding and AI-based
            trading confidence.
          </p>
        </div>

        <button onClick={fetchMyCalculations}>Refresh</button>
      </div>

      {error && <div className="ai-profit-error">{error}</div>}

      <div className="ai-profit-layout">
        <form className="profit-form-card" onSubmit={calculateProfit}>
          <h2>Trade Setup</h2>

          <div className="profit-input-grid">
            <label>
              Symbol
              <select name="symbol" value={form.symbol} onChange={handleChange}>
                <option>BTC/USDT</option>
                <option>ETH/USDT</option>
                <option>BNB/USDT</option>
                <option>SOL/USDT</option>
                <option>EXALT/USDT</option>
              </select>
            </label>

            <label>
              Market Type
              <select name="marketType" value={form.marketType} onChange={handleChange}>
                <option>Spot</option>
                <option>Futures</option>
                <option>Staking</option>
                <option>Copy Trading</option>
                <option>Grid Trading</option>
              </select>
            </label>

            <label>
              Position
              <select name="positionType" value={form.positionType} onChange={handleChange}>
                <option>Long</option>
                <option>Short</option>
                <option>Spot Buy</option>
                <option>Neutral</option>
              </select>
            </label>

            <label>
              Capital ($)
              <input
                name="capital"
                type="number"
                min="0"
                value={form.capital}
                onChange={handleChange}
              />
            </label>

            <label>
              Entry Price
              <input
                name="entryPrice"
                type="number"
                min="0"
                value={form.entryPrice}
                onChange={handleChange}
              />
            </label>

            <label>
              Exit Price
              <input
                name="exitPrice"
                type="number"
                min="0"
                value={form.exitPrice}
                onChange={handleChange}
              />
            </label>

            <label>
              Stop Loss
              <input
                name="stopLossPrice"
                type="number"
                min="0"
                value={form.stopLossPrice}
                onChange={handleChange}
              />
            </label>

            <label>
              Take Profit
              <input
                name="takeProfitPrice"
                type="number"
                min="0"
                value={form.takeProfitPrice}
                onChange={handleChange}
              />
            </label>

            <label>
              Leverage
              <input
                name="leverage"
                type="number"
                min="1"
                max="125"
                value={form.leverage}
                onChange={handleChange}
              />
            </label>

            <label>
              Compound Days
              <input
                name="compoundDays"
                type="number"
                min="1"
                value={form.compoundDays}
                onChange={handleChange}
              />
            </label>
          </div>

          <label className="compound-check">
            <input
              name="compoundEnabled"
              type="checkbox"
              checked={form.compoundEnabled}
              onChange={handleChange}
            />
            Enable compounding projection
          </label>

          <button type="submit" disabled={calculating}>
            {calculating ? "Calculating..." : "Calculate AI Profit"}
          </button>
        </form>

        <div className="profit-result-card">
          <h2>AI Result</h2>

          {!latest ? (
            <div className="empty-profit-result">No calculation yet.</div>
          ) : (
            <>
              <div className="profit-main-result">
                <span>Expected Profit</span>
                <strong>{formatMoney(latest.expectedProfit)}</strong>
                <p>{latest.recommendation}</p>
              </div>

              <div className="profit-result-grid">
                <div>
                  <span>ROI</span>
                  <strong className={latest.roi >= 0 ? "positive" : "negative"}>
                    {latest.roi}%
                  </strong>
                </div>

                <div>
                  <span>Expected Loss</span>
                  <strong>{formatMoney(latest.expectedLoss)}</strong>
                </div>

                <div>
                  <span>Risk/Reward</span>
                  <strong>{latest.riskRewardRatio}</strong>
                </div>

                <div>
                  <span>Win Rate</span>
                  <strong>{latest.winRate}%</strong>
                </div>

                <div>
                  <span>AI Confidence</span>
                  <strong>{latest.aiConfidence}%</strong>
                </div>

                <div>
                  <span>Risk Level</span>
                  <strong className={`profit-risk-text ${latest.riskLevel?.toLowerCase()}`}>
                    {latest.riskLevel}
                  </strong>
                </div>

                <div>
                  <span>Daily Profit</span>
                  <strong>{formatMoney(latest.dailyProfit)}</strong>
                </div>

                <div>
                  <span>Monthly Profit</span>
                  <strong>{formatMoney(latest.monthlyProfit)}</strong>
                </div>

                <div>
                  <span>Yearly Profit</span>
                  <strong>{formatMoney(latest.yearlyProfit)}</strong>
                </div>

                <div>
                  <span>Compound Result</span>
                  <strong>{formatMoney(latest.compoundResult)}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="profit-history-card">
        <div className="profit-history-head">
          <h2>My Profit History</h2>
          <span>{calculations.length} records</span>
        </div>

        {calculations.length === 0 ? (
          <div className="empty-profit-result">No saved calculations.</div>
        ) : (
          <div className="profit-history-list">
            {calculations.map((item) => (
              <div className="profit-history-row" key={item._id}>
                <div>
                  <strong>{item.symbol}</strong>
                  <small>{item.marketType} • {formatDate(item.createdAt)}</small>
                </div>

                <span>{formatMoney(item.capital)}</span>

                <span className={item.roi >= 0 ? "positive" : "negative"}>
                  {item.roi}%
                </span>

                <span>{formatMoney(item.expectedProfit)}</span>

                <span className={`profit-risk-pill ${item.riskLevel?.toLowerCase()}`}>
                  {item.riskLevel}
                </span>

                <div className="profit-row-actions">
                  <button onClick={() => toggleFavorite(item._id)}>
                    {item.isFavorite ? "★" : "☆"}
                  </button>
                  <button className="danger" onClick={() => deleteCalculation(item._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}