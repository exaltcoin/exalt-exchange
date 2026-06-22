import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAIRisk.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

export default function AdminAIRisk() {
  const [stats, setStats] = useState({});
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchRiskAdmin = async () => {
    try {
      setLoading(true);

      const [statsRes, profilesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/risk/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/risk/admin/profiles`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setProfiles(profilesRes.data?.profiles || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskAdmin();
  }, []);

  if (loading) {
    return <div className="admin-risk-page">Loading AI Risk Admin...</div>;
  }

  return (
    <div className="admin-risk-page">
      <div className="admin-risk-header">
        <h2>AI Risk Manager Admin</h2>
        <button onClick={fetchRiskAdmin}>Refresh</button>
      </div>

      <div className="admin-risk-cards">
        <div><span>Total Profiles</span><strong>{stats.total || 0}</strong></div>
        <div><span>Low Risk</span><strong>{stats.low || 0}</strong></div>
        <div><span>Medium Risk</span><strong>{stats.medium || 0}</strong></div>
        <div><span>High Risk</span><strong>{stats.high || 0}</strong></div>
        <div><span>Watchlist</span><strong>{stats.watchlist || 0}</strong></div>
      </div>

      <div className="admin-risk-table-box">
        <h3>User Risk Profiles</h3>

        <table className="admin-risk-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Score</th>
              <th>Level</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>

          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan="6">No risk profiles found</td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile._id}>
                  <td>{profile.user?.name || "User"}</td>
                  <td>{profile.user?.email || "No email"}</td>
                  <td>{profile.riskScore}/100</td>
                  <td>
                    <span className={`risk-badge ${profile.riskLevel?.toLowerCase()}`}>
                      {profile.riskLevel}
                    </span>
                  </td>
                  <td>{profile.status}</td>
                  <td>{new Date(profile.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}