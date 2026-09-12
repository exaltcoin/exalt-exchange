import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AIWhaleTracker.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AIWhaleTracker() {
  const { t } = useI18n();

  const formatDate = (date) => {
    if (!date) return t("noDate");
    return new Date(date).toLocaleString();
  };

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
    [token]
  );

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-whale-tracker`, {
        ...authHeaders,
        params: {
          search,
          symbol: symbolFilter,
          type: typeFilter,
          impact: impactFilter,
        },
      });

      setTransactions(res.data?.transactions || []);
    } catch (err) {
      setError(err.response?.data?.message || t("failedLoadWhaleTracker"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const toggleFavorite = async (id) => {
    try {
      await axios.put(
        `${API_BASE}/api/ai-whale-tracker/${id}/favorite`,
        {},
        authHeaders
      );

      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || t("failedUpdateFavorite"));
    }
  };

  if (loading) {
    return (
      <PageShell titleKey="aiWhaleTracker" subtitleKey="aiWhaleTrackerSubtitle">
        <div className="whale-page">{t("loadingWhaleTracker")}</div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="aiWhaleTracker" subtitleKey="aiWhaleTrackerSubtitle">
      <div className="whale-page">
        <div className="whale-top-action">
          <button onClick={fetchTransactions}>{t("refresh")}</button>
        </div>

        {error && <div className="whale-error">{error}</div>}

        <div className="whale-toolbar">
          <input
            placeholder={t("searchWalletOrSymbol")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)}>
            <option value="all">{t("allSymbols")}</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="BNB">BNB</option>
            <option value="SOL">SOL</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">{t("allTypes")}</option>
            <option value="Buy">{t("buy")}</option>
            <option value="Sell">{t("sell")}</option>
          </select>

          <select value={impactFilter} onChange={(e) => setImpactFilter(e.target.value)}>
            <option value="all">{t("allImpact")}</option>
            <option value="Low">{t("low")}</option>
            <option value="Medium">{t("medium")}</option>
            <option value="High">{t("high")}</option>
          </select>

          <button onClick={fetchTransactions}>{t("apply")}</button>
        </div>

        <div className="whale-grid">
          {transactions.length === 0 ? (
            <div className="whale-empty">{t("noWhaleTransactionsFound")}</div>
          ) : (
            transactions.map((item) => (
              <div className="whale-card" key={item._id}>
                <div className="whale-top">
                  <h2>{item.symbol}</h2>

                  <span className={`whale-type ${item.transactionType?.toLowerCase()}`}>
                    {item.transactionType}
                  </span>
                </div>

                <div className="whale-row">
                  <span>{t("wallet")}</span>
                  <strong>{item.walletAddress}</strong>
                </div>

                <div className="whale-row">
                  <span>{t("usdValue")}</span>
                  <strong>{formatMoney(item.amountUSD)}</strong>
                </div>

                <div className="whale-row">
                  <span>{t("aiSignal")}</span>
                  <strong>{item.aiSignal}</strong>
                </div>

                <div className="whale-row">
                  <span>{t("confidence")}</span>
                  <strong>{item.confidence}%</strong>
                </div>

                <div className="whale-row">
                  <span>{t("risk")}</span>
                  <strong className={`risk-${item.riskLevel?.toLowerCase()}`}>
                    {item.riskLevel}
                  </strong>
                </div>

                <div className="whale-row">
                  <span>{t("impact")}</span>
                  <strong className={`impact-${item.impactLevel?.toLowerCase()}`}>
                    {item.impactLevel}
                  </strong>
                </div>

                <div className="whale-row">
                  <span>{t("created")}</span>
                  <strong>{formatDate(item.createdAt)}</strong>
                </div>

                <p className="recommendation">{item.aiRecommendation}</p>

                <button className="favorite-btn" onClick={() => toggleFavorite(item._id)}>
                  {item.isFavorite ? t("favorite") : t("addFavorite")}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}