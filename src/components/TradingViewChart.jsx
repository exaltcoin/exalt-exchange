import { useEffect, useRef } from "react";
import "./TradingViewChart.css";

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
    MATIC: "BINANCE:MATICUSDT",
    AVAX: "BINANCE:AVAXUSDT",
    LTC: "BINANCE:LTCUSDT",
    BCH: "BINANCE:BCHUSDT",
    TRX: "BINANCE:TRXUSDT",
    UNI: "BINANCE:UNIUSDT",
    AAVE: "BINANCE:AAVEUSDT",
    EXALT: "BINANCE:BNBUSDT",
  };

  return map[symbol] || `BINANCE:${symbol}USDT`;
}

function TradingViewChart({ token }) {
  const containerRef = useRef(null);

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
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      studies: ["STD;Volume"],
      hide_side_toolbar: false,
      withdateranges: true,
      details: true,
      hotlist: false,
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [token?.symbol]);

  return (
    <div className="tv-chart-shell">
      <div ref={containerRef} className="tradingview-widget-container" />
    </div>
  );
}

export default TradingViewChart;