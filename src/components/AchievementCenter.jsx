import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AchievementCenter.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

export default function AchievementCenter() {
  const { t } = useI18n();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
    [token]
  );

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/achievements/me`, authHeaders);
      setProfile(res.data?.profile || null);
    } catch (err) {
      setError(err.response?.data?.message || t("failedLoadAchievements"));
    } finally {
      setLoading(false);
    }
  };

  const refreshAchievements = async () => {
    try {
      setRefreshing(true);

      const res = await axios.post(
        `${API_BASE}/api/achievements/refresh`,
        {},
        authHeaders
      );

      setProfile(res.data?.profile || null);
    } catch (err) {
      alert(err.response?.data?.message || t("failedRefreshAchievements"));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const achievements = profile?.achievements || [];
  const unlocked = achievements.filter((item) => item.unlocked);
  const locked = achievements.filter((item) => !item.unlocked);

  const goldBadges = achievements.filter(
    (item) => item.unlocked && item.tier === "Gold"
  ).length;

  const platinumBadges = achievements.filter(
    (item) => item.unlocked && item.tier === "Platinum"
  ).length;

  if (loading) {
    return (
      <PageShell titleKey="achievementCenter" subtitleKey="achievementCenterSubtitle">
        <div className="achievement-page">{t("loadingAchievementCenter")}</div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="achievementCenter" subtitleKey="achievementCenterSubtitle">
      <div className="achievement-page">
        <div className="achievement-top-action">
          <button onClick={refreshAchievements} disabled={refreshing}>
            {refreshing ? t("refreshing") : t("refreshAchievements")}
          </button>
        </div>

        {error && <div className="achievement-error">{error}</div>}

        {!profile ? (
          <div className="achievement-empty">{t("noAchievementProfileFound")}</div>
        ) : (
          <>
            <div className="achievement-stats">
              <div><span>{t("totalXp")}</span><strong>{profile.totalXP || 0}</strong></div>
              <div><span>{t("currentLevel")}</span><strong>{profile.level || 1}</strong></div>
              <div><span>{t("unlocked")}</span><strong>{unlocked.length}</strong></div>
              <div><span>{t("locked")}</span><strong>{locked.length}</strong></div>
              <div><span>{t("goldBadges")}</span><strong>{goldBadges}</strong></div>
              <div><span>{t("platinum")}</span><strong>{platinumBadges}</strong></div>
            </div>

            <div className="achievement-level-box">
              <div>
                <h2>{t("levelProgress")}</h2>
                <p>{t("levelProgressText")}</p>
              </div>

              <div className="achievement-level-progress">
                <div style={{ width: `${Math.min((profile.totalXP || 0) / 10, 100)}%` }} />
              </div>
            </div>

            <div className="achievement-grid">
              {achievements.map((item) => (
                <div
                  className={`achievement-card ${item.unlocked ? "unlocked" : "locked"}`}
                  key={item.key}
                >
                  <div className="achievement-icon">{item.icon}</div>

                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>

                    <div className="achievement-meta">
                      <span>{item.category}</span>
                      <span>{item.tier}</span>
                      <span>{item.xp} XP</span>
                    </div>

                    <strong>
                      {item.unlocked ? t("unlocked") : t("locked")}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}