import "./Staking.css";
import { useState, useEffect } from "react";
import { useI18n } from "../i18n";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://exalt-real-backend-6b6v.onrender.com";

export default function Staking() {
  const { t } = useI18n();

  const [amount, setAmount] = useState("");
  const [stakes, setStakes] = useState([]);
  const [stats, setStats] = useState({
    totalStaked: 0,
    rewardsEarned: 0,
    apr: 15,
  });

  useEffect(() => {
    loadStats();
    loadStakes();
  }, []);

  const loadStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/staking/stats`);
      setStats(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const loadStakes = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_BASE}/api/staking/my-stakes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

      alert(res.data.message || t("unstakedSuccessfully"));
      loadStats();
      loadStakes();
    } catch (err) {
      alert(err.response?.data?.message || t("unstakeFailed"));
    }
  };

  const handleStake = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!amount || Number(amount) <= 0) {
        alert(t("enterValidExaltAmount"));
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

      alert(res.data.message || t("stakingStartedSuccessfully"));
      setAmount("");
      loadStats();
      loadStakes();
    } catch (err) {
      alert(err.response?.data?.message || t("stakingFailed"));
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

      alert(res.data.message || t("rewardsClaimedSuccessfully"));
      loadStats();
      loadStakes();
    } catch (err) {
      alert(err.response?.data?.message || t("claimRewardsFailed"));
    }
  };

  return (
    <div className="staking-page">
      <div className="staking-header">
        <h1>{t("exaltStaking")}</h1>
        <p>{t("stakingSubtitle")}</p>
      </div>

      <div className="staking-cards">
        <div className="staking-card">
          <h2>{t("totalStaked")}</h2>
          <h1>{stats.totalStaked} EXALT</h1>
        </div>

        <div className="staking-card">
          <h2>{t("estimatedApr")}</h2>
          <h1>{stats.apr}%</h1>
        </div>

        <div className="staking-card">
          <h2>{t("rewardsEarned")}</h2>
          <h1>{stats.rewardsEarned} EXALT</h1>
        </div>
      </div>

      <div className="stake-box">
        <h2>{t("stakeExalt")}</h2>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("enterExaltAmount")}
        />

        <div className="stake-buttons">
          <button className="stake-btn" onClick={handleStake}>
            {t("stake")}
          </button>

          <button className="unstake-btn" onClick={handleUnstake}>
            {t("unstake")}
          </button>

          <button className="claim-btn" onClick={handleClaimRewards}>
            {t("claimRewards")}
          </button>
        </div>
      </div>

      <div className="stakes-table-box">
        <h2>{t("activeStakes")}</h2>

        <table className="stakes-table">
          <thead>
            <tr>
              <th>{t("coin")}</th>
              <th>{t("amount")}</th>
              <th>{t("apy")}</th>
              <th>{t("duration")}</th>
              <th>{t("pendingReward")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>

          <tbody>
            {stakes.length === 0 ? (
              <tr>
                <td colSpan="6">{t("noActiveStakesYet")}</td>
              </tr>
            ) : (
              stakes.map((stake) => (
                <tr key={stake._id}>
                  <td>{stake.coin}</td>
                  <td>{stake.amount}</td>
                  <td>{stake.apy}%</td>
                  <td>
                    {stake.durationDays} {t("days")}
                  </td>
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