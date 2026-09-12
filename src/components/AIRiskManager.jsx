import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AIRiskManager.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

export default function AIRiskManager() {
  const { t } = useI18n();

  const formatDate = (date) => {
    if (!date) return t("notScannedYet");
    return new Date(date).toLocaleString();
  };

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    }),
    [token]
  );

  const fetchRiskProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/risk/me`, authHeaders);
      setProfile(res.data?.profile || null);
    } catch (err) {
      setError(err.response?.data?.message || t("failedLoadRiskManager"));
    } finally {
      setLoading(false);
    }
  };

  const refreshRisk = async () => {
    try {
      setRefreshing(true);
      setError("");

      const res = await axios.post(`${API_BASE}/api/risk/refresh`, {}, authHeaders);
      setProfile(res.data?.profile || null);
    } catch (err) {
      setError(err.response?.data?.message || t("failedRefreshRiskProfile"));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRiskProfile();
  }, []);

  const score = profile?.riskScore ?? 0;
  const level = profile?.riskLevel || t("low");
  const status = profile?.status || t("safe");
  const recommendations = profile?.recommendations || [];
  const factors = profile?.factors || {};
  const history = profile?.history || [];

  const exposure = Math.min(100, Math.max(0, score + 12));
  const protection = Math.max(0, 100 - score);
  const leverage = score >= 70 ? "1x" : score >= 40 ? "2x" : "3x";
  const health = Math.max(0, 100 - score);

  const riskMessage =
    score >= 70
      ? t("highRiskDetected")
      : score >= 40
      ? t("mediumRiskDetected")
      : t("lowRiskDetected");

  if (loading) {
    return (
      <PageShell titleKey="aiRiskManager" subtitleKey="aiRiskManagerSubtitle">
        <div className="risk-page">
          <div className="risk-loading">{t("loadingRiskManager")}</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="aiRiskManager" subtitleKey="aiRiskManagerSubtitle">
      <div className="risk-page">
        <div className="risk-top-action">
          <button onClick={refreshRisk} disabled={refreshing}>
            {refreshing ? t("scanning") : t("refreshAiScan")}
          </button>
        </div>

        {error && <div className="risk-error">{error}</div>}

        <div className="risk-score-panel">
          <div className="risk-score-top">
            <div>
              <span>{t("currentRiskScore")}</span>
              <h2>{score}/100</h2>
              <p>{t("status")}: {status}</p>
            </div>

            <div className={`risk-score-badge ${String(level).toLowerCase()}`}>
              {level} {t("risk")}
            </div>
          </div>

          <div className="risk-bar">
            <div style={{ width: `${score}%` }} />
          </div>

          <p className="risk-summary">{riskMessage}</p>
        </div>

        <div className="risk-grid">
          <div className="risk-card">
            <span>{t("riskLevel")}</span>
            <h2 className={`risk-level ${String(level).toLowerCase()}`}>{level}</h2>
          </div>

          <div className="risk-card">
            <span>{t("portfolioExposure")}</span>
            <h2>{exposure}%</h2>
          </div>

          <div className="risk-card">
            <span>{t("suggestedLeverage")}</span>
            <h2>{leverage}</h2>
          </div>

          <div className="risk-card">
            <span>{t("capitalProtection")}</span>
            <h2>{protection}%</h2>
          </div>

          <div className="risk-card">
            <span>{t("accountHealth")}</span>
            <h2>{health}%</h2>
          </div>

          <div className="risk-card">
            <span>{t("lastScan")}</span>
            <h2 className="small-date">{formatDate(profile?.updatedAt)}</h2>
          </div>
        </div>

        <div className="risk-two-column">
          <div className="recommend-box">
            <h2>{t("aiRecommendations")}</h2>

            {recommendations.length === 0 ? (
              <p>{t("noRecommendationYet")}</p>
            ) : (
              recommendations.map((item, index) => <p key={index}>• {item}</p>)
            )}

            <button onClick={refreshRisk} disabled={refreshing}>
              {refreshing ? t("applying") : t("applySafeModeScan")}
            </button>
          </div>

          <div className="risk-factors-box">
            <h2>{t("riskFactors")}</h2>

            <div className="factor-row">
              <span>{t("kycCompleted")}</span>
              <strong>{factors.kycCompleted ? t("yes") : t("no")}</strong>
            </div>

            <div className="factor-row">
              <span>{t("suspiciousActivity")}</span>
              <strong>{factors.suspiciousActivity ? t("detected") : t("clear")}</strong>
            </div>

            <div className="factor-row">
              <span>{t("highWithdrawals")}</span>
              <strong>{factors.highWithdrawals ? t("yes") : t("no")}</strong>
            </div>

            <div className="factor-row">
              <span>{t("p2pDisputes")}</span>
              <strong>{factors.p2pDisputes || 0}</strong>
            </div>

            <div className="factor-row">
              <span>{t("failedLogins")}</span>
              <strong>{factors.failedLoginAttempts || 0}</strong>
            </div>
          </div>
        </div>

        <div className="risk-history-box">
          <h2>{t("riskHistory")}</h2>

          {!history.length ? (
            <p>{t("noRiskHistoryYet")}</p>
          ) : (
            history.slice(0, 8).map((item, index) => (
              <div className="risk-history-row" key={index}>
                <span className={String(item.level).toLowerCase()}>{item.level}</span>
                <strong>{item.score}/100</strong>
                <small>{item.reason}</small>
                <small>{formatDate(item.createdAt)}</small>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}