import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AIRiskManager.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatDate = (date) => {
  if (!date) return "Not scanned yet";
  return new Date(date).toLocaleString();
};

export default function AIRiskManager() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
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
      setError(err.response?.data?.message || "Failed to load AI Risk Manager");
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
      setError(err.response?.data?.message || "Failed to refresh risk profile");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRiskProfile();
  }, []);

  const score = profile?.riskScore ?? 0;
  const level = profile?.riskLevel || "Low";
  const status = profile?.status || "Safe";
  const recommendations = profile?.recommendations || [];
  const factors = profile?.factors || {};
  const history = profile?.history || [];

  const exposure = Math.min(100, Math.max(0, score + 12));
  const protection = Math.max(0, 100 - score);
  const leverage = score >= 70 ? "1x" : score >= 40 ? "2x" : "3x";
  const health = Math.max(0, 100 - score);

  const riskMessage =
    score >= 70
      ? "High risk detected. Reduce exposure and wait for admin review if required."
      : score >= 40
      ? "Medium risk detected. Improve verification and reduce unusual activity."
      : "Low risk detected. Account is currently in a safe zone.";

  if (loading) {
    return (
      <div className="risk-page">
        <div className="risk-loading">Loading AI Risk Manager...</div>
      </div>
    );
  }

  return (
    <div className="risk-page">
      <div className="risk-header">
        <div>
          <h1>AI Risk Manager</h1>
          <p>
            Smart account risk analysis, portfolio protection and safety
            recommendations.
          </p>
        </div>

        <button onClick={refreshRisk} disabled={refreshing}>
          {refreshing ? "Scanning..." : "Refresh AI Scan"}
        </button>
      </div>

      {error && <div className="risk-error">{error}</div>}

      <div className="risk-score-panel">
        <div className="risk-score-top">
          <div>
            <span>Current Risk Score</span>
            <h2>{score}/100</h2>
            <p>Status: {status}</p>
          </div>

          <div className={`risk-score-badge ${level.toLowerCase()}`}>
            {level} Risk
          </div>
        </div>

        <div className="risk-bar">
          <div style={{ width: `${score}%` }} />
        </div>

        <p className="risk-summary">{riskMessage}</p>
      </div>

      <div className="risk-grid">
        <div className="risk-card">
          <span>Risk Level</span>
          <h2 className={`risk-level ${level.toLowerCase()}`}>{level}</h2>
        </div>

        <div className="risk-card">
          <span>Portfolio Exposure</span>
          <h2>{exposure}%</h2>
        </div>

        <div className="risk-card">
          <span>Suggested Leverage</span>
          <h2>{leverage}</h2>
        </div>

        <div className="risk-card">
          <span>Capital Protection</span>
          <h2>{protection}%</h2>
        </div>

        <div className="risk-card">
          <span>Account Health</span>
          <h2>{health}%</h2>
        </div>

        <div className="risk-card">
          <span>Last Scan</span>
          <h2 className="small-date">{formatDate(profile?.updatedAt)}</h2>
        </div>
      </div>

      <div className="risk-two-column">
        <div className="recommend-box">
          <h2>AI Recommendations</h2>

          {recommendations.length === 0 ? (
            <p>No recommendation available yet. Run AI scan.</p>
          ) : (
            recommendations.map((item, index) => <p key={index}>• {item}</p>)
          )}

          <button onClick={refreshRisk} disabled={refreshing}>
            {refreshing ? "Applying..." : "Apply Safe Mode Scan"}
          </button>
        </div>

        <div className="risk-factors-box">
          <h2>Risk Factors</h2>

          <div className="factor-row">
            <span>KYC Completed</span>
            <strong>{factors.kycCompleted ? "Yes" : "No"}</strong>
          </div>

          <div className="factor-row">
            <span>Suspicious Activity</span>
            <strong>{factors.suspiciousActivity ? "Detected" : "Clear"}</strong>
          </div>

          <div className="factor-row">
            <span>High Withdrawals</span>
            <strong>{factors.highWithdrawals ? "Yes" : "No"}</strong>
          </div>

          <div className="factor-row">
            <span>P2P Disputes</span>
            <strong>{factors.p2pDisputes || 0}</strong>
          </div>

          <div className="factor-row">
            <span>Failed Logins</span>
            <strong>{factors.failedLoginAttempts || 0}</strong>
          </div>
        </div>
      </div>

      <div className="risk-history-box">
        <h2>Risk History</h2>

        {!history.length ? (
          <p>No risk history yet.</p>
        ) : (
          history.slice(0, 8).map((item, index) => (
            <div className="risk-history-row" key={index}>
              <span className={String(item.level).toLowerCase()}>
                {item.level}
              </span>
              <strong>{item.score}/100</strong>
              <small>{item.reason}</small>
              <small>{formatDate(item.createdAt)}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}