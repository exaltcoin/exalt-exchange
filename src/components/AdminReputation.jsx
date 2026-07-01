import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminReputation.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
export default function AdminReputation() {
  const [reputations, setReputations] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchReputations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/reputation/admin/all`, authHeaders);
      setReputations(res.data?.reputations || []);
    } finally {
      setLoading(false);
    }
  };

  const markTrusted = async (item) => {
    await axios.put(
      `${API_BASE}/api/reputation/admin/${item._id}`,
      {
        reputationScore: 75,
        isTrustedTrader: true,
        adminNote: "Marked as trusted trader by admin",
        reason: "Admin approved trusted trader badge",
      },
      authHeaders
    );

    fetchReputations();
  };

  const markHighRisk = async (item) => {
    await axios.put(
      `${API_BASE}/api/reputation/admin/${item._id}`,
      {
        reputationScore: 25,
        fraudFlags: ["Admin high risk flag"],
        adminNote: "Marked high risk by admin",
        reason: "Admin marked this account as high risk",
      },
      authHeaders
    );

    fetchReputations();
  };

  useEffect(() => {
    fetchReputations();
  }, []);

  if (loading) {
    return <div className="admin-reputation-page">Loading Reputation Admin...</div>;
  }

  return (
    <div className="admin-reputation-page">
      <div className="admin-reputation-header">
        <div>
          <h2>Community Reputation Admin</h2>
          <p>Manage user trust scores, badges, fraud flags and community reputation.</p>
        </div>

        <button onClick={fetchReputations}>Refresh</button>
      </div>

      <div className="admin-reputation-cards">
        <div><span>Total Profiles</span><strong>{reputations.length}</strong></div>
        <div><span>Elite</span><strong>{reputations.filter((x) => x.level === "Elite").length}</strong></div>
        <div><span>Trusted</span><strong>{reputations.filter((x) => x.level === "Trusted").length}</strong></div>
        <div><span>High Risk</span><strong>{reputations.filter((x) => x.level === "High Risk").length}</strong></div>
      </div>

      <div className="admin-reputation-table-box">
        <h3>Reputation Profiles</h3>

        <table className="admin-reputation-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Score</th>
              <th>Level</th>
              <th>Badges</th>
              <th>P2P Rating</th>
              <th>Trades</th>
              <th>Disputes</th>
              <th>Fraud Flags</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {reputations.length === 0 ? (
              <tr>
                <td colSpan="9">No reputation profiles found</td>
              </tr>
            ) : (
              reputations.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.user?.name || "User"}</strong>
                    <small>{item.user?.email}</small>
                  </td>

                  <td>{item.reputationScore}%</td>

                  <td>
                    <span className={`admin-reputation-level ${item.level?.toLowerCase().replace(" ", "-")}`}>
                      {item.level}
                    </span>
                  </td>

                  <td>
                    <div className="admin-reputation-badges">
                      {item.badges?.length ? (
                        item.badges.slice(0, 3).map((badge, index) => (
                          <span key={index}>{badge}</span>
                        ))
                      ) : (
                        <small>No badges</small>
                      )}
                    </div>
                  </td>

                  <td>{item.p2pRating}/5</td>
                  <td>{item.completedTrades}</td>
                  <td>{item.disputes}</td>
                  <td>{item.fraudFlags?.length || 0}</td>

                  <td>
                    <div className="admin-reputation-actions">
                      <button onClick={() => markTrusted(item)}>Trusted</button>
                      <button className="danger" onClick={() => markHighRisk(item)}>
                        High Risk
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}