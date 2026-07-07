import { useEffect, useRef, useState } from "react";
import "./TradingViewChart.css";

const TIMEFRAMES = [
  ["1", "1m"],
  ["5", "5m"],
  ["15", "15m"],
  ["60", "1H"],
  ["240", "4H"],
  ["D", "1D"],
];

function getTradingViewSymbol(token = {}) {
  const symbol = String(token.symbol || "BNB").toUpperCase();

  const map = {
    BTC: "BINANCE:BTCUSDT",
    ETH: "BINANCE:ETHUSDT",
    BNB: "BINANCE:BNBUSDT",
    SOL: "BINANCE:SOLUSDT",
    XRP: "BINANCE:XRPUSDT",
    DOGE: "BINANCE:DOGEUSDT",
    ADA: "BINANCE:ADAUSDT",
    DOT: "BINANCE:DOTUSDT",
    LINK: "BINANCE:LINKUSDT",
    AVAX: "BINANCE:AVAXUSDT",
    LTC: "BINANCE:LTCUSDT",
    BCH: "BINANCE:BCHUSDT",
    TRX: "BINANCE:TRXUSDT",
    AAVE: "BINANCE:AAVEUSDT",
    EXALT: "BINANCE:BNBUSDT",
  };

  return map[symbol] || `BINANCE:${symbol}USDT`;
}

function TradingViewChart({ token }) {
  const containerRef = useRef(null);
  const [interval, setIntervalValue] = useState("15");

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const widgetBox = document.createElement("div");
    widgetBox.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetBox);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: getTradingViewSymbol(token),
      interval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      hide_side_toolbar: false,
      hide_top_toolbar: true,
      withdateranges: false,
      details: false,
      hotlist: false,
      studies: ["STD;Volume"],
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [token?.symbol, interval]);

  return (
    <div className="tv-pro-card">
      <div className="tv-pro-top">
        <div>
          <strong>{token?.symbol || "BNB"}/USDT</strong>
          <span>Professional TradingView Chart</span>
        </div>

        <div className="tv-timeframes">
          {TIMEFRAMES.map(([value, label]) => (
            <button
              key={value}
              className={interval === value ? "active" : ""}
              onClick={() => setIntervalValue(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="tv-chart-shell">
        <div ref={containerRef} className="tradingview-widget-container" />
      </div>
    </div>
  );
}

export default TradingViewChart;