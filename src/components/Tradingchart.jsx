function Tradingchart() {
  return (
    <div className="panel chart-panel">
      <div className="pair-header">
        <h2>EXALT/USDT</h2>
        <span className="green">Live Trading Chart</span>
      </div>

      <iframe
        title="EXALT Chart"
        src="https://dexscreener.com/bsc/0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78?embed=1&theme=dark"
        width="100%"
        height="420"
        style={{
          border: "0",
          borderRadius: "12px",
          background: "#0b0e11"
        }}
      ></iframe>
    </div>
  );
}

export default Tradingchart;