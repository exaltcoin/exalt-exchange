import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminMarketScanner.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

const formatDate = (date) => {
  if (!date) return "No date";
  return new Date(date).toLocaleString();
};

export default function AdminAIMarketScanner() {
  const [stats, setStats] = useState({});
  const [scans, setScans] = useState([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [signalFilter, setSignalFilter] = useState("all");
  const [selectedScan, setSelectedScan] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [status, setStatus] = useState("Reviewed");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchAdminScanner = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, scansRes] = await Promise.all([
        axios.get(`${API_BASE}/api/ai-market-scanner/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/ai-market-scanner/admin/scans`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setScans(scansRes.data?.scans || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI Market Scanner Admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminScanner();
  }, []);

  const filteredScans = scans.filter((item) => {
    const keyword = search.toLowerCase();
    const name = item.user?.name?.toLowerCase() || "";
    const email = item.user?.email?.toLowerCase() || "";
    const symbol = item.symbol?.toLowerCase() || "";
    const risk = item.riskLevel?.toLowerCase() || "";
    const signal = item.signal?.toLowerCase() || "";

    const matchesSearch =
      name.includes(keyword) ||
      email.includes(keyword) ||
      symbol.includes(keyword);

    const matchesRisk =
      riskFilter === "all" || risk === riskFilter.toLowerCase();

    const matchesSignal =
      signalFilter === "all" || signal === signalFilter.toLowerCase();

    return matchesSearch && matchesRisk && matchesSignal;
  });

  const openReview = (scan) => {
    setSelectedScan(scan);
    setAdminNote(scan.adminNote || "");
    setStatus(scan.status || "Reviewed");
  };

  const closeReview = () => {
    setSelectedScan(null);
    setAdminNote("");
    setStatus("Reviewed");
  };

  const reviewScan = async () => {
    if (!selectedScan?._id) return;

    try {
      setActionLoading(selectedScan._id);

      await axios.put(
        `${API_BASE}/api/ai-market-scanner/admin/scans/${selectedScan._id}/review`,
        { adminNote, status },
        authHeaders
      );

      closeReview();
      fetchAdminScanner();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to review market scan");
    } finally {
      setActionLoading("");
    }
  };

  const deleteScan = async (id) => {
    const confirmDelete = window.confirm("Delete this AI market scan?");
    if (!confirmDelete) return;

    try {
      setActionLoading(id);

      await axios.delete(
        `${API_BASE}/api/ai-market-scanner/admin/scans/${id}`,
        authHeaders
      );

      setScans((prev) => prev.filter((item) => item._id !== id));
      fetchAdminScanner();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete scan");
    } finally {
      setActionLoading("");
    }
  };

  const exportCSV = () => {
    const rows = [
      [
        "User",
        "Email",
        "Symbol",
        "Timeframe",
        "Market",
        "Price",
        "Signal",
        "Trend",
        "Risk",
        "AI Confidence",
        "RSI",
        "MACD",
        "Created",
      ],
      ...filteredScans.map((item) => [
        item.user?.name || "User",
        item.user?.email || "No email",
        item.symbol || "",
        item.timeframe || "",
        item.marketType || "",
        item.currentPrice || 0,
        item.signal || "",
        item.trend || "",
        item.riskLevel || "",
        item.aiConfidence || 0,
        item.indicators?.rsi || 0,
        item.indicators?.macd || "",
        formatDate(item.createdAt),
      ]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-market-scans.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="admin-market-page">Loading AI Market Scanner Admin...</div>;
  }

  return (
    <div className="admin-market-page">
      <div className="admin-market-header">
        <div>
          <h2>AI Market Scanner Admin</h2>
          <p>Monitor AI scans, signals, risk levels, confidence and reviewed setups.</p>
        </div>

        <div className="admin-market-header-actions">
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={fetchAdminScanner}>Refresh</button>
        </div>
      </div>

      {error && <div className="admin-market-error">{error}</div>}

      <div className="admin-market-cards">
        <div><span>Total Scans</span><strong>{stats.total || 0}</strong></div>
        <div><span>Buy Signals</span><strong>{stats.buySignals || 0}</strong></div>
        <div><span>Sell Signals</span><strong>{stats.sellSignals || 0}</strong></div>
        <div><span>Hold Signals</span><strong>{stats.holdSignals || 0}</strong></div>
        <div><span>Low Risk</span><strong>{stats.lowRisk || 0}</strong></div>
        <div><span>Medium Risk</span><strong>{stats.mediumRisk || 0}</strong></div>
        <div><span>High Risk</span><strong>{stats.highRisk || 0}</strong></div>
        <div><span>Reviewed</span><strong>{stats.reviewed || 0}</strong></div>
      </div>

      <div className="admin-market-toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user, email or symbol..."
        />

        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
          <option value="all">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>

        <select value={signalFilter} onChange={(e) => setSignalFilter(e.target.value)}>
          <option value="all">All Signals</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
          <option value="hold">Hold</option>
        </select>
      </div>

      <div className="admin-market-table-box">
        <div className="admin-market-table-head">
          <h3>AI Market Scans</h3>
          <span>{filteredScans.length} records</span>
        </div>

        <table className="admin-market-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Symbol</th>
              <th>Market</th>
              <th>Price</th>
              <th>Signal</th>
              <th>Trend</th>
              <th>Risk</th>
              <th>Indicators</th>
              <th>AI Confidence</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredScans.length === 0 ? (
              <tr>
                <td colSpan="12" className="empty-market-row">
                  No AI market scans found
                </td>
              </tr>
            ) : (
              filteredScans.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.user?.name || "User"}</strong>
                    <small>{item.user?.email || "No email"}</small>
                  </td>

                  <td>{item.symbol}</td>
                  <td>{item.marketType} • {item.timeframe}</td>
                  <td>{formatMoney(item.currentPrice)}</td>

                  <td>
                    <span className={`market-signal ${item.signal?.toLowerCase()}`}>
                      {item.signal}
                    </span>
                  </td>

                  <td>{item.trend}</td>

                  <td>
                    <span className={`market-risk ${item.riskLevel?.toLowerCase()}`}>
                      {item.riskLevel}
                    </span>
                  </td>

                  <td>
                    <div className="market-mini">
                      <span>RSI: {item.indicators?.rsi}</span>
                      <span>MACD: {item.indicators?.macd}</span>
                      <span>EMA: {item.indicators?.emaTrend}</span>
                    </div>
                  </td>

                  <td>{item.aiConfidence}%</td>

                  <td>
                    <span className={`market-status ${item.status?.toLowerCase()}`}>
                      {item.status || "Scanned"}
                    </span>
                  </td>

                  <td>{formatDate(item.createdAt)}</td>

                  <td>
                    <div className="admin-market-actions">
                      <button onClick={() => openReview(item)}>Review</button>
                      <button
                        className="danger"
                        onClick={() => deleteScan(item._id)}
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

      {selectedScan && (
        <div className="market-modal-backdrop">
          <div className="market-modal">
            <h3>Review AI Market Scan</h3>

            <p>
              User: <strong>{selectedScan.user?.name || "User"}</strong>
            </p>

            <div className="market-review-grid">
              <div><span>Symbol</span><strong>{selectedScan.symbol}</strong></div>
              <div><span>Signal</span><strong>{selectedScan.signal}</strong></div>
              <div><span>Trend</span><strong>{selectedScan.trend}</strong></div>
              <div><span>Risk</span><strong>{selectedScan.riskLevel}</strong></div>
              <div><span>Buy Zone</span><strong>{formatMoney(selectedScan.buyZone)}</strong></div>
              <div><span>Sell Zone</span><strong>{formatMoney(selectedScan.sellZone)}</strong></div>
            </div>

            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Reviewed</option>
              <option>Flagged</option>
              <option>Scanned</option>
              <option>Saved</option>
            </select>

            <label>Admin Note</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Write review note..."
            />

            <div className="market-modal-actions">
              <button onClick={closeReview}>Cancel</button>
              <button
                onClick={reviewScan}
                disabled={actionLoading === selectedScan._id}
              >
                {actionLoading === selectedScan._id ? "Saving..." : "Save Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}