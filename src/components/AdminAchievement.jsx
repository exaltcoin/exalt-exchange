import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAchievement.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

export default function AdminAchievement() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/achievements/admin/all`, authHeaders);
      setProfiles(res.data?.profiles || []);
    } finally {
      setLoading(false);
    }
  };

  const boostUser = async (profile) => {
    await axios.put(
      `${API_BASE}/api/achievements/admin/${profile._id}`,
      {
        stats: {
          totalTrades: 50,
          p2pOrders: 20,
          totalReferrals: 10,
          kycApproved: true,
        },
        adminNote: "Achievement boost by admin",
      },
      authHeaders
    );

    fetchProfiles();
  };

  const markLaunchpadInvestor = async (profile) => {
    await axios.put(
      `${API_BASE}/api/achievements/admin/${profile._id}`,
      {
        stats: {
          launchpadInvestments: 1,
        },
        adminNote: "Launchpad investor badge unlocked by admin",
      },
      authHeaders
    );

    fetchProfiles();
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  if (loading) {
    return <div className="admin-achievement-page">Loading Achievement Admin...</div>;
  }

  return (
    <div className="admin-achievement-page">
      <div className="admin-achievement-header">
        <div>
          <h2>Achievement Admin</h2>
          <p>Manage user badges, XP, levels and exchange achievement progress.</p>
        </div>

        <button onClick={fetchProfiles}>Refresh</button>
      </div>

      <div className="admin-achievement-cards">
        <div>
          <span>Total Profiles</span>
          <strong>{profiles.length}</strong>
        </div>

        <div>
          <span>Total XP</span>
          <strong>{profiles.reduce((sum, item) => sum + Number(item.totalXP || 0), 0)}</strong>
        </div>

        <div>
          <span>Level 4+</span>
          <strong>{profiles.filter((item) => Number(item.level || 0) >= 4).length}</strong>
        </div>

        <div>
          <span>Top Level</span>
          <strong>{Math.max(1, ...profiles.map((item) => Number(item.level || 1)))}</strong>
        </div>
      </div>

      <div className="admin-achievement-table-box">
        <h3>User Achievement Profiles</h3>

        <table className="admin-achievement-table">
          <thead>
            <tr>
              <th>User</th>
              <th>XP</th>
              <th>Level</th>
              <th>Unlocked</th>
              <th>Trades</th>
              <th>P2P</th>
              <th>Referrals</th>
              <th>KYC</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan="9">No achievement profiles found</td>
              </tr>
            ) : (
              profiles.map((profile) => {
                const unlocked = profile.achievements?.filter((item) => item.unlocked).length || 0;

                return (
                  <tr key={profile._id}>
                    <td>
                      <strong>{profile.user?.name || "User"}</strong>
                      <small>{profile.user?.email || "No email"}</small>
                    </td>

                    <td>{profile.totalXP}</td>
                    <td>{profile.level}</td>
                    <td>{unlocked}/{profile.achievements?.length || 0}</td>
                    <td>{profile.stats?.totalTrades || 0}</td>
                    <td>{profile.stats?.p2pOrders || 0}</td>
                    <td>{profile.stats?.totalReferrals || 0}</td>
                    <td>{profile.stats?.kycApproved ? "Approved" : "Pending"}</td>

                    <td>
                      <div className="admin-achievement-actions">
                        <button onClick={() => boostUser(profile)}>Boost</button>
                        <button onClick={() => markLaunchpadInvestor(profile)}>
                          Launchpad Badge
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}