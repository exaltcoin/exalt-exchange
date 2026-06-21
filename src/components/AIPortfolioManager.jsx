import { useEffect, useState } from "react";
import axios from "axios";
import "./AIPortfolioManager.css";

const API = "https://exalt-exchange-backend.onrender.com";

export default function AIPortfolioManager() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const loadPortfolio = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/api/portfolio/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setPortfolio(res.data.portfolio);
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to load AI portfolio");
    } finally {
      setLoading(false);
    }
  };

  const rebalance = async () => {
    try {
      const res = await axios.put(
        `${API}/api/portfolio/rebalance`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        alert("Portfolio rebalanced successfully");
        setPortfolio(res.data.portfolio);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to rebalance portfolio");
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  if (loading && !portfolio) {
    return (
      <div className="ai-portfolio-page">
        <h2>Loading AI Portfolio...</h2>
      </div>
    );
  }

  return (
    <div className="ai-portfolio-page">
      <div className="ai-portfolio-header">
        <h1>AI Portfolio Manager</h1>
        <p>AI-powered portfolio health, risk score, allocation, and smart suggestions.</p>
      </div>

      <div className="ai-portfolio-stats">
        <div>
          <span>Total Value</span>
          <h2>{portfolio?.totalValue || 0} USDT</h2>
        </div>

        <div>
          <span>Total P/L</span>
          <h2>{portfolio?.totalProfitLoss || 0} USDT</h2>
        </div>

        <div>
          <span>Risk Score</span>
          <h2>{portfolio?.riskScore || 0}/100</h2>
        </div>

        <div>
          <span>Diversification</span>
          <h2>{portfolio?.diversification || 0}%</h2>
        </div>
      </div>

      <div className="ai-portfolio-actions">
        <button onClick={loadPortfolio} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>

        <button onClick={rebalance}>AI Rebalance</button>
      </div>

      <div className="ai-portfolio-grid">
        <div className="ai-portfolio-card">
          <h2>Asset Allocation</h2>

          {(portfolio?.assets || []).map((asset, index) => (
            <div className="asset-row" key={index}>
              <div>
                <strong>{asset.symbol}</strong>
                <span>{asset.name}</span>
              </div>

              <div>
                <strong>{asset.value} USDT</strong>
                <span>{asset.allocation}% Allocation</span>
              </div>

              <div>
                <strong className={asset.change24h >= 0 ? "green" : "red"}>
                  {asset.change24h >= 0 ? "+" : ""}
                  {asset.change24h}%
                </strong>
                <span>24h</span>
              </div>
            </div>
          ))}
        </div>

        <div className="ai-portfolio-card">
          <h2>AI Suggestions</h2>

          {(portfolio?.suggestions || []).map((item, index) => (
            <div className={`suggestion ${item.type}`} key={index}>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}