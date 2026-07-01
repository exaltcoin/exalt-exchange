import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AISmartAlerts.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AISmartAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({
    title: "BTC Breakout Alert",
    symbol: "BTCUSDT",
    alertType: "Price",
    condition: "Above",
    targetPrice: 0,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-smart-alerts`, authHeaders);
      setAlerts(res.data?.alerts || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI Smart Alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      title:
        name === "symbol"
          ? `${value} Smart Alert`
          : prev.title,
    }));
  };

  const createAlert = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);

      await axios.post(
        `${API_BASE}/api/ai-smart-alerts`,
        {
          ...form,
          targetPrice: Number(form.targetPrice),
        },
        authHeaders
      );

      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create smart alert");
    } finally {
      setCreating(false);
    }
  };

  const markRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-smart-alerts/${id}/read`, {}, authHeaders);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark alert read");
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-smart-alerts/${id}/favorite`, {}, authHeaders);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update favorite");
    }
  };

  if (loading) {
    return <div className="smart-page">Loading AI Smart Alerts...</div>;
  }

  return (
    <div className="smart-page">
      <div className="smart-header">
        <div>
          <h1>AI Smart Alerts</h1>
          <p>
            Create intelligent crypto alerts using live market prices, AI confidence,
            priority and risk analysis.
          </p>
        </div>

        <button onClick={fetchAlerts}>Refresh</button>
      </div>

      {error && <div className="smart-error">{error}</div>}

      <div className="smart-layout">
        <form className="smart-form-card" onSubmit={createAlert}>
          <h2>Create Smart Alert</h2>

          <div className="smart-input-grid">
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
              Alert Type
              <select name="alertType" value={form.alertType} onChange={handleChange}>
                <option>Price</option>
                <option>Volume</option>
                <option>Whale</option>
                <option>Risk</option>
                <option>News</option>
                <option>Arbitrage</option>
                <option>Grid</option>
              </select>
            </label>

            <label>
              Condition
              <select name="condition" value={form.condition} onChange={handleChange}>
                <option>Above</option>
                <option>Below</option>
                <option>Spike</option>
                <option>Drop</option>
                <option>Detected</option>
              </select>
            </label>

            <label>
              Target Price
              <input
                name="targetPrice"
                type="number"
                value={form.targetPrice}
                onChange={handleChange}
              />
            </label>
          </div>

          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create AI Alert"}
          </button>
        </form>

        <div className="smart-result-card">
          <h2>Latest Alert</h2>

          {!alerts.length ? (
            <div className="empty-smart">No alerts found.</div>
          ) : (
            <div className="smart-main-result">
              <span>{alerts[0].symbol}</span>
              <strong>{alerts[0].priority}</strong>
              <p>{alerts[0].message}</p>

              <div className="smart-main-grid">
                <div>
                  <span>Current Price</span>
                  <b>{formatMoney(alerts[0].currentPrice)}</b>
                </div>

                <div>
                  <span>Target Price</span>
                  <b>{formatMoney(alerts[0].targetPrice)}</b>
                </div>

                <div>
                  <span>Status</span>
                  <b>{alerts[0].status}</b>
                </div>

                <div>
                  <span>AI Confidence</span>
                  <b>{alerts[0].aiConfidence}%</b>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="smart-list-card">
        <div className="smart-list-head">
          <h2>Smart Alerts</h2>
          <span>{alerts.length} records</span>
        </div>

        <div className="smart-list">
          {alerts.map((item) => (
            <div className="smart-row" key={item._id}>
              <div>
                <strong>{item.title}</strong>
                <small>{item.symbol} • {item.alertType}</small>
              </div>

              <span>{item.condition}</span>
              <span>{formatMoney(item.currentPrice)}</span>
              <span>{formatMoney(item.targetPrice)}</span>

              <span className={`smart-priority ${item.priority?.toLowerCase()}`}>
                {item.priority}
              </span>

              <span className={`smart-status ${item.status?.toLowerCase()}`}>
                {item.status}
              </span>

              <button onClick={() => markRead(item._id)}>
                {item.isRead ? "Read" : "Mark Read"}
              </button>

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