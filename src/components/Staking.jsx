import "./Staking.css";
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://exalt-real-backend-6b6v.onrender.com";

export default function Staking() {
  const [amount, setAmount] = useState("");
  const [stakes, setStakes] = useState([]);
const [stats, setStats] = useState({
  
  totalStaked: 0,
  rewardsEarned: 0,
  apr: 15
});

useEffect(() => {
  loadStats();
  loadStakes();
}, []);
const loadStats = async () => {
  try {
    const res = await axios.get(
      `${API_BASE}/api/staking/stats`
    );

    setStats(res.data);
  } catch (err) {
    console.log(err);
  }
};
const loadStakes = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(
      `${API_BASE}/api/staking/my-stakes`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setStakes(res.data.stakes || []);
  } catch (err) {
    console.log(err);
  }
};
const handleUnstake = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.post(
      `${API_BASE}/api/staking/unstake`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert(res.data.message || "Unstaked successfully");
    loadStats();
    loadStakes();
  } catch (err) {
    alert(err.response?.data?.message || "Unstake failed");
  }
};
const handleStake = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!amount || Number(amount) <= 0) {
      alert("Please enter valid EXALT amount");
      return;
    }

    const res = await axios.post(
      `${API_BASE}/api/staking/stake`,
      {
        amount: Number(amount),
        durationDays: 30,
        coin: "EXALT",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert(res.data.message || "Staking started successfully");
    setAmount("");
    loadStats();
  } catch (err) {
    alert(err.response?.data?.message || "Staking failed");
  }
};
const handleClaimRewards = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.post(
      `${API_BASE}/api/staking/claim`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert(res.data.message || "Rewards claimed successfully");
    loadStats();
  } catch (err) {
    alert(err.response?.data?.message || "Claim rewards failed");
  }
};
  return (
    <div className="staking-page">

      <div className="staking-header">
        <h1>EXALT Staking</h1>
        <p>Stake EXALT and earn passive rewards</p>
      </div>

      <div className="staking-cards">

        <div className="staking-card">
          <h2>Total Staked</h2>
         <h1>{stats.totalStaked} EXALT</h1>
        </div>

        <div className="staking-card">
          <h2>Estimated APR</h2>
        <h1>{stats.apr}%</h1>
        </div>

        <div className="staking-card">
          <h2>Rewards Earned</h2>
         <h1>{stats.rewardsEarned} EXALT</h1>
        </div>

      </div>

      <div className="stake-box">

        <h2>Stake EXALT</h2>

       <input
  type="number"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  placeholder="Enter EXALT amount"
/>

        <div className="stake-buttons">

         <button className="stake-btn" onClick={handleStake}>
  Stake
</button>
        <button className="unstake-btn" onClick={handleUnstake}>
  Unstake
</button> 

         <button className="claim-btn" onClick={handleClaimRewards}>
  Claim Rewards
</button>

        </div>

      </div>
<div className="stakes-table-box">
  <h2>Active Stakes</h2>

  <table className="stakes-table">
    <thead>
      <tr>
        <th>Coin</th>
        <th>Amount</th>
        <th>APY</th>
        <th>Duration</th>
        <th>Pending Reward</th>
        <th>Status</th>
      </tr>
    </thead>

    <tbody>
      {stakes.length === 0 ? (
        <tr>
          <td colSpan="6">No active stakes yet</td>
        </tr>
      ) : (
        stakes.map((stake) => (
          <tr key={stake._id}>
            <td>{stake.coin}</td>
            <td>{stake.amount}</td>
            <td>{stake.apy}%</td>
            <td>{stake.durationDays} Days</td>
            <td>{stake.pendingReward || 0} EXALT</td>
            <td>{stake.status}</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
    </div>
  );
}