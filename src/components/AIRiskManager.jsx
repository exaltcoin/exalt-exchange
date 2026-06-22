import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AIRiskManager.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

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

  const exposure = Math.min(100, Math.max(0, score + 12));
  const protection = Math.max(0, 100 - score);
  const leverage = score >= 70 ? "1x" : score >= 40 ? "2x" : "3x";

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
          <p>Smart account risk analysis, portfolio protection and safety recommendations.</p>
        </div>

        <button onClick={refreshRisk} disabled={refreshing}>
          {refreshing ? "Scanning..." : "Refresh AI Scan"}
        </button>
      </div>

      {error && <div className="risk-error">{error}</div>}

      <div className="risk-score-panel">
        <div>
          <span>Current Risk Score</span>
          <h2>{score}/100</h2>
          <p>Status: {status}</p>
        </div>

        <div className="risk-bar">
          <div style={{ width: `${score}%` }} />
        </div>
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
      </div>

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

      <div className="risk-history-box">
        <h2>Risk History</h2>

        {!profile?.history?.length ? (
          <p>No risk history yet.</p>
        ) : (
          profile.history.slice(0, 5).map((item, index) => (
            <div className="risk-history-row" key={index}>
              <span>{item.level}</span>
              <strong>{item.score}/100</strong>
              <small>{item.reason}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}