import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAIWhaleTracker.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

const formatDate = (date) => {
  if (!date) return "No date";
  return new Date(date).toLocaleString();
};

export default function AdminAIWhaleTracker() {
  const [stats, setStats] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [impactFilter, setImpactFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState(null);
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchAdminWhales = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, txRes] = await Promise.all([
        axios.get(`${API_BASE}/api/ai-whale-tracker/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/ai-whale-tracker/admin/transactions`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setTransactions(txRes.data?.transactions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI Whale Tracker Admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminWhales();
  }, []);

  const filteredTransactions = transactions.filter((item) => {
    const keyword = search.toLowerCase();
    const symbol = item.symbol?.toLowerCase() || "";
    const wallet = item.walletAddress?.toLowerCase() || "";
    const network = item.network?.toLowerCase() || "";
    const type = item.transactionType?.toLowerCase() || "";
    const impact = item.impactLevel?.toLowerCase() || "";

    const matchesSearch =
      symbol.includes(keyword) ||
      wallet.includes(keyword) ||
      network.includes(keyword);

    const matchesImpact =
      impactFilter === "all" || impact === impactFilter.toLowerCase();

    const matchesType =
      typeFilter === "all" || type === typeFilter.toLowerCase();

    return matchesSearch && matchesImpact && matchesType;
  });

  const openReview = (tx) => {
    setSelectedTx(tx);
    setStatus(tx.status || "Active");
    setNotes(tx.notes || "");
  };

  const closeReview = () => {
    setSelectedTx(null);
    setStatus("Active");
    setNotes("");
  };

  const reviewTransaction = async () => {
    if (!selectedTx?._id) return;

    try {
      setActionLoading(selectedTx._id);

      await axios.put(
        `${API_BASE}/api/ai-whale-tracker/admin/transactions/${selectedTx._id}/review`,
        { status, notes },
        authHeaders
      );

      closeReview();
      fetchAdminWhales();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to review whale transaction");
    } finally {
      setActionLoading("");
    }
  };

  const deleteTransaction = async (id) => {
    const confirmDelete = window.confirm("Delete this whale transaction?");
    if (!confirmDelete) return;

    try {
      setActionLoading(id);

      await axios.delete(
        `${API_BASE}/api/ai-whale-tracker/admin/transactions/${id}`,
        authHeaders
      );

      setTransactions((prev) => prev.filter((item) => item._id !== id));
      fetchAdminWhales();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete transaction");
    } finally {
      setActionLoading("");
    }
  };

  const exportCSV = () => {
    const rows = [
      [
        "Symbol",
        "Network",
        "Wallet",
        "Type",
        "Amount USD",
        "Amount Coin",
        "Price",
        "AI Signal",
        "Confidence",
        "Risk",
        "Impact",
        "Status",
        "Created",
      ],
      ...filteredTransactions.map((item) => [
        item.symbol || "",
        item.network || "",
        item.walletAddress || "",
        item.transactionType || "",
        item.amountUSD || 0,
        item.amountCoin || 0,
        item.price || 0,
        item.aiSignal || "",
        item.confidence || 0,
        item.riskLevel || "",
        item.impactLevel || "",
        item.status || "",
        formatDate(item.createdAt),
      ]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-whale-transactions.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="admin-whale-page">Loading AI Whale Tracker Admin...</div>;
  }

  return (
    <div className="admin-whale-page">
      <div className="admin-whale-header">
        <div>
          <h2>AI Whale Tracker Admin</h2>
          <p>Monitor whale transactions, impact level, AI signals and reviewed alerts.</p>
        </div>

        <div className="admin-whale-header-actions">
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={fetchAdminWhales}>Refresh</button>
        </div>
      </div>

      {error && <div className="admin-whale-error">{error}</div>}

      <div className="admin-whale-cards">
        <div><span>Total Transactions</span><strong>{stats.total || 0}</strong></div>
        <div><span>Whale Buys</span><strong>{stats.buys || 0}</strong></div>
        <div><span>Whale Sells</span><strong>{stats.sells || 0}</strong></div>
        <div><span>High Impact</span><strong>{stats.highImpact || 0}</strong></div>
        <div><span>Medium Impact</span><strong>{stats.mediumImpact || 0}</strong></div>
        <div><span>Low Impact</span><strong>{stats.lowImpact || 0}</strong></div>
        <div><span>Reviewed</span><strong>{stats.reviewed || 0}</strong></div>
        <div><span>Total USD Value</span><strong>{formatMoney(stats.totalUsdValue)}</strong></div>
      </div>

      <div className="admin-whale-toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search wallet, symbol or network..."
        />

        <select value={impactFilter} onChange={(e) => setImpactFilter(e.target.value)}>
          <option value="all">All Impact</option>
          <option value="low">Low Impact</option>
          <option value="medium">Medium Impact</option>
          <option value="high">High Impact</option>
        </select>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
      </div>

      <div className="admin-whale-table-box">
        <div className="admin-whale-table-head">
          <h3>Whale Transactions</h3>
          <span>{filteredTransactions.length} records</span>
        </div>

        <table className="admin-whale-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Wallet</th>
              <th>Type</th>
              <th>Amount</th>
              <th>AI Signal</th>
              <th>Confidence</th>
              <th>Risk</th>
              <th>Impact</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="11" className="empty-whale-row">
                  No whale transactions found
                </td>
              </tr>
            ) : (
              filteredTransactions.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.symbol}</strong>
                    <small>{item.network}</small>
                  </td>

                  <td>
                    <span className="wallet-text">{item.walletAddress}</span>
                  </td>

                  <td>
                    <span className={`whale-type ${item.transactionType?.toLowerCase()}`}>
                      {item.transactionType}
                    </span>
                  </td>

                  <td>
                    <strong>{formatMoney(item.amountUSD)}</strong>
                    <small>{item.amountCoin} {item.symbol}</small>
                  </td>

                  <td>{item.aiSignal}</td>
                  <td>{item.confidence}%</td>

                  <td>
                    <span className={`whale-risk ${item.riskLevel?.toLowerCase()}`}>
                      {item.riskLevel}
                    </span>
                  </td>

                  <td>
                    <span className={`whale-impact ${item.impactLevel?.toLowerCase()}`}>
                      {item.impactLevel}
                    </span>
                  </td>

                  <td>
                    <span className={`whale-status ${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>

                  <td>{formatDate(item.createdAt)}</td>

                  <td>
                    <div className="admin-whale-actions">
                      <button onClick={() => openReview(item)}>Review</button>
                      <button
                        className="danger"
                        onClick={() => deleteTransaction(item._id)}
                        disabled={actionLoading === item._id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTx && (
        <div className="whale-modal-backdrop">
          <div className="whale-modal">
            <h3>Review Whale Transaction</h3>

            <p>
              Wallet: <strong>{selectedTx.walletAddress}</strong>
            </p>

            <div className="whale-review-grid">
              <div><span>Symbol</span><strong>{selectedTx.symbol}</strong></div>
              <div><span>Type</span><strong>{selectedTx.transactionType}</strong></div>
              <div><span>USD Value</span><strong>{formatMoney(selectedTx.amountUSD)}</strong></div>
              <div><span>Impact</span><strong>{selectedTx.impactLevel}</strong></div>
            </div>

            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Active</option>
              <option>Closed</option>
            </select>

            <label>Admin Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write admin review note..."
            />

            <div className="whale-modal-actions">
              <button onClick={closeReview}>Cancel</button>
              <button
                onClick={reviewTransaction}
                disabled={actionLoading === selectedTx._id}
              >
                {actionLoading === selectedTx._id ? "Saving..." : "Save Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}