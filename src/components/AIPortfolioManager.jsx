import { useEffect, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AIPortfolioManager.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const demoPortfolio = {
  totalValue: 24580,
  totalProfitLoss: 1875,
  riskScore: 38,
  diversification: 84,
  assets: [
    { symbol: "BTC", name: "Bitcoin", value: 12000, allocation: 49, change24h: 2.8 },
    { symbol: "ETH", name: "Ethereum", value: 7000, allocation: 28, change24h: 1.6 },
    { symbol: "BNB", name: "BNB", value: 3500, allocation: 14, change24h: -0.8 },
    { symbol: "EXALT", name: "Exalt Coin", value: 2080, allocation: 9, change24h: 6.4 },
  ],
  suggestions: [
    { type: "success", titleKey: "goodDiversification", messageKey: "portfolioWellDiversified" },
    { type: "warning", titleKey: "reduceBtcExposure", messageKey: "btcAllocationHigh" },
    { type: "info", titleKey: "increaseExalt", messageKey: "increaseExaltGradually" },
  ],
};

export default function AIPortfolioManager() {
  const { t } = useI18n();

  const [portfolio, setPortfolio] = useState(demoPortfolio);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const loadPortfolio = async () => {
    try {
      setLoading(true);

      if (!token) {
        setPortfolio(demoPortfolio);
        return;
      }

      const res = await axios.get(`${API_BASE}/api/portfolio/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success !== false) {
        setPortfolio(res.data.portfolio || demoPortfolio);
      } else {
        setPortfolio(demoPortfolio);
      }
    } catch (err) {
      console.log(err);
      setPortfolio(demoPortfolio);
    } finally {
      setLoading(false);
    }
  };

  const rebalance = async () => {
    try {
      if (!token) {
        alert(t("pleaseLoginFirst"));
        return;
      }

      const res = await axios.put(
        `${API_BASE}/api/portfolio/rebalance`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success !== false) {
        alert(t("portfolioRebalancedSuccessfully"));
        setPortfolio(res.data.portfolio || demoPortfolio);
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || t("rebalanceFailed"));
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  return (
    <PageShell
      titleKey="aiPortfolioManager"
      subtitleKey="aiPortfolioManagerSubtitle"
    >
      <div className="ai-portfolio-page">
        <div className="ai-portfolio-stats">
          <div>
            <span>{t("totalValue")}</span>
            <h2>{portfolio.totalValue} USDT</h2>
          </div>

          <div>
            <span>{t("totalPL")}</span>
            <h2>{portfolio.totalProfitLoss} USDT</h2>
          </div>

          <div>
            <span>{t("riskScore")}</span>
            <h2>{portfolio.riskScore}/100</h2>
          </div>

          <div>
            <span>{t("diversification")}</span>
            <h2>{portfolio.diversification}%</h2>
          </div>
        </div>

        <div className="ai-portfolio-actions">
          <button onClick={loadPortfolio}>
            {loading ? t("loading") : t("refresh")}
          </button>

          <button onClick={rebalance}>{t("aiRebalance")}</button>
        </div>

        <div className="ai-portfolio-grid">
          <div className="ai-portfolio-card">
            <h2>{t("assetAllocation")}</h2>

            {portfolio.assets.map((asset, index) => (
              <div className="asset-row" key={index}>
                <div>
                  <strong>{asset.symbol}</strong>
                  <span>{asset.name}</span>
                </div>

                <div>
                  <strong>{asset.value} USDT</strong>
                  <span>{asset.allocation}%</span>
                </div>

                <div>
                  <strong className={asset.change24h >= 0 ? "green" : "red"}>
                    {asset.change24h > 0 ? "+" : ""}
                    {asset.change24h}%
                  </strong>
                  <span>{t("change24h")}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="ai-portfolio-card">
            <h2>{t("aiSuggestions")}</h2>

            {portfolio.suggestions.map((item, index) => (
              <div key={index} className={`suggestion ${item.type}`}>
                <strong>{item.titleKey ? t(item.titleKey) : item.title}</strong>
                <p>{item.messageKey ? t(item.messageKey) : item.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}