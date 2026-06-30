import { useMemo, useState } from "react";

function Tradingchart({ selectedCoin }) {
  const EXALT_ADDRESS = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

  const [interval, setInterval] = useState("15");

  const symbol =
    selectedCoin?.baseToken?.symbol?.toUpperCase() ||
    selectedCoin?.symbol?.toUpperCase() ||
    "BTC";

  const chartSymbol =
    selectedCoin?.chartSymbol?.toUpperCase() ||
    `${symbol}USDT`;

  const isExalt = symbol === "EXALT" || chartSymbol === "EXALTUSDT";

  const chartUrl = useMemo(() => {
    if (isExalt) {
      return `https://dexscreener.com/bsc/${EXALT_ADDRESS}?embed=1&theme=dark&trades=0&info=0`;
    }

    return `https://www.tradingview.com/widgetembed/?symbol=BINANCE:${chartSymbol}&interval=${interval}&theme=dark&style=1&timezone=Etc/UTC&withdateranges=1&hide_side_toolbar=0&allow_symbol_change=0`;
  }, [chartSymbol, interval, isExalt]);

  return (
    <div className="panel chart-panel">
      <div className="chart-topbar">
        <div>
          <h2>{isExalt ? "EXALT/BNB" : chartSymbol}</h2>
          <span className="green-text">Live Trading Chart</span>
        </div>

        {!isExalt && (
          <div className="chart-timeframes">
            {[
              { label: "1m", value: "1" },
              { label: "5m", value: "5" },
              { label: "15m", value: "15" },
              { label: "1h", value: "60" },
              { label: "4h", value: "240" },
              { label: "1D", value: "D" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setInterval(item.value)}
                className={interval === item.value ? "active" : ""}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="chart-frame-box">
        <iframe
          title={`${chartSymbol} Chart`}
          src={chartUrl}
          width="100%"
          height="470"
          allowFullScreen
          style={{
            border: 0,
            borderRadius: "14px",
            background: "#0b0e11",
          }}
        />
      </div>
    </div>
  );
}

export default Tradingchart;