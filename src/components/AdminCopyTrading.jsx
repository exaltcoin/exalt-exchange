import { useEffect, useMemo, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
export default function AdminCopyTrading() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    paused: 0,
    totalFollowers: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/copy-trading/admin/all`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });

      const data = await res.json();

      const list = Array.isArray(data.traders)
        ? data.traders
        : Array.isArray(data.records)
        ? data.records
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setRecords(list);

      setStats({
        total: list.length,
        active: list.filter((x) => x.status === "active").length,
        paused: list.filter((x) => x.status === "paused").length,
        totalFollowers: list.reduce(
          (sum, x) => sum + Number(x.followers || x.copiers || 0),
          0
        ),
      });
    } catch (error) {
      console.log("Admin copy trading load error:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const text = `
        ${item.user?.email || ""}
        ${item.traderName || item.name || ""}
        ${item.strategy || ""}
        ${item.status || ""}
      `.toLowerCase();

      const matchSearch = text.includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [records, search, statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/api/copy-trading/admin/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        alert(`Copy trader ${status}`);
        loadData();
      } else {
        alert(data.message || "Status update failed");
      }
    } catch (error) {
      console.log(error);
      alert("Status update failed");
    }
  };

  return (
    <div className="admin-content">
      <h2>Admin AI Copy Trading</h2>
      <p>Monitor copy traders, followers, strategies and account status.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Traders</h3>
          <p>{stats.total}</p>
        </div>

        <div className="stat-card">
          <h3>Active</h3>
          <p>{stats.active}</p>
        </div>

        <div className="stat-card">
          <h3>Paused</h3>
          <p>{stats.paused}</p>
        </div>

        <div className="stat-card">
          <h3>Total Followers</h3>
          <p>{stats.totalFollowers}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "18px 0" }}>
        <input
          className="web3-input"
          placeholder="Search trader, email, strategy..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "240px" }}
        />

        <select
          className="web3-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: "180px" }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="blocked">Blocked</option>
        </select>

        <button className="action-btn yellow-btn" onClick={loadData}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading copy trading data...</p>
      ) : filteredRecords.length === 0 ? (
        <p>No copy trading records found.</p>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Trader</th>
                <th>Email</th>
                <th>Strategy</th>
                <th>ROI</th>
                <th>Followers</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((item, index) => (
                <tr key={item._id || index}>
                  <td>{item.traderName || item.name || "Trader"}</td>
                  <td>{item.user?.email || item.email || "N/A"}</td>
                  <td>{item.strategy || "Smart Copy"}</td>
                  <td className="green-text">
                    {Number(item.roi || item.profitPercent || 0).toFixed(2)}%
                  </td>
                  <td>{item.followers || item.copiers || 0}</td>
                  <td>{item.riskLevel || "Medium"}</td>
                  <td>{item.status || "active"}</td>
                  <td>
                    <button
                      className="action-btn green-btn"
                      onClick={() => updateStatus(item._id, "active")}
                    >
                      Active
                    </button>

                    <button
                      className="action-btn reject-btn"
                      onClick={() => updateStatus(item._id, "paused")}
                    >
                      Pause
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}