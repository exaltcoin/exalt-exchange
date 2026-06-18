import "./AISmartAlerts.css";

export default function AISmartAlerts() {
  const alerts = [
    {
      pair: "BTCUSDT",
      type: "Breakout Alert",
      price: "$106,250",
      confidence: "96%",
      status: "Active",
    },
    {
      pair: "ETHUSDT",
      type: "Volume Spike",
      price: "$3,460",
      confidence: "91%",
      status: "Active",
    },
    {
      pair: "SOLUSDT",
      type: "Trend Reversal",
      price: "$152",
      confidence: "88%",
      status: "Pending",
    },
  ];

  return (
    <div className="alerts-page">

      <div className="alerts-header">
        <h1>AI Smart Alerts</h1>
        <p>
          Receive intelligent alerts for breakouts, trend changes and unusual market activity.
        </p>
      </div>

      <div className="alerts-stats">

        <div className="alert-card">
          <span>Active Alerts</span>
          <h2>24</h2>
        </div>

        <div className="alert-card">
          <span>AI Accuracy</span>
          <h2>95%</h2>
        </div>

        <div className="alert-card">
          <span>Triggered Today</span>
          <h2>17</h2>
        </div>

        <div className="alert-card">
          <span>High Confidence</span>
          <h2>91%</h2>
        </div>

      </div>

      <div className="alerts-table">

        <div className="alerts-head">
          <span>Pair</span>
          <span>Alert Type</span>
          <span>Target Price</span>
          <span>Confidence</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {alerts.map((item, index) => (
          <div className="alerts-row" key={index}>

            <strong>{item.pair}</strong>

            <span>{item.type}</span>

            <span>{item.price}</span>

            <span className="confidence">{item.confidence}</span>

            <span
              className={
                item.status === "Active"
                  ? "active-alert"
                  : "pending-alert"
              }
            >
              {item.status}
            </span>

            <button>View Alert</button>

          </div>
        ))}
      </div>

      <div className="ai-alert-box">
        <h2>AI Recommendation</h2>

        <p>
          BTCUSDT breakout probability is currently high. AI suggests monitoring resistance zones and setting alerts near key levels.
        </p>
      </div>

    </div>
  );
}