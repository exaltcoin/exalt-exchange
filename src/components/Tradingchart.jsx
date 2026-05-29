function Tradingchart({ selectedCoin }) {
 const symbol =
  selectedCoin?.chartSymbol?.toUpperCase() || "BTCUSDT";
  const pair = symbol;

 const EXALT_ADDRESS = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

const chartUrl =
  symbol === "EXALT"
    ? `https://dexscreener.com/bsc/${EXALT_ADDRESS}?embed=1&theme=dark&trades=0&info=0`
    : `https://www.tradingview.com/widgetembed/?symbol=BINANCE:${pair}&interval=15&theme=dark`;
  return (
    <div className="panel chart-panel">
      <div className="pair-header">
        <h2>{pair}</h2>
        <span className="green">Live Trading Chart</span>
      </div>

      <iframe
        title={`${pair} Chart`}
        src={chartUrl}
        width="100%"
        height="420"
        style={{
          border: 0,
          borderRadius: "12px",
          background: "#0b0e11",
        }}
      />
    </div>
  );
}

export default Tradingchart;