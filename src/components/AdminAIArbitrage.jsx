import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAIArbitrage.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AdminAIArbitrage() {
  const [stats, setStats] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchData = async () => {
    try {
      setLoading(true);

      const [statsRes, listRes] = await Promise.all([
        axios.get(`${API_BASE}/api/ai-arbitrage/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/ai-arbitrage/admin/list`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setItems(listRes.data?.arbitrages || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="admin-arb-page">Loading AI Arbitrage Admin...</div>;

  return (
    <div className="admin-arb-page">
      <div className="admin-arb-header">
        <div>
          <h2>AI Arbitrage Scanner Admin</h2>
          <p>Monitor arbitrage opportunities, spread, profit, confidence and risk.</p>
        </div>

        <button onClick={fetchData}>Refresh</button>
      </div>

      <div className="admin-arb-cards">
        <div><span>Total</span><strong>{stats.total || 0}</strong></div>
        <div><span>Low Risk</span><strong>{stats.lowRisk || 0}</strong></div>
        <div><span>Medium Risk</span><strong>{stats.mediumRisk || 0}</strong></div>
        <div><span>High Risk</span><strong>{stats.highRisk || 0}</strong></div>
        <div><span>Favorites</span><strong>{stats.favorites || 0}</strong></div>
        <div><span>Total Profit</span><strong>{formatMoney(stats.totalProfit)}</strong></div>
      </div>

      <div className="admin-arb-table-box">
        <h3>Arbitrage Opportunities</h3>

        <table className="admin-arb-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Buy</th>
              <th>Sell</th>
              <th>Spread</th>
              <th>Net Profit</th>
              <th>Risk</th>
              <th>AI Confidence</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="8">No arbitrage data found</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id}>
                  <td>{item.symbol}</td>
                  <td>{item.buyExchange} — {formatMoney(item.buyPrice)}</td>
                  <td>{item.sellExchange} — {formatMoney(item.sellPrice)}</td>
                  <td>{item.spreadPercent}%</td>
                  <td>{formatMoney(item.netProfit)}</td>
                  <td>
                    <span className={`arb-risk ${item.riskLevel?.toLowerCase()}`}>
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