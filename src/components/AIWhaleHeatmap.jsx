import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AIWhaleHeatmap.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AIWhaleHeatmap() {
  const [heatmaps, setHeatmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchHeatmap = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-whale-heatmap`, authHeaders);
      setHeatmaps(res.data?.heatmaps || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI Whale Heatmap");
    } finally {
      setLoading(false);
    }
  };

  const syncSymbol = async (symbol) => {
    try {
      setSyncing(symbol);
      await axios.get(`${API_BASE}/api/ai-whale-heatmap/sync/${symbol}`, authHeaders);
      fetchHeatmap();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to sync symbol");
    } finally {
      setSyncing("");
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-whale-heatmap/${id}/favorite`, {}, authHeaders);
      fetchHeatmap();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update favorite");
    }
  };

  useEffect(() => {
    fetchHeatmap();
  }, []);

  if (loading) {
    return <div className="heatmap-page">Loading AI Whale Heatmap...</div>;
  }

  return (
    <div className="heatmap-page">
      <div className="heatmap-header">
        <div>
          <h1>AI Whale Heatmap</h1>
          <p>
            Real whale activity heatmap powered by Binance live prices,
            on-chain whale transactions, buy/sell pressure and AI scoring.
          </p>
        </div>

        <button onClick={fetchHeatmap}>Refresh</button>
      </div>

      {error && <div className="heatmap-error">{error}</div>}

      <div className="heatmap-grid">
        {heatmaps.map((item) => (
          <div
            className={`heatmap-card heat-${item.heatLevel?.toLowerCase()}`}
            key={item._id}
          >
            <div className="heatmap-card-top">
              <div>
                <h2>{item.symbol}</h2>
                <p>{item.network} • {item.source}</p>
              </div>

              <span className={`heat-signal ${item.signal?.toLowerCase()}`}>
                {item.signal}
              </span>
            </div>

            <div className="heat-score">
              <span>Whale Score</span>
              <strong>{item.whaleScore}%</strong>
              <small>{item.heatLevel} Heat</small>
            </div>

            <div className="heat-pressure">
              <div>
                <span>Buy Pressure</span>
                <b>{item.buyPressure}%</b>
                <div className="pressure-bar">
                  <div className="buy-bar" style={{ width: `${item.buyPressure}%` }} />
                </div>
              </div>

              <div>
                <span>Sell Pressure</span>
                <b>{item.sellPressure}%</b>
                <div className="pressure-bar">
                  <div className="sell-bar" style={{ width: `${item.sellPressure}%` }} />
                </div>
              </div>
            </div>

            <div className="heatmap-data-grid">
              <span>Price <b>{formatMoney(item.currentPrice)}</b></span>
              <span>Total Whale Volume <b>{formatMoney(item.totalWhaleVolumeUSD)}</b></span>
              <span>Buy Volume <b>{formatMoney(item.buyVolumeUSD)}</b></span>
              <span>Sell Volume <b>{formatMoney(item.sellVolumeUSD)}</b></span>
              <span>Transfer Volume <b>{formatMoney(item.transferVolumeUSD)}</b></span>
              <span>AI Confidence <b>{item.aiConfidence}%</b></span>
              <span>
                Risk{" "}
                <b className={`risk-${item.riskLevel?.toLowerCase()}`}>
                  {item.riskLevel}
                </b>
              </span>
              <span>Wallets <b>{item.wallets?.length || 0}</b></span>
            </div>

            <p className="heat-recommendation">{item.recommendation}</p>

            <div className="heat-wallets">
              <h3>Top Whale Wallets</h3>

              {!item.wallets?.length ? (
                <p>No whale wallets detected yet.</p>
              ) : (
                item.wallets.slice(0, 4).map((wallet, index) => (
                  <div className="heat-wallet-row" key={index}>
                    <span>{wallet.walletAddress}</span>
                    <b>{formatMoney(wallet.amountUSD)}</b>
                  </div>
                ))
              )}
            </div>

            <div className="heat-actions">
              <button onClick={() => syncSymbol(item.symbol)} disabled={syncing === item.symbol}>
                {syncing === item.symbol ? "Syncing..." : "Sync"}
              </button>

              <button onClick={() => toggleFavorite(item._id)}>
                {item.isFavorite ? "★ Favorite" : "☆ Favorite"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}