import "./AIGridTrading.css";

export default function AIGridTrading() {
  const grids = [
    {
      pair: "BTCUSDT",
      range: "102000 - 108000",
      grids: 20,
      pnl: "+$235",
      status: "Running",
    },
    {
      pair: "ETHUSDT",
      range: "3400 - 3600",
      grids: 15,
      pnl: "+$91",
      status: "Running",
    },
    {
      pair: "SOLUSDT",
      range: "145 - 160",
      grids: 10,
      pnl: "-$22",
      status: "Paused",
    },
  ];

  return (
    <div className="grid-page">

      <div className="grid-header">
        <h1>AI Grid Trading</h1>
        <p>
          Automated buy and sell orders with intelligent AI grid strategy.
        </p>
      </div>

      <div className="grid-stats">

        <div className="grid-card">
          <span>Active Bots</span>
          <h2>12</h2>
        </div>

        <div className="grid-card">
          <span>Total Profit</span>
          <h2>+$1,820</h2>
        </div>

        <div className="grid-card">
          <span>AI Confidence</span>
          <h2>94%</h2>
        </div>

        <div className="grid-card">
          <span>Success Rate</span>
          <h2>88%</h2>
        </div>

      </div>

      <div className="grid-table">

        <div className="grid-head">
          <span>Pair</span>
          <span>Range</span>
          <span>Grids</span>
          <span>PnL</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {grids.map((bot, index) => (
          <div className="grid-row" key={index}>

            <strong>{bot.pair}</strong>

            <span>{bot.range}</span>

            <span>{bot.grids}</span>

            <span
              className={
                bot.pnl.includes("-") ? "loss-color" : "profit-color"
              }
            >
              {bot.pnl}
            </span>

            <span
              className={
                bot.status === "Running"
                  ? "running-color"
                  : "paused-color"
              }
            >
              {bot.status}
            </span>

            <button>Manage Bot</button>

          </div>
        ))}
      </div>

      <div className="grid-ai-box">
        <h2>AI Recommendation</h2>

        <p>
          BTCUSDT grid currently performs best with low volatility and high
          AI confidence. Recommended for stable automated returns.
        </p>
      </div>

    </div>
  );
}