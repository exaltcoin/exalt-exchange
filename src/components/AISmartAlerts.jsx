import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AISmartAlerts.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AISmartAlerts() {
  const { t } = useI18n();

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
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
    [token]
  );

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-smart-alerts`, authHeaders);
      setAlerts(res.data?.alerts || []);
    } catch (err) {
      setError(err.response?.data?.message || t("failedLoadSmartAlerts"));
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
      title: name === "symbol" ? `${value} Smart Alert` : prev.title,
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
      alert(err.response?.data?.message || t("failedCreateSmartAlert"));
    } finally {
      setCreating(false);
    }
  };

  const markRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-smart-alerts/${id}/read`, {}, authHeaders);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || t("failedMarkAlertRead"));
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-smart-alerts/${id}/favorite`, {}, authHeaders);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || t("failedUpdateFavorite"));
    }
  };

  if (loading) {
    return (
      <PageShell titleKey="aiSmartAlerts" subtitleKey="aiSmartAlertsSubtitle">
        <div className="smart-page">{t("loadingSmartAlerts")}</div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="aiSmartAlerts" subtitleKey="aiSmartAlertsSubtitle">
      <div className="smart-page">
        <div className="smart-top-action">
          <button onClick={fetchAlerts}>{t("refresh")}</button>
        </div>

        {error && <div className="smart-error">{error}</div>}

        <div className="smart-layout">
          <form className="smart-form-card" onSubmit={createAlert}>
            <h2>{t("createSmartAlert")}</h2>

            <div className="smart-input-grid">
              <label>
                {t("symbol")}
                <select name="symbol" value={form.symbol} onChange={handleChange}>
                  <option>BTCUSDT</option>
                  <option>ETHUSDT</option>
                  <option>BNBUSDT</option>
                  <option>SOLUSDT</option>
                  <option>EXALTUSDT</option>
                </select>
              </label>

              <label>
                {t("alertType")}
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
                {t("condition")}
                <select name="condition" value={form.condition} onChange={handleChange}>
                  <option>Above</option>
                  <option>Below</option>
                  <option>Spike</option>
                  <option>Drop</option>
                  <option>Detected</option>
                </select>
              </label>

              <label>
                {t("targetPrice")}
                <input
                  name="targetPrice"
                  type="number"
                  value={form.targetPrice}
                  onChange={handleChange}
                />
              </label>
            </div>

            <button type="submit" disabled={creating}>
              {creating ? t("creating") : t("createAiAlert")}
            </button>
          </form>

          <div className="smart-result-card">
            <h2>{t("latestAlert")}</h2>

            {!alerts.length ? (
              <div className="empty-smart">{t("noAlertsFound")}</div>
            ) : (
              <div className="smart-main-result">
                <span>{alerts[0].symbol}</span>
                <strong>{alerts[0].priority}</strong>
                <p>{alerts[0].message}</p>

                <div className="smart-main-grid">
                  <div>
                    <span>{t("currentPrice")}</span>
                    <b>{formatMoney(alerts[0].currentPrice)}</b>
                  </div>

                  <div>
                    <span>{t("targetPrice")}</span>
                    <b>{formatMoney(alerts[0].targetPrice)}</b>
                  </div>

                  <div>
                    <span>{t("status")}</span>
                    <b>{alerts[0].status}</b>
                  </div>

                  <div>
                    <span>{t("aiConfidence")}</span>
                    <b>{alerts[0].aiConfidence}%</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="smart-list-card">
          <div className="smart-list-head">
            <h2>{t("smartAlerts")}</h2>
            <span>{alerts.length} {t("records")}</span>
          </div>

          <div className="smart-list">
            {alerts.length === 0 ? (
              <div className="empty-smart">{t("noAlertsFound")}</div>
            ) : (
              alerts.map((item) => (
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
                    {item.isRead ? t("read") : t("markRead")}
                  </button>

                  <button onClick={() => toggleFavorite(item._id)}>
                    {item.isFavorite ? "★" : "☆"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}