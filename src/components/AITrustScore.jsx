import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AITrustScore.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AITrustScore() {
  const { t } = useI18n();

  const [trustScores, setTrustScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
    [token]
  );

  const fetchTrustScores = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-trust-score`, authHeaders);

      const list =
        res.data?.trustScores ||
        res.data?.scores ||
        res.data?.data ||
        res.data?.trustScore ||
        [];

      setTrustScores(Array.isArray(list) ? list : [list]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || t("failedLoadTrustScore"));
      setTrustScores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrustScores();
  }, []);

  if (loading) {
    return (
      <PageShell titleKey="aiTrustScore" subtitleKey="aiTrustScoreSubtitle">
        <div className="trust-page">{t("loadingTrustScore")}</div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="aiTrustScore" subtitleKey="aiTrustScoreSubtitle">
      <div className="trust-page">
        <div className="trust-top-action">
          <button onClick={fetchTrustScores}>{t("refresh")}</button>
        </div>

        {error && <div className="trust-error">{error}</div>}

        <div className="trust-grid">
          {trustScores.length === 0 ? (
            <div className="trust-empty">{t("noTrustScoresFound")}</div>
          ) : (
            trustScores.map((item) => (
              <div className="trust-card" key={item._id || item.symbol}>
                <div className="trust-card-top">
                  <div>
                    <h2>{item.symbol}</h2>
                    <p>{item.chain}</p>
                  </div>

                  <span className={`trust-status ${String(item.status || "").toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>

                <div className="trust-score-box">
                  <span>{t("aiTrustScore")}</span>
                  <strong>{item.trustScore || 0}%</strong>
                  <small>{item.riskLevel || t("low")} {t("risk")}</small>
                </div>

                <div className="trust-progress">
                  <div style={{ width: `${item.trustScore || 0}%` }} />
                </div>

                <div className="trust-data-grid">
                  <span>{t("price")} <b>{formatMoney(item.price)}</b></span>
                  <span>{t("liquidity")} <b>{formatMoney(item.liquidityUSD)}</b></span>
                  <span>{t("marketCap")} <b>{formatMoney(item.marketCapUSD)}</b></span>
                  <span>{t("holders")} <b>{Number(item.holders || 0).toLocaleString()}</b></span>
                  <span>{t("liquidityScore")} <b>{item.liquidityScore || 0}%</b></span>
                  <span>{t("holderScore")} <b>{item.holderScore || 0}%</b></span>
                  <span>{t("whaleRisk")} <b>{item.whaleRiskScore || 0}%</b></span>
                  <span>{t("contractSafety")} <b>{item.contractSafetyScore || 0}%</b></span>
                  <span>{t("community")} <b>{item.communityScore || 0}%</b></span>
                </div>

                {item.flags?.length > 0 && (
                  <div className="trust-flags">
                    {item.flags.map((flag, index) => (
                      <span key={index}>{flag}</span>
                    ))}
                  </div>
                )}

                <p className="trust-recommendation">{item.recommendation}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}