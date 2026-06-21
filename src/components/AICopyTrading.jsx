import { useEffect, useState } from "react";
import axios from "axios";
import "./AICopyTrading.css";

const API = "https://exalt-exchange-backend.onrender.com";

export default function AICopyTrading() {
  const [traders, setTraders] = useState([]);
  const [copies, setCopies] = useState([]);
  const [stats, setStats] = useState({
    activeCount: 0,
    totalCopiedAmount: 0,
    totalProfitLoss: 0,
  });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const loadData = async () => {
    try {
      setLoading(true);

      const tradersRes = await axios.get(`${API}/api/copy/top-traders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const myRes = await axios.get(`${API}/api/copy/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (tradersRes.data.success) {
        setTraders(tradersRes.data.traders || []);
      }

      if (myRes.data.success) {
        setCopies(myRes.data.copies || []);
        setStats(myRes.data.stats || {
          activeCount: 0,
          totalCopiedAmount: 0,
          totalProfitLoss: 0,
        });
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to load copy trading");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startCopy = async (trader) => {
    try {
      const amount = prompt(
        `Enter copy amount for ${trader.traderName}`,
        trader.suggestedCopy || 50
      );

      if (!amount || Number(amount) <= 0) return;

      const res = await axios.post(
        `${API}/api/copy/start`,
        {
          ...trader,
          copyAmount: Number(amount),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        alert("Copy trading started successfully");
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start copy trading");
    }
  };

  const stopCopy = async (id) => {
    try {
      const res = await axios.put(
        `${API}/api/copy/stop/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        alert("Copy trading stopped");
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to stop copy trading");
    }
  };

  return (
    <div className="copy-page">
      <div className="copy-header">
        <h1>AI Copy Trading</h1>
        <p>Follow AI-ranked traders and copy strategies automatically.</p>
      </div>

      <div className="copy-stats">
        <div>
          <span>Active Copies</span>
          <h2>{stats.activeCount}</h2>
        </div>

        <div>
          <span>Total Copied</span>
          <h2>{stats.totalCopiedAmount} USDT</h2>
        </div>

        <div>
          <span>Total P/L</span>
          <h2>{stats.totalProfitLoss} USDT</h2>
        </div>

        <div>
          <span>AI Risk Engine</span>
          <h2>{loading ? "Loading..." : "Enabled"}</h2>
        </div>
      </div>

      <div className="trader-list">
        {traders.map((trader, index) => (
          <div className="copy-card" key={trader.traderId || index}>
            <div className="trader-head">
              <div className="trader-icon">
                {trader.traderAvatar || trader.traderName?.charAt(0)}
              </div>

              <div>
                <h3>{trader.traderName}</h3>
                <p>AI Ranked Trader #{index + 1}</p>
              </div>
            </div>

            <div className="copy-metrics">
              <div>
                <span>ROI</span>
                <strong>+{trader.roi}%</strong>
              </div>

              <div>
                <span>Win Rate</span>
                <strong>{trader.winRate}%</strong>
              </div>

              <div>
                <span>Risk</span>
                <strong>{trader.risk}</strong>
              </div>

              <div>
                <span>Followers</span>
                <strong>{trader.followers}</strong>
              </div>
            </div>

            <div className="copy-footer">
              <span>Suggested Copy: {trader.suggestedCopy} USDT</span>
              <button onClick={() => startCopy(trader)}>
                Copy Trader
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="copy-my-section">
        <h2>My Copy Trades</h2>

        {copies.length === 0 ? (
          <p>No active copy trades yet.</p>
        ) : (
          copies.map((copy) => (
            <div className="copy-my-card" key={copy._id}>
              <div>
                <h3>{copy.traderName}</h3>
                <p>{copy.symbol}</p>
              </div>

              <div>
                <span>Amount</span>
                <strong>{copy.copyAmount} USDT</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{copy.status}</strong>
              </div>

              <div>
                <span>P/L</span>
                <strong>{copy.profitLoss || 0} USDT</strong>
              </div>

              {copy.status === "active" && (
                <button onClick={() => stopCopy(copy._id)}>
                  Stop
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}