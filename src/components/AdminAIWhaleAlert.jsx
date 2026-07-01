import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAIWhaleAlert.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AdminAIWhaleAlert() {
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
        axios.get(`${API_BASE}/api/ai-whale-alerts/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/ai-whale-alerts/admin/list`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setAlerts(listRes.data?.alerts || []);
    } finally {
      setLoading(false);
    }
  };

  const reviewAlert = async (id) => {
    await axios.put(
      `${API_BASE}/api/ai-whale-alerts/admin/${id}/review`,
      { status: "Reviewed", adminNote: "Reviewed by admin" },
      authHeaders
    );

    fetchAdminAlerts();
  };

  const deleteAlert = async (id) => {
    const ok = window.confirm("Delete this whale alert?");
    if (!ok) return;

    await axios.delete(`${API_BASE}/api/ai-whale-alerts/admin/${id}`, authHeaders);
    fetchAdminAlerts();
  };

  useEffect(() => {
    fetchAdminAlerts();
  }, []);

  if (loading) {
    return <div className="admin-whale-alert-page">Loading AI Whale Alerts Admin...</div>;
  }

  return (
    <div className="admin-whale-alert-page">
      <div className="admin-whale-alert-header">
        <div>
          <h2>AI Whale Alert Admin</h2>
          <p>Monitor whale alerts, smart money signals, priority, risk and total volume.</p>
        </div>

        <button onClick={fetchAdminAlerts}>Refresh</button>
      </div>

      <div className="admin-whale-alert-cards">
        <div><span>Total Alerts</span><strong>{stats.total || 0}</strong></div>
        <div><span>Active</span><strong>{stats.active || 0}</strong></div>
        <div><span>Triggered</span><strong>{stats.triggered || 0}</strong></div>
        <div><span>Critical</span><strong>{stats.critical || 0}</strong></div>
        <div><span>Bullish</span><strong>{stats.bullish || 0}</strong></div>
        <div><span>Bearish</span><strong>{stats.bearish || 0}</strong></div>
        <div><span>Unread</span><strong>{stats.unread || 0}</strong></div>
        <div><span>Total Volume</span><strong>{formatMoney(stats.totalVolume)}</strong></div>
      </div>

      <div className="admin-whale-alert-table-box">
        <h3>Whale Alerts</h3>

        <table className="admin-whale-alert-table">
          <thead>
            <tr>
              <th>Alert</th>
              <th>Type</th>
              <th>Wallet</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Signal</th>
              <th>Priority</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Confidence</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="11">No whale alerts found</td>
              </tr>
            ) : (
              alerts.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.symbol}</strong>
                    <small>{item.message}</small>
                  </td>

                  <td>{item.alertType}</td>

                  <td>
                    <small>{item.whaleWallet || "No wallet"}</small>
                  </td>

                  <td>{formatMoney(item.price)}</td>
                  <td>{formatMoney(item.amountUSD)}</td>

                  <td>
                    <span className={`admin-whale-signal ${item.signal?.toLowerCase()}`}>
                      {item.signal}
                    </span>
                  </td>

                  <td>
                    <span className={`admin-whale-priority ${item.priority?.toLowerCase()}`}>
                      {item.priority}
                    </span>
                  </td>

                  <td>
                    <span className={`admin-whale-risk ${item.riskLevel?.toLowerCase()}`}>
                      {item.riskLevel}
                    </span>
                  </td>

                  <td>{item.status}</td>
                  <td>{item.confidence}%</td>

                  <td>
                    <div className="admin-whale-alert-actions">
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