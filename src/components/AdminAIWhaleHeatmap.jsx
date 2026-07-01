import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAIWhaleHeatmap.css";
const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AdminAIWhaleHeatmap() {
  const [stats, setStats] = useState({});
  const [heatmaps, setHeatmaps] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchAdminHeatmap = async () => {
    try {
      setLoading(true);

      const [statsRes, listRes] = await Promise.all([
        axios.get(`${API_BASE}/api/ai-whale-heatmap/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/ai-whale-heatmap/admin/list`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setHeatmaps(listRes.data?.heatmaps || []);
    } finally {
      setLoading(false);
    }
  };

  const reviewHeatmap = async (id) => {
    await axios.put(
      `${API_BASE}/api/ai-whale-heatmap/admin/${id}/review`,
      { status: "Reviewed", adminNote: "Reviewed by admin" },
      authHeaders
    );

    fetchAdminHeatmap();
  };

  const deleteHeatmap = async (id) => {
    const ok = window.confirm("Delete this whale heatmap record?");
    if (!ok) return;

    await axios.delete(`${API_BASE}/api/ai-whale-heatmap/admin/${id}`, authHeaders);
    fetchAdminHeatmap();
  };

  useEffect(() => {
    fetchAdminHeatmap();
  }, []);

  if (loading) {
    return <div className="admin-heat-page">Loading AI Whale Heatmap Admin...</div>;
  }

  return (
    <div className="admin-heat-page">
      <div className="admin-heat-header">
        <div>
          <h2>AI Whale Heatmap Admin</h2>
          <p>Monitor whale heat zones, live price, buy/sell pressure, volume and AI risk.</p>
        </div>

        <button onClick={fetchAdminHeatmap}>Refresh</button>
      </div>

      <div className="admin-heat-cards">
        <div><span>Total Assets</span><strong>{stats.totalAssets || 0}</strong></div>
        <div><span>Hot Zones</span><strong>{stats.hotZones || 0}</strong></div>
        <div><span>Extreme Zones</span><strong>{stats.extremeZones || 0}</strong></div>
        <div><span>Bullish</span><strong>{stats.bullish || 0}</strong></div>
        <div><span>Bearish</span><strong>{stats.bearish || 0}</strong></div>
        <div><span>High Risk</span><strong>{stats.highRisk || 0}</strong></div>
        <div><span>Reviewed</span><strong>{stats.reviewed || 0}</strong></div>
        <div><span>Total Volume</span><strong>{formatMoney(stats.totalVolume)}</strong></div>
      </div>

      <div className="admin-heat-table-box">
        <h3>Whale Heatmap Records</h3>

        <table className="admin-heat-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Price</th>
              <th>Volume</th>
              <th>Pressure</th>
              <th>Score</th>
              <th>Heat</th>
              <th>Signal</th>
              <th>Risk</th>
              <th>Wallets</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {heatmaps.length === 0 ? (
              <tr>
                <td colSpan="11">No whale heatmap records found</td>
              </tr>
            ) : (
              heatmaps.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.symbol}</strong>
                    <small>{item.network} • {item.source}</small>
                  </td>

                  <td>{formatMoney(item.currentPrice)}</td>
                  <td>{formatMoney(item.totalWhaleVolumeUSD)}</td>

                  <td>
                    <small>Buy: {item.buyPressure}%</small>
                    <small>Sell: {item.sellPressure}%</small>
                  </td>

                  <td>{item.whaleScore}%</td>

                  <td>
                    <span className={`admin-heat-level ${item.heatLevel?.toLowerCase()}`}>
                      {item.heatLevel}
                    </span>
                  </td>

                  <td>
                    <span className={`admin-heat-signal ${item.signal?.toLowerCase()}`}>
                      {item.signal}
                    </span>
                  </td>

                  <td>
                    <span className={`admin-heat-risk ${item.riskLevel?.toLowerCase()}`}>
                      {item.riskLevel}
                    </span>
                  </td>

                  <td>{item.wallets?.length || 0}</td>

                  <td>{item.status}</td>

                  <td>
                    <div className="admin-heat-actions">
                      <button onClick={() => reviewHeatmap(item._id)}>Review</button>
                      <button className="danger" onClick={() => deleteHeatmap(item._id)}>
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