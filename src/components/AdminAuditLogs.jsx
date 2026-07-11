import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../api";
import "./AdminAuditLogs.css";

function AdminAuditLogs() {
  const API_BASE =
    API_BASE_URL || "https://api.exaltexchange.io";

  const API = API_BASE.endsWith("/api")
    ? API_BASE.replace(/\/api$/, "")
    : API_BASE.replace(/\/+$/, "");

  const token = localStorage.getItem("token");

  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const getPublicUid = (record) => {
    return String(
      record?.uid ||
        record?.userUid ||
        record?.userId?.uid ||
        "N/A"
    );
  };

  const getAdminPublicUid = (record) => {
    return String(
      record?.adminUid ||
        record?.adminId?.uid ||
        "N/A"
    );
  };

  const loadLogs = async () => {
    try {
      setLoading(true);

      if (!token) {
        throw new Error("Admin login token is missing.");
      }

      const query = new URLSearchParams({
        module: moduleFilter,
        action: actionFilter,
        limit: "300",
      });

      const res = await fetch(
        `${API}/api/audit?${query.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Audit logs load failed."
        );
      }

      setLogs(
        Array.isArray(data.logs)
          ? data.logs
          : Array.isArray(data.data)
          ? data.data
          : []
      );
    } catch (err) {
      console.log("Audit logs load error:", err);
      alert(err.message || "Audit logs load failed.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [moduleFilter, actionFilter]);

  const uniqueModules = useMemo(() => {
    return [
      "all",
      ...new Set(
        logs.map((log) => log.module).filter(Boolean)
      ),
    ];
  }, [logs]);

  const uniqueActions = useMemo(() => {
    return [
      "all",
      ...new Set(
        logs.map((log) => log.action).filter(Boolean)
      ),
    ];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (!q) return true;

      const searchableText = [
        log.module,
        log.action,
        log.description,
        log.adminId?.name,
        log.adminId?.email,
        getAdminPublicUid(log),
        log.userId?.name,
        log.userId?.email,
        getPublicUid(log),
        log.ipAddress,
        log.userAgent,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(q);
    });
  }, [logs, search]);

  const exportCsv = () => {
    const rows = [
      [
        "Module",
        "Action",
        "Admin UID",
        "Admin",
        "User UID",
        "User",
        "IP",
        "Description",
        "User Agent",
        "Time",
      ],
      ...filteredLogs.map((log) => [
        log.module || "",
        log.action || "",
        getAdminPublicUid(log) === "N/A"
          ? ""
          : getAdminPublicUid(log),
        log.adminId?.email ||
          log.adminId?.name ||
          "System",
        getPublicUid(log) === "N/A"
          ? ""
          : getPublicUid(log),
        log.userId?.email ||
          log.userId?.name ||
          "",
        log.ipAddress || "",
        log.description || "",
        log.userAgent || "",
        log.createdAt
          ? new Date(log.createdAt).toLocaleString()
          : "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${Date.now()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString();
  };

  return (
    <div className="admin-audit-page">
      <div className="admin-audit-header">
        <div>
          <h3>Audit Logs</h3>
          <p>
            Review administrator actions, affected users,
            security activity and platform changes.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="admin-audit-toolbar">
        <input
          type="search"
          placeholder="Search UID, admin, user, action, module or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={moduleFilter}
          onChange={(e) =>
            setModuleFilter(e.target.value)
          }
        >
          {uniqueModules.map((module) => (
            <option key={module} value={module}>
              {module === "all"
                ? "All Modules"
                : module}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) =>
            setActionFilter(e.target.value)
          }
        >
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {action === "all"
                ? "All Actions"
                : action}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={exportCsv}
          disabled={filteredLogs.length === 0}
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="admin-audit-empty">
          <div className="admin-audit-spinner" />
          <h4>Loading audit logs</h4>
          <p>
            Please wait while audit records are retrieved.
          </p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="admin-audit-empty">
          <span>📋</span>
          <h4>No audit logs found</h4>
          <p>
            No audit records match the selected filters.
          </p>
        </div>
      ) : (
        <div className="admin-audit-list">
          {filteredLogs.map((log) => {
            const adminUid = getAdminPublicUid(log);
            const userUid = getPublicUid(log);

            return (
              <div
                className="admin-audit-card"
                key={log._id}
              >
                <div className="admin-audit-card-head">
                  <div>
                    <h4>
                      {log.module || "System"}
                    </h4>

                    <span className="admin-audit-action">
                      {String(
                        log.action || "unknown"
                      )
                        .replace(/_/g, " ")
                        .toUpperCase()}
                    </span>
                  </div>

                  <span className="admin-audit-time">
                    {formatDate(log.createdAt)}
                  </span>
                </div>

                <div className="admin-audit-info-grid">
                  <div>
                    <span>Admin UID</span>
                    <strong className="admin-audit-user-uid">
                      {adminUid}
                    </strong>
                  </div>

                  <div>
                    <span>Admin</span>
                    <strong>
                      {log.adminId?.email ||
                        log.adminId?.name ||
                        "System"}
                    </strong>
                  </div>

                  <div>
                    <span>User UID</span>
                    <strong className="admin-audit-user-uid">
                      {userUid}
                    </strong>
                  </div>

                  <div>
                    <span>User</span>
                    <strong>
                      {log.userId?.email ||
                        log.userId?.name ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>IP Address</span>
                    <strong>
                      {log.ipAddress || "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Description</span>
                    <strong>
                      {log.description || "N/A"}
                    </strong>
                  </div>
                </div>

                {log.userAgent && (
                  <div className="admin-audit-user-agent">
                    <span>User Agent</span>
                    <p>{log.userAgent}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminAuditLogs;