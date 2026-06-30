import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAIProfit.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

const formatDate = (date) => {
  if (!date) return "No date";
  return new Date(date).toLocaleString();
};

export default function AdminAIProfit() {
  const [stats, setStats] = useState({});
  const [calculations, setCalculations] = useState([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedCalc, setSelectedCalc] = useState(null);
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

  const fetchAdminProfit = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, listRes] = await Promise.all([
        axios.get(`${API_BASE}/api/ai-profit/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/ai-profit/admin/calculations`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setCalculations(listRes.data?.calculations || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI Profit Admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfit();
  }, []);

  const filteredCalculations = calculations.filter((item) => {
    const keyword = search.toLowerCase();
    const name = item.user?.name?.toLowerCase() || "";
    const email = item.user?.email?.toLowerCase() || "";
    const symbol = item.symbol?.toLowerCase() || "";
    const risk = item.riskLevel?.toLowerCase() || "";

    const matchesSearch =
      name.includes(keyword) ||
      email.includes(keyword) ||
      symbol.includes(keyword);

    const matchesRisk =
      riskFilter === "all" || risk === riskFilter.toLowerCase();

    return matchesSearch && matchesRisk;
  });

  const openReview = (calculation) => {
    setSelectedCalc(calculation);
    setAdminNote(calculation.adminNote || "");
    setStatus(calculation.status || "Reviewed");
  };

  const closeReview = () => {
    setSelectedCalc(null);
    setAdminNote("");
    setStatus("Reviewed");
  };

  const reviewCalculation = async () => {
    if (!selectedCalc?._id) return;

    try {
      setActionLoading(selectedCalc._id);

      await axios.put(
        `${API_BASE}/api/ai-profit/admin/calculations/${selectedCalc._id}/review`,
        {
          adminNote,
          status,
        },
        authHeaders
      );

      closeReview();
      fetchAdminProfit();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to review calculation");
    } finally {
      setActionLoading("");
    }
  };

  const deleteCalculation = async (id) => {
    const confirmDelete = window.confirm("Delete this AI profit calculation?");
    if (!confirmDelete) return;

    try {
      setActionLoading(id);

      await axios.delete(
        `${API_BASE}/api/ai-profit/admin/calculations/${id}`,
        authHeaders
      );

      setCalculations((prev) => prev.filter((item) => item._id !== id));
      fetchAdminProfit();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete calculation");
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
        "Market",
        "Capital",
        "ROI",
        "Expected Profit",
        "Expected Loss",
        "Risk",
        "Confidence",
        "Status",
        "Created",
      ],
      ...filteredCalculations.map((item) => [
        item.user?.name || "User",
        item.user?.email || "No email",
        item.symbol || "",
        item.marketType || "",
        item.capital || 0,
        item.roi || 0,
        item.expectedProfit || 0,
        item.expectedLoss || 0,
        item.riskLevel || "",
        item.aiConfidence || 0,
        item.status || "",
        formatDate(item.createdAt),
      ]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-profit-calculations.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="admin-profit-page">Loading AI Profit Admin...</div>;
  }

  return (
    <div className="admin-profit-page">
      <div className="admin-profit-header">
        <div>
          <h2>AI Profit Calculator Admin</h2>
          <p>Monitor profit calculations, risk setups, ROI and reviewed trades.</p>
        </div>

        <div className="admin-profit-header-actions">
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={fetchAdminProfit}>Refresh</button>
        </div>
      </div>

      {error && <div className="admin-profit-error">{error}</div>}

      <div className="admin-profit-cards">
        <div>
          <span>Total Calculations</span>
          <strong>{stats.total || 0}</strong>
        </div>

        <div>
          <span>Total Capital</span>
          <strong>{formatMoney(stats.totalCapital)}</strong>
        </div>

        <div>
          <span>Expected Profit</span>
          <strong>{formatMoney(stats.totalExpectedProfit)}</strong>
        </div>

        <div>
          <span>Expected Loss</span>
          <strong>{formatMoney(stats.totalExpectedLoss)}</strong>
        </div>

        <div>
          <span>Low Risk</span>
          <strong>{stats.lowRisk || 0}</strong>
        </div>

        <div>
          <span>Medium Risk</span>
          <strong>{stats.mediumRisk || 0}</strong>
        </div>

        <div>
          <span>High Risk</span>
          <strong>{stats.highRisk || 0}</strong>
        </div>

        <div>
          <span>Reviewed</span>
          <strong>{stats.reviewed || 0}</strong>
        </div>
      </div>

      <div className="admin-profit-toolbar">
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
      </div>

      <div className="admin-profit-table-box">
        <div className="admin-profit-table-head">
          <h3>AI Profit Calculations</h3>
          <span>{filteredCalculations.length} records</span>
        </div>

        <table className="admin-profit-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Symbol</th>
              <th>Market</th>
              <th>Capital</th>
              <th>ROI</th>
              <th>Profit / Loss</th>
              <th>Risk</th>
              <th>AI Confidence</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredCalculations.length === 0 ? (
              <tr>
                <td colSpan="11" className="empty-profit-row">
                  No AI profit calculations found
                </td>
              </tr>
            ) : (
              filteredCalculations.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.user?.name || "User"}</strong>
                    <small>{item.user?.email || "No email"}</small>
                  </td>

                  <td>{item.symbol}</td>
                  <td>{item.marketType}</td>
                  <td>{formatMoney(item.capital)}</td>
                  <td className={item.roi >= 0 ? "positive" : "negative"}>
                    {item.roi}%
                  </td>

                  <td>
                    <div className="profit-mini">
                      <span>Profit: {formatMoney(item.expectedProfit)}</span>
                      <span>Loss: {formatMoney(item.expectedLoss)}</span>
                    </div>
                  </td>

                  <td>
                    <span className={`profit-risk ${item.riskLevel?.toLowerCase()}`}>
                      {item.riskLevel || "Low"}
                    </span>
                  </td>

                  <td>{item.aiConfidence || 0}%</td>

                  <td>
                    <span className={`profit-status ${item.status?.toLowerCase()}`}>
                      {item.status || "Calculated"}
                    </span>
                  </td>

                  <td>{formatDate(item.createdAt)}</td>

                  <td>
                    <div className="admin-profit-actions">
                      <button onClick={() => openReview(item)}>Review</button>
                      <button
                        className="danger"
                        onClick={() => deleteCalculation(item._id)}
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

      {selectedCalc && (
        <div className="profit-modal-backdrop">
          <div className="profit-modal">
            <h3>Review AI Profit Calculation</h3>

            <p>
              User: <strong>{selectedCalc.user?.name || "User"}</strong>
            </p>

            <div className="profit-review-grid">
              <div>
                <span>Symbol</span>
                <strong>{selectedCalc.symbol}</strong>
              </div>

              <div>
                <span>Capital</span>
                <strong>{formatMoney(selectedCalc.capital)}</strong>
              </div>

              <div>
                <span>ROI</span>
                <strong>{selectedCalc.roi}%</strong>
              </div>

              <div>
                <span>Risk</span>
                <strong>{selectedCalc.riskLevel}</strong>
              </div>
            </div>

            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Reviewed</option>
              <option>Flagged</option>
              <option>Calculated</option>
              <option>Saved</option>
            </select>

            <label>Admin Note</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Write review note..."
            />

            <div className="profit-modal-actions">
              <button onClick={closeReview}>Cancel</button>
              <button
                onClick={reviewCalculation}
                disabled={actionLoading === selectedCalc._id}
              >
                {actionLoading === selectedCalc._id ? "Saving..." : "Save Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}