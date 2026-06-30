import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AIWhaleTracker.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString()}`;

const formatDate = (date) => {
  if (!date) return "No date";
  return new Date(date).toLocaleString();
};

export default function AIWhaleTracker() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `${API_BASE}/api/ai-whale-tracker`,
        {
          ...authHeaders,
          params: {
            search,
            symbol: symbolFilter,
            type: typeFilter,
            impact: impactFilter,
          },
        }
      );

      setTransactions(res.data?.transactions || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load whale tracker"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const toggleFavorite = async (id) => {
    try {
      await axios.put(
        `${API_BASE}/api/ai-whale-tracker/${id}/favorite`,
        {},
        authHeaders
      );

      fetchTransactions();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to update favorite"
      );
    }
  };

  if (loading) {
    return (
      <div className="whale-page">
        Loading AI Whale Tracker...
      </div>
    );
  }

  return (
    <div className="whale-page">
      <div className="whale-header">
        <div>
          <h1>AI Whale Tracker</h1>
          <p>
            Detect whale activity, large transfers and
            market impact.
          </p>
        </div>

        <button onClick={fetchTransactions}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="whale-error">
          {error}
        </div>
      )}

      <div className="whale-toolbar">
        <input
          placeholder="Search wallet or symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={symbolFilter}
          onChange={(e) =>
            setSymbolFilter(e.target.value)
          }
        >
          <option value="all">All Symbols</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
          <option value="BNB">BNB</option>
          <option value="SOL">SOL</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value)
          }
        >
          <option value="all">All Types</option>
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
        </select>

        <select
          value={impactFilter}
          onChange={(e) =>
            setImpactFilter(e.target.value)
          }
        >
          <option value="all">All Impact</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <button onClick={fetchTransactions}>
          Apply
        </button>
      </div>

      <div className="whale-grid">
        {transactions.map((item) => (
          <div className="whale-card" key={item._id}>
            <div className="whale-top">
              <h2>{item.symbol}</h2>

              <span
                className={`whale-type ${item.transactionType?.toLowerCase()}`}
              >
                {item.transactionType}
              </span>
            </div>

            <div className="whale-row">
              <span>Wallet</span>
              <strong>{item.walletAddress}</strong>
            </div>

            <div className="whale-row">
              <span>USD Value</span>
              <strong>
                {formatMoney(item.amountUSD)}
              </strong>
            </div>

            <div className="whale-row">
              <span>AI Signal</span>
              <strong>{item.aiSignal}</strong>
            </div>

            <div className="whale-row">
              <span>Confidence</span>
              <strong>
                {item.confidence}%
              </strong>
            </div>

            <div className="whale-row">
              <span>Risk</span>

              <strong
                className={`risk-${item.riskLevel?.toLowerCase()}`}
              >
                {item.riskLevel}
              </strong>
            </div>

            <div className="whale-row">
              <span>Impact</span>

              <strong
                className={`impact-${item.impactLevel?.toLowerCase()}`}
              >
                {item.impactLevel}
              </strong>
            </div>

            <div className="whale-row">
              <span>Created</span>
              <strong>
                {formatDate(item.createdAt)}
              </strong>
            </div>

            <p className="recommendation">
              {item.aiRecommendation}
            </p>

            <button
              className="favorite-btn"
              onClick={() =>
                toggleFavorite(item._id)
              }
            >
              {item.isFavorite
                ? "★ Favorite"
                : "☆ Add Favorite"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}