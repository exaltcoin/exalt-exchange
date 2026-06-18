import "./LearnEarn.css";

export default function LearnEarn() {
  const lessons = [
    { title: "Crypto Basics", reward: "25 EXALT", status: "Available" },
    { title: "P2P Safety", reward: "40 EXALT", status: "Available" },
    { title: "Staking Guide", reward: "50 EXALT", status: "Locked" },
  ];

  return (
    <div className="learn-page">
      <div className="learn-header">
        <h1>Learn & Earn</h1>
        <p>Watch lessons, complete quizzes, and earn EXALT rewards.</p>
      </div>

      <div className="learn-stats">
        <div className="learn-card">
          <span>Total Rewards</span>
          <h2>0 EXALT</h2>
        </div>

        <div className="learn-card">
          <span>Completed Tasks</span>
          <h2>0 / 3</h2>
        </div>

        <div className="learn-card">
          <span>Learning Level</span>
          <h2>Beginner</h2>
        </div>
      </div>

      <div className="lesson-grid">
        {lessons.map((lesson, index) => (
          <div className="lesson-card" key={index}>
            <div className="video-box">▶</div>

            <h3>{lesson.title}</h3>
            <p>Reward: {lesson.reward}</p>

            <button
              className={lesson.status === "Locked" ? "locked-btn" : "start-btn"}
              disabled={lesson.status === "Locked"}
            >
              {lesson.status === "Locked" ? "Locked" : "Start Lesson"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}