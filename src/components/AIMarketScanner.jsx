import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AIMarketScanner.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

const formatDate = (date) => {
  if (!date) return "No date";
  return new Date(date).toLocaleString();
};

export default function AIMarketScanner() {
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
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
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
      setError(err.response?.data?.message || "Failed to load AI Market Scanner");
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
      alert(err.response?.data?.message || "Failed to run AI market scan");
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
      alert(err.response?.data?.message || "Failed to update favorite");
    }
  };

  const deleteScan = async (id) => {
    const confirmDelete = window.confirm("Delete this market scan?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/api/ai-market-scanner/my/${id}`, authHeaders);
      fetchMyScans();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete market scan");
    }
  };

  if (loading) {
    return <div className="ai-market-page">Loading AI Market Scanner...</div>;
  }

  return (
    <div className="ai-market-page">
      <div className="ai-market-header">
        <div>
          <h1>AI Market Scanner</h1>
          <p>
            Scan market trend, buy/sell zones, RSI, MACD, volatility, risk and AI
            confidence.
          </p>
        </div>

        <button onClick={fetchMyScans}>Refresh</button>
      </div>

      {error && <div className="ai-market-error">{error}</div>}

      <div className="ai-market-layout">
        <form className="market-scan-card" onSubmit={runScan}>
          <h2>Run AI Scan</h2>

          <div className="market-input-grid">
            <label>
              Symbol
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
              Timeframe
              <select
                name="timeframe"
                value={form.timeframe}
                onChange={handleChange}
              >
                <option>1m</option>
                <option>5m</option>
                <option>15m</option>
                <option>1h</option>
                <option>4h</option>
                <option>1d</option>
              </select>
            </label>

            <label>
              Market Type
              <select
                name="marketType"
                value={form.marketType}
                onChange={handleChange}
              >
                <option>Spot</option>
                <option>Futures</option>
              </select>
            </label>
          </div>

          <button type="submit" disabled={scanning}>
            {scanning ? "Scanning..." : "Run AI Market Scan"}
          </button>
        </form>

        <div className="market-result-card">
          <h2>AI Scan Result</h2>

          {!latest ? (
            <div className="empty-market-result">No scan yet.</div>
          ) : (
            <>
              <div className="market-main-result">
                <span>{latest.symbol} • {latest.timeframe}</span>
                <strong className={`signal-text ${latest.signal?.toLowerCase()}`}>
                  {latest.signal} Signal
                </strong>
                <p>{latest.recommendation}</p>
              </div>

              <div className="market-result-grid">
                <div>
                  <span>Current Price</span>
                  <strong>{formatMoney(latest.currentPrice)}</strong>
                </div>

                <div>
                  <span>Trend</span>
                  <strong>{latest.trend}</strong>
                </div>

                <div>
                  <span>Buy Zone</span>
                  <strong>{formatMoney(latest.buyZone)}</strong>
                </div>

                <div>
                  <span>Sell Zone</span>
                  <strong>{formatMoney(latest.sellZone)}</strong>
                </div>

                <div>
                  <span>Stop Loss</span>
                  <strong>{formatMoney(latest.stopLoss)}</strong>
                </div>

                <div>
                  <span>Take Profit</span>
                  <strong>{formatMoney(latest.takeProfit)}</strong>
                </div>

                <div>
                  <span>Trend Strength</span>
                  <strong>{latest.trendStrength}%</strong>
                </div>

                <div>
                  <span>AI Confidence</span>
                  <strong>{latest.aiConfidence}%</strong>
                </div>

                <div>
                  <span>Risk Level</span>
                  <strong className={`market-risk-text ${latest.riskLevel?.toLowerCase()}`}>
                    {latest.riskLevel}
                  </strong>
                </div>

                <div>
                  <span>RSI</span>
                  <strong>{latest.indicators?.rsi}</strong>
                </div>

                <div>
                  <span>MACD</span>
                  <strong>{latest.indicators?.macd}</strong>
                </div>

                <div>
                  <span>Volume</span>
                  <strong>{latest.indicators?.volumeSignal}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="market-history-card">
        <div className="market-history-head">
          <h2>My Market Scan History</h2>
          <span>{scans.length} records</span>
        </div>

        {scans.length === 0 ? (
          <div className="empty-market-result">No saved scans.</div>
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