import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./ReputationCenter.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

export default function ReputationCenter() {
  const { t } = useI18n();

  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
    [token]
  );

  const fetchReputation = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/reputation/me`, authHeaders);
      setReputation(res.data?.reputation || null);
    } catch (err) {
      setError(err.response?.data?.message || t("failedLoadReputation"));
    } finally {
      setLoading(false);
    }
  };

  const refreshScore = async () => {
    try {
      setRefreshing(true);

      const res = await axios.post(
        `${API_BASE}/api/reputation/refresh`,
        {},
        authHeaders
      );

      setReputation(res.data?.reputation || null);
    } catch (err) {
      alert(err.response?.data?.message || t("failedRefreshReputation"));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReputation();
  }, []);

  if (loading) {
    return (
      <PageShell titleKey="reputationCenter" subtitleKey="reputationCenterSubtitle">
        <div className="reputation-page">{t("loadingReputationCenter")}</div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="reputationCenter" subtitleKey="reputationCenterSubtitle">
      <div className="reputation-page">
        <div className="reputation-top-action">
          <button onClick={refreshScore} disabled={refreshing}>
            {refreshing ? t("refreshing") : t("refreshScore")}
          </button>
        </div>

        {error && <div className="reputation-error">{error}</div>}

        {!reputation ? (
          <div className="reputation-empty">{t("noReputationProfileFound")}</div>
        ) : (
          <>
            <div className="reputation-overview">
              <div className="reputation-score-card">
                <span>{t("reputationScore")}</span>
                <strong>{reputation.reputationScore || 0}%</strong>
                <small>{reputation.level}</small>

                <div className="reputation-progress">
                  <div style={{ width: `${reputation.reputationScore || 0}%` }} />
                </div>
              </div>

              <div className="reputation-metrics">
                <div>
                  <span>{t("p2pRating")}</span>
                  <strong>{reputation.p2pRating || 0}/5</strong>
                </div>

                <div>
                  <span>{t("tradingSuccess")}</span>
                  <strong>{reputation.tradingSuccessRate || 0}%</strong>
                </div>

                <div>
                  <span>{t("completedTrades")}</span>
                  <strong>{reputation.completedTrades || 0}</strong>
                </div>

                <div>
                  <span>{t("p2pOrders")}</span>
                  <strong>{reputation.successfulP2POrders || 0}</strong>
                </div>

                <div>
                  <span>{t("disputes")}</span>
                  <strong>{reputation.disputes || 0}</strong>
                </div>

                <div>
                  <span>{t("fraudFlags")}</span>
                  <strong>{reputation.fraudFlags?.length || 0}</strong>
                </div>
              </div>
            </div>

            <div className="reputation-badges-box">
              <h2>{t("badges")}</h2>

              <div className="reputation-badges">
                {reputation.badges?.length ? (
                  reputation.badges.map((badge, index) => (
                    <span key={index}>{badge}</span>
                  ))
                ) : (
                  <p>{t("noBadgesYet")}</p>
                )}
              </div>
            </div>

            <div className="reputation-history-box">
              <h2>{t("reputationHistory")}</h2>

              <div className="reputation-history">
                {reputation.history?.length ? (
                  reputation.history.slice(0, 8).map((item, index) => (
                    <div className="reputation-history-row" key={index}>
                      <div>
                        <strong>{item.action}</strong>
                        <p>{item.reason}</p>
                      </div>

                      <span>{item.score}%</span>
                    </div>
                  ))
                ) : (
                  <p>{t("noReputationHistoryYet")}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}