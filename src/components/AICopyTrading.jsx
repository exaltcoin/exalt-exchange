import { useEffect, useState } from "react";
import axios from "axios";
import "./AICopyTrading.css";
const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const demoTraders = [
  {
    traderId: "ai-1",
    traderName: "AI Alpha Trader",
    traderAvatar: "A",
    roi: 18.7,
    winRate: 74,
    risk: "Medium",
    followers: 1280,
    suggestedCopy: 50,
    symbol: "BTCUSDT",
  },
  {
    traderId: "ai-2",
    traderName: "Smart Futures Pro",
    traderAvatar: "S",
    roi: 12.4,
    winRate: 68,
    risk: "Low",
    followers: 840,
    suggestedCopy: 100,
    symbol: "ETHUSDT",
  },
  {
    traderId: "ai-3",
    traderName: "EXALT Growth Bot",
    traderAvatar: "E",
    roi: 25.1,
    winRate: 71,
    risk: "High",
    followers: 620,
    suggestedCopy: 75,
    symbol: "EXALTUSDT",
  },
];

export default function AICopyTrading() {
  const [traders, setTraders] = useState([]);
  const [copies, setCopies] = useState([]);
  const [stats, setStats] = useState({
    activeCount: 0,
    totalCopiedAmount: 0,
    totalProfitLoss: 0,
  });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token || ""}`,
  };

  const loadData = async () => {
    try {
      setLoading(true);

      if (!token) {
        setTraders(demoTraders);
        setCopies([]);
        setStats({
          activeCount: 0,
          totalCopiedAmount: 0,
          totalProfitLoss: 0,
        });
        return;
      }

      let tradersList = [];
      let copiesList = [];
      let copyStats = {
        activeCount: 0,
        totalCopiedAmount: 0,
        totalProfitLoss: 0,
      };

      try {
        const tradersRes = await axios.get(`${API}/api/copy/top-traders`, {
          headers,
        });

        tradersList =
          tradersRes.data?.traders ||
          tradersRes.data?.data ||
          tradersRes.data?.records ||
          [];
      } catch (error) {
        console.log("Top traders load failed:", error);
        tradersList = demoTraders;
      }

      try {
        const myRes = await axios.get(`${API}/api/copy/my`, {
          headers,
        });

        copiesList =
          myRes.data?.copies ||
          myRes.data?.data ||
          myRes.data?.records ||
          [];

        copyStats =
          myRes.data?.stats || {
            activeCount: copiesList.filter((x) => x.status === "active").length,
            totalCopiedAmount: copiesList.reduce(
              (sum, x) => sum + Number(x.copyAmount || 0),
              0
            ),
            totalProfitLoss: copiesList.reduce(
              (sum, x) => sum + Number(x.profitLoss || 0),
              0
            ),
          };
      } catch (error) {
        console.log("My copy trades load failed:", error);
      }

      setTraders(Array.isArray(tradersList) ? tradersList : demoTraders);
      setCopies(Array.isArray(copiesList) ? copiesList : []);
      setStats(copyStats);
    } catch (error) {
      console.log("Copy trading load error:", error);
      setTraders(demoTraders);
      setCopies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startCopy = async (trader) => {
    try {
      if (!token) {
        alert("Please login first");
        return;
      }

      const amount = prompt(
        `Enter copy amount for ${trader.traderName}`,
        trader.suggestedCopy || 50
      );

      if (!amount || Number(amount) <= 0) return;

      const res = await axios.post(
        `${API}/api/copy/start`,
        {
          traderId: trader.traderId || trader._id,
          traderName: trader.traderName,
          symbol: trader.symbol || "BTCUSDT",
          copyAmount: Number(amount),
          strategy: trader.strategy || "AI Copy Strategy",
        },
        { headers }
      );

      if (res.data.success !== false) {
        alert("Copy trading started successfully");
        loadData();
      } else {
        alert(res.data.message || "Failed to start copy trading");
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to start copy trading");
    }
  };

  const stopCopy = async (id) => {
    try {
      if (!id) return alert("Copy trade ID missing");

      const res = await axios.put(
        `${API}/api/copy/stop/${id}`,
        {},
        { headers }
      );

      if (res.data.success !== false) {
        alert("Copy trading stopped");
        loadData();
      } else {
        alert(res.data.message || "Failed to stop copy trading");
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to stop copy trading");
    }
  };

  return (
    <div className="copy-page">
      <div className="copy-header">
        <h1>AI Copy Trading</h1>
        <p>Follow AI-ranked traders and copy strategies automatically.</p>
      </div>

      <div className="copy-stats">
        <div><span>Active Copies</span><h2>{stats.activeCount}</h2></div>
        <div><span>Total Copied</span><h2>{stats.totalCopiedAmount} USDT</h2></div>
        <div><span>Total P/L</span><h2>{stats.totalProfitLoss} USDT</h2></div>
        <div><span>AI Risk Engine</span><h2>{loading ? "Loading..." : "Enabled"}</h2></div>
      </div>

      <div className="trader-list">
        {traders.map((trader, index) => (
          <div className="copy-card" key={trader.traderId || trader._id || index}>
            <div className="trader-head">
              <div className="trader-icon">
                {trader.traderAvatar || trader.traderName?.charAt(0) || "T"}
              </div>

              <div>
                <h3>{trader.traderName || trader.name || "AI Trader"}</h3>
                <p>AI Ranked Trader #{index + 1}</p>
              </div>
            </div>

            <div className="copy-metrics">
              <div><span>ROI</span><strong>+{Number(trader.roi || 0).toFixed(2)}%</strong></div>
              <div><span>Win Rate</span><strong>{Number(trader.winRate || 0).toFixed(0)}%</strong></div>
              <div><span>Risk</span><strong>{trader.risk || trader.riskLevel || "Medium"}</strong></div>
              <div><span>Followers</span><strong>{trader.followers || 0}</strong></div>
            </div>

            <div className="copy-footer">
              <span>Suggested Copy: {trader.suggestedCopy || 50} USDT</span>
              <button onClick={() => startCopy(trader)}>Copy Trader</button>
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

              <div><span>Amount</span><strong>{copy.copyAmount} USDT</strong></div>
              <div><span>Status</span><strong>{copy.status}</strong></div>
              <div><span>P/L</span><strong>{copy.profitLoss || 0} USDT</strong></div>

              {copy.status === "active" && (
                <button onClick={() => stopCopy(copy._id)}>Stop</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}