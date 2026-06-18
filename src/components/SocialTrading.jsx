import "./SocialTrading.css";

export default function SocialTrading() {
  const traders = [
    {
      name: "Crypto Alpha",
      handle: "@alpha_trader",
      signal: "Long BTCUSDT",
      pnl: "+14.8%",
      followers: "18.2K",
      likes: "2.4K",
      comments: 318,
    },
    {
      name: "EXALT Whale",
      handle: "@exalt_whale",
      signal: "Buy EXALT on dip",
      pnl: "+22.6%",
      followers: "9.7K",
      likes: "1.1K",
      comments: 144,
    },
    {
      name: "Smart Futures AI",
      handle: "@smart_ai",
      signal: "Short ETHUSDT",
      pnl: "+7.9%",
      followers: "12.6K",
      likes: "890",
      comments: 76,
    },
  ];

  return (
    <div className="social-page">
      <div className="social-header">
        <h1>Social Trading</h1>
        <p>Follow expert traders, view signals, and join the EXALT trading community.</p>
      </div>

      <div className="social-stats">
        <div>
          <span>Total Traders</span>
          <h2>0</h2>
        </div>
        <div>
          <span>Community Signals</span>
          <h2>3</h2>
        </div>
        <div>
          <span>Weekly Leaderboard</span>
          <h2>Live</h2>
        </div>
      </div>

      <div className="social-layout">
        <div className="feed">
          <h2>Community Feed</h2>

          {traders.map((trader, index) => (
            <div className="feed-card" key={index}>
              <div className="feed-head">
                <div className="avatar">{trader.name.charAt(0)}</div>
                <div>
                  <h3>{trader.name}</h3>
                  <p>{trader.handle}</p>
                </div>
              </div>

              <div className="signal-box-social">
                <span>Signal</span>
                <strong>{trader.signal}</strong>
              </div>

              <div className="feed-metrics">
                <span>PNL: <b>{trader.pnl}</b></span>
                <span>Followers: {trader.followers}</span>
                <span>❤️ {trader.likes}</span>
                <span>💬 {trader.comments}</span>
              </div>

              <div className="feed-actions">
                <button>Follow</button>
                <button>Copy Signal</button>
              </div>
            </div>
          ))}
        </div>

        <div className="leaderboard">
          <h2>Top Traders</h2>

          {traders.map((trader, index) => (
            <div className="leader-row" key={index}>
              <span>#{index + 1}</span>
              <strong>{trader.name}</strong>
              <b>{trader.pnl}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}