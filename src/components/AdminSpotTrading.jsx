import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../api";
import "./AdminSpotTrading.css";
function AdminSpotTrading() {
  const API_BASE = API_BASE_URL || "https://api.exaltexchange.io";
  const API = API_BASE.endsWith("/api") ? API_BASE.replace("/api", "") : API_BASE;

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const loadSpotAdmin = async () => {
    try {
      setLoading(true);

      const ordersRes = await fetch(`${API}/api/trades/admin/orders`, { headers });
      const ordersData = await ordersRes.json();

      const tradesRes = await fetch(`${API}/api/trades/admin`, { headers });
      const tradesData = await tradesRes.json();

      const statsRes = await fetch(`${API}/api/trades/admin/stats`, { headers });
      const statsData = await statsRes.json();

      setOrders(ordersData.orders || []);
      setTrades(tradesData.trades || []);
      setStats(statsData.stats || {});
    } catch (err) {
      console.log("Admin spot load error:", err);
      alert("Admin spot trading load failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpotAdmin();
    const interval = setInterval(loadSpotAdmin, 10000);
    return () => clearInterval(interval);
  }, []);

  const cancelAdminOrder = async (orderId) => {
    if (!window.confirm("Cancel this order as admin?")) return;

    try {
      const res = await fetch(`${API}/api/trades/admin/order/${orderId}/cancel`, {
        method: "PATCH",
        headers,
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Cancel failed.");
        return;
      }

      alert("Order cancelled.");
      loadSpotAdmin();
    } catch (err) {
      console.log(err);
      alert("Server error.");
    }
  };

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();

    return orders.filter((order) => {
      const matchSearch =
        !q ||
        order.pair?.toLowerCase().includes(q) ||
        order.side?.toLowerCase().includes(q) ||
        order.status?.toLowerCase().includes(q) ||
        order.userId?.email?.toLowerCase().includes(q) ||
        order.userId?.name?.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || order.status === statusFilter;
      const matchSide = sideFilter === "all" || order.side === sideFilter;

      return matchSearch && matchStatus && matchSide;
    });
  }, [orders, search, statusFilter, sideFilter]);

  const exportCsv = () => {
    const rows = [
      ["Pair", "Side", "Type", "Price", "Amount", "Filled", "Remaining", "Avg Price", "Status", "User", "Time"],
      ...filteredOrders.map((o) => [
        o.pair || "",
        o.side || "",
        o.type || "",
        o.price || "",
        o.amount || "",
        o.filled || "",
        o.remaining || "",
        o.averagePrice || "",
        o.status || "",
        o.userId?.email || o.userId?.name || "",
        o.createdAt ? new Date(o.createdAt).toLocaleString() : "",
      ]),
    ];

    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `spot-orders-${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-content">
      <h3>Spot Trading Admin</h3>

      <div className="admin-stats">
        <div className="stat-card"><h3>{stats.totalOrders || 0}</h3><p>Total Orders</p></div>
        <div className="stat-card"><h3>{stats.openOrders || 0}</h3><p>Open</p></div>
        <div className="stat-card"><h3>{stats.partialOrders || 0}</h3><p>Partial</p></div>
        <div className="stat-card"><h3>{stats.filledOrders || 0}</h3><p>Filled</p></div>
        <div className="stat-card"><h3>{stats.cancelledOrders || 0}</h3><p>Cancelled</p></div>
        <div className="stat-card"><h3>{Number(stats.totalVolume || 0).toFixed(2)}</h3><p>Volume USDT</p></div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
        <input
          placeholder="Search pair, user, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "240px", padding: "10px" }}
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="partial">Partial</option>
          <option value="filled">Filled</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select value={sideFilter} onChange={(e) => setSideFilter(e.target.value)}>
          <option value="all">All Sides</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>

        <button className="action-btn approve-btn" onClick={loadSpotAdmin}>
          Refresh
        </button>

        <button className="action-btn" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      {loading && <p>Loading spot trading data...</p>}

      <h3>Orders</h3>

      {filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        filteredOrders.map((order) => (
          <div className="admin-card" key={order._id}>
            <h4>
              {order.side?.toUpperCase()} {order.pair}
              <span style={{ marginLeft: "10px", color: order.side === "buy" ? "#00ff88" : "#ff4444" }}>
                {order.status?.toUpperCase()}
              </span>
            </h4>

            <p><b>User:</b> {order.userId?.email || order.userId?.name || order.userId?._id || "N/A"}</p>
            <p><b>Type:</b> {order.type}</p>
            <p><b>Price:</b> {order.price}</p>
            <p><b>Amount:</b> {order.amount}</p>
            <p><b>Filled:</b> {order.filled}</p>
            <p><b>Remaining:</b> {order.remaining}</p>
            <p><b>Average Price:</b> {order.averagePrice}</p>
            <p><b>Locked:</b> {order.lockedAmount} {order.lockedCoin}</p>
            <p><b>Time:</b> {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</p>

            {["open", "partial"].includes(order.status) && (
              <button className="action-btn reject-btn" onClick={() => cancelAdminOrder(order._id)}>
                Cancel Order
              </button>
            )}
          </div>
        ))
      )}

      <h3>Recent Trades</h3>

      {trades.length === 0 ? (
        <p>No trades found.</p>
      ) : (
        trades.slice(0, 50).map((trade) => (
          <div className="admin-card" key={trade._id}>
            <h4>{trade.pair}</h4>
            <p><b>Price:</b> {trade.price}</p>
            <p><b>Amount:</b> {trade.amount}</p>
            <p><b>Total:</b> {trade.total}</p>
            <p><b>Buyer:</b> {trade.buyerId?.email || trade.buyerId?.name || "N/A"}</p>
            <p><b>Seller:</b> {trade.sellerId?.email || trade.sellerId?.name || "N/A"}</p>
            <p><b>Buyer Fee:</b> {trade.buyerFee}</p>
            <p><b>Seller Fee:</b> {trade.sellerFee}</p>
            <p><b>Time:</b> {trade.createdAt ? new Date(trade.createdAt).toLocaleString() : "N/A"}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default AdminSpotTrading;