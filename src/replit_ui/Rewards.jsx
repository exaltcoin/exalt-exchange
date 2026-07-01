import { useEffect, useMemo, useState } from "react";
import "./replit.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

export default function Rewards() {
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const [rewards, setRewards] = useState({
    pools: {
      mining: { total: 1000000, distributed: 0, remaining: 1000000, dailyRate: 2.4 },
      referral: { total: 1000000, distributed: 0, remaining: 1000000 },
    },
    claims: [],
  });

  const [dashboard, setDashboard] = useState(null);
  const [leaderboard, setLeaderboard] = useState({
    topMiners: [],
    topReferrers: [],
  });

  const token = localStorage.getItem("token");
  const format = (n) => Number(n || 0).toLocaleString();

  const loadRewards = async () => {
    try {
      setLoading(true);

      const [meRes, dashRes, leaderRes] = await Promise.all([
        fetch(`${API}/rewards/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/rewards/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/rewards/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const meData = await meRes.json();
      const dashData = await dashRes.json();
      const leaderData = await leaderRes.json();

      if (meData.success) setRewards(meData.data);
      if (dashData.success) setDashboard(dashData.data);
      if (leaderData.success) setLeaderboard(leaderData.data);
    } catch (error) {
      console.log(error);
      alert("Failed to load rewards");
    } finally {
      setLoading(false);
    }
  };

  const claimMining = async () => {
    try {
      setClaiming(true);

      const res = await fetch(`${API}/rewards/claim-mining`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message || "Mining reward submitted");
        loadRewards();
      } else {
        alert(data.message || "Claim failed");
      }
    } catch (error) {
      console.log(error);
      alert("Claim failed");
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  const mining = rewards.pools.mining;
  const referral = rewards.pools.referral;

  const miningPercent = mining.total
    ? Math.min(100, (mining.distributed / mining.total) * 100)
    : 0;

  const referralPercent = referral.total
    ? Math.min(100, (referral.distributed / referral.total) * 100)
    : 0;

  const stats = useMemo(() => {
    const claims = rewards.claims || [];

    return {
      totalClaims: claims.length,
      pending: claims.filter((c) => c.status === "pending").length,
      approved: claims.filter((c) => c.status === "approved").length,
      rejected: claims.filter((c) => c.status === "rejected").length,
      riskClaims: claims.filter((c) => c.riskFlag).length,
      approvedAmount: claims
        .filter((c) => c.status === "approved")
        .reduce((sum, c) => sum + Number(c.amount || 0), 0),
      pendingAmount: claims
        .filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + Number(c.amount || 0), 0),
    };
  }, [rewards.claims]);

  return (
    <div className="glass-panel rewards-page">
      <div className="rewards-header premium">
        <div>
          <span className="reward-live-badge">● Live Reward Pool</span>
          <h2>Exalt Rewards Center</h2>
          <p>Real EXALT mining, referral pool, leaderboard and anti-fake claim protection.</p>
        </div>

        <button className="gold-btn" onClick={loadRewards} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="reward-summary-grid">
        <div className="reward-summary-card"><span>Total Claims</span><h3>{stats.totalClaims}</h3></div>
        <div className="reward-summary-card"><span>Pending</span><h3>{stats.pending}</h3></div>
        <div className="reward-summary-card"><span>Approved</span><h3>{stats.approved}</h3></div>
        <div className="reward-summary-card"><span>Approved EXALT</span><h3>{format(stats.approvedAmount)}</h3></div>
        <div className="reward-summary-card"><span>Today Claims</span><h3>{dashboard?.platformStats?.todayClaims || 0}</h3></div>
        <div className="reward-summary-card"><span>Active Miners</span><h3>{dashboard?.platformStats?.activeMiners || 0}</h3></div>
      </div>

      <div className="rewards-grid">
        <div className="glass-panel reward-card premium-card">
          <div className="reward-card-top">
            <h3>EXALT Mining Pool</h3>
            <span>{miningPercent.toFixed(2)}% Used</span>
          </div>

          <h1>{format(mining.remaining)} EXALT</h1>
          <p>Total Pool: {format(mining.total)} EXALT</p>
          <p>Daily Mining Rate: <b>{mining.dailyRate} EXALT/day</b></p>
          <p>Cooldown: <b>1 claim every 24 hours</b></p>

          <div className="reward-progress">
            <span style={{ width: `${miningPercent}%` }} />
          </div>

          <button className="gold-btn" onClick={claimMining} disabled={claiming}>
            {claiming ? "Submitting..." : "Claim Daily Mining"}
          </button>

          <p className="reward-note">
            IP/device checks reduce fake claims. Risky claims may require extra review.
          </p>
        </div>

        <div className="glass-panel reward-card premium-card">
          <div className="reward-card-top">
            <h3>Referral Reward Pool</h3>
            <span>{referralPercent.toFixed(2)}% Used</span>
          </div>

          <h1>{format(referral.remaining)} EXALT</h1>
          <p>Total Pool: {format(referral.total)} EXALT</p>
          <p>Distributed: <b>{format(referral.distributed)} EXALT</b></p>

          <div className="reward-progress">
            <span style={{ width: `${referralPercent}%` }} />
          </div>

          <p className="reward-note">
            Referral rewards are verified, approved and credited to EXALT wallet.
          </p>
        </div>
      </div>

      <div className="reward-trust-box">
        <b>Anti-Fake Protection:</b>
        <span>
          24h cooldown, duplicate IP/device checks, risk flags and admin approval are active.
        </span>
      </div>

      <div className="rewards-grid">
        <div className="glass-panel reward-history premium-history">
          <div className="history-head">
            <h3>Top Miners</h3>
            <span>Leaderboard</span>
          </div>

          {leaderboard.topMiners?.length === 0 ? (
            <p>No miners yet.</p>
          ) : (
            leaderboard.topMiners?.map((miner, index) => (
              <div className="reward-claim-row" key={miner._id || index}>
                <div>
                  <strong>#{index + 1} {miner.name || "User"}</strong>
                  <p>{miner.claims || 0} approved claims</p>
                </div>
                <span>{format(miner.totalEarned)} EXALT</span>
                <b className="claim-status approved">MINER</b>
              </div>
            ))
          )}
        </div>

        <div className="glass-panel reward-history premium-history">
          <div className="history-head">
            <h3>Top Referrers</h3>
            <span>Community</span>
          </div>

          {leaderboard.topReferrers?.length === 0 ? (
            <p>No referrers yet.</p>
          ) : (
            leaderboard.topReferrers?.map((ref, index) => (
              <div className="reward-claim-row" key={ref._id || index}>
                <div>
                  <strong>#{index + 1} {ref.name || "User"}</strong>
                  <p>{ref.referralCount || 0} referrals</p>
                </div>
                <span>{format(ref.approvedReferralRewards)} EXALT</span>
                <b className="claim-status approved">REF</b>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass-panel reward-history premium-history">
        <div className="history-head">
          <h3>My Reward Claims</h3>
          <span>Pending Value: {format(stats.pendingAmount)} EXALT</span>
        </div>

        {rewards.claims.length === 0 ? (
          <p>No reward claims yet.</p>
        ) : (
          rewards.claims.map((claim) => (
            <div className="reward-claim-row" key={claim._id}>
              <div>
                <strong>{String(claim.rewardType).toUpperCase()}</strong>
                <p>
                  {claim.proofText || "Reward claim"}
                  {claim.riskFlag && (
                    <span className="risk-inline"> ⚠ Security Review</span>
                  )}
                </p>
              </div>

              <span>{claim.amount} {claim.coin}</span>

              <b className={`claim-status ${claim.status}`}>
                {claim.status}
              </b>
            </div>
          ))
        )}
      </div>
    </div>
  );
}