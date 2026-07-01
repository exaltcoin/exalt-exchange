import { useEffect, useMemo, useState } from "react";
import "./Referral.css";
const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function Referral() {
  const [loading, setLoading] = useState(true);
  const [referral, setReferral] = useState({
    referralCode: "",
    referralLink: "",
    referralCount: 0,
    pendingReferralRewards: 0,
    approvedReferralRewards: 0,
    rewards: [],
  });

  const totalEarnings =
    Number(referral.pendingReferralRewards || 0) +
    Number(referral.approvedReferralRewards || 0);

  const referralRank = useMemo(() => {
    const count = Number(referral.referralCount || 0);

    if (count >= 100) return "Platinum";
    if (count >= 50) return "Gold";
    if (count >= 20) return "Silver";
    return "Bronze";
  }, [referral.referralCount]);

  const qrUrl = referral.referralLink
    ? `https://quickchart.io/qr?text=${encodeURIComponent(
        referral.referralLink
      )}&size=180`
    : "";

  const loadReferral = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/referrals/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setReferral(data.referral);
      } else {
        alert(data.message || "Referral data load failed");
      }
    } catch (error) {
      console.log("Referral load error:", error);
      alert("Referral data load failed");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text, message) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    alert(message);
  };

  const shareReferral = (platform) => {
    const text = `Join Exalt Exchange using my referral code ${referral.referralCode}`;
    const link = referral.referralLink;

    if (!link) return;

    const encodedText = encodeURIComponent(text);
    const encodedLink = encodeURIComponent(link);

    const urls = {
      telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedLink}`,
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
    };

    window.open(urls[platform], "_blank");
  };

  useEffect(() => {
    loadReferral();
  }, []);

  return (
    <div className="referral-page">
      <div className="referral-hero">
        <div>
          <h1>Exalt Referral Program</h1>
          <p>Invite users, grow the Exalt community, and earn EXALT rewards.</p>
        </div>

        <div className="referral-hero-actions">
          <span className={`referral-rank ${referralRank.toLowerCase()}`}>
            {referralRank}
          </span>

          <button onClick={loadReferral} className="referral-refresh">
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="referral-grid">
        <div className="referral-card main">
          <span>Your Referral Code</span>
          <h2>{referral.referralCode || "Loading..."}</h2>

          <button
            onClick={() =>
              copyText(referral.referralCode, "Referral code copied")
            }
          >
            Copy Code
          </button>
        </div>

        <div className="referral-card link-card">
          <span>Your Referral Link</span>
          <p>{referral.referralLink || "Loading..."}</p>

          <button
            onClick={() =>
              copyText(referral.referralLink, "Referral link copied")
            }
          >
            Copy Link
          </button>
        </div>

        <div className="referral-card qr-card">
          <span>Referral QR Code</span>

          {qrUrl ? (
            <img src={qrUrl} alt="Referral QR Code" />
          ) : (
            <p>Loading QR...</p>
          )}
        </div>
      </div>

      <div className="referral-stats">
        <div>
          <span>Total Referrals</span>
          <h2>{referral.referralCount || 0}</h2>
        </div>

        <div>
          <span>Pending Rewards</span>
          <h2>{referral.pendingReferralRewards || 0} EXALT</h2>
        </div>

        <div>
          <span>Approved Rewards</span>
          <h2>{referral.approvedReferralRewards || 0} EXALT</h2>
        </div>

        <div>
          <span>Total Earnings</span>
          <h2>{totalEarnings} EXALT</h2>
        </div>
      </div>

      <div className="referral-share-box">
        <h2>Share Your Referral Link</h2>

        <div className="referral-share-buttons">
          <button onClick={() => shareReferral("telegram")}>Telegram</button>
          <button onClick={() => shareReferral("whatsapp")}>WhatsApp</button>
          <button onClick={() => shareReferral("x")}>X</button>
          <button onClick={() => shareReferral("facebook")}>Facebook</button>
        </div>
      </div>

      <div className="referral-history">
        <h2>Referral Reward History</h2>

        {referral.rewards?.length === 0 ? (
          <p>No referral rewards yet.</p>
        ) : (
          referral.rewards.map((reward) => (
            <div className="referral-history-row" key={reward._id}>
              <div>
                <strong>{reward.referredEmail || "Referred User"}</strong>
                <p>{reward.note || "Referral reward"}</p>
              </div>

              <span>
                {reward.rewardAmount} {reward.coin}
              </span>

              <b className={`reward-status ${reward.status}`}>
                {reward.status}
              </b>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Referral;