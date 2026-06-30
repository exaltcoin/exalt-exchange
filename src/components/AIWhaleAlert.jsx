import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AIWhaleAlert.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

const defaultAlerts = [
  {
    _id: "local-btc",
    symbol: "BTCUSDT",
    title: "BTC Whale Accumulation",
    alertType: "Buy Pressure",
    amountUSD: 1250000,
    priority: "High",
    status: "Active",
    signal: "Bullish",
    confidence: 91,
    message: "Large BTC whale buying pressure detected. Monitor breakout zone.",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "local-eth",
    symbol: "ETHUSDT",
    title: "ETH Smart Money Movement",
    alertType: "Wallet Movement",
    amountUSD: 780000,
    priority: "Medium",
    status: "Watching",
    signal: "Neutral",
    confidence: 84,
    message: "ETH whale wallets are moving funds. Wait for confirmation.",
    createdAt: new Date().toISOString(),
  },
];

export default function AIWhaleAlert() {
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({
    symbol: "BTCUSDT",
    alertType: "Buy Pressure",
    minAmountUSD: 250000,
    notifyTelegram: true,
    notifyEmail: false,
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

      const res = await axios.get(`${API_BASE}/api/ai-whale-alerts`, authHeaders);
      setAlerts(res.data?.alerts || defaultAlerts);
    } catch {
      setAlerts(defaultAlerts);
      setError("Backend not connected yet. Showing local preview alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const createAlert = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);

      await axios.post(
        `${API_BASE}/api/ai-whale-alerts`,
        {
          ...form,
          minAmountUSD: Number(form.minAmountUSD),
        },
        authHeaders
      );

      fetchAlerts();
    } catch {
      const localAlert = {
        _id: `local-${Date.now()}`,
        symbol: form.symbol,
        title: `${form.symbol} Whale Alert`,
        alertType: form.alertType,
        amountUSD: Number(form.minAmountUSD),
        priority: "High",
        status: "Active",
        signal: "Bullish",
        confidence: 88,
        message: `Whale alert created for ${form.symbol}. Backend will save after API connection.`,
        createdAt: new Date().toISOString(),
      };

      setAlerts((prev) => [localAlert, ...prev]);
    } finally {
      setCreating(false);
    }
  };

  const stats = {
    total: alerts.length,
    bullish: alerts.filter((x) => x.signal === "Bullish").length,
    bearish: alerts.filter((x) => x.signal === "Bearish").length,
    high: alerts.filter((x) => x.priority === "High").length,
  };

  if (loading) {
    return <div className="whale-alert-page">Loading AI Whale Alerts...</div>;
  }

  return (
    <div className="whale-alert-page">
      <div className="whale-alert-header">
        <div>
          <h1>AI Whale Alert System</h1>
          <p>
            Create real-time whale alerts for large wallet movements, buy/sell pressure,
            smart money activity and high-impact market signals.
          </p>
        </div>

        <button onClick={fetchAlerts}>Refresh</button>
      </div>

      {error && <div className="whale-alert-warning">{error}</div>}

      <div className="whale-alert-stats">
        <div><span>Total Alerts</span><strong>{stats.total}</strong></div>
        <div><span>Bullish</span><strong>{stats.bullish}</strong></div>
        <div><span>Bearish</span><strong>{stats.bearish}</strong></div>
        <div><span>High Priority</span><strong>{stats.high}</strong></div>
      </div>

      <div className="whale-alert-layout">
        <form className="whale-alert-form" onSubmit={createAlert}>
          <h2>Create Whale Alert</h2>

          <label>
            Symbol
            <select name="symbol" value={form.symbol} onChange={handleChange}>
              <option>BTCUSDT</option>
              <option>ETHUSDT</option>
              <option>BNBUSDT</option>
              <option>SOLUSDT</option>
              <option>XRPUSDT</option>
            </select>
          </label>

          <label>
            Alert Type
            <select name="alertType" value={form.alertType} onChange={handleChange}>
              <option>Buy Pressure</option>
              <option>Sell Pressure</option>
              <option>Wallet Movement</option>
              <option>Extreme Heat Zone</option>
              <option>Smart Money Entry</option>
            </select>
          </label>

          <label>
            Minimum Whale Amount USD
            <input
              name="minAmountUSD"
              type="number"
              value={form.minAmountUSD}
              onChange={handleChange}
            />
          </label>

          <div className="whale-alert-checks">
            <label>
              <input
                type="checkbox"
                name="notifyTelegram"
                checked={form.notifyTelegram}
                onChange={handleChange}
              />
              Telegram Alert
            </label>

            <label>
              <input
                type="checkbox"
                name="notifyEmail"
                checked={form.notifyEmail}
                onChange={handleChange}
              />
              Email Alert
            </label>
          </div>

          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create AI Whale Alert"}
          </button>
        </form>

        <div className="whale-alert-list">
          <div className="whale-alert-list-head">
            <h2>Live Whale Alerts</h2>
            <span>{alerts.length} records</span>
          </div>

          {alerts.map((item) => (
            <div className="whale-alert-card" key={item._id}>
              <div className="whale-alert-card-top">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.symbol} • {item.alertType}</p>
                </div>

                <span className={`alert-signal ${item.signal?.toLowerCase()}`}>
                  {item.signal}
                </span>
              </div>

              <div className="whale-alert-grid">
                <span>Amount <b>{formatMoney(item.amountUSD)}</b></span>
                <span>Priority <b>{item.priority}</b></span>
                <span>Status <b>{item.status}</b></span>
                <span>AI Confidence <b>{item.confidence}%</b></span>
              </div>

              <p className="whale-alert-message">{item.message}</p>

              <small>
                Created: {new Date(item.createdAt).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}