import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AIMarketScanner.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AIMarketScanner() {
  const { t } = useI18n();

  const formatDate = (date) => {
    if (!date) return t("noDate");
    return new Date(date).toLocaleString();
  };

  const [form, setForm] = useState({
    symbol: "BTCUSDT",
    timeframe: "1h",
    marketType: "Spot",
  });

  const [scans, setScans] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
    [token]
  );

  const fetchMyScans = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `${API_BASE}/api/ai-market-scanner/my`,
        authHeaders
      );

      setScans(res.data?.scans || []);
      setLatest(res.data?.scans?.[0] || null);
    } catch (err) {
      setError(err.response?.data?.message || t("failedLoadMarketScanner"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyScans();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const runScan = async (e) => {
    e.preventDefault();

    try {
      setScanning(true);
      setError("");

      const res = await axios.post(
        `${API_BASE}/api/ai-market-scanner/scan`,
        form,
        authHeaders
      );

      setLatest(res.data?.scan || null);
      fetchMyScans();
    } catch (err) {
      alert(err.response?.data?.message || t("failedRunMarketScan"));
    } finally {
      setScanning(false);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.put(
        `${API_BASE}/api/ai-market-scanner/my/${id}/favorite`,
        {},
        authHeaders
      );

      fetchMyScans();
    } catch (err) {
      alert(err.response?.data?.message || t("failedUpdateFavorite"));
    }
  };

  const deleteScan = async (id) => {
    const confirmDelete = window.confirm(t("deleteMarketScanConfirm"));
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/api/ai-market-scanner/my/${id}`, authHeaders);
      fetchMyScans();
    } catch (err) {
      alert(err.response?.data?.message || t("failedDeleteMarketScan"));
    }
  };

  if (loading) {
    return (
      <PageShell titleKey="aiMarketScanner" subtitleKey="aiMarketScannerSubtitle">
        <div className="ai-market-page">{t("loadingMarketScanner")}</div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="aiMarketScanner" subtitleKey="aiMarketScannerSubtitle">
      <div className="ai-market-page">
        <div className="ai-market-top-action">
          <button onClick={fetchMyScans}>{t("refresh")}</button>
        </div>

        {error && <div className="ai-market-error">{error}</div>}

        <div className="ai-market-layout">
          <form className="market-scan-card" onSubmit={runScan}>
            <h2>{t("runAiScan")}</h2>

            <div className="market-input-grid">
              <label>
                {t("symbol")}
                <select name="symbol" value={form.symbol} onChange={handleChange}>
                  <option>BTCUSDT</option>
                  <option>ETHUSDT</option>
                  <option>BNBUSDT</option>
                  <option>SOLUSDT</option>
                  <option>XRPUSDT</option>
                  <option>DOGEUSDT</option>
                  <option>EXALTUSDT</option>
                </select>
              </label>

              <label>
                {t("timeframe")}
                <select name="timeframe" value={form.timeframe} onChange={handleChange}>
                  <option>1m</option>
                  <option>5m</option>
                  <option>15m</option>
                  <option>1h</option>
                  <option>4h</option>
                  <option>1d</option>
                </select>
              </label>

              <label>
                {t("marketType")}
                <select name="marketType" value={form.marketType} onChange={handleChange}>
                  <option>Spot</option>
                  <option>Futures</option>
                </select>
              </label>
            </div>

            <button type="submit" disabled={scanning}>
              {scanning ? t("scanning") : t("runAiMarketScan")}
            </button>
          </form>

          <div className="market-result-card">
            <h2>{t("aiScanResult")}</h2>

            {!latest ? (
              <div className="empty-market-result">{t("noScanYet")}</div>
            ) : (
              <>
                <div className="market-main-result">
                  <span>{latest.symbol} • {latest.timeframe}</span>
                  <strong className={`signal-text ${latest.signal?.toLowerCase()}`}>
                    {latest.signal} {t("signal")}
                  </strong>
                  <p>{latest.recommendation}</p>
                </div>

                <div className="market-result-grid">
                  <div><span>{t("currentPrice")}</span><strong>{formatMoney(latest.currentPrice)}</strong></div>
                  <div><span>{t("trend")}</span><strong>{latest.trend}</strong></div>
                  <div><span>{t("buyZone")}</span><strong>{formatMoney(latest.buyZone)}</strong></div>
                  <div><span>{t("sellZone")}</span><strong>{formatMoney(latest.sellZone)}</strong></div>
                  <div><span>{t("stopLoss")}</span><strong>{formatMoney(latest.stopLoss)}</strong></div>
                  <div><span>{t("takeProfit")}</span><strong>{formatMoney(latest.takeProfit)}</strong></div>
                  <div><span>{t("trendStrength")}</span><strong>{latest.trendStrength}%</strong></div>
                  <div><span>{t("aiConfidence")}</span><strong>{latest.aiConfidence}%</strong></div>
                  <div>
                    <span>{t("riskLevel")}</span>
                    <strong className={`market-risk-text ${latest.riskLevel?.toLowerCase()}`}>
                      {latest.riskLevel}
                    </strong>
                  </div>
                  <div><span>RSI</span><strong>{latest.indicators?.rsi}</strong></div>
                  <div><span>MACD</span><strong>{latest.indicators?.macd}</strong></div>
                  <div><span>{t("volume")}</span><strong>{latest.indicators?.volumeSignal}</strong></div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="market-history-card">
          <div className="market-history-head">
            <h2>{t("myMarketScanHistory")}</h2>
            <span>{scans.length} {t("records")}</span>
          </div>

          {scans.length === 0 ? (
            <div className="empty-market-result">{t("noSavedScans")}</div>
          ) : (
            <div className="market-history-list">
              {scans.map((item) => (
                <div className="market-history-row" key={item._id}>
                  <div>
                    <strong>{item.symbol}</strong>
                    <small>
                      {item.marketType} • {item.timeframe} • {formatDate(item.createdAt)}
                    </small>
                  </div>

                  <span>{formatMoney(item.currentPrice)}</span>

                  <span className={`signal-pill ${item.signal?.toLowerCase()}`}>
                    {item.signal}
                  </span>

                  <span>{item.trend}</span>

                  <span className={`market-risk-pill ${item.riskLevel?.toLowerCase()}`}>
                    {item.riskLevel}
                  </span>

                  <span>{item.aiConfidence}%</span>

                  <div className="market-row-actions">
                    <button onClick={() => toggleFavorite(item._id)}>
                      {item.isFavorite ? "★" : "☆"}
                    </button>

                    <button className="danger" onClick={() => deleteScan(item._id)}>
                      {t("delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}