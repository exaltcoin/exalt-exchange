import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AIArbitrageScanner.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AIArbitrageScanner() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    symbol: "BTCUSDT",
    baseCoin: "BTC",
    buyExchange: "KuCoin",
    sellExchange: "Binance",
    buyPrice: 105100,
    sellPrice: 106500,
    capital: 1000,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchArbitrage = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-arbitrage`, authHeaders);
      setItems(res.data?.arbitrages || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI Arbitrage Scanner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArbitrage();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createOpportunity = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);

      await axios.post(
        `${API_BASE}/api/ai-arbitrage`,
        {
          ...form,
          buyPrice: Number(form.buyPrice),
          sellPrice: Number(form.sellPrice),
          capital: Number(form.capital),
        },
        authHeaders
      );

      fetchArbitrage();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create arbitrage opportunity");
    } finally {
      setCreating(false);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-arbitrage/${id}/favorite`, {}, authHeaders);
      fetchArbitrage();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update favorite");
    }
  };

  if (loading) {
    return <div className="arb-page">Loading AI Arbitrage Scanner...</div>;
  }

  return (
    <div className="arb-page">
      <div className="arb-header">
        <div>
          <h1>AI Arbitrage Scanner</h1>
          <p>
            Detect cross-exchange price differences, spreads, estimated profit,
            fees and AI confidence.
          </p>
        </div>

        <button onClick={fetchArbitrage}>Refresh</button>
      </div>

      {error && <div className="arb-error">{error}</div>}

      <div className="arb-layout">
        <form className="arb-form-card" onSubmit={createOpportunity}>
          <h2>Create Opportunity</h2>

          <div className="arb-input-grid">
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
              Base Coin
              <select name="baseCoin" value={form.baseCoin} onChange={handleChange}>
                <option>BTC</option>
                <option>ETH</option>
                <option>BNB</option>
                <option>SOL</option>
                <option>EXALT</option>
              </select>
            </label>

            <label>
              Buy Exchange
              <select name="buyExchange" value={form.buyExchange} onChange={handleChange}>
                <option>Binance</option>
                <option>Bybit</option>
                <option>OKX</option>
                <option>KuCoin</option>
                <option>MEXC</option>
              </select>
            </label>

            <label>
              Sell Exchange
              <select name="sellExchange" value={form.sellExchange} onChange={handleChange}>
                <option>Binance</option>
                <option>Bybit</option>
                <option>OKX</option>
                <option>KuCoin</option>
                <option>MEXC</option>
              </select>
            </label>

            <label>
              Buy Price
              <input
                name="buyPrice"
                type="number"
                value={form.buyPrice}
                onChange={handleChange}
              />
            </label>

            <label>
              Sell Price
              <input
                name="sellPrice"
                type="number"
                value={form.sellPrice}
                onChange={handleChange}
              />
            </label>

            <label>
              Capital
              <input
                name="capital"
                type="number"
                value={form.capital}
                onChange={handleChange}
              />
            </label>
          </div>

          <button type="submit" disabled={creating}>
            {creating ? "Scanning..." : "Create AI Opportunity"}
          </button>
        </form>

        <div className="arb-result-card">
          <h2>Top Opportunity</h2>

          {!items.length ? (
            <div className="empty-arb">No opportunities found.</div>
          ) : (
            <div className="arb-main-result">
              <span>{items[0].symbol}</span>
              <strong>{formatMoney(items[0].netProfit)}</strong>
              <p>{items[0].recommendation}</p>

              <div className="arb-main-grid">
                <div>
                  <span>Buy</span>
                  <b>{items[0].buyExchange}</b>
                </div>

                <div>
                  <span>Sell</span>
                  <b>{items[0].sellExchange}</b>
                </div>

                <div>
                  <span>Spread</span>
                  <b>{items[0].spreadPercent}%</b>
                </div>

                <div>
                  <span>AI Confidence</span>
                  <b>{items[0].aiConfidence}%</b>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="arb-list-card">
        <div className="arb-list-head">
          <h2>Arbitrage Opportunities</h2>
          <span>{items.length} records</span>
        </div>

        <div className="arb-list">
          {items.map((item) => (
            <div className="arb-row" key={item._id}>
              <div>
                <strong>{item.symbol}</strong>
                <small>{item.buyExchange} → {item.sellExchange}</small>
              </div>

              <span>{item.spreadPercent}%</span>
              <span>{formatMoney(item.netProfit)}</span>

              <span className={`arb-risk-pill ${item.riskLevel?.toLowerCase()}`}>
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