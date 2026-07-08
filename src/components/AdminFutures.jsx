import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../api";
import "./AdminFutures.css";

function AdminFutures() {
  const API_BASE = API_BASE_URL || "https://api.exaltexchange.io";
  const API = API_BASE.endsWith("/api") ? API_BASE.replace("/api", "") : API_BASE;

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [positions, setPositions] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const loadFuturesAdmin = async () => {
    try {
      setLoading(true);

      const posRes = await fetch(`${API}/api/futures/admin/positions`, { headers });
      const posData = await posRes.json();

      const statsRes = await fetch(`${API}/api/futures/admin/stats`, { headers });
      const statsData = await statsRes.json();

      setPositions(posData.positions || []);
      setStats(statsData.stats || {});
    } catch (err) {
      console.log("Admin futures load error:", err);
      alert("Admin futures load failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFuturesAdmin();
    const interval = setInterval(loadFuturesAdmin, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredPositions = useMemo(() => {
    const q = search.toLowerCase();

    return positions.filter((p) => {
      const matchSearch =
        !q ||
        p.symbol?.toLowerCase().includes(q) ||
        p.side?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q) ||
        p.userId?.email?.toLowerCase().includes(q) ||
        p.userId?.name?.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchSide = sideFilter === "all" || p.side === sideFilter;

      return matchSearch && matchStatus && matchSide;
    });
  }, [positions, search, statusFilter, sideFilter]);

  const forceClose = async (id) => {
    if (!window.confirm("Force close this futures position?")) return;

    const res = await fetch(`${API}/api/futures/admin/close/${id}`, {
      method: "PUT",
      headers,
    });

    const data = await res.json();

    if (!data.success) return alert(data.message || "Close failed.");

    alert("Position closed.");
    loadFuturesAdmin();
  };

  const exportCsv = () => {
    const rows = [
      ["User", "Symbol", "Side", "Quantity", "Leverage", "Entry", "Mark", "Margin", "PNL", "Status", "Time"],
      ...filteredPositions.map((p) => [
        p.userId?.email || p.userId?.name || "",
        p.symbol || "",
        p.side || "",
        p.quantity || "",
        p.leverage || "",
        p.entryPrice || "",
        p.markPrice || "",
        p.margin || "",
        p.realizedPnl || p.pnl || 0,
        p.status || "",
        p.createdAt ? new Date(p.createdAt).toLocaleString() : "",
      ]),
    ];

    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `futures-positions-${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-futures-page">
      <h3>Futures Admin</h3>

      <div className="admin-futures-stats">
        <div><h3>{stats.totalPositions || 0}</h3><p>Total Positions</p></div>
        <div><h3>{stats.openPositions || 0}</h3><p>Open</p></div>
        <div><h3>{stats.closedPositions || 0}</h3><p>Closed</p></div>
        <div><h3>{stats.liquidatedPositions || 0}</h3><p>Liquidated</p></div>
        <div><h3>{Number(stats.totalMargin || 0).toFixed(2)}</h3><p>Total Margin</p></div>
        <div><h3>{Number(stats.totalPnl || 0).toFixed(2)}</h3><p>Total PNL</p></div>
      </div>

      <div className="admin-futures-toolbar">
        <input
          placeholder="Search user, symbol, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="liquidated">Liquidated</option>
        </select>

        <select value={sideFilter} onChange={(e) => setSideFilter(e.target.value)}>
          <option value="all">All Sides</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>

        <button onClick={loadFuturesAdmin}>Refresh</button>
        <button onClick={exportCsv}>Export CSV</button>
      </div>

      {loading && <p>Loading futures positions...</p>}

      {filteredPositions.length === 0 ? (
        <p>No futures positions found.</p>
      ) : (
        filteredPositions.map((p) => (
          <div className="admin-futures-card" key={p._id}>
            <h4>
              {p.symbol} {String(p.side).toUpperCase()}
              <span className={`futures-status ${p.status}`}>{p.status}</span>
            </h4>

            <p><b>User:</b> {p.userId?.email || p.userId?.name || "N/A"}</p>
            <p><b>Quantity:</b> {p.quantity}</p>
            <p><b>Leverage:</b> {p.leverage}x</p>
            <p><b>Entry:</b> {p.entryPrice}</p>
            <p><b>Mark:</b> {p.markPrice}</p>
            <p><b>Margin:</b> {p.margin} USDT</p>
            <p><b>PNL:</b> {Number(p.realizedPnl || p.pnl || 0).toFixed(2)}</p>
            <p><b>Liquidation:</b> {p.liquidationPrice || "N/A"}</p>
            <p><b>Time:</b> {p.createdAt ? new Date(p.createdAt).toLocaleString() : "N/A"}</p>

            {p.status === "open" && (
              <button className="force-close-btn" onClick={() => forceClose(p._id)}>
                Force Close
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AdminFutures;