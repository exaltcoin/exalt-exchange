import { useEffect, useState } from "react";
import axios from "axios";
import "./LearnEarn.css";
export default function LearnEarn() {
 const API = "https://exalt-exchange-backend.onrender.com";

const [loading, setLoading] = useState(false);
 const loadProgress = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token");

    const res = await axios.get(`${API}/api/learnearn`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.success) {
      setCompleted(
        (res.data.completed || []).map((item) => item.lessonId)
      );

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
  const lessons = [
    {
      id: 1,
      title: "Crypto Basics",
      reward: 25,
      level: "Beginner",
      status: "Available",
      videoTitle: "What is crypto and how exchanges work?",
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
      question: "What does staking mean?",
      options: ["Lock tokens for rewards", "Delete tokens", "Send tokens away"],
      answer: "Lock tokens for rewards",
    },
  ];

  const [activeLesson, setActiveLesson] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [completed, setCompleted] = useState([]);
  const [totalRewards, setTotalRewards] = useState(0);

  const startLesson = (lesson) => {
    if (lesson.status === "Locked") return;
    setActiveLesson(lesson);
    setSelectedAnswer("");
  };

  const submitQuiz = async () => {
  try {
    if (!activeLesson) return;

    if (selectedAnswer !== activeLesson.answer) {
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.data.success) {
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

      <div className="lesson-grid">
        {lessons.map((lesson) => {
          const isCompleted = completed.includes(lesson.id);
const isLocked =
  lesson.status === "Locked" && completed.length < 2;
          return (
            <div className="lesson-card" key={lesson.id}>
              <div className="video-box">▶️</div>

              <h3>{lesson.title}</h3>
              <p>Reward: {lesson.reward} EXALT</p>
              <p>Level: {lesson.level}</p>

              {isCompleted && <span className="completed-badge">Completed</span>}
<button
  className={isLocked ? "locked-btn" : "start-btn"}
  disabled={isLocked}
  onClick={() => startLesson(lesson)}
>
  {isLocked
    ? "Locked"
    : isCompleted
    ? "View Again"
    : "Start Lesson"}
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
              <span>▶️</span>
              <p>{activeLesson.videoTitle}</p>
            </div>

            <div className="quiz-box">
              <h3>Quiz</h3>
              <p>{activeLesson.question}</p>

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

              <button
  className="claim-learn-btn"
  onClick={submitQuiz}
  disabled={loading}
>
  {loading ? "Submitting..." : "Submit Quiz & Claim Reward"}
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}