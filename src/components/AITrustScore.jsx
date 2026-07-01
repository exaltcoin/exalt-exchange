import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AITrustScore.css";
const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";


const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AITrustScore() {
  const [trustScores, setTrustScores] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchTrustScores = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `${API_BASE}/api/ai-trust-score`,
        authHeaders
      );

      console.log("AI Trust Score Response:", res.data);

      const list =
        res.data?.trustScores ||
        res.data?.scores ||
        res.data?.data ||
        res.data?.trustScore ||
        [];

      setTrustScores(Array.isArray(list) ? list : [list]);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message || "Failed to load AI Trust Score"
      );

      setTrustScores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrustScores();
  }, []);

  if (loading) {
    return <div className="trust-page">Loading AI Trust Score...</div>;
  }

  return (
    <div className="trust-page">
      <div className="trust-header">
        <div>
          <h1>AI Trust Score</h1>
          <p>
            Token safety, liquidity, holders, whale risk and community trust
            analysis.
          </p>
        </div>

        <button onClick={fetchTrustScores}>Refresh</button>
      </div>

      {error && <div className="trust-error">{error}</div>}

      <div className="trust-grid">
        {trustScores.length === 0 ? (
          <div className="trust-empty">No trust scores found yet.</div>
        ) : (
          trustScores.map((item) => (
            <div className="trust-card" key={item._id}>
              <div className="trust-card-top">
                <div>
                  <h2>{item.symbol}</h2>
                  <p>{item.chain}</p>
                </div>

                <span
                  className={`trust-status ${String(
                    item.status || ""
                  ).toLowerCase()}`}
                >
                  {item.status}
                </span>
              </div>

              <div className="trust-score-box">
                <span>AI Trust Score</span>
                <strong>{item.trustScore || 0}%</strong>
                <small>{item.riskLevel || "Low"} Risk</small>
              </div>

              <div className="trust-progress">
                <div style={{ width: `${item.trustScore || 0}%` }} />
              </div>

              <div className="trust-data-grid">
                <span>
                  Price <b>{formatMoney(item.price)}</b>
                </span>

                <span>
                  Liquidity <b>{formatMoney(item.liquidityUSD)}</b>
                </span>

                <span>
                  Market Cap <b>{formatMoney(item.marketCapUSD)}</b>
                </span>

                <span>
                  Holders{" "}
                  <b>{Number(item.holders || 0).toLocaleString()}</b>
                </span>

                <span>
                  Liquidity Score <b>{item.liquidityScore || 0}%</b>
                </span>

                <span>
                  Holder Score <b>{item.holderScore || 0}%</b>
                </span>

                <span>
                  Whale Risk <b>{item.whaleRiskScore || 0}%</b>
                </span>

                <span>
                  Contract Safety <b>{item.contractSafetyScore || 0}%</b>
                </span>

                <span>
                  Community <b>{item.communityScore || 0}%</b>
                </span>
              </div>

              {item.flags?.length > 0 && (
                <div className="trust-flags">
                  {item.flags.map((flag, index) => (
                    <span key={index}>{flag}</span>
                  ))}
                </div>
              )}

              <p className="trust-recommendation">
                {item.recommendation}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}