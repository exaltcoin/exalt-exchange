import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminCopyTrading.css";

const API = "https://exalt-exchange-backend.onrender.com";

export default function AdminCopyTrading() {
  const [copies, setCopies] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const loadCopies = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/api/copy/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setCopies(Array.isArray(res.data.copies) ? res.data.copies : []);
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to load copy trading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCopies();
  }, []);

  const safeDate = (date) => {
    if (!date) return "-";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString();
  };

  const getUserName = (item) =>
    item?.userId?.name || item?.user?.name || "User";

  const getUserEmail = (item) =>
    item?.userId?.email || item?.user?.email || "-";

  const filteredCopies = useMemo(() => {
    return copies.filter((item) => {
      const matchesFilter = filter === "all" || item?.status === filter;

      const text = `
        ${getUserName(item)}
        ${getUserEmail(item)}
        ${item?.traderName || ""}
        ${item?.symbol || ""}
        ${item?.status || ""}
      `.toLowerCase();

      return matchesFilter && text.includes(search.toLowerCase());
    });
  }, [copies, search, filter]);

  const totalUsers = new Set(
    copies.map((c) => c?.userId?._id || c?.userId || c?.user).filter(Boolean)
  ).size;

  const activeCopies = copies.filter((c) => c.status === "active").length;
  const stoppedCopies = copies.filter((c) => c.status === "stopped").length;

  const totalCopied = copies.reduce(
    (sum, c) => sum + Number(c.copyAmount || 0),
    0
  );

  const totalPL = copies.reduce(
    (sum, c) => sum + Number(c.profitLoss || 0),
    0
  );

  const exportCSV = () => {
    const rows = [
      ["User", "Email", "Trader", "Symbol", "Amount", "Status", "P/L", "Date"],
      ...filteredCopies.map((c) => [
        getUserName(c),
        getUserEmail(c),
        c?.traderName || "-",
        c?.symbol || "-",
        c?.copyAmount || 0,
        c?.status || "-",
        c?.profitLoss || 0,
        safeDate(c?.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-copy-trading.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-copy-page">
      <div className="admin-copy-header">
        <h1>Admin Copy Trading</h1>
        <p>Monitor all users copying AI-ranked traders and strategies.</p>
      </div>

      <div className="admin-copy-stats">
        <div>
          <span>Total Users</span>
          <h2>{totalUsers}</h2>
        </div>

        <div>
          <span>Active Copies</span>
          <h2>{activeCopies}</h2>
        </div>

        <div>
          <span>Stopped Copies</span>
          <h2>{stoppedCopies}</h2>
        </div>

        <div>
          <span>Total Copied</span>
          <h2>{totalCopied} USDT</h2>
        </div>

        <div>
          <span>Total P/L</span>
          <h2>{totalPL} USDT</h2>
        </div>
      </div>

      <div className="admin-copy-tools">
        <input
          placeholder="Search user, email, trader, symbol, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="stopped">Stopped</option>
        </select>

        <button onClick={loadCopies} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>

        <button onClick={exportCSV} disabled={filteredCopies.length === 0}>
          Export CSV
        </button>
      </div>

      <div className="admin-copy-table-box">
        <h2>Copy Trading Records</h2>

        <table className="admin-copy-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Trader</th>
              <th>Symbol</th>
              <th>Amount</th>
              <th>Risk</th>
              <th>Status</th>
              <th>P/L</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredCopies.length === 0 ? (
              <tr>
                <td colSpan="9">No copy trading records found</td>
              </tr>
            ) : (
              filteredCopies.map((item, index) => (
                <tr key={item?._id || index}>
                  <td>{getUserName(item)}</td>
                  <td>{getUserEmail(item)}</td>
                  <td>{item?.traderName || "-"}</td>
                  <td>{item?.symbol || "-"}</td>
                  <td>{item?.copyAmount || 0} USDT</td>
                  <td>{item?.risk || "-"}</td>
                  <td>
                    <span className={`copy-status ${item?.status || "active"}`}>
                      {item?.status || "active"}
                    </span>
                  </td>
                  <td>{item?.profitLoss || 0} USDT</td>
                  <td>{safeDate(item?.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}