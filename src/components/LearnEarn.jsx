import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import "./LearnEarn.css";
const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

export default function LearnEarn() {
  const lessons = [
    {
      id: 1,
      title: "Crypto Basics",
      reward: 25,
      level: "Beginner",
      status: "Available",
      videoTitle: "What is crypto and how exchanges work?",
      videoUrl: "https://www.youtube.com/embed/SSo_EIwHSd4",
      duration: "5 min",
      question: "What is the safest rule in crypto?",
      options: ["Share private key", "Use unknown links", "Protect wallet keys"],
      answer: "Protect wallet keys",
    },
    {
      id: 2,
      title: "P2P Safety",
      reward: 40,
      level: "Beginner",
      status: "Available",
      videoTitle: "How to trade safely with P2P users",
      videoUrl: "https://www.youtube.com/embed/9g8N0yJmY4U",
      duration: "7 min",
      question: "When should you release crypto in P2P?",
      options: ["Before payment", "After confirmed payment", "Any time"],
      answer: "After confirmed payment",
    },
    {
      id: 3,
      title: "Staking Guide",
      reward: 50,
      level: "Intermediate",
      status: "Locked",
      videoTitle: "How staking rewards work",
      videoUrl: "https://www.youtube.com/embed/UjA8W3M5l6Q",
      duration: "10 min",
      question: "What does staking mean?",
      options: ["Lock tokens for rewards", "Delete tokens", "Send tokens away"],
      answer: "Lock tokens for rewards",
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
  if (completed.length >= 1) achievements.push("🏆 First Lesson");
  if (completed.length >= 2) achievements.push("🎯 Learner");
  if (completed.length >= lessons.length) achievements.push("👑 Master");

  const filteredLessons = lessons.filter((lesson) => {
    const matchSearch = lesson.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || lesson.level === category;
    return matchSearch && matchCategory;
  });

  const leaderboard = [
    { name: "You", xp },
    { name: "Rehan", xp: 900 },
    { name: "Ali", xp: 700 },
    { name: "Ahmed", xp: 500 },
  ].sort((a, b) => b.xp - a.xp);

  const recentActivity = completed
    .map((id) => {
      const lesson = lessons.find((l) => l.id === id);
      return lesson ? `✅ ${lesson.title} Completed +${lesson.reward} EXALT` : null;
    })
    .filter(Boolean);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/api/learnearn`, {
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
    alert("🎁 Daily Reward Claimed: 5 EXALT");
  };

  const downloadCertificate = async () => {
    const userName =
      localStorage.getItem("name") ||
      localStorage.getItem("email") ||
      "Exalt Exchange User";

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
        alert("Wrong answer. Please try again.");
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first");
        return;
      }

      const res = await axios.post(
        `${API}/api/learnearn/complete`,
        {
          lessonId: activeLesson.id,
          title: activeLesson.title,
          reward: activeLesson.reward,
          answer: selectedAnswer,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setQuizResult("correct");
        alert(`${activeLesson.reward} EXALT reward completed`);
        await loadProgress();
        setActiveLesson(null);
        setSelectedAnswer("");
      } else {
        alert(res.data.message || "Reward failed");
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Server error");
    }
  };

  return (
    <div className="learn-page">
      <div className="learn-header">
        <h1>Learn & Earn</h1>
        <p>Watch lessons, complete quizzes, and earn EXALT rewards.</p>
      </div>

      <div className="learn-stats">
        <div className="learn-card">
          <span>Total Rewards</span>
          <h2>{totalRewards} EXALT</h2>
        </div>

        <div className="learn-card">
          <span>Completed Tasks</span>
          <h2>{completed.length} / {lessons.length}</h2>
        </div>

        <div className="learn-card">
          <span>Learning Level</span>
          <h2>{completed.length >= 2 ? "Intermediate" : "Beginner"}</h2>
        </div>
      </div>

      <div className="learn-progress-box">
        <div className="learn-progress-info">
          <span>Learning Progress</span>
          <strong>{progressPercent}%</strong>
        </div>

        <div className="learn-progress-bar">
          <div className="learn-progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>

        <div className="xp-info">
          <span>XP Points</span>
          <strong>{xp} XP</strong>
        </div>

        <div className="streak-info">
          <span>Daily Streak</span>
          <strong>🔥 {streak} Days</strong>
        </div>

        <div className="achievement-box">
          <span>Achievements</span>
          <div className="achievement-list">
            {achievements.length === 0 ? (
              <small>No achievements yet</small>
            ) : (
              achievements.map((item, index) => <strong key={index}>{item}</strong>)
            )}
          </div>
        </div>
      </div>

      {completed.length === lessons.length && (
        <button className="certificate-btn" onClick={downloadCertificate}>
          🏆 Download Certificate
        </button>
      )}

      <div className="learn-tools">
        <input
          className="lesson-search"
          placeholder="Search lessons..."
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
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="daily-reward-box">
        <div>
          <h3>🎁 Daily Reward</h3>
          <p>Claim 5 EXALT every day.</p>
        </div>
        <button onClick={claimDailyReward} disabled={dailyClaimed}>
          {dailyClaimed ? "Claimed Today" : "Claim 5 EXALT"}
        </button>
      </div>

      <div className="learn-extra-grid">
        <div className="leaderboard-box">
          <h3>🏆 Top Learners</h3>
          {leaderboard.map((user, index) => (
            <div className="leader-row" key={index}>
              <span>#{index + 1} {user.name}</span>
              <strong>{user.xp} XP</strong>
            </div>
          ))}
        </div>

        <div className="activity-box">
          <h3>Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p>No activity yet</p>
          ) : (
            recentActivity.map((item, index) => <p key={index}>{item}</p>)
          )}
        </div>
      </div>

      <div className="lesson-grid">
        {filteredLessons.map((lesson) => {
          const isCompleted = completed.includes(lesson.id);
          const isLocked = lesson.status === "Locked" && completed.length < 2;

          return (
            <div className="lesson-card" key={lesson.id}>
              <div className="video-box">▶️</div>

              <h3>{lesson.title}</h3>
              <p>Reward: {lesson.reward} EXALT</p>
              <p>Level: {lesson.level}</p>
              <p>Duration: {lesson.duration}</p>

              {isCompleted && <span className="completed-badge">Completed</span>}

              <button
                className={isLocked ? "locked-btn" : "start-btn"}
                disabled={isLocked}
                onClick={() => startLesson(lesson)}
              >
                {isLocked ? "Locked" : isCompleted ? "View Again" : "Start Lesson"}
              </button>
            </div>
          );
        })}
      </div>

      {activeLesson && (
        <div className="lesson-modal">
          <div className="lesson-modal-content">
            <button className="close-btn" onClick={() => setActiveLesson(null)}>
              ×
            </button>

            <h2>{activeLesson.title}</h2>

            <div className="video-player">
              <iframe
                width="100%"
                height="300"
                src={activeLesson.videoUrl}
                title={activeLesson.videoTitle}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>

              <p>{activeLesson.videoTitle}</p>
              <small className="video-duration">⏱ {activeLesson.duration}</small>
            </div>

            <div className="quiz-box">
              <h3>Quiz</h3>
              <p>{activeLesson.question}</p>

              {quizResult === "correct" && (
                <div className="quiz-result success">
                  ✅ Correct Answer! Reward added.
                </div>
              )}

              {quizResult === "wrong" && (
                <div className="quiz-result error">
                  ❌ Wrong Answer. Try again.
                </div>
              )}

              {activeLesson.options.map((option) => (
                <label className="quiz-option" key={option}>
                  <input
                    type="radio"
                    name="quiz"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                  />
                  {option}
                </label>
              ))}

              <button className="claim-learn-btn" onClick={submitQuiz} disabled={loading}>
                {loading ? "Submitting..." : "Submit Quiz & Claim Reward"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}