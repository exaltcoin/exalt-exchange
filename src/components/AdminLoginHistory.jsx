import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../api";
import "./AdminLoginHistory.css";

function AdminLoginHistory() {
  const API_BASE = API_BASE_URL || "https://api.exaltexchange.io";
  const API = API_BASE.endsWith("/api") ? API_BASE.replace("/api", "") : API_BASE;

  const token = localStorage.getItem("token");

  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API}/api/login-history?status=${statusFilter}&limit=300`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (err) {
      console.log("Login history load error:", err);
      alert("Login history load failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [statusFilter]);

  const filteredHistory = useMemo(() => {
    const q = search.toLowerCase();

    return history.filter((item) => {
      return (
        !q ||
        item.email?.toLowerCase().includes(q) ||
        item.userId?.email?.toLowerCase().includes(q) ||
        item.userId?.name?.toLowerCase().includes(q) ||
        item.ipAddress?.toLowerCase().includes(q) ||
        item.device?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q)
      );
    });
  }, [history, search]);

  const exportCsv = () => {
    const rows = [
      ["User", "Email", "Status", "IP", "Device", "Reason", "Time"],
      ...filteredHistory.map((item) => [
        item.userId?.name || "",
        item.email || item.userId?.email || "",
        item.status || "",
        item.ipAddress || "",
        item.device || "",
        item.reason || "",
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `login-history-${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-login-history-page">
      <h3>Login History</h3>

      <div className="admin-login-history-toolbar">
        <input
          placeholder="Search user, email, IP, device, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="2fa_required">2FA Required</option>
          <option value="blocked">Blocked</option>
        </select>

        <button onClick={loadHistory}>Refresh</button>
        <button onClick={exportCsv}>Export CSV</button>
      </div>

      {loading && <p>Loading login history...</p>}

      {filteredHistory.length === 0 ? (
        <p>No login history found.</p>
      ) : (
        filteredHistory.map((item) => (
          <div className="admin-login-history-card" key={item._id}>
            <h4>
              {item.userId?.email || item.email || "Unknown User"}
              <span className={`login-status ${item.status}`}>
                {item.status}
              </span>
            </h4>

            <p><b>User:</b> {item.userId?.name || "N/A"}</p>
            <p><b>Email:</b> {item.email || item.userId?.email || "N/A"}</p>
            <p><b>IP:</b> {item.ipAddress || "N/A"}</p>
            <p><b>Device:</b> {item.device || "N/A"}</p>
            <p><b>Reason:</b> {item.reason || "N/A"}</p>
            <p><b>Time:</b> {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}</p>

            {item.userAgent && (
              <small>
                <b>User Agent:</b> {item.userAgent}
              </small>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AdminLoginHistory;