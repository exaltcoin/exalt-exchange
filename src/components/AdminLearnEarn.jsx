import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminLearnEarn.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;
export default function AdminLearnEarn() {
  const [records, setRecords] = useState([]);
  const [topLearners, setTopLearners] = useState([]);
  const [backendStats, setBackendStats] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const safeDate = (date) => {
    if (!date) return "-";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString();
  };

  const getName = (item) =>
    item?.userId?.name || item?.user?.name || item?.name || "User";

  const getEmail = (item) =>
    item?.userId?.email || item?.user?.email || item?.email || "-";

  const getLesson = (item) =>
    item?.lessonTitle || item?.title || item?.lesson || "-";

  const loadLearnEarn = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/api/admin/learnearn`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setRecords(Array.isArray(res.data.records) ? res.data.records : []);
        setTopLearners(Array.isArray(res.data.topLearners) ? res.data.topLearners : []);
        setBackendStats(res.data.stats || null);
      }
    } catch (err) {
      console.log(err);
      setRecords([]);
      setTopLearners([]);
      alert(err.response?.data?.message || "Failed to load Learn & Earn data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearnEarn();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const text = `
        ${getEmail(item)}
        ${getName(item)}
        ${getLesson(item)}
        ${item?.status || ""}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [records, search]);

  const totalUsers =
    backendStats?.totalUsers ??
    new Set(records.map((r) => r?.userId?._id || r?.user?._id || r?.userId || r?.user).filter(Boolean)).size;

  const totalCompleted = backendStats?.totalCompleted ?? records.length;

  const totalRewards =
    backendStats?.totalRewards ??
    records.reduce((sum, r) => sum + Number(r?.reward || 0), 0);

  const totalCertificates = backendStats?.totalCertificates ?? totalCompleted;

  const exportCSV = () => {
    const rows = [
      ["User", "Email", "Lesson", "Reward", "Status", "Date"],
      ...filteredRecords.map((r) => [
        getName(r),
        getEmail(r),
        getLesson(r),
        r?.reward || 0,
        r?.status || "completed",
        safeDate(r?.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
        <p>Monitor user lessons, rewards, XP, certificates, and completed tasks.</p>
      </div>

      <div className="admin-learn-stats">
        <div><span>Total Users</span><h2>{totalUsers}</h2></div>
        <div><span>Lessons Completed</span><h2>{totalCompleted}</h2></div>
        <div><span>Total Rewards</span><h2>{totalRewards} EXALT</h2></div>
        <div><span>Certificates</span><h2>{totalCertificates}</h2></div>
      </div>

      <div className="admin-learn-tools">
        <input
          placeholder="Search user, email, lesson, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={loadLearnEarn} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>

        <button onClick={exportCSV} disabled={filteredRecords.length === 0}>
          Export CSV
        </button>
      </div>

      <div className="admin-learn-table-box">
        <h2>Top Learners</h2>

        {topLearners.length === 0 ? (
          <p className="admin-learn-empty">No top learners yet</p>
        ) : (
          <table className="admin-learn-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Completed</th>
                <th>Rewards</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {topLearners.map((item, index) => (
                <tr key={item?.userId?._id || item?.user?._id || index}>
                  <td>{getName(item)}</td>
                  <td>{getEmail(item)}</td>
                  <td>{item?.completed || 0}</td>
                  <td>{item?.rewards || 0} EXALT</td>
                  <td>{item?.xp || 0} XP</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
                <tr key={item?._id || index}>
                  <td>{getName(item)}</td>
                  <td>{getEmail(item)}</td>
                  <td>{getLesson(item)}</td>
                  <td>{item?.reward || 0} EXALT</td>
                  <td>
                    <span className={`learn-status ${item?.status || "completed"}`}>
                      {item?.status || "completed"}
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