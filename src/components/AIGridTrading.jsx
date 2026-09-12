import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AIGridTrading.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AIGridTrading() {
  const { t } = useI18n();

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
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
    [token]
  );

  const fetchGrids = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-grid-trading`, authHeaders);
      setGrids(res.data?.grids || []);
    } catch (err) {
      setError(err.response?.data?.message || t("failedLoadGridTrading"));
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
      baseCoin: name === "symbol" ? value.replace("USDT", "") : prev.baseCoin,
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
      alert(err.response?.data?.message || t("failedCreateGridStrategy"));
    } finally {
      setCreating(false);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-grid-trading/${id}/favorite`, {}, authHeaders);
      fetchGrids();
    } catch (err) {
      alert(err.response?.data?.message || t("failedUpdateFavorite"));
    }
  };

  if (loading) {
    return (
      <PageShell titleKey="aiGridTrading" subtitleKey="aiGridTradingSubtitle">
        <div className="grid-page">{t("loadingGridTrading")}</div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="aiGridTrading" subtitleKey="aiGridTradingSubtitle">
      <div className="grid-page">
        <div className="grid-top-action">
          <button onClick={fetchGrids}>{t("refresh")}</button>
        </div>

        {error && <div className="grid-error">{error}</div>}

        <div className="grid-layout">
          <form className="grid-form-card" onSubmit={createGrid}>
            <h2>{t("createGridStrategy")}</h2>

            <div className="grid-input-grid">
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
                {t("marketType")}
                <select name="marketType" value={form.marketType} onChange={handleChange}>
                  <option>Spot</option>
                  <option>Futures</option>
                </select>
              </label>

              <label>
                {t("gridCount")}
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
                {t("investment")}
                <input
                  name="investment"
                  type="number"
                  min="0"
                  value={form.investment}
                  onChange={handleChange}
                />
              </label>

              <label>
                {t("leverage")}
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
              {creating ? t("generating") : t("generateAiGrid")}
            </button>
          </form>

          <div className="grid-result-card">
            <h2>{t("topGridStrategy")}</h2>

            {!grids.length ? (
              <div className="empty-grid">{t("noGridStrategiesFound")}</div>
            ) : (
              <div className="grid-main-result">
                <span>{grids[0].symbol}</span>
                <strong>{formatMoney(grids[0].estimatedMonthlyProfit)}</strong>
                <p>{grids[0].recommendation}</p>

                <div className="grid-main-grid">
                  <div>
                    <span>{t("lowerPrice")}</span>
                    <b>{formatMoney(grids[0].lowerPrice)}</b>
                  </div>

                  <div>
                    <span>{t("upperPrice")}</span>
                    <b>{formatMoney(grids[0].upperPrice)}</b>
                  </div>

                  <div>
                    <span>{t("gridCount")}</span>
                    <b>{grids[0].gridCount}</b>
                  </div>

                  <div>
                    <span>{t("aiConfidence")}</span>
                    <b>{grids[0].aiConfidence}%</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid-list-card">
          <div className="grid-list-head">
            <h2>{t("gridStrategies")}</h2>
            <span>{grids.length} {t("records")}</span>
          </div>

          <div className="grid-list">
            {grids.length === 0 ? (
              <div className="empty-grid">{t("noGridStrategiesFound")}</div>
            ) : (
              grids.map((item) => (
                <div className="grid-row" key={item._id}>
                  <div>
                    <strong>{item.symbol}</strong>
                    <small>{item.strategyName}</small>
                  </div>

                  <span>{formatMoney(item.lowerPrice)} - {formatMoney(item.upperPrice)}</span>
                  <span>{item.gridCount} {t("grids")}</span>
                  <span>{formatMoney(item.estimatedMonthlyProfit)}</span>

                  <span className={`grid-risk-pill ${item.riskLevel?.toLowerCase()}`}>
                    {item.riskLevel}
                  </span>

                  <span>{item.aiConfidence}%</span>

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