import { useEffect, useMemo, useState } from "react";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./Referral.css";

const RAW_API =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const API = RAW_API.endsWith("/api") ? RAW_API : `${RAW_API}/api`;

function Referral() {
  const { t } = useI18n();

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
    ? `https://quickchart.io/qr?text=${encodeURIComponent(referral.referralLink)}&size=180`
    : "";

  const loadReferral = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/referrals/me`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setReferral(data.referral);
      } else {
        alert(data.message || t("referralLoadFailed"));
      }
    } catch (error) {
      console.log("Referral load error:", error);
      alert(t("referralLoadFailed"));
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
    const text = `${t("joinExaltUsingReferral")} ${referral.referralCode}`;
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
    <PageShell titleKey="referralProgram" subtitleKey="referralProgramSubtitle">
      <div className="referral-page">
        <div className="referral-top-action">
          <span className={`referral-rank ${referralRank.toLowerCase()}`}>
            {referralRank}
          </span>

          <button onClick={loadReferral} className="referral-refresh">
            {loading ? t("loading") : t("refresh")}
          </button>
        </div>

        <div className="referral-grid">
          <div className="referral-card main">
            <span>{t("yourReferralCode")}</span>
            <h2>{referral.referralCode || t("loading")}</h2>

            <button
              onClick={() =>
                copyText(referral.referralCode, t("referralCodeCopied"))
              }
            >
              {t("copyCode")}
            </button>
          </div>

          <div className="referral-card link-card">
            <span>{t("yourReferralLink")}</span>
            <p>{referral.referralLink || t("loading")}</p>

            <button
              onClick={() =>
                copyText(referral.referralLink, t("referralLinkCopied"))
              }
            >
              {t("copyLink")}
            </button>
          </div>

          <div className="referral-card qr-card">
            <span>{t("referralQrCode")}</span>

            {qrUrl ? (
              <img src={qrUrl} alt="Referral QR Code" />
            ) : (
              <p>{t("loadingQr")}</p>
            )}
          </div>
        </div>

        <div className="referral-stats">
          <div>
            <span>{t("totalReferrals")}</span>
            <h2>{referral.referralCount || 0}</h2>
          </div>

          <div>
            <span>{t("pendingRewards")}</span>
            <h2>{referral.pendingReferralRewards || 0} EXALT</h2>
          </div>

          <div>
            <span>{t("approvedRewards")}</span>
            <h2>{referral.approvedReferralRewards || 0} EXALT</h2>
          </div>

          <div>
            <span>{t("totalEarnings")}</span>
            <h2>{totalEarnings} EXALT</h2>
          </div>
        </div>

        <div className="referral-share-box">
          <h2>{t("shareReferralLink")}</h2>

          <div className="referral-share-buttons">
            <button onClick={() => shareReferral("telegram")}>Telegram</button>
            <button onClick={() => shareReferral("whatsapp")}>WhatsApp</button>
            <button onClick={() => shareReferral("x")}>X</button>
            <button onClick={() => shareReferral("facebook")}>Facebook</button>
          </div>
        </div>

        <div className="referral-history">
          <h2>{t("referralRewardHistory")}</h2>

          {referral.rewards?.length === 0 ? (
            <p>{t("noReferralRewardsYet")}</p>
          ) : (
            referral.rewards.map((reward) => (
              <div className="referral-history-row" key={reward._id}>
                <div>
                  <strong>{reward.referredEmail || t("referredUser")}</strong>
                  <p>{reward.note || t("referralReward")}</p>
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
    </PageShell>
  );
}

export default Referral;