import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AIWhaleAlert.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AIWhaleAlert() {
  const { t } = useI18n();

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
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
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
      setError(t("backendPreviewAlerts"));
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
        message: `${t("whaleAlertCreatedFor")} ${form.symbol}. ${t("backendWillSaveAfterApi")}`,
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
    return (
      <PageShell titleKey="aiWhaleAlert" subtitleKey="aiWhaleAlertSubtitle">
        <div className="whale-alert-page">{t("loadingWhaleAlerts")}</div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="aiWhaleAlert" subtitleKey="aiWhaleAlertSubtitle">
      <div className="whale-alert-page">
        <div className="whale-alert-top-action">
          <button onClick={fetchAlerts}>{t("refresh")}</button>
        </div>

        {error && <div className="whale-alert-warning">{error}</div>}

        <div className="whale-alert-stats">
          <div><span>{t("totalAlerts")}</span><strong>{stats.total}</strong></div>
          <div><span>{t("bullish")}</span><strong>{stats.bullish}</strong></div>
          <div><span>{t("bearish")}</span><strong>{stats.bearish}</strong></div>
          <div><span>{t("highPriority")}</span><strong>{stats.high}</strong></div>
        </div>

        <div className="whale-alert-layout">
          <form className="whale-alert-form" onSubmit={createAlert}>
            <h2>{t("createWhaleAlert")}</h2>

            <label>
              {t("symbol")}
              <select name="symbol" value={form.symbol} onChange={handleChange}>
                <option>BTCUSDT</option>
                <option>ETHUSDT</option>
                <option>BNBUSDT</option>
                <option>SOLUSDT</option>
                <option>XRPUSDT</option>
              </select>
            </label>

            <label>
              {t("alertType")}
              <select name="alertType" value={form.alertType} onChange={handleChange}>
                <option>Buy Pressure</option>
                <option>Sell Pressure</option>
                <option>Wallet Movement</option>
                <option>Extreme Heat Zone</option>
                <option>Smart Money Entry</option>
              </select>
            </label>

            <label>
              {t("minimumWhaleAmountUsd")}
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
                {t("telegramAlert")}
              </label>

              <label>
                <input
                  type="checkbox"
                  name="notifyEmail"
                  checked={form.notifyEmail}
                  onChange={handleChange}
                />
                {t("emailAlert")}
              </label>
            </div>

            <button type="submit" disabled={creating}>
              {creating ? t("creating") : t("createAiWhaleAlert")}
            </button>
          </form>

          <div className="whale-alert-list">
            <div className="whale-alert-list-head">
              <h2>{t("liveWhaleAlerts")}</h2>
              <span>{alerts.length} {t("records")}</span>
            </div>

            {alerts.length === 0 ? (
              <div className="whale-alert-empty">{t("noAlertsFound")}</div>
            ) : (
              alerts.map((item) => (
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
                    <span>{t("amount")} <b>{formatMoney(item.amountUSD)}</b></span>
                    <span>{t("priority")} <b>{item.priority}</b></span>
                    <span>{t("status")} <b>{item.status}</b></span>
                    <span>{t("aiConfidence")} <b>{item.confidence}%</b></span>
                  </div>

                  <p className="whale-alert-message">{item.message}</p>

                  <small>
                    {t("created")}: {new Date(item.createdAt).toLocaleString()}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}