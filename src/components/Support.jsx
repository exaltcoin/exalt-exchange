function Support() {
  return (
    <div className="panel">
      <h2>Support Center</h2>
 
     <div className="admin-card">
  <h3>Official EXALT Support</h3>

  <p>
    Welcome to EXALT Exchange official support center.
    For listing help, wallet issues, deposits, trading support,
    partnership requests and community updates, contact only
    official EXALT channels below.
  </p>

  <p>
    Telegram Community:
    https://t.me/exaltcommunity
  </p>

  <p>
    Official Support Admin:
    https://t.me/offical_exaltcoin
  </p>

  <p>
    X Official:
    https://x.com/exalt_coin?s=21
  </p>

  <p style={{ color: "#00ff99", marginTop: "10px" }}>
    Live support available for EXALT community members.
  </p>

  <div className="link-row">

    <a
      href="https://t.me/exaltcommunity"
      target="_blank"
      rel="noreferrer"
    >
      <button className="buy-btn">
        Telegram Community
      </button>
    </a>

    <a
      href="https://t.me/offical_exaltcoin"
      target="_blank"
      rel="noreferrer"
    >
      <button className="buy-btn">
        Support Admin
      </button>
    </a>

    <a
      href="https://x.com/exalt_coin?s=21"
      target="_blank"
      rel="noreferrer"
    >
      <button className="buy-btn">
        X Official
      </button>
    </a>

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