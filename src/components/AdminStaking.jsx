import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminStaking.css";

const API = "https://exalt-exchange-backend.onrender.com";

export default function AdminStaking() {
  const [stakes, setStakes] = useState([]);
  const [stats, setStats] = useState({
    totalStaked: 0,
    totalRewards: 0,
    activeStakes: 0,
  });

  const loadAdminStakes = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/api/admin/staking`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStakes(res.data.stakes || []);
      setStats(res.data.stats || {
        totalStaked: 0,
        totalRewards: 0,
        activeStakes: 0,
      });
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to load admin staking");
    }
  };

  useEffect(() => {
    loadAdminStakes();
  }, []);

  return (
    <div className="admin-staking-page">
      <div className="admin-staking-header">
        <h1>Admin Staking Control</h1>
        <p>Monitor all user staking activity, rewards, and locked EXALT.</p>
      </div>

      <div className="admin-staking-cards">
        <div className="admin-staking-card">
          <span>Total Staked</span>
          <h2>{stats.totalStaked} EXALT</h2>
        </div>

        <div className="admin-staking-card">
          <span>Total Rewards</span>
          <h2>{stats.totalRewards} EXALT</h2>
        </div>

        <div className="admin-staking-card">
          <span>Active Stakes</span>
          <h2>{stats.activeStakes}</h2>
        </div>
      </div>

      <div className="admin-staking-table-box">
        <h2>All User Stakes</h2>

        <table className="admin-staking-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Coin</th>
              <th>Amount</th>
              <th>APY</th>
              <th>Duration</th>
              <th>Reward</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {stakes.length === 0 ? (
              <tr>
                <td colSpan="8">No staking records found</td>
              </tr>
            ) : (
              stakes.map((stake) => (
                <tr key={stake._id}>
                  <td>{stake.user?.email || stake.userId || "User"}</td>
                  <td>{stake.coin}</td>
                  <td>{stake.amount}</td>
                  <td>{stake.apy}%</td>
                  <td>{stake.durationDays} Days</td>
                  <td>{stake.pendingReward || 0} EXALT</td>
                  <td>{stake.status}</td>
                  <td>{new Date(stake.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}