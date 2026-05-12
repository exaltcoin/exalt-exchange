function Support() {
  return (
    <div className="panel">
      <h2>Support Center</h2>

      <div className="admin-card">
        <h3>Official Community</h3>
        <p>Telegram: https://t.me/exaltcommunity</p>
        <p>X: https://x.com/exalt_coin?s=21</p>

        <div className="link-row">
          <a href="https://t.me/exaltcommunity" target="_blank">Telegram</a>
          <a href="https://x.com/exalt_coin?s=21" target="_blank">X</a>
        </div>
      </div>

      <div className="admin-card">
        <h3>Submit Support Request</h3>
        <input className="support-input" placeholder="Your wallet address" />
        <input className="support-input" placeholder="Your issue" />
        <button className="buy-btn" onClick={() => alert("Support request submitted")}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default Support;