import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminLearnEarn.css";

const API = "https://exalt-exchange-backend.onrender.com";

export default function AdminLearnEarn() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const loadLearnEarn = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/api/admin/learnearn`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setRecords(res.data.records || []);
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to load Learn & Earn data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearnEarn();
  }, []);

  const filteredRecords = records.filter((item) => {
    const text = `
      ${item.user?.email || ""}
      ${item.user?.name || ""}
      ${item.title || ""}
      ${item.status || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const totalUsers = new Set(records.map((r) => r.user?._id || r.userId)).size;
  const totalCompleted = records.length;
  const totalRewards = records.reduce((sum, r) => sum + Number(r.reward || 0), 0);

  const exportCSV = () => {
    const rows = [
      ["User", "Email", "Lesson", "Reward", "Status", "Date"],
      ...filteredRecords.map((r) => [
        r.user?.name || "User",
        r.user?.email || "-",
        r.title || "-",
        r.reward || 0,
        r.status || "completed",
        new Date(r.createdAt).toLocaleDateString(),
      ]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "learn-earn-records.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-learn-page">
      <div className="admin-learn-header">
        <h1>Admin Learn & Earn</h1>
        <p>Monitor user lessons, rewards, XP, and completed tasks.</p>
      </div>

      <div className="admin-learn-stats">
        <div>
          <span>Total Users</span>
          <h2>{totalUsers}</h2>
        </div>

        <div>
          <span>Lessons Completed</span>
          <h2>{totalCompleted}</h2>
        </div>

        <div>
          <span>Total Rewards</span>
          <h2>{totalRewards} EXALT</h2>
        </div>

        <div>
          <span>Status</span>
          <h2>{loading ? "Loading..." : "Live"}</h2>
        </div>
      </div>

      <div className="admin-learn-tools">
        <input
          placeholder="Search user, email, lesson, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={exportCSV}>Export CSV</button>
      </div>

      <div className="admin-learn-table-box">
        <h2>User Reward History</h2>

        <table className="admin-learn-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Lesson</th>
              <th>Reward</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="6">No Learn & Earn records found</td>
              </tr>
            ) : (
              filteredRecords.map((item, index) => (
                <tr key={item._id || index}>
                  <td>{item.user?.name || "User"}</td>
                  <td>{item.user?.email || "-"}</td>
                  <td>{item.title || "-"}</td>
                  <td>{item.reward || 0} EXALT</td>
                  <td>
                    <span className="learn-status">
                      {item.status || "completed"}
                    </span>
                  </td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}