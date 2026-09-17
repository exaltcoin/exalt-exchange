import "./AITradingAssistant.css";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { getModuleData } from "../aiService";

export default function AITradingAssistant() {
  const { t } = useI18n();

  const [records, setRecords] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState("BTC-USD");
  const [search, setSearch] = useState("");

  const coins = [
    "BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD", "XRP-USD",
    "ADA-USD", "DOGE-USD", "TRX-USD", "DOT-USD", "LINK-USD",
    "MATIC-USD", "AVAX-USD", "ATOM-USD", "LTC-USD", "BCH-USD",
    "UNI-USD", "AAVE-USD", "NEAR-USD", "APT-USD", "ARB-USD",
    "OP-USD", "FIL-USD", "ETC-USD", "HBAR-USD", "ICP-USD",
    "SUI-USD", "TON-USD", "SHIB-USD", "PEPE-USD", "XLM-USD"
  ];

  const filteredCoins = coins.filter((coin) =>
    coin.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    loadData();
  }, [selectedCoin]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedCoin]);

  const loadData = async () => {
    try {
      const res = await getModuleData(
        `ai_trading_assistant?symbol=${selectedCoin}`
      );
      setRecords(res.records || []);
    } catch (err) {
      console.log(err);
    }
  };

  const latest = records[0] || {};
  const meta = latest.metadata || latest.metaData || {};

  const topGainers = [
    { symbol: "BTC", change: "+3.2%" },
    { symbol: "ETH", change: "+2.8%" },
    { symbol: "SOL", change: "+7.5%" },
    { symbol: "BNB", change: "+1.6%" },
  ];

  const topLosers = [
    { symbol: "XRP", change: "-2.1%" },
    { symbol: "DOGE", change: "-3.8%" },
    { symbol: "ADA", change: "-1.5%" },
    { symbol: "TRX", change: "-0.9%" },
  ];

  const fearGreed = 68;
  const whaleActivity = t("whaleAccumulation");
  const marketNews = t("btcVolatilityNews");
  const buyStrength = 72;
  const riskLevel = t("mediumRisk");
  const liveVolume = "$2.4B";
  const volatilityIndex = t("high");
  const confidence =
    latest.signal === "Strong Buy"
      ? 90
      : latest.signal === "buy"
      ? 75
      : latest.signal === "sell"
      ? 35
      : 60;

  const finalDecision =
    confidence >= 80
      ? t("strongBuyDecision")
      : confidence >= 60
      ? t("buyDecision")
      : confidence >= 40
      ? t("neutralDecision")
      : t("sellDecision");

  const marketCap = "$3.8T";
  const change24h = "+2.45%";
  const signalStrength = latest.confidence || 0;
  const lastUpdated = new Date().toLocaleTimeString();
