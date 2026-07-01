import { useEffect, useState } from "react";
import "./AdminReferrals.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function AdminReferrals() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/referrals/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setUsers(data.users || []);
      } else {
        alert(data.message || "Failed to load referral data");
      }
    } catch (err) {
      console.log(err);
      alert("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const updateReward = async (userId, rewardId, status) => {
    try {
      let note = "";

      if (status === "approved") {
        const confirmApprove = window.confirm(
          "Approve this referral reward? EXALT will be credited to the user wallet."
        );

        if (!confirmApprove) return;
      }

      if (status === "rejected") {
        note = prompt("Enter rejection reason:") || "";

        if (!note.trim()) {
          alert("Rejection reason is required");
          return;
        }
      }

      if (status === "pending") {
        const confirmPending = window.confirm(
          "Move this referral reward back to pending review?"
        );

        if (!confirmPending) return;
      }

      setActionLoading(`${userId}-${rewardId}-${status}`);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API}/referrals/admin/${userId}/reward/${rewardId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            note,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert(data.message || "Reward updated");
        await loadUsers();
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.log(err);
      alert("Update failed");
    } finally {
      setActionLoading("");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="admin-referrals-page">
      <div className="admin-referrals-header">
        <div>
          <h1>Referral Management</h1>
          <p>Approve, reject and monitor real EXALT referral rewards.</p>
        </div>

        <button onClick={loadUsers} className="refresh-btn" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {users.length === 0 ? (
        <div className="referral-user-card">
          <p>No referral rewards found.</p>
        </div>
      ) : (
        users.map((user) => (
          <div key={user._id} className="referral-user-card">
            <div className="user-top">
              <div>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <span>Referral Code: {user.referralCode}</span>
              </div>

              <div className="stats">
                <div>
                  <strong>{user.referralCount || 0}</strong>
                  <span>Referrals</span>
                </div>

                <div>
                  <strong>{user.pendingReferralRewards || 0}</strong>
                  <span>Pending</span>
                </div>

                <div>
                  <strong>{user.approvedReferralRewards || 0}</strong>
                  <span>Approved</span>
                </div>

                <div>
                  <strong>{user.wallets?.EXALT || 0}</strong>
                  <span>Wallet EXALT</span>
                </div>
              </div>
            </div>

            <div className="reward-list">
              {user.referralRewards?.length === 0 && <p>No rewards</p>}

              {user.referralRewards?.map((reward) => (
                <div className="reward-row" key={reward._id}>
                  <div>
                    <strong>{reward.referredEmail || "Referred User"}</strong>
                    <p>
                      {reward.rewardAmount} {reward.coin}
                    </p>
                    {reward.note && <small>{reward.note}</small>}
                  </div>

                  <span className={`status ${reward.status}`}>
                    {reward.status}
                  </span>

                  <div className="reward-actions">
                    <button
                      className="approve-btn"
                      disabled={!!actionLoading}
                      onClick={() =>
                        updateReward(user._id, reward._id, "approved")
                      }
                    >
                      {actionLoading === `${user._id}-${reward._id}-approved`
                        ? "..."
                        : "Approve"}
                    </button>

                    <button
                      className="pending-btn"
                      disabled={!!actionLoading}
                      onClick={() =>
                        updateReward(user._id, reward._id, "pending")
                      }
                    >
                      {actionLoading === `${user._id}-${reward._id}-pending`
                        ? "..."
                        : "Pending"}
                    </button>

                    <button
                      className="reject-btn"
                      disabled={!!actionLoading}
                      onClick={() =>
                        updateReward(user._id, reward._id, "rejected")
                      }
                    >
                      {actionLoading === `${user._id}-${reward._id}-rejected`
                        ? "..."
                        : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default AdminReferrals;