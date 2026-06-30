import { useEffect, useState } from "react";
import axios from "axios";
import "./AIPortfolioManager.css";

const API =
  import.meta.env.VITE_API_URL ||
  "https://exalt-exchange-backend.onrender.com";

const demoPortfolio = {
  totalValue: 24580,
  totalProfitLoss: 1875,
  riskScore: 38,
  diversification: 84,
  assets: [
    {
      symbol: "BTC",
      name: "Bitcoin",
      value: 12000,
      allocation: 49,
      change24h: 2.8,
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      value: 7000,
      allocation: 28,
      change24h: 1.6,
    },
    {
      symbol: "BNB",
      name: "BNB",
      value: 3500,
      allocation: 14,
      change24h: -0.8,
    },
    {
      symbol: "EXALT",
      name: "Exalt Coin",
      value: 2080,
      allocation: 9,
      change24h: 6.4,
    },
  ],
  suggestions: [
    {
      type: "success",
      title: "Good Diversification",
      message: "Portfolio is well diversified.",
    },
    {
      type: "warning",
      title: "Reduce BTC Exposure",
      message: "BTC allocation is slightly high.",
    },
    {
      type: "info",
      title: "Increase EXALT",
      message: "AI suggests increasing EXALT holdings gradually.",
    },
  ],
};

export default function AIPortfolioManager() {
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

      const res = await axios.get(`${API}/api/portfolio/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        alert("Please login first");
        return;
      }

      const res = await axios.put(
        `${API}/api/portfolio/rebalance`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success !== false) {
        alert("Portfolio rebalanced successfully");
        setPortfolio(res.data.portfolio || demoPortfolio);
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Rebalance failed");
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  return (
    <div className="ai-portfolio-page">
      <div className="ai-portfolio-header">
        <h1>AI Portfolio Manager</h1>
        <p>
          AI-powered portfolio health, risk score, allocation and smart
          suggestions.
        </p>
      </div>

      <div className="ai-portfolio-stats">
        <div>
          <span>Total Value</span>
          <h2>{portfolio.totalValue} USDT</h2>
        </div>

        <div>
          <span>Total P/L</span>
          <h2>{portfolio.totalProfitLoss} USDT</h2>
        </div>

        <div>
          <span>Risk Score</span>
          <h2>{portfolio.riskScore}/100</h2>
        </div>

        <div>
          <span>Diversification</span>
          <h2>{portfolio.diversification}%</h2>
        </div>
      </div>

      <div className="ai-portfolio-actions">
        <button onClick={loadPortfolio}>
          {loading ? "Loading..." : "Refresh"}
        </button>

        <button onClick={rebalance}>AI Rebalance</button>
      </div>

      <div className="ai-portfolio-grid">
        <div className="ai-portfolio-card">
          <h2>Asset Allocation</h2>

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
                <span>24H</span>
              </div>
            </div>
          ))}
        </div>

        <div className="ai-portfolio-card">
          <h2>AI Suggestions</h2>

          {portfolio.suggestions.map((item, index) => (
            <div key={index} className={`suggestion ${item.type}`}>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}