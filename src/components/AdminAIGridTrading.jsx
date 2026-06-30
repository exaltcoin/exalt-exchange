import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAIGridTrading.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AdminAIGridTrading() {
  const [stats, setStats] = useState({});
  const [grids, setGrids] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchAdminGrids = async () => {
    try {
      setLoading(true);

      const [statsRes, listRes] = await Promise.all([
        axios.get(`${API_BASE}/api/ai-grid-trading/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/ai-grid-trading/admin/list`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setGrids(listRes.data?.grids || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminGrids();
  }, []);

  if (loading) {
    return <div className="admin-grid-page">Loading AI Grid Trading Admin...</div>;
  }

  return (
    <div className="admin-grid-page">
      <div className="admin-grid-header">
        <div>
          <h2>AI Grid Trading Admin</h2>
          <p>Monitor AI grid strategies, live price ranges, profit, confidence and risk.</p>
        </div>

        <button onClick={fetchAdminGrids}>Refresh</button>
      </div>

      <div className="admin-grid-cards">
        <div><span>Total Strategies</span><strong>{stats.total || 0}</strong></div>
        <div><span>Low Risk</span><strong>{stats.lowRisk || 0}</strong></div>
        <div><span>Medium Risk</span><strong>{stats.mediumRisk || 0}</strong></div>
        <div><span>High Risk</span><strong>{stats.highRisk || 0}</strong></div>
        <div><span>Favorites</span><strong>{stats.favorites || 0}</strong></div>
        <div><span>Reviewed</span><strong>{stats.reviewed || 0}</strong></div>
        <div><span>Monthly Profit</span><strong>{formatMoney(stats.totalMonthlyProfit)}</strong></div>
      </div>

      <div className="admin-grid-table-box">
        <h3>AI Grid Strategies</h3>

        <table className="admin-grid-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Range</th>
              <th>Grid Count</th>
              <th>Investment</th>
              <th>Profit / Grid</th>
              <th>Daily Profit</th>
              <th>Monthly Profit</th>
              <th>Risk</th>
              <th>Confidence</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {grids.length === 0 ? (
              <tr>
                <td colSpan="10">No grid strategies found</td>
              </tr>
            ) : (
              grids.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.symbol}</strong>
                    <small>{item.strategyName}</small>
                  </td>
                  <td>{formatMoney(item.lowerPrice)} - {formatMoney(item.upperPrice)}</td>
                  <td>{item.gridCount}</td>
                  <td>{formatMoney(item.investment)}</td>
                  <td>{formatMoney(item.estimatedProfitPerGrid)}</td>
                  <td>{formatMoney(item.estimatedDailyProfit)}</td>
                  <td>{formatMoney(item.estimatedMonthlyProfit)}</td>
                  <td>
                    <span className={`admin-grid-risk ${item.riskLevel?.toLowerCase()}`}>
                      {item.riskLevel}
                    </span>
                  </td>
                  <td>{item.aiConfidence}%</td>
                  <td>{item.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}