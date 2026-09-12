import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { useI18n } from "../i18n";
import "./replit.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://exalt-real-backend-6b6v.onrender.com";

const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

export default function Rewards() {
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const [rewards, setRewards] = useState({
    pools: {
      mining: {
        total: 1000000,
        distributed: 0,
        remaining: 1000000,
        dailyRate: 2.4,
      },
      referral: {
        total: 1000000,
        distributed: 0,
        remaining: 1000000,
      },
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
          headers: { Authorization: `Bearer ${token || ""}` },
        }),
        fetch(`${API}/rewards/dashboard`, {
          headers: { Authorization: `Bearer ${token || ""}` },
        }),
        fetch(`${API}/rewards/leaderboard`, {
          headers: { Authorization: `Bearer ${token || ""}` },
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
      alert(t("failedLoadRewards"));
    } finally {
      setLoading(false);
    }
  };

  const claimMining = async () => {
    try {
      setClaiming(true);

      const res = await fetch(`${API}/rewards/claim-mining`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token || ""}` },
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message || t("miningRewardSubmitted"));
        loadRewards();
      } else {
        alert(data.message || t("claimFailed"));
      }
    } catch (error) {
      console.log(error);
      alert(t("claimFailed"));
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
    <PageShell
      titleKey="rewardsCenter"
      subtitleKey="rewardsCenterSubtitle"
    >
      <div className="glass-panel rewards-page">
        <div className="rewards-top-action">
          <button className="gold-btn" onClick={loadRewards} disabled={loading}>
            {loading ? t("loading") : t("refresh")}
          </button>
        </div>

        <div className="reward-summary-grid">
          <div className="reward-summary-card">
            <span>{t("totalClaims")}</span>
            <h3>{stats.totalClaims}</h3>
          </div>

          <div className="reward-summary-card">
            <span>{t("pending")}</span>
            <h3>{stats.pending}</h3>
          </div>

          <div className="reward-summary-card">
            <span>{t("approved")}</span>
            <h3>{stats.approved}</h3>
          </div>

          <div className="reward-summary-card">
            <span>{t("approvedExalt")}</span>
            <h3>{format(stats.approvedAmount)}</h3>
          </div>

          <div className="reward-summary-card">
            <span>{t("todayClaims")}</span>
            <h3>{dashboard?.platformStats?.todayClaims || 0}</h3>
          </div>

          <div className="reward-summary-card">
            <span>{t("activeMiners")}</span>
            <h3>{dashboard?.platformStats?.activeMiners || 0}</h3>
          </div>
        </div>

        <div className="rewards-grid">
          <div className="glass-panel reward-card premium-card">
            <div className="reward-card-top">
              <h3>{t("exaltMiningPool")}</h3>
              <span>{miningPercent.toFixed(2)}% {t("used")}</span>
            </div>

            <h1>{format(mining.remaining)} EXALT</h1>
            <p>{t("totalPool")}: {format(mining.total)} EXALT</p>
            <p>
              {t("dailyMiningRate")}: <b>{mining.dailyRate} EXALT/day</b>
            </p>
            <p>
              {t("cooldown")}: <b>{t("oneClaimEvery24Hours")}</b>
            </p>

            <div className="reward-progress">
              <span style={{ width: `${miningPercent}%` }} />
            </div>

            <button className="gold-btn" onClick={claimMining} disabled={claiming}>
              {claiming ? t("submitting") : t("claimDailyMining")}
            </button>

            <p className="reward-note">{t("miningProtectionNote")}</p>
          </div>

          <div className="glass-panel reward-card premium-card">
            <div className="reward-card-top">
              <h3>{t("referralRewardPool")}</h3>
              <span>{referralPercent.toFixed(2)}% {t("used")}</span>
            </div>

            <h1>{format(referral.remaining)} EXALT</h1>
            <p>{t("totalPool")}: {format(referral.total)} EXALT</p>
            <p>
              {t("distributed")}: <b>{format(referral.distributed)} EXALT</b>
            </p>

            <div className="reward-progress">
              <span style={{ width: `${referralPercent}%` }} />
            </div>

            <p className="reward-note">{t("referralRewardNote")}</p>
          </div>
        </div>

        <div className="reward-trust-box">
          <b>{t("antiFakeProtection")}:</b>
          <span>{t("antiFakeProtectionText")}</span>
        </div>

        <div className="rewards-grid">
          <div className="glass-panel reward-history premium-history">
            <div className="history-head">
              <h3>{t("topMiners")}</h3>
              <span>{t("leaderboard")}</span>
            </div>

            {leaderboard.topMiners?.length === 0 ? (
              <p>{t("noMinersYet")}</p>
            ) : (
              leaderboard.topMiners?.map((miner, index) => (
                <div className="reward-claim-row" key={miner._id || index}>
                  <div>
                    <strong>
                      #{index + 1} {miner.name || t("user")}
                    </strong>
                    <p>{miner.claims || 0} {t("approvedClaims")}</p>
                  </div>

                  <span>{format(miner.totalEarned)} EXALT</span>
                  <b className="claim-status approved">MINER</b>
                </div>
              ))
            )}
          </div>

          <div className="glass-panel reward-history premium-history">
            <div className="history-head">
              <h3>{t("topReferrers")}</h3>
              <span>{t("community")}</span>
            </div>

            {leaderboard.topReferrers?.length === 0 ? (
              <p>{t("noReferrersYet")}</p>
            ) : (
              leaderboard.topReferrers?.map((ref, index) => (
                <div className="reward-claim-row" key={ref._id || index}>
                  <div>
                    <strong>
                      #{index + 1} {ref.name || t("user")}
                    </strong>
                    <p>{ref.referralCount || 0} {t("referrals")}</p>
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
            <h3>{t("myRewardClaims")}</h3>
            <span>
              {t("pendingValue")}: {format(stats.pendingAmount)} EXALT
            </span>
          </div>

          {rewards.claims.length === 0 ? (
            <p>{t("noRewardClaimsYet")}</p>
          ) : (
            rewards.claims.map((claim) => (
              <div className="reward-claim-row" key={claim._id}>
                <div>
                  <strong>{String(claim.rewardType).toUpperCase()}</strong>
                  <p>
                    {claim.proofText || t("rewardClaim")}
                    {claim.riskFlag && (
                      <span className="risk-inline"> ⚠ {t("securityReview")}</span>
                    )}
                  </p>
                </div>

                <span>
                  {claim.amount} {claim.coin}
                </span>

                <b className={`claim-status ${claim.status}`}>
                  {claim.status}
                </b>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}