import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAIPortfolio.css";

const API = "https://exalt-real-backend-6b6v.onrender.com";

export default function AdminAIPortfolio() {
  const [portfolios, setPortfolios] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/api/admin/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setPortfolios(Array.isArray(res.data.portfolios) ? res.data.portfolios : []);
        setStats(res.data.stats || null);
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to load admin portfolio data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const safeDate = (date) => {
    if (!date) return "-";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString();
  };

  const filtered = useMemo(() => {
    return portfolios.filter((item) => {
      const text = `
        ${item?._id || ""}
        ${item?.status || ""}
        ${item?.totalValue || ""}
        ${item?.riskScore || ""}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [portfolios, search]);

  const exportCSV = () => {
    const rows = [
      ["UserId", "Total Value", "P/L", "Risk Score", "Diversification", "Status", "Date"],
      ...filtered.map((p) => [
        p?.userId || "-",
        p?.totalValue || 0,
        p?.totalProfitLoss || 0,
        p?.riskScore || 0,
        p?.diversification || 0,
        p?.status || "-",
        safeDate(p?.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-ai-portfolio.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-ai-portfolio-page">
      <div className="admin-ai-portfolio-header">
        <h1>Admin AI Portfolio</h1>
        <p>Monitor user portfolios, risk score, AI suggestions, and asset allocation.</p>
      </div>

      <div className="admin-ai-portfolio-stats">
        <div>
          <span>Total Users</span>
          <h2>{stats?.totalUsers || 0}</h2>
        </div>

        <div>
          <span>Total Value</span>
          <h2>{stats?.totalPortfolioValue || 0} USDT</h2>
        </div>

        <div>
          <span>Total P/L</span>
          <h2>{stats?.totalProfitLoss || 0} USDT</h2>
        </div>

        <div>
          <span>Average Risk</span>
          <h2>{stats?.avgRiskScore || 0}/100</h2>
        </div>
      </div>

      <div className="admin-ai-portfolio-tools">
        <input
          placeholder="Search portfolio, status, risk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>

        <button onClick={exportCSV} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </div>

      <div className="admin-ai-portfolio-table-box">
        <h2>Portfolio Records</h2>

        <table className="admin-ai-portfolio-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Total Value</th>
              <th>P/L</th>
              <th>Risk</th>
              <th>Diversification</th>
              <th>Assets</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8">No AI portfolio records found</td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item?._id || index}>
                  <td>{String(item?.userId || "-").slice(0, 10)}...</td>
                  <td>{item?.totalValue || 0} USDT</td>
                  <td>{item?.totalProfitLoss || 0} USDT</td>
                  <td>{item?.riskScore || 0}/100</td>
                  <td>{item?.diversification || 0}%</td>
                  <td>{item?.assets?.length || 0}</td>
                  <td>
                    <span className={`portfolio-status ${item?.status || "active"}`}>
                      {item?.status || "active"}
                    </span>
                  </td>
                  <td>{safeDate(item?.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}