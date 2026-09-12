import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AIWhaleHeatmap.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AIWhaleHeatmap() {
  const { t } = useI18n();

  const [heatmaps, setHeatmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
    [token]
  );

  const fetchHeatmap = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-whale-heatmap`, authHeaders);
      setHeatmaps(res.data?.heatmaps || []);
    } catch (err) {
      setError(err.response?.data?.message || t("failedLoadWhaleHeatmap"));
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
      alert(err.response?.data?.message || t("failedSyncSymbol"));
    } finally {
      setSyncing("");
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-whale-heatmap/${id}/favorite`, {}, authHeaders);
      fetchHeatmap();
    } catch (err) {
      alert(err.response?.data?.message || t("failedUpdateFavorite"));
    }
  };

  useEffect(() => {
    fetchHeatmap();
  }, []);

  if (loading) {
    return (
      <PageShell titleKey="aiWhaleHeatmap" subtitleKey="aiWhaleHeatmapSubtitle">
        <div className="heatmap-page">{t("loadingWhaleHeatmap")}</div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="aiWhaleHeatmap" subtitleKey="aiWhaleHeatmapSubtitle">
      <div className="heatmap-page">
        <div className="heatmap-top-action">
          <button onClick={fetchHeatmap}>{t("refresh")}</button>
        </div>

        {error && <div className="heatmap-error">{error}</div>}

        <div className="heatmap-grid">
          {heatmaps.length === 0 ? (
            <div className="empty-heatmap">{t("noHeatmapDataFound")}</div>
          ) : (
            heatmaps.map((item) => (
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
                  <span>{t("whaleScore")}</span>
                  <strong>{item.whaleScore}%</strong>
                  <small>{item.heatLevel} {t("heat")}</small>
                </div>

                <div className="heat-pressure">
                  <div>
                    <span>{t("buyPressure")}</span>
                    <b>{item.buyPressure}%</b>
                    <div className="pressure-bar">
                      <div className="buy-bar" style={{ width: `${item.buyPressure}%` }} />
                    </div>
                  </div>

                  <div>
                    <span>{t("sellPressure")}</span>
                    <b>{item.sellPressure}%</b>
                    <div className="pressure-bar">
                      <div className="sell-bar" style={{ width: `${item.sellPressure}%` }} />
                    </div>
                  </div>
                </div>

                <div className="heatmap-data-grid">
                  <span>{t("price")} <b>{formatMoney(item.currentPrice)}</b></span>
                  <span>{t("totalWhaleVolume")} <b>{formatMoney(item.totalWhaleVolumeUSD)}</b></span>
                  <span>{t("buyVolume")} <b>{formatMoney(item.buyVolumeUSD)}</b></span>
                  <span>{t("sellVolume")} <b>{formatMoney(item.sellVolumeUSD)}</b></span>
                  <span>{t("transferVolume")} <b>{formatMoney(item.transferVolumeUSD)}</b></span>
                  <span>{t("aiConfidence")} <b>{item.aiConfidence}%</b></span>
                  <span>
                    {t("risk")}{" "}
                    <b className={`risk-${item.riskLevel?.toLowerCase()}`}>
                      {item.riskLevel}
                    </b>
                  </span>
                  <span>{t("wallets")} <b>{item.wallets?.length || 0}</b></span>
                </div>

                <p className="heat-recommendation">{item.recommendation}</p>

                <div className="heat-wallets">
                  <h3>{t("topWhaleWallets")}</h3>

                  {!item.wallets?.length ? (
                    <p>{t("noWhaleWalletsDetected")}</p>
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
                    {syncing === item.symbol ? t("syncing") : t("sync")}
                  </button>

                  <button onClick={() => toggleFavorite(item._id)}>
                    {item.isFavorite ? t("favorite") : t("addFavorite")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}