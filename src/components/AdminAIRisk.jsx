import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAIRisk.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatDate = (date) => {
  if (!date) return "No update";
  return new Date(date).toLocaleString();
};

export default function AdminAIRisk() {
  const [stats, setStats] = useState({});
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [riskScore, setRiskScore] = useState(20);
  const [status, setStatus] = useState("Safe");
  const [adminNote, setAdminNote] = useState("");
  const [reason, setReason] = useState("");
  const [flags, setFlags] = useState({
    watchlist: false,
    restricted: false,
    freezeWithdrawals: false,
    freezeP2P: false,
    requireKYC: false,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchRiskAdmin = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, profilesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/risk/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/risk/admin/profiles`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setProfiles(profilesRes.data?.profiles || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI Risk Admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskAdmin();
  }, []);

  const filteredProfiles = profiles.filter((profile) => {
    const keyword = search.toLowerCase();
    const name = profile.user?.name?.toLowerCase() || "";
    const email = profile.user?.email?.toLowerCase() || "";
    const level = profile.riskLevel?.toLowerCase() || "";

    const matchesSearch = name.includes(keyword) || email.includes(keyword);
    const matchesLevel =
      filterLevel === "all" || level === filterLevel.toLowerCase();

    return matchesSearch && matchesLevel;
  });

  const openEditRisk = (profile) => {
    setSelectedProfile(profile);
    setRiskScore(profile.riskScore || 20);
    setStatus(profile.status || "Safe");
    setAdminNote(profile.adminNote || "");
    setReason("");
    setFlags({
      watchlist: Boolean(profile.watchlist),
      restricted: Boolean(profile.restricted),
      freezeWithdrawals: Boolean(profile.freezeWithdrawals),
      freezeP2P: Boolean(profile.freezeP2P),
      requireKYC: Boolean(profile.requireKYC),
    });
  };

  const closeEditRisk = () => {
    setSelectedProfile(null);
    setRiskScore(20);
    setStatus("Safe");
    setAdminNote("");
    setReason("");
    setFlags({
      watchlist: false,
      restricted: false,
      freezeWithdrawals: false,
      freezeP2P: false,
      requireKYC: false,
    });
  };

  const updateRiskProfile = async () => {
    if (!selectedProfile?.user?._id) {
      alert("User ID not found");
      return;
    }

    try {
      setActionLoading(selectedProfile._id);

      await axios.put(
        `${API_BASE}/api/risk/admin/users/${selectedProfile.user._id}`,
        {
          riskScore: Number(riskScore),
          status,
          reason: reason || "Admin updated risk profile",
          adminNote,
          watchlist: flags.watchlist,
          restricted: flags.restricted,
          freezeWithdrawals: flags.freezeWithdrawals,
          freezeP2P: flags.freezeP2P,
          requireKYC: flags.requireKYC,
          factors: selectedProfile.factors || {},
        },
        authHeaders
      );

      closeEditRisk();
      fetchRiskAdmin();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update risk profile");
    } finally {
      setActionLoading("");
    }
  };

  const toggleRiskAction = async (profileId, action) => {
    const endpoints = {
      watchlist: `/api/risk/admin/watchlist/${profileId}`,
      restricted: `/api/risk/admin/restricted/${profileId}`,
      freezeWithdrawals: `/api/risk/admin/freeze-withdrawals/${profileId}`,
      freezeP2P: `/api/risk/admin/freeze-p2p/${profileId}`,
      requireKYC: `/api/risk/admin/require-kyc/${profileId}`,
    };

    try {
      setActionLoading(`${action}-${profileId}`);

      await axios.put(
        `${API_BASE}${endpoints[action]}`,
        { note: `Admin toggled ${action}` },
        authHeaders
      );

      fetchRiskAdmin();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to update ${action}`);
    } finally {
      setActionLoading("");
    }
  };

  const deleteRiskProfile = async (profileId) => {
    const confirmDelete = window.confirm("Delete this risk profile?");
    if (!confirmDelete) return;

    try {
      setActionLoading(profileId);

      await axios.delete(
        `${API_BASE}/api/risk/admin/profiles/${profileId}`,
        authHeaders
      );

      setProfiles((prev) => prev.filter((item) => item._id !== profileId));
      fetchRiskAdmin();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete risk profile");
    } finally {
      setActionLoading("");
    }
  };

  const exportCSV = () => {
    const rows = [
      [
        "User",
        "Email",
        "Score",
        "Level",
        "Status",
        "Watchlist",
        "Restricted",
        "Freeze Withdrawals",
        "Freeze P2P",
        "Require KYC",
        "Updated",
      ],
      ...filteredProfiles.map((p) => [
        p.user?.name || "User",
        p.user?.email || "No email",
        p.riskScore || 0,
        p.riskLevel || "Low",
        p.status || "Safe",
        p.watchlist ? "Yes" : "No",
        p.restricted ? "Yes" : "No",
        p.freezeWithdrawals ? "Yes" : "No",
        p.freezeP2P ? "Yes" : "No",
        p.requireKYC ? "Yes" : "No",
        formatDate(p.updatedAt),
      ]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-risk-profiles.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="admin-risk-page">Loading AI Risk Admin...</div>;
  }

  return (
    <div className="admin-risk-page">
      <div className="admin-risk-header">
        <div>
          <h2>AI Risk Manager Admin</h2>
          <p>
            Monitor user risk, suspicious activity, watchlist, restricted
            accounts and account safety controls.
          </p>
        </div>

        <div className="admin-risk-header-actions">
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={fetchRiskAdmin}>Refresh</button>
        </div>
      </div>

      {error && <div className="admin-risk-error">{error}</div>}

      <div className="admin-risk-cards">
        <div>
          <span>Total Profiles</span>
          <strong>{stats.total || 0}</strong>
        </div>

        <div>
          <span>Low Risk</span>
          <strong>{stats.low || 0}</strong>
        </div>

        <div>
          <span>Medium Risk</span>
          <strong>{stats.medium || 0}</strong>
        </div>

        <div>
          <span>High Risk</span>
          <strong>{stats.high || 0}</strong>
        </div>

        <div>
          <span>Watchlist</span>
          <strong>{stats.watchlist || 0}</strong>
        </div>

        <div>
          <span>Restricted</span>
          <strong>{stats.restricted || 0}</strong>
        </div>

        <div>
          <span>Withdrawals Frozen</span>
          <strong>{stats.freezeWithdrawals || 0}</strong>
        </div>

        <div>
          <span>P2P Frozen</span>
          <strong>{stats.freezeP2P || 0}</strong>
        </div>

        <div>
          <span>KYC Required</span>
          <strong>{stats.requireKYC || 0}</strong>
        </div>
      </div>

      <div className="admin-risk-toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user or email..."
        />

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>
      </div>

      <div className="admin-risk-table-box">
        <div className="admin-risk-table-head">
          <h3>User Risk Profiles</h3>
          <span>{filteredProfiles.length} profiles</span>
        </div>

        <table className="admin-risk-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Score</th>
              <th>Level</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Risk Factors</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-risk-row">
                  No risk profiles found
                </td>
              </tr>
            ) : (
              filteredProfiles.map((profile) => (
                <tr key={profile._id}>
                  <td>{profile.user?.name || "User"}</td>
                  <td>{profile.user?.email || "No email"}</td>
                  <td>
                    <strong>{profile.riskScore || 0}/100</strong>
                  </td>
                  <td>
                    <span
                      className={`risk-badge ${profile.riskLevel?.toLowerCase()}`}
                    >
                      {profile.riskLevel || "Low"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${profile.status?.toLowerCase()}`}
                    >
                      {profile.status || "Safe"}
                    </span>
                  </td>
                  <td>
                    <div className="risk-mini-flags">
                      {profile.watchlist && <span>Watchlist</span>}
                      {profile.restricted && <span>Restricted</span>}
                      {profile.freezeWithdrawals && <span>Withdrawals Frozen</span>}
                      {profile.freezeP2P && <span>P2P Frozen</span>}
                      {profile.requireKYC && <span>KYC Required</span>}
                      {!profile.watchlist &&
                        !profile.restricted &&
                        !profile.freezeWithdrawals &&
                        !profile.freezeP2P &&
                        !profile.requireKYC && <small>No flags</small>}
                    </div>
                  </td>
                  <td>
                    <div className="risk-mini-factors">
                      <span>KYC: {profile.factors?.kycCompleted ? "Yes" : "No"}</span>
                      <span>P2P: {profile.factors?.p2pDisputes || 0}</span>
                      <span>Login: {profile.factors?.failedLoginAttempts || 0}</span>
                      <span>Withdraw: {profile.factors?.withdrawalRisk || 0}</span>
                    </div>
                  </td>
                  <td>{formatDate(profile.updatedAt)}</td>
                  <td>
                    <div className="admin-risk-actions">
                      <button onClick={() => openEditRisk(profile)}>Edit</button>

                      <button
                        onClick={() => toggleRiskAction(profile._id, "watchlist")}
                        disabled={actionLoading === `watchlist-${profile._id}`}
                      >
                        {profile.watchlist ? "Unwatch" : "Watch"}
                      </button>

                      <button
                        onClick={() => toggleRiskAction(profile._id, "restricted")}
                        disabled={actionLoading === `restricted-${profile._id}`}
                      >
                        {profile.restricted ? "Unrestrict" : "Restrict"}
                      </button>

                      <button
                        onClick={() =>
                          toggleRiskAction(profile._id, "freezeWithdrawals")
                        }
                        disabled={
                          actionLoading === `freezeWithdrawals-${profile._id}`
                        }
                      >
                        {profile.freezeWithdrawals ? "Unfreeze W" : "Freeze W"}
                      </button>

                      <button
                        onClick={() => toggleRiskAction(profile._id, "freezeP2P")}
                        disabled={actionLoading === `freezeP2P-${profile._id}`}
                      >
                        {profile.freezeP2P ? "Unfreeze P2P" : "Freeze P2P"}
                      </button>

                      <button
                        onClick={() => toggleRiskAction(profile._id, "requireKYC")}
                        disabled={actionLoading === `requireKYC-${profile._id}`}
                      >
                        {profile.requireKYC ? "KYC Done" : "Require KYC"}
                      </button>

                      <button
                        className="danger"
                        onClick={() => deleteRiskProfile(profile._id)}
                        disabled={actionLoading === profile._id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedProfile && (
        <div className="risk-modal-backdrop">
          <div className="risk-modal">
            <h3>Update Risk Profile</h3>

            <p>
              User: <strong>{selectedProfile.user?.name || "User"}</strong>
            </p>

            <label>Risk Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={riskScore}
              onChange={(e) => setRiskScore(e.target.value)}
            />

            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Safe</option>
              <option>Watchlist</option>
              <option>Restricted</option>
            </select>

            <div className="risk-modal-flags">
              <label>
                <input
                  type="checkbox"
                  checked={flags.watchlist}
                  onChange={(e) =>
                    setFlags((prev) => ({
                      ...prev,
                      watchlist: e.target.checked,
                    }))
                  }
                />
                Watchlist
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={flags.restricted}
                  onChange={(e) =>
                    setFlags((prev) => ({
                      ...prev,
                      restricted: e.target.checked,
                    }))
                  }
                />
                Restricted
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={flags.freezeWithdrawals}
                  onChange={(e) =>
                    setFlags((prev) => ({
                      ...prev,
                      freezeWithdrawals: e.target.checked,
                    }))
                  }
                />
                Freeze Withdrawals
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={flags.freezeP2P}
                  onChange={(e) =>
                    setFlags((prev) => ({
                      ...prev,
                      freezeP2P: e.target.checked,
                    }))
                  }
                />
                Freeze P2P
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={flags.requireKYC}
                  onChange={(e) =>
                    setFlags((prev) => ({
                      ...prev,
                      requireKYC: e.target.checked,
                    }))
                  }
                />
                Require KYC
              </label>
            </div>

            <label>Admin Note</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Internal admin note..."
            />

            <label>Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Write reason for updating risk..."
            />

            {selectedProfile.adminActions?.length > 0 && (
              <div className="risk-actions-history">
                <h4>Admin Action History</h4>
                {selectedProfile.adminActions.slice(0, 5).map((action, index) => (
                  <p key={index}>
                    <strong>{action.action}</strong> — {action.note || "No note"}{" "}
                    <small>{formatDate(action.createdAt)}</small>
                  </p>
                ))}
              </div>
            )}

            <div className="risk-modal-actions">
              <button onClick={closeEditRisk}>Cancel</button>
              <button
                onClick={updateRiskProfile}
                disabled={actionLoading === selectedProfile._id}
              >
                {actionLoading === selectedProfile._id ? "Updating..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}