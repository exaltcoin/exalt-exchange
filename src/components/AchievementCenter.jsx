import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AchievementCenter.css";
const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

export default function AchievementCenter() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/achievements/me`, authHeaders);
      setProfile(res.data?.profile || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load achievements");
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
      alert(err.response?.data?.message || "Failed to refresh achievements");
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
    return <div className="achievement-page">Loading Achievement Center...</div>;
  }

  return (
    <div className="achievement-page">
      <div className="achievement-header">
        <div>
          <h1>Achievement Center</h1>
          <p>
            Unlock badges, earn XP, grow your level and build your Exalt Exchange identity.
          </p>
        </div>

        <button onClick={refreshAchievements} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh Achievements"}
        </button>
      </div>

      {error && <div className="achievement-error">{error}</div>}

      {!profile ? (
        <div className="achievement-empty">No achievement profile found.</div>
      ) : (
        <>
          <div className="achievement-stats">
            <div>
              <span>Total XP</span>
              <strong>{profile.totalXP || 0}</strong>
            </div>

            <div>
              <span>Current Level</span>
              <strong>{profile.level || 1}</strong>
            </div>

            <div>
              <span>Unlocked</span>
              <strong>{unlocked.length}</strong>
            </div>

            <div>
              <span>Locked</span>
              <strong>{locked.length}</strong>
            </div>

            <div>
              <span>Gold Badges</span>
              <strong>{goldBadges}</strong>
            </div>

            <div>
              <span>Platinum</span>
              <strong>{platinumBadges}</strong>
            </div>
          </div>

          <div className="achievement-level-box">
            <div>
              <h2>Level Progress</h2>
              <p>
                Your XP grows when you trade, complete KYC, invite users,
                stake EXALT and join launchpad projects.
              </p>
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
                    {item.unlocked ? "Unlocked" : "Locked"}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}