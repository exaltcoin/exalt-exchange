import { useEffect, useMemo, useState } from "react";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import { apiFetch } from "../lib/apiClient.js";
import "./Referral.css";

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
      const data = await apiFetch("/api/referrals/me");

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

  const [members, setMembers] = useState([]);
  const [membersLoadState, setMembersLoadState] = useState("loading");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);

  const loadMembers = async (page = 1, search = "") => {
    setMembersLoadState("loading");

    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search.trim()) params.set("search", search.trim());

      const data = await apiFetch(
        `/api/referrals/my-members?${params.toString()}`
      );

      if (!data?.success) {
        setMembersLoadState("unavailable");
        return;
      }

      setMembers(data.members || []);
      setMemberTotalPages(data.totalPages || 1);
      setMemberPage(data.page || 1);
      setMembersLoadState("ready");
    } catch (error) {
      console.log("Referral members load error:", error);
      setMembersLoadState("unavailable");
    }
  };

  useEffect(() => {
    loadReferral();
    loadMembers(1, "");
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

        <div className="referral-members-box">
          <h2>{t("yourReferredMembers")}</h2>

          <div className="referral-members-search">
            <input
              type="search"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadMembers(1, memberSearch);
              }}
              placeholder={t("searchYourMembers")}
              aria-label={t("searchYourMembers")}
            />
            <button onClick={() => loadMembers(1, memberSearch)}>
              {t("search")}
            </button>
          </div>

          {membersLoadState === "loading" ? (
            <p>{t("loading")}</p>
          ) : membersLoadState === "unavailable" ? (
            <p>{t("unavailable")}</p>
          ) : members.length === 0 ? (
            <p>{t("noReferredMembersYet")}</p>
          ) : (
            <>
              <table className="referral-members-table">
                <thead>
                  <tr>
                    <th>{t("name")}</th>
                    <th>{t("email")}</th>
                    <th>{t("kycStatus")}</th>
                    <th>{t("joined")}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member._id}>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.kycStatus || t("notSubmitted")}</td>
                      <td>
                        {member.createdAt
                          ? new Date(member.createdAt).toLocaleDateString()
                          : "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {memberTotalPages > 1 ? (
                <div className="referral-members-pagination">
                  <button
                    disabled={memberPage <= 1}
                    onClick={() => loadMembers(memberPage - 1, memberSearch)}
                  >
                    {t("previous")}
                  </button>
                  <span>
                    {memberPage} / {memberTotalPages}
                  </span>
                  <button
                    disabled={memberPage >= memberTotalPages}
                    onClick={() => loadMembers(memberPage + 1, memberSearch)}
                  >
                    {t("next")}
                  </button>
                </div>
              ) : null}
            </>
          )}
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