const coinLogo = selectedCoin.split("-")[0];
  const aiAlert =
    latest.signal === "buy"
      ? t("strongBuyOpportunity")
      : latest.signal === "sell"
      ? t("marketWeaknessDetected")
      : t("neutralMarketConditions");

  const trendStrength =
    latest.confidence >= 80
      ? t("strongTrend")
      : latest.confidence >= 60
      ? t("moderateTrend")
      : t("weakTrend");

  const entryPrice = latest.price || "--";
  const takeProfit = latest.price ? (latest.price * 1.05).toFixed(2) : "--";
  const stopLoss = latest.price ? (latest.price * 0.97).toFixed(2) : "--";

  const riskReward =
    latest.price
      ? ((takeProfit - entryPrice) / (entryPrice - stopLoss)).toFixed(2)
      : "--";

  const btcDominance = "61.8%";

  const marketSentiment =
    fearGreed >= 75
      ? t("extremeGreed")
      : fearGreed >= 55
      ? t("greed")
      : fearGreed >= 45
      ? t("neutral")
      : fearGreed >= 25
      ? t("fear")
      : t("extremeFear");
      return (
  <div className="ai-page">

    <div className="ai-header">
      <h1>{t("aiTradingAssistant")}</h1>
      <p>{t("aiTradingAssistantSubtitle")}</p>
    </div>

    <input
      type="text"
      placeholder={t("searchCoin")}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="coin-search"
    />

    <select
      className="coin-select"
      value={selectedCoin}
      onChange={(e) => setSelectedCoin(e.target.value)}
    >
      {filteredCoins.map((coin) => (
        <option key={coin} value={coin}>
          {coin}
        </option>
      ))}
    </select>

    <div className="ai-grid">

      <div className="ai-card">
        <h3>{t("trend")}</h3>

        <h2
          className={
            latest.signal === "buy"
              ? "buy-signal"
              : latest.signal === "sell"
              ? "sell-signal"
              : "neutral-signal"
          }
        >
          {latest.signal || t("neutral")}
        </h2>
      </div>

      <div className="ai-card">
        <h3>{t("entryPrice")}</h3>
        <h2>{meta.entryPrice || "--"}</h2>
      </div>

      <div className="ai-card">
        <h3>{t("takeProfit")}</h3>
        <h2>{meta.takeProfit || "--"}</h2>
      </div>

      <div className="ai-card">
        <h3>{t("stopLoss")}</h3>
        <h2>{meta.stopLoss || "--"}</h2>
      </div>

      <div className="ai-card">
        <h3>{t("confidenceScore")}</h3>
        <h2>{latest.confidence ?? "--"}%</h2>
      </div>

    </div>

    <div className="signal-box">

      <h2>{t("aiSignal")}</h2>

      <div className="signal-card">
        <span>{latest.symbol || "BTCUSDT"}</span>
        <strong>{latest.signal || t("neutral")}</strong>
      </div>

      <button
        className="signal-btn"
        onClick={() => setShowDetails(!showDetails)}
      >
        {t("viewDetails")}
      </button>

      {showDetails && (
        <div className="signal-details">

          <p>
            <strong>{t("symbol")}:</strong> {latest.symbol}
          </p>

          <p>
            <strong>{t("signal")}:</strong> {latest.signal}
          </p>

          <p>
            <strong>{t("entryPrice")}:</strong> {meta.entryPrice}
          </p>

          <p>
            <strong>{t("takeProfit")}:</strong> {meta.takeProfit}
          </p>

          <p>
            <strong>{t("stopLoss")}:</strong> {meta.stopLoss}
          </p>

          <p>
            <strong>{t("confidence")}:</strong> {latest.confidence}%
          </p>

        </div>
      )}

    </div>

    <div className="market-section">

      <div className="gainers-card">
        <h3>🚀 {t("topGainers")}</h3>

        {topGainers.map((coin) => (
          <div key={coin.symbol}>
            {coin.symbol} {coin.change}
          </div>
        ))}
      </div>

      <div className="losers-card">
        <h3>📉 {t("topLosers")}</h3>

        {topLosers.map((coin) => (
          <div key={coin.symbol}>
            {coin.symbol} {coin.change}
          </div>
        ))}
      </div>

      <div className="sentiment-card">
        <h3>📊 {t("marketSentiment")}</h3>

        <div className="fear-score">
          {t("fearGreedIndex")} : {fearGreed}
        </div>

        <div className="sentiment-status">
          {marketSentiment}
        </div>
      </div>

      <div className="dominance-card">
        <h3>₿ {t("btcDominance")}</h3>

        <div className="dominance-value">
          {btcDominance}
        </div>
      </div>

      <div className="whale-card">
        <h3>🐋 {t("whaleActivity")}</h3>

        <div className="whale-status">
          {whaleActivity}
        </div>
      </div>

      <div className="news-card">
        <h3>📰 {t("aiMarketNews")}</h3>

        <div className="news-text">
          {marketNews}
        </div>
      </div>

      <div className="strength-card">
        <h3>📊 {t("buyStrength")}</h3>

        <div className="strength-value">
          {buyStrength}%
        </div>
      </div>

      <div className="risk-card">
        <h3>⚠ {t("aiRiskLevel")}</h3>

        <div className="risk-value">
          {riskLevel}
        </div>
      </div>

      <div className="volume-card">
        <h3>💵 {t("liveVolume")}</h3>

        <div className="volume-value">
          {liveVolume}
        </div>
      </div>

      <div className="volatility-card">
        <h3>⚡ {t("volatilityIndex")}</h3>

        <div className="volatility-value">
          {volatilityIndex}
        </div>
      </div>
      <div className="gauge-card">
        <h3>🌍 {t("fearGreedGauge")}</h3>

        <div className="gauge-value">
          {fearGreed} / 100
        </div>
      </div>

      <div className="marketcap-card">
        <h3>🌎 {t("marketCap")}</h3>

        <div className="marketcap-value">
          {marketCap}
        </div>
      </div>

      <div className="change-card">
        <h3>📝 {t("change24h")}</h3>

        <div className="change-value">
          {change24h}
        </div>
      </div>

      <div className="confidence-meter-card">
        <h3>🤖 {t("aiConfidenceMeter")}</h3>

        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{ width: `${confidence}%` }}
          ></div>
        </div>

        <div className="confidence-meter-value">
          {confidence || 0}%
        </div>
      </div>

      <div className="signal-strength-card">
        <h3>🔥 {t("signalStrength")}</h3>

        <div className="signal-strength-value">
          {signalStrength}
        </div>
      </div>

      <div className="updated-card">
        <h3>🕒 {t("lastUpdated")}</h3>

        <div className="updated-value">
          {lastUpdated}
        </div>
      </div>

      <div className="coin-logo-card">

        <div className="coin-logo-circle">
          {coinLogo}
        </div>

        <div>
          <h3>{selectedCoin}</h3>
          <p>{t("liveAiMarketSignal")}</p>
        </div>

      </div>

      <div className="alert-card">
        <h3>🔔 {t("aiAlert")}</h3>

        <div className="alert-value">
          {aiAlert}
        </div>
      </div>

      <div className="trend-card">
        <h3>📈 {t("trendStrength")}</h3>

        <div className="trend-value">
          {trendStrength}
        </div>
      </div>

      <div className="decision-card">
        <h3>🟢 {t("aiFinalDecision")}</h3>

        <div className="decision-value">
          {finalDecision}
        </div>
      </div>

      <div className="riskreward-card">
        <h3>⚖️ {t("riskRewardRatio")}</h3>

        <div className="riskreward-value">
          {riskReward} : 1
        </div>
      </div>

    </div>

  </div>
);
}