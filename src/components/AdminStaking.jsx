import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminStaking.css";

const API =
  import.meta.env.VITE_API_URL ||
  "https://exalt-exchange-backend.onrender.com";

const emptyStats = {
  totalStaked: 0,
  totalRewards: 0,
  activeStakes: 0,
  totalUsers: 0,
  completedStakes: 0,
  cancelledStakes: 0,
};

export default function AdminStaking() {
  const [stakes, setStakes] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStake, setSelectedStake] = useState(null);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const buildStats = (list = [], apiStats = {}) => {
    const safeList = Array.isArray(list) ? list : [];

    setStats({
      totalStaked:
        apiStats.totalStaked ||
        safeList.reduce((sum, s) => sum + Number(s.amount || 0), 0),
      totalRewards:
        apiStats.totalRewards ||
        safeList.reduce((sum, s) => sum + Number(s.pendingReward || 0), 0),
      activeStakes:
        apiStats.activeStakes ||
        safeList.filter((s) => s.status === "active").length,
      totalUsers: new Set(
        safeList.map((s) => s.user?._id || s.userId).filter(Boolean)
      ).size,
      completedStakes: safeList.filter((s) => s.status === "completed").length,
      cancelledStakes: safeList.filter((s) => s.status === "cancelled").length,
    });
  };

  const loadAdminStakes = async () => {
    try {
      setLoading(true);

      if (!token) {
        setStakes([]);
        setStats(emptyStats);
        return;
      }

      const res = await axios.get(`${API}/api/admin/staking`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = Array.isArray(res.data?.stakes)
        ? res.data.stakes
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      setStakes(list);
      buildStats(list, res.data?.stats || {});
    } catch (err) {
      console.log("Admin staking load error:", err);
      setStakes([]);
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  };

  const cancelStake = async (id) => {
    if (!id) return alert("Stake ID missing");
    if (!window.confirm("Cancel this stake?")) return;

    try {
      await axios.post(
        `${API}/api/admin/staking/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Stake cancelled successfully");
      loadAdminStakes();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel stake");
    }
  };

  useEffect(() => {
    loadAdminStakes();
    const interval = setInterval(loadAdminStakes, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredStakes = useMemo(() => {
    return stakes.filter((stake) => {
      const text = `
        ${stake.user?.email || ""}
        ${stake.user?.name || ""}
        ${stake.coin || ""}
        ${stake.status || ""}
      `.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || stake.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [stakes, search, statusFilter]);

  const exportCSV = () => {
    if (!filteredStakes.length) return alert("No staking records to export");

    const rows = filteredStakes.map((stake) => ({
      user: stake.user?.email || stake.userId || "User",
      coin: stake.coin || "EXALT",
      amount: stake.amount || 0,
      apy: stake.apy || 0,
      duration: stake.durationDays || 0,
      reward: stake.pendingReward || 0,
      status: stake.status || "active",
      date: stake.createdAt
        ? new Date(stake.createdAt).toLocaleDateString()
        : "N/A",
    }));

    const csv =
      "User,Coin,Amount,APY,Duration,Reward,Status,Date\n" +
      rows.map((r) => Object.values(r).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "admin-staking-report.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-staking-page">
      <div className="admin-staking-header">
        <h1>Admin Staking Control</h1>
        <p>Monitor all user staking activity, rewards, and locked EXALT.</p>
      </div>

      <div className="admin-staking-cards">
        <div className="admin-staking-card"><span>Total Staked</span><h2>{stats.totalStaked} EXALT</h2></div>
        <div className="admin-staking-card"><span>Total Rewards</span><h2>{stats.totalRewards} EXALT</h2></div>
        <div className="admin-staking-card"><span>Active Stakes</span><h2>{stats.activeStakes}</h2></div>
        <div className="admin-staking-card"><span>Total Users</span><h2>{stats.totalUsers}</h2></div>
        <div className="admin-staking-card"><span>Completed</span><h2>{stats.completedStakes}</h2></div>
        <div className="admin-staking-card"><span>Cancelled</span><h2>{stats.cancelledStakes}</h2></div>
      </div>

      <div className="admin-staking-table-box">
        <input
          className="admin-staking-search"
          placeholder="Search user, email, coin, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="staking-filter-buttons">
          {["all", "active", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        <button className="export-csv-btn" onClick={exportCSV}>
          Export CSV
        </button>

        <h2>All User Stakes</h2>

        {loading ? (
          <p>Loading staking records...</p>
        ) : (
          <table className="admin-staking-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Coin</th>
                <th>Amount</th>
                <th>APY</th>
                <th>Duration</th>
                <th>Reward</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredStakes.length === 0 ? (
                <tr>
                  <td colSpan="9">No staking records found</td>
                </tr>
              ) : (
                filteredStakes.map((stake) => (
                  <tr key={stake._id}>
                    <td onClick={() => setSelectedStake(stake)}>
                      {stake.user?.email || stake.userId || "User"}
                    </td>
                    <td>{stake.coin || "EXALT"}</td>
                    <td>{stake.amount || 0}</td>
                    <td>{stake.apy || 0}%</td>
                    <td>{stake.durationDays || 0} Days</td>
                    <td>{stake.pendingReward || 0} EXALT</td>
                    <td>
                      <span className={`status-${stake.status || "active"}`}>
                        {stake.status || "active"}
                      </span>
                    </td>
                    <td>
                      {stake.createdAt
                        ? new Date(stake.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      {stake.status === "active" ? (
                        <button
                          className="cancel-btn"
                          onClick={() => cancelStake(stake._id)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="no-action">No Action</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedStake && (
        <div className="stake-popup-overlay">
          <div className="stake-popup">
            <h2>Stake Details</h2>
            <p><strong>User:</strong> {selectedStake.user?.email || selectedStake.userId}</p>
            <p><strong>Coin:</strong> {selectedStake.coin}</p>
            <p><strong>Amount:</strong> {selectedStake.amount}</p>
            <p><strong>APY:</strong> {selectedStake.apy}%</p>
            <p><strong>Duration:</strong> {selectedStake.durationDays} Days</p>
            <p><strong>Reward:</strong> {selectedStake.pendingReward || 0}</p>
            <p><strong>Status:</strong> {selectedStake.status}</p>

            <button className="close-popup-btn" onClick={() => setSelectedStake(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}