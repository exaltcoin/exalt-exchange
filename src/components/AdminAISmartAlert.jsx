import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAISmartAlerts.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AdminAISmartAlerts() {
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchAdminAlerts = async () => {
    try {
      setLoading(true);

      const [statsRes, listRes] = await Promise.all([
        axios.get(`${API_BASE}/api/ai-smart-alerts/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/ai-smart-alerts/admin/list`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setAlerts(listRes.data?.alerts || []);
    } finally {
      setLoading(false);
    }
  };

  const reviewAlert = async (id) => {
    await axios.put(
      `${API_BASE}/api/ai-smart-alerts/admin/${id}/review`,
      { status: "Reviewed", adminNote: "Reviewed by admin" },
      authHeaders
    );
    fetchAdminAlerts();
  };

  const deleteAlert = async (id) => {
    const ok = window.confirm("Delete this smart alert?");
    if (!ok) return;

    await axios.delete(`${API_BASE}/api/ai-smart-alerts/admin/${id}`, authHeaders);
    fetchAdminAlerts();
  };

  useEffect(() => {
    fetchAdminAlerts();
  }, []);

  if (loading) {
    return <div className="admin-smart-page">Loading AI Smart Alerts Admin...</div>;
  }

  return (
    <div className="admin-smart-page">
      <div className="admin-smart-header">
        <div>
          <h2>AI Smart Alerts Admin</h2>
          <p>Monitor alerts, triggered signals, priorities, unread alerts and reviews.</p>
        </div>

        <button onClick={fetchAdminAlerts}>Refresh</button>
      </div>

      <div className="admin-smart-cards">
        <div><span>Total Alerts</span><strong>{stats.total || 0}</strong></div>
        <div><span>Active</span><strong>{stats.active || 0}</strong></div>
        <div><span>Triggered</span><strong>{stats.triggered || 0}</strong></div>
        <div><span>Critical</span><strong>{stats.critical || 0}</strong></div>
        <div><span>High Priority</span><strong>{stats.high || 0}</strong></div>
        <div><span>Unread</span><strong>{stats.unread || 0}</strong></div>
        <div><span>Favorites</span><strong>{stats.favorites || 0}</strong></div>
        <div><span>Reviewed</span><strong>{stats.reviewed || 0}</strong></div>
      </div>

      <div className="admin-smart-table-box">
        <h3>AI Smart Alerts</h3>

        <table className="admin-smart-table">
          <thead>
            <tr>
              <th>Alert</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Condition</th>
              <th>Current</th>
              <th>Target</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Confidence</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="10">No alerts found</td>
              </tr>
            ) : (
              alerts.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.title}</strong>
                    <small>{item.message}</small>
                  </td>
                  <td>{item.symbol}</td>
                  <td>{item.alertType}</td>
                  <td>{item.condition}</td>
                  <td>{formatMoney(item.currentPrice)}</td>
                  <td>{formatMoney(item.targetPrice)}</td>
                  <td>
                    <span className={`admin-smart-priority ${item.priority?.toLowerCase()}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-smart-status ${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.aiConfidence}%</td>
                  <td>
                    <div className="admin-smart-actions">
                      <button onClick={() => reviewAlert(item._id)}>Review</button>
                      <button className="danger" onClick={() => deleteAlert(item._id)}>
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