import { useEffect, useMemo, useState } from "react";
import "./AdminRewards.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function AdminRewards() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  const loadClaims = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/rewards/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) setClaims(data.claims || []);
      else alert(data.message || "Failed to load rewards");
    } catch (error) {
      console.log(error);
      alert("Failed to load admin rewards");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (claimId, status) => {
    try {
      let adminNote = "";

      if (status === "approved") {
        const ok = window.confirm(
          "Approve this reward? EXALT will be credited to the user wallet."
        );
        if (!ok) return;
      }

      if (status === "rejected") {
        adminNote = prompt("Reason for rejection?") || "";
        if (!adminNote.trim()) {
          alert("Rejection reason is required");
          return;
        }
      }

      if (status === "pending") {
        const ok = window.confirm("Move this reward back to pending review?");
        if (!ok) return;
      }

      setActionLoading(`${claimId}-${status}`);

      const res = await fetch(`${API}/rewards/admin/${claimId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminNote }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message || `Reward ${status} successfully`);
        await loadClaims();
      } else {
        alert(data.message || "Update failed");
      }
    } catch (error) {
      console.log(error);
      alert("Reward update failed");
    } finally {
      setActionLoading("");
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const statusMatch =
        filter === "all" ||
        claim.status === filter ||
        (filter === "risk" && claim.riskFlag);

      const text = `
        ${claim?.userId?.name || ""}
        ${claim?.userId?.email || ""}
        ${claim?.rewardType || ""}
        ${claim?.taskType || ""}
        ${claim?.status || ""}
        ${claim?.riskReason || ""}
      `.toLowerCase();

      return statusMatch && text.includes(search.toLowerCase());
    });
  }, [claims, filter, search]);

  const stats = useMemo(() => {
    return {
      total: claims.length,
      pending: claims.filter((c) => c.status === "pending").length,
      approved: claims.filter((c) => c.status === "approved").length,
      rejected: claims.filter((c) => c.status === "rejected").length,
      risk: claims.filter((c) => c.riskFlag).length,
      pendingAmount: claims
        .filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + Number(c.amount || 0), 0),
      approvedAmount: claims
        .filter((c) => c.status === "approved")
        .reduce((sum, c) => sum + Number(c.amount || 0), 0),
    };
  }, [claims]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="admin-rewards-page">
      <div className="admin-rewards-hero">
        <div>
          <span>● Live Admin Control</span>
          <h1>Admin Rewards Center</h1>
          <p>Approve rewards with anti-fake claim protection and risk review.</p>
        </div>

        <button onClick={loadClaims} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="admin-reward-stats">
        <div><span>Total Claims</span><h2>{stats.total}</h2></div>
        <div><span>Pending</span><h2>{stats.pending}</h2></div>
        <div><span>Approved</span><h2>{stats.approved}</h2></div>
        <div><span>Rejected</span><h2>{stats.rejected}</h2></div>
        <div><span>Risk Flags</span><h2>{stats.risk}</h2></div>
        <div><span>Approved EXALT</span><h2>{stats.approvedAmount}</h2></div>
      </div>

      <div className="admin-rewards-tools">
        <input
          placeholder="Search name, email, reward type, risk reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Claims</option>
          <option value="risk">High Risk</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="admin-rewards-table-box">
        <h2>Reward Claims</h2>

        {filteredClaims.length === 0 ? (
          <p className="admin-rewards-empty">No reward claims found.</p>
        ) : (
          filteredClaims.map((claim) => (
            <div
              className={`admin-reward-row ${claim.riskFlag ? "risk-row" : ""}`}
              key={claim._id}
            >
              <div>
                <strong>{claim?.userId?.name || "User"}</strong>
                <p>{claim?.userId?.email || "-"}</p>
                {claim.riskFlag && <small className="risk-small">⚠ {claim.riskReason || "Security review"}</small>}
              </div>

              <div><span>Type</span><b>{claim.rewardType}</b></div>
              <div><span>Amount</span><b>{claim.amount} {claim.coin}</b></div>

              <div>
                <span>Risk</span>
                <b className={claim.riskFlag ? "risk-badge high" : "risk-badge low"}>
                  {claim.riskFlag ? `${claim.riskScore || 0}%` : "Low"}
                </b>
              </div>

              <div>
                <span>Duplicates</span>
                <b>IP {claim.duplicateIpCount || 0} / Device {claim.duplicateDeviceCount || 0}</b>
              </div>

              <div>
                <span>Status</span>
                <b className={`admin-reward-status ${claim.status}`}>
                  {claim.status}
                </b>
              </div>

              <div className="admin-reward-actions">
                <button
                  className="approve"
                  disabled={!!actionLoading}
                  onClick={() => updateStatus(claim._id, "approved")}
                >
                  {actionLoading === `${claim._id}-approved` ? "..." : "Approve"}
                </button>

                <button
                  className="pending"
                  disabled={!!actionLoading}
                  onClick={() => updateStatus(claim._id, "pending")}
                >
                  {actionLoading === `${claim._id}-pending` ? "..." : "Pending"}
                </button>

                <button
                  className="reject"
                  disabled={!!actionLoading}
                  onClick={() => updateStatus(claim._id, "rejected")}
                >
                  {actionLoading === `${claim._id}-rejected` ? "..." : "Reject"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminRewards;