import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../api";
import "./AdminLoginHistory.css";

function AdminLoginHistory() {
  const API_BASE =
    API_BASE_URL || "https://api.exaltexchange.io";

  const API = API_BASE.endsWith("/api")
    ? API_BASE.replace(/\/api$/, "")
    : API_BASE.replace(/\/+$/, "");

  const token = localStorage.getItem("token");

  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const getPublicUid = (item) => {
    return String(
      item?.userId?.uid ||
        item?.uid ||
        item?.userUid ||
        "N/A"
    );
  };

  const loadHistory = async () => {
    try {
      setLoading(true);

      if (!token) {
        alert("Admin login token is missing.");
        return;
      }

      const res = await fetch(
        `${API}/api/login-history?status=${encodeURIComponent(
          statusFilter
        )}&limit=300`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Login history load failed."
        );
      }

      setHistory(
        Array.isArray(data.history)
          ? data.history
          : Array.isArray(data.data)
          ? data.data
          : []
      );
    } catch (err) {
      console.log("Login history load error:", err);
      alert(err.message || "Login history load failed.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [statusFilter]);

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();

    return history.filter((item) => {
      if (!q) return true;

      const searchableText = [
        getPublicUid(item),
        item.userId?.name,
        item.userId?.email,
        item.email,
        item.ipAddress,
        item.device,
        item.status,
        item.reason,
        item.userAgent,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(q);
    });
  }, [history, search]);

  const exportCsv = () => {
    const rows = [
      [
        "UID",
        "User",
        "Email",
        "Status",
        "IP",
        "Device",
        "Reason",
        "User Agent",
        "Time",
      ],
      ...filteredHistory.map((item) => [
        getPublicUid(item) === "N/A"
          ? ""
          : getPublicUid(item),
        item.userId?.name || "",
        item.email || item.userId?.email || "",
        item.status || "",
        item.ipAddress || "",
        item.device || "",
        item.reason || "",
        item.userAgent || "",
        item.createdAt
          ? new Date(item.createdAt).toLocaleString()
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
    link.download = `login-history-${Date.now()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-login-history-page">
      <div className="admin-login-history-header">
        <div>
          <h3>Login History</h3>
          <p>
            Review successful, failed, blocked and 2FA login
            activity for Exalt Exchange users.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="admin-login-history-toolbar">
        <input
          type="search"
          placeholder="Search UID, user, email, IP, device, status..."
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
          <option value="2fa_required">
            2FA Required
          </option>
          <option value="blocked">Blocked</option>
        </select>

        <button
          type="button"
          onClick={exportCsv}
          disabled={filteredHistory.length === 0}
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="admin-login-history-empty">
          <div className="admin-login-history-spinner" />
          <h4>Loading login history</h4>
          <p>Please wait while records are retrieved.</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="admin-login-history-empty">
          <span>🔐</span>
          <h4>No login history found</h4>
          <p>
            No login records match the selected search and
            status filter.
          </p>
        </div>
      ) : (
        <div className="admin-login-history-list">
          {filteredHistory.map((item) => {
            const publicUid = getPublicUid(item);
            const status = String(
              item.status || "unknown"
            ).toLowerCase();

            return (
              <div
                className="admin-login-history-card"
                key={item._id}
              >
                <div className="admin-login-history-card-head">
                  <div>
                    <h4>
                      {item.userId?.email ||
                        item.email ||
                        "Unknown User"}
                    </h4>

                    <span
                      className={`login-status ${status}`}
                    >
                      {String(item.status || "unknown")
                        .replace(/_/g, " ")
                        .toUpperCase()}
                    </span>
                  </div>

                  <span className="admin-login-history-time">
                    {item.createdAt
                      ? new Date(
                          item.createdAt
                        ).toLocaleString()
                      : "N/A"}
                  </span>
                </div>

                <div className="admin-login-history-info-grid">
                  <div>
                    <span>Exalt User ID</span>

                    <strong className="admin-login-user-uid">
                      {publicUid}
                    </strong>
                  </div>

                  <div>
                    <span>User</span>

                    <strong>
                      {item.userId?.name || "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Email</span>

                    <strong>
                      {item.email ||
                        item.userId?.email ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>IP Address</span>

                    <strong>
                      {item.ipAddress || "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Device</span>

                    <strong>
                      {item.device || "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Reason</span>

                    <strong>
                      {item.reason || "N/A"}
                    </strong>
                  </div>
                </div>

                {item.userAgent && (
                  <div className="admin-login-history-user-agent">
                    <span>User Agent</span>
                    <p>{item.userAgent}</p>
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

export default AdminLoginHistory;