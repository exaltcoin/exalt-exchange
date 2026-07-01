import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AIGridTrading.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AIGridTrading() {
  const [grids, setGrids] = useState([]);
  const [form, setForm] = useState({
    symbol: "BTCUSDT",
    baseCoin: "BTC",
    marketType: "Spot",
    strategyName: "BTC AI Grid Strategy",
    gridCount: 20,
    investment: 1000,
    leverage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchGrids = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-grid-trading`, authHeaders);
      setGrids(res.data?.grids || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI Grid Trading");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrids();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      baseCoin:
        name === "symbol"
          ? value.replace("USDT", "")
          : prev.baseCoin,
      strategyName:
        name === "symbol"
          ? `${value.replace("USDT", "")} AI Grid Strategy`
          : prev.strategyName,
    }));
  };

  const createGrid = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);

      await axios.post(
        `${API_BASE}/api/ai-grid-trading`,
        {
          ...form,
          gridCount: Number(form.gridCount),
          investment: Number(form.investment),
          leverage: Number(form.leverage),
        },
        authHeaders
      );

      fetchGrids();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create grid strategy");
    } finally {
      setCreating(false);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-grid-trading/${id}/favorite`, {}, authHeaders);
      fetchGrids();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update favorite");
    }
  };

  if (loading) {
    return <div className="grid-page">Loading AI Grid Trading...</div>;
  }

  return (
    <div className="grid-page">
      <div className="grid-header">
        <div>
          <h1>AI Grid Trading</h1>
          <p>
            Generate AI grid strategies using live Binance market prices, price
            ranges, grid count and estimated profit.
          </p>
        </div>

        <button onClick={fetchGrids}>Refresh</button>
      </div>

      {error && <div className="grid-error">{error}</div>}

      <div className="grid-layout">
        <form className="grid-form-card" onSubmit={createGrid}>
          <h2>Create Grid Strategy</h2>

          <div className="grid-input-grid">
            <label>
              Symbol
              <select name="symbol" value={form.symbol} onChange={handleChange}>
                <option>BTCUSDT</option>
                <option>ETHUSDT</option>
                <option>BNBUSDT</option>
                <option>SOLUSDT</option>
                <option>EXALTUSDT</option>
              </select>
            </label>

            <label>
              Market Type
              <select name="marketType" value={form.marketType} onChange={handleChange}>
                <option>Spot</option>
                <option>Futures</option>
              </select>
            </label>

            <label>
              Grid Count
              <input
                name="gridCount"
                type="number"
                min="2"
                max="200"
                value={form.gridCount}
                onChange={handleChange}
              />
            </label>

            <label>
              Investment
              <input
                name="investment"
                type="number"
                min="0"
                value={form.investment}
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
          </div>

          <button type="submit" disabled={creating}>
            {creating ? "Generating..." : "Generate AI Grid"}
          </button>
        </form>

        <div className="grid-result-card">
          <h2>Top Grid Strategy</h2>

          {!grids.length ? (
            <div className="empty-grid">No grid strategies found.</div>
          ) : (
            <div className="grid-main-result">
              <span>{grids[0].symbol}</span>
              <strong>{formatMoney(grids[0].estimatedMonthlyProfit)}</strong>
              <p>{grids[0].recommendation}</p>

              <div className="grid-main-grid">
                <div>
                  <span>Lower Price</span>
                  <b>{formatMoney(grids[0].lowerPrice)}</b>
                </div>

                <div>
                  <span>Upper Price</span>
                  <b>{formatMoney(grids[0].upperPrice)}</b>
                </div>

                <div>
                  <span>Grid Count</span>
                  <b>{grids[0].gridCount}</b>
                </div>

                <div>
                  <span>AI Confidence</span>
                  <b>{grids[0].aiConfidence}%</b>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid-list-card">
        <div className="grid-list-head">
          <h2>Grid Strategies</h2>
          <span>{grids.length} records</span>
        </div>

        <div className="grid-list">
          {grids.map((item) => (
            <div className="grid-row" key={item._id}>
              <div>
                <strong>{item.symbol}</strong>
                <small>{item.strategyName}</small>
              </div>

              <span>{formatMoney(item.lowerPrice)} - {formatMoney(item.upperPrice)}</span>
              <span>{item.gridCount} grids</span>
              <span>{formatMoney(item.estimatedMonthlyProfit)}</span>

              <span className={`grid-risk-pill ${item.riskLevel?.toLowerCase()}`}>
                {item.riskLevel}
              </span>

              <span>{item.aiConfidence}%</span>

              <button onClick={() => toggleFavorite(item._id)}>
                {item.isFavorite ? "★" : "☆"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}