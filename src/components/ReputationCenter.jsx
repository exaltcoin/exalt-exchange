import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ReputationCenter.css";
const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

export default function ReputationCenter() {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchReputation = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/reputation/me`, authHeaders);
      setReputation(res.data?.reputation || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reputation");
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
      alert(err.response?.data?.message || "Failed to refresh reputation");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReputation();
  }, []);

  if (loading) {
    return <div className="reputation-page">Loading Reputation Center...</div>;
  }

  return (
    <div className="reputation-page">
      <div className="reputation-header">
        <div>
          <h1>Community Reputation System</h1>
          <p>
            Build your Exalt identity with trading trust, P2P success,
            verified badges and community activity.
          </p>
        </div>

        <button onClick={refreshScore} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh Score"}
        </button>
      </div>

      {error && <div className="reputation-error">{error}</div>}

      {!reputation ? (
        <div className="reputation-empty">No reputation profile found.</div>
      ) : (
        <>
          <div className="reputation-overview">
            <div className="reputation-score-card">
              <span>Reputation Score</span>
              <strong>{reputation.reputationScore || 0}%</strong>
              <small>{reputation.level}</small>

              <div className="reputation-progress">
                <div
                  style={{ width: `${reputation.reputationScore || 0}%` }}
                />
              </div>
            </div>

            <div className="reputation-metrics">
              <div>
                <span>P2P Rating</span>
                <strong>{reputation.p2pRating || 0}/5</strong>
              </div>

              <div>
                <span>Trading Success</span>
                <strong>{reputation.tradingSuccessRate || 0}%</strong>
              </div>

              <div>
                <span>Completed Trades</span>
                <strong>{reputation.completedTrades || 0}</strong>
              </div>

              <div>
                <span>P2P Orders</span>
                <strong>{reputation.successfulP2POrders || 0}</strong>
              </div>

              <div>
                <span>Disputes</span>
                <strong>{reputation.disputes || 0}</strong>
              </div>

              <div>
                <span>Fraud Flags</span>
                <strong>{reputation.fraudFlags?.length || 0}</strong>
              </div>
            </div>
          </div>

          <div className="reputation-badges-box">
            <h2>Badges</h2>

            <div className="reputation-badges">
              {reputation.badges?.length ? (
                reputation.badges.map((badge, index) => (
                  <span key={index}>{badge}</span>
                ))
              ) : (
                <p>No badges yet. Increase activity to unlock badges.</p>
              )}
            </div>
          </div>

          <div className="reputation-history-box">
            <h2>Reputation History</h2>

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
                <p>No reputation history yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}