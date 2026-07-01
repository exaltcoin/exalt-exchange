import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAILaunchpad.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AdminAILaunchpad() {
  const [stats, setStats] = useState({});
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchAdminLaunchpad = async () => {
    try {
      setLoading(true);

      const [statsRes, listRes] = await Promise.all([
        axios.get(`${API_BASE}/api/ai-launchpad/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/ai-launchpad/admin`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setProjects(listRes.data?.projects || []);
    } finally {
      setLoading(false);
    }
  };

  const reviewProject = async (id, payload) => {
    await axios.put(
      `${API_BASE}/api/ai-launchpad/admin/review/${id}`,
      payload,
      authHeaders
    );

    fetchAdminLaunchpad();
  };

  const deleteProject = async (id) => {
    const ok = window.confirm("Delete this launchpad project?");
    if (!ok) return;

    await axios.delete(`${API_BASE}/api/ai-launchpad/admin/${id}`, authHeaders);
    fetchAdminLaunchpad();
  };

  useEffect(() => {
    fetchAdminLaunchpad();
  }, []);

  if (loading) {
    return <div className="admin-launch-page">Loading AI Launchpad Admin...</div>;
  }

  return (
    <div className="admin-launch-page">
      <div className="admin-launch-header">
        <div>
          <h2>AI Launchpad Admin</h2>
          <p>Review projects, verify KYC, audit status, featured launches and raised amount.</p>
        </div>

        <button onClick={fetchAdminLaunchpad}>Refresh</button>
      </div>

      <div className="admin-launch-cards">
        <div><span>Total Projects</span><strong>{stats.total || 0}</strong></div>
        <div><span>Live</span><strong>{stats.live || 0}</strong></div>
        <div><span>Upcoming</span><strong>{stats.upcoming || 0}</strong></div>
        <div><span>Ended</span><strong>{stats.ended || 0}</strong></div>
        <div><span>Verified</span><strong>{stats.verified || 0}</strong></div>
        <div><span>Featured</span><strong>{stats.featured || 0}</strong></div>
        <div><span>Low Risk</span><strong>{stats.lowRisk || 0}</strong></div>
        <div><span>Total Raised</span><strong>{formatMoney(stats.totalRaised)}</strong></div>
      </div>

      <div className="admin-launch-table-box">
        <h3>Launchpad Projects</h3>

        <table className="admin-launch-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Chain</th>
              <th>Raised</th>
              <th>Caps</th>
              <th>AI Score</th>
              <th>Risk</th>
              <th>Audit</th>
              <th>KYC</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan="11">No launchpad projects found</td>
              </tr>
            ) : (
              projects.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.projectName}</strong>
                    <small>{item.symbol} • {item.category}</small>
                  </td>

                  <td>{item.chain}</td>

                  <td>{formatMoney(item.raisedAmount)}</td>

                  <td>
                    <small>Soft: {formatMoney(item.softCap)}</small>
                    <small>Hard: {formatMoney(item.hardCap)}</small>
                  </td>

                  <td>{item.aiScore}%</td>

                  <td>
                    <span className={`admin-launch-risk ${item.riskLevel?.toLowerCase()}`}>
                      {item.riskLevel}
                    </span>
                  </td>

                  <td>{item.auditStatus}</td>
                  <td>{item.kycStatus}</td>

                  <td>
                    <span className={`admin-launch-status ${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>

                  <td>
                    <div className="admin-launch-flags">
                      {item.verified && <span>Verified</span>}
                      {item.featured && <span>Featured</span>}
                      {!item.verified && !item.featured && <small>No flags</small>}
                    </div>
                  </td>

                  <td>
                    <div className="admin-launch-actions">
                      <button
                        onClick={() =>
                          reviewProject(item._id, {
                            status: "Reviewed",
                            verified: true,
                            auditStatus: "Passed",
                            kycStatus: "Passed",
                            adminNote: "Reviewed by admin",
                          })
                        }
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          reviewProject(item._id, {
                            featured: !item.featured,
                            adminNote: "Featured status updated",
                          })
                        }
                      >
                        {item.featured ? "Unfeature" : "Feature"}
                      </button>

                      <button
                        className="danger"
                        onClick={() => deleteProject(item._id)}
                      >
                        Delete
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