import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../api";
import "./AdminAuditLogs.css";

function AdminAuditLogs() {
  const API_BASE = API_BASE_URL || "https://api.exaltexchange.io";
  const API = API_BASE.endsWith("/api") ? API_BASE.replace("/api", "") : API_BASE;

  const token = localStorage.getItem("token");

  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API}/api/audit?module=${moduleFilter}&action=${actionFilter}&limit=300`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.log("Audit logs load error:", err);
      alert("Audit logs load failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [moduleFilter, actionFilter]);

  const uniqueModules = useMemo(() => {
    return ["all", ...new Set(logs.map((l) => l.module).filter(Boolean))];
  }, [logs]);

  const uniqueActions = useMemo(() => {
    return ["all", ...new Set(logs.map((l) => l.action).filter(Boolean))];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();

    return logs.filter((log) => {
      return (
        !q ||
        log.module?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.description?.toLowerCase().includes(q) ||
        log.adminId?.email?.toLowerCase().includes(q) ||
        log.userId?.email?.toLowerCase().includes(q) ||
        log.ipAddress?.toLowerCase().includes(q)
      );
    });
  }, [logs, search]);

  const exportCsv = () => {
    const rows = [
      ["Module", "Action", "Admin", "User", "IP", "Description", "Time"],
      ...filteredLogs.map((log) => [
        log.module || "",
        log.action || "",
        log.adminId?.email || log.adminId?.name || "",
        log.userId?.email || log.userId?.name || "",
        log.ipAddress || "",
        log.description || "",
        log.createdAt ? new Date(log.createdAt).toLocaleString() : "",
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
    link.download = `audit-logs-${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-audit-page">
      <h3>Audit Logs</h3>

      <div className="admin-audit-toolbar">
        <input
          placeholder="Search admin, user, action, module, IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
          {uniqueModules.map((m) => (
            <option key={m} value={m}>
              {m === "all" ? "All Modules" : m}
            </option>
          ))}
        </select>

        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>
              {a === "all" ? "All Actions" : a}
            </option>
          ))}
        </select>

        <button onClick={loadLogs}>Refresh</button>
        <button onClick={exportCsv}>Export CSV</button>
      </div>

      {loading && <p>Loading audit logs...</p>}

      {filteredLogs.length === 0 ? (
        <p>No audit logs found.</p>
      ) : (
        filteredLogs.map((log) => (
          <div className="admin-audit-card" key={log._id}>
            <h4>
              {log.module}
              <span>{log.action}</span>
            </h4>

            <p><b>Admin:</b> {log.adminId?.email || log.adminId?.name || "System"}</p>
            <p><b>User:</b> {log.userId?.email || log.userId?.name || "N/A"}</p>
            <p><b>IP:</b> {log.ipAddress || "N/A"}</p>
            <p><b>Description:</b> {log.description || "N/A"}</p>
            <p><b>Time:</b> {log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}</p>

            {log.userAgent && (
              <small>
                <b>User Agent:</b> {log.userAgent}
              </small>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AdminAuditLogs;