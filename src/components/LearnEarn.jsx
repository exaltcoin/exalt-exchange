import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import axios from "axios";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import "./LearnEarn.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://exalt-real-backend-6b6v.onrender.com";

export default function LearnEarn() {
  const { t } = useI18n();

  const lessons = [
    {
      id: 1,
      titleKey: "cryptoBasics",
      reward: 25,
      levelKey: "beginner",
      status: "Available",
      videoTitleKey: "cryptoBasicsVideoTitle",
      videoUrl: "https://www.youtube.com/embed/SSo_EIwHSd4",
      duration: "5 min",
      questionKey: "cryptoBasicsQuestion",
      options: [
        { key: "sharePrivateKey", value: "sharePrivateKey" },
        { key: "useUnknownLinks", value: "useUnknownLinks" },
        { key: "protectWalletKeys", value: "protectWalletKeys" },
      ],
      answer: "protectWalletKeys",
    },
    {
      id: 2,
      titleKey: "p2pSafety",
      reward: 40,
      levelKey: "beginner",
      status: "Available",
      videoTitleKey: "p2pSafetyVideoTitle",
      videoUrl: "https://www.youtube.com/embed/9g8N0yJmY4U",
      duration: "7 min",
      questionKey: "p2pSafetyQuestion",
      options: [
        { key: "beforePayment", value: "beforePayment" },
        { key: "afterConfirmedPayment", value: "afterConfirmedPayment" },
        { key: "anyTime", value: "anyTime" },
      ],
      answer: "afterConfirmedPayment",
    },
    {
      id: 3,
      titleKey: "stakingGuide",
      reward: 50,
      levelKey: "intermediate",
      status: "Locked",
      videoTitleKey: "stakingGuideVideoTitle",
      videoUrl: "https://www.youtube.com/embed/UjA8W3M5l6Q",
      duration: "10 min",
      questionKey: "stakingGuideQuestion",
      options: [
        { key: "lockTokensForRewards", value: "lockTokensForRewards" },
        { key: "deleteTokens", value: "deleteTokens" },
        { key: "sendTokensAway", value: "sendTokensAway" },
      ],
      answer: "lockTokensForRewards",
    },
  ];

  const [loading, setLoading] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [quizResult, setQuizResult] = useState("");
  const [completed, setCompleted] = useState([]);
  const [totalRewards, setTotalRewards] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [dailyClaimed, setDailyClaimed] = useState(
    localStorage.getItem("learnDailyClaimed") === new Date().toDateString()
  );

  const progressPercent = Math.round((completed.length / lessons.length) * 100);
  const xp = completed.length * 100;
  const streak = completed.length > 0 ? completed.length : 0;

  const achievements = [];
  if (completed.length >= 1) achievements.push(t("firstLesson"));
  if (completed.length >= 2) achievements.push(t("learnerAchievement"));
  if (completed.length >= lessons.length) achievements.push(t("masterAchievement"));

  const categoryMap = {
    All: t("all"),
    Beginner: t("beginner"),
    Intermediate: t("intermediate"),
    Advanced: t("advanced"),
  };

  const filteredLessons = lessons.filter((lesson) => {
    const title = t(lesson.titleKey).toLowerCase();
    const matchSearch = title.includes(search.toLowerCase());
    const matchCategory =
      category === "All" || t(lesson.levelKey) === categoryMap[category];

    return matchSearch && matchCategory;
  });

  const leaderboard = [
    { name: t("you"), xp },
    { name: "Rehan", xp: 900 },
    { name: "Ali", xp: 700 },
    { name: "Ahmed", xp: 500 },
  ].sort((a, b) => b.xp - a.xp);

  const recentActivity = completed
    .map((id) => {
      const lesson = lessons.find((l) => l.id === id);
      return lesson
        ? `✅ ${t(lesson.titleKey)} ${t("completed")} +${lesson.reward} EXALT`
        : null;
    })
    .filter(Boolean);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_BASE}/api/learnearn`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setCompleted((res.data.completed || []).map((item) => item.lessonId));
        setTotalRewards(res.data.totalRewards || 0);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const claimDailyReward = () => {
    if (dailyClaimed) return;

    localStorage.setItem("learnDailyClaimed", new Date().toDateString());
    setDailyClaimed(true);
    alert(t("dailyRewardClaimed"));
  };

  const downloadCertificate = async () => {
    const userName =
      localStorage.getItem("name") ||
      localStorage.getItem("email") ||
      t("exaltExchangeUser");

    const today = new Date().toLocaleDateString();
    const certificateId = `EXALT-${Date.now()}`;
    const verifyText = `Exalt Exchange Learn & Earn Certificate | ${certificateId} | ${userName}`;
    const qrImage = await QRCode.toDataURL(verifyText);

    const doc = new jsPDF("landscape", "mm", "a4");

    doc.setFillColor(10, 15, 28);
    doc.rect(0, 0, 297, 210, "F");

    doc.setDrawColor(240, 185, 11);
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);

    doc.setDrawColor(246, 197, 107);
    doc.setLineWidth(0.6);
    doc.rect(16, 16, 265, 178);

    doc.setFontSize(28);
    doc.setTextColor(246, 197, 107);
    doc.text("EXALT EXCHANGE", 105, 38);

    doc.setFontSize(22);
    doc.text("Certificate of Completion", 95, 58);

    doc.setFontSize(13);
    doc.setTextColor(220, 220, 220);
    doc.text("This certificate is proudly presented to", 105, 78);

    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text(userName, 105, 98);

    doc.setFontSize(14);
    doc.setTextColor(220, 220, 220);
    doc.text("For successfully completing the Exalt Learn & Earn Program", 75, 118);

    doc.setFontSize(13);
    doc.setTextColor(246, 197, 107);
    doc.text(`Total Rewards: ${totalRewards} EXALT`, 30, 145);
    doc.text(`XP Points: ${xp} XP`, 30, 155);
    doc.text(`Completion Date: ${today}`, 30, 165);
    doc.text(`Certificate ID: ${certificateId}`, 30, 175);

    doc.addImage(qrImage, "PNG", 235, 140, 35, 35);

    doc.setFontSize(16);
    doc.text("Secure • Fast • Global", 118, 190);

    doc.save(`EXALT-Certificate-${certificateId}.pdf`);
  };

  const startLesson = (lesson) => {
    const isLocked = lesson.status === "Locked" && completed.length < 2;
    if (isLocked) return;

    setActiveLesson(lesson);
    setSelectedAnswer("");
    setQuizResult("");
  };

  const submitQuiz = async () => {
    try {
      if (!activeLesson) return;

      if (selectedAnswer !== activeLesson.answer) {
        setQuizResult("wrong");
        alert(t("wrongAnswerTryAgain"));
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        alert(t("pleaseLoginFirst"));
        return;
      }

      const res = await axios.post(
        `${API_BASE}/api/learnearn/complete`,
        {
          lessonId: activeLesson.id,
          title: t(activeLesson.titleKey),
          reward: activeLesson.reward,
          answer: selectedAnswer,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setQuizResult("correct");
        alert(`${activeLesson.reward} EXALT ${t("rewardCompleted")}`);
        await loadProgress();
        setActiveLesson(null);
        setSelectedAnswer("");
      } else {
        alert(res.data.message || t("rewardFailed"));
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || t("serverError"));
    }
  };
  return (
  <div className="learn-page">
    <div className="learn-header">
      <h1>{t("learnEarn")}</h1>
      <p>{t("learnEarnSubtitle")}</p>
    </div>

    <div className="learn-stats">
      <div className="learn-card">
        <span>{t("totalRewards")}</span>
        <h2>{totalRewards} EXALT</h2>
      </div>

      <div className="learn-card">
        <span>{t("completedTasks")}</span>
        <h2>{completed.length} / {lessons.length}</h2>
      </div>

      <div className="learn-card">
        <span>{t("learningLevel")}</span>
        <h2>
          {completed.length >= 2
            ? t("intermediate")
            : t("beginner")}
        </h2>
      </div>
    </div>

    <div className="learn-progress-box">
      <div className="learn-progress-info">
        <span>{t("learningProgress")}</span>
        <strong>{progressPercent}%</strong>
      </div>

      <div className="learn-progress-bar">
        <div
          className="learn-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="xp-info">
        <span>{t("xpPoints")}</span>
        <strong>{xp} XP</strong>
      </div>

      <div className="streak-info">
        <span>{t("dailyStreak")}</span>
        <strong>🔥 {streak} {t("days")}</strong>
      </div>

      <div className="achievement-box">
        <span>{t("achievements")}</span>

        <div className="achievement-list">
          {achievements.length === 0 ? (
            <small>{t("noAchievements")}</small>
          ) : (
            achievements.map((item, index) => (
              <strong key={index}>{item}</strong>
            ))
          )}
        </div>
      </div>
    </div>

    {completed.length === lessons.length && (
      <button
        className="certificate-btn"
        onClick={downloadCertificate}
      >
        🏆 {t("downloadCertificate")}
      </button>
    )}

    <div className="learn-tools">
      <input
        className="lesson-search"
        placeholder={t("searchLessons")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="lesson-tabs">
        {["All", "Beginner", "Intermediate", "Advanced"].map((item) => (
          <button
            key={item}
            className={category === item ? "active-tab" : ""}
            onClick={() => setCategory(item)}
          >
            {categoryMap[item]}
          </button>
        ))}
      </div>
    </div>

    <div className="daily-reward-box">
      <div>
        <h3>🎁 {t("dailyReward")}</h3>
        <p>{t("claimDailyRewardDesc")}</p>
      </div>

      <button
        onClick={claimDailyReward}
        disabled={dailyClaimed}
      >
        {dailyClaimed
          ? t("claimedToday")
          : t("claim5Exalt")}
      </button>
    </div>

    <div className="learn-extra-grid">
      <div className="leaderboard-box">
        <h3>🏆 {t("topLearners")}</h3>

        {leaderboard.map((user, index) => (
          <div
            className="leader-row"
            key={index}
          >
            <span>
              #{index + 1} {user.name}
            </span>

            <strong>{user.xp} XP</strong>
          </div>
        ))}
      </div>

      <div className="activity-box">
        <h3>{t("recentActivity")}</h3>

        {recentActivity.length === 0 ? (
          <p>{t("noActivityYet")}</p>
        ) : (
          recentActivity.map((item, index) => (
            <p key={index}>{item}</p>
          ))
        )}
      </div>
    </div>

    <div className="lesson-grid">
      {filteredLessons.map((lesson) => {
        const isCompleted = completed.includes(lesson.id);

        const isLocked =
          lesson.status === "Locked" &&
          completed.length < 2;

        return (
          <div
            className="lesson-card"
            key={lesson.id}
          >
            <div className="video-box">▶️</div>

            <h3>{t(lesson.titleKey)}</h3>

            <p>
              {t("reward")}: {lesson.reward} EXALT
            </p>

            <p>
              {t("level")}: {t(lesson.levelKey)}
            </p>

            <p>
              {t("duration")}: {lesson.duration}
            </p>

            {isCompleted && (
              <span className="completed-badge">
                {t("completed")}
              </span>
            )}

            <button
              className={
                isLocked
                  ? "locked-btn"
                  : "start-btn"
              }
              disabled={isLocked}
              onClick={() => startLesson(lesson)}
            >
              {isLocked
                ? t("locked")
                : isCompleted
                ? t("viewAgain")
                : t("startLesson")}
            </button>
          </div>
        );
      })}
    </div>
    {activeLesson && (
      <div className="lesson-modal">
        <div className="lesson-modal-content">
          <button
            className="close-btn"
            onClick={() => setActiveLesson(null)}
          >
            ×
          </button>

          <h2>{t(activeLesson.titleKey)}</h2>

          <div className="video-player">
            <iframe
              width="100%"
              height="300"
              src={activeLesson.videoUrl}
              title={t(activeLesson.videoTitleKey)}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            <p>{t(activeLesson.videoTitleKey)}</p>
            <small className="video-duration">
              ⏱ {activeLesson.duration}
            </small>
          </div>

          <div className="quiz-box">
            <h3>{t("quiz")}</h3>
            <p>{t(activeLesson.questionKey)}</p>

            {quizResult === "correct" && (
              <div className="quiz-result success">
                ✅ {t("correctAnswerRewardAdded")}
              </div>
            )}

            {quizResult === "wrong" && (
              <div className="quiz-result error">
                ❌ {t("wrongAnswerTryAgain")}
              </div>
            )}

            {activeLesson.options.map((option) => (
              <label
                className="quiz-option"
                key={option.value}
              >
                <input
                  type="radio"
                  name="quiz"
                  value={option.value}
                  checked={selectedAnswer === option.value}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                />

                {t(option.key)}
              </label>
            ))}

            <button
              className="claim-learn-btn"
              onClick={submitQuiz}
              disabled={loading}
            >
              {loading
                ? t("submitting")
                : t("submitQuizClaimReward")}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}