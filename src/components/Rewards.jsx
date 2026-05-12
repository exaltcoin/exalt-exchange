function Rewards() {
  return (
    <div className="panel">
      <h2>Rewards Center</h2>

      <div className="admin-card">
        <h3>Mining Rewards</h3>
        <p>Available: 1,250 EXALT</p>
        <p>Status: Active</p>
        <button className="buy-btn" onClick={() => alert("Reward claim request submitted")}>
          Claim Rewards
        </button>
      </div>

      <div className="admin-card">
        <h3>Community Tasks</h3>
        <p>Join Telegram: 100 EXALT</p>
        <p>Follow X: 100 EXALT</p>
        <p>Invite Friend: 250 EXALT</p>
        <button className="buy-btn" onClick={() => alert("Task reward request submitted")}>
          Submit Task
        </button>
      </div>
    </div>
  );
}

export default Rewards;