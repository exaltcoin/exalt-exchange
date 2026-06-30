import { useEffect, useMemo, useState } from "react";
import { socket } from "../api";

function Orders() {
  const API =
    import.meta.env.VITE_API_URL ||
    "https://exalt-exchange-backend.onrender.com";

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("OPEN");
  const [sideFilter, setSideFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const safeText = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    return value;
  };

  const getPair = (order) =>
    String(order.pair || order.symbol || "EXALTUSDT").toUpperCase();

  const getSide = (order) =>
    String(order.type || order.side || "buy").toUpperCase();

  const getStatus = (order) =>
    String(order.status || "open").toUpperCase();

  const getPrice = (order) => Number(order.price || 0);

  const getAmount = (order) => Number(order.amount || order.quantity || 0);

  const getFilled = (order) => {
    const filled = Number(order.filled || order.filledAmount || 0);
    const amount = getAmount(order);

    if (!amount) return 0;
    return Math.min(100, (filled / amount) * 100);
  };

  const formatPair = (pair) => {
    if (pair.includes("/")) return pair;
    return pair.replace("USDT", "/USDT");
  };

  const loadOrders = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setOrders([]);
        return;
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const res = await fetch(`${API}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.orders || data.data || [];

      const myOrders = Array.isArray(list)
        ? list.filter((order) => {
            const orderUser =
              order.userId?._id || order.userId || order.user?._id || order.user;

            if (!orderUser) return true;

            return String(orderUser) === String(user?._id || user?.id);
          })
        : [];

      setOrders(myOrders);
    } catch (error) {
      console.log("Orders load error:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id) => {
    try {
      if (!id) return alert("Order id missing");

      const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
      if (!confirmCancel) return;

      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/api/orders/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        alert("Order cancelled successfully");
        loadOrders();
        socket.emit("orderCancelled", { id });
      } else {
        alert(data.message || "Cancel failed");
      }
    } catch (error) {
      console.log("Cancel order error:", error);
      alert("Cancel order failed");
    }
  };

  useEffect(() => {
    loadOrders();

    const refreshOrders = () => loadOrders();

    socket.on("orderCreated", refreshOrders);
    socket.on("orderMatched", refreshOrders);
    socket.on("orderUpdated", refreshOrders);
    socket.on("orderCancelled", refreshOrders);

    const interval = setInterval(loadOrders, 15000);

    return () => {
      clearInterval(interval);
      socket.off("orderCreated", refreshOrders);
      socket.off("orderMatched", refreshOrders);
      socket.off("orderUpdated", refreshOrders);
      socket.off("orderCancelled", refreshOrders);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const pair = getPair(order);
      const side = getSide(order);
      const status = getStatus(order);
      const q = search.toLowerCase();

      const isOpen =
        status === "OPEN" ||
        status === "PENDING" ||
        status === "PARTIAL" ||
        status === "NEW";

      const isHistory = !isOpen;

      const matchTab =
        activeTab === "ALL" ||
        (activeTab === "OPEN" && isOpen) ||
        (activeTab === "HISTORY" && isHistory) ||
        status.includes(activeTab);

      const matchSide = sideFilter === "ALL" || side === sideFilter;

      const matchSearch =
        !q ||
        pair.toLowerCase().includes(q) ||
        side.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q);

      return matchTab && matchSide && matchSearch;
    });
  }, [orders, activeTab, sideFilter, search]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      open: orders.filter((o) => {
        const s = getStatus(o);
        return s === "OPEN" || s === "PENDING" || s === "PARTIAL" || s === "NEW";
      }).length,
      filled: orders.filter((o) => getStatus(o).includes("FILLED")).length,
      cancelled: orders.filter((o) => getStatus(o).includes("CANCEL")).length,
    };
  }, [orders]);

  return (
    <div className="panel orders-page">
      <div className="orders-header">
        <div>
          <h2>Orders</h2>
          <p>Manage open orders, filled orders and trading history.</p>
        </div>

        <button className="action-btn yellow-btn" onClick={loadOrders}>
          Refresh
        </button>
      </div>

      <div className="orders-stats">
        <div>
          <strong>{stats.total}</strong>
          <span>Total Orders</span>
        </div>

        <div>
          <strong>{stats.open}</strong>
          <span>Open</span>
        </div>

        <div>
          <strong>{stats.filled}</strong>
          <span>Filled</span>
        </div>

        <div>
          <strong>{stats.cancelled}</strong>
          <span>Cancelled</span>
        </div>
      </div>

      <div className="orders-tabs">
        {["OPEN", "HISTORY", "FILLED", "CANCELLED", "ALL"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "tab active-tab" : "tab"}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="orders-tools">
        <input
          className="web3-input"
          placeholder="Search pair, side or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="web3-input"
          value={sideFilter}
          onChange={(e) => setSideFilter(e.target.value)}
        >
          <option value="ALL">All Sides</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Side</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Filled</th>
                <th>Status</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order, index) => {
                const pair = getPair(order);
                const side = getSide(order);
                const status = getStatus(order);
                const filled = getFilled(order);

                const canCancel =
                  status === "OPEN" ||
                  status === "PENDING" ||
                  status === "PARTIAL" ||
                  status === "NEW";

                return (
                  <tr
                    key={order._id || index}
                    className={`order-book-row ${side === "BUY" ? "buy" : "sell"}`}
                  >
                    <td>
                      <strong>{formatPair(pair)}</strong>
                    </td>

                    <td>
                      <span className={side === "BUY" ? "order-side-buy" : "order-side-sell"}>
                        {side}
                      </span>
                    </td>

                    <td>${getPrice(order).toFixed(6)}</td>

                    <td>{getAmount(order).toLocaleString()}</td>

                    <td>
                      <div className="order-filled-box">
                        <div>
                          <span style={{ width: `${filled}%` }} />
                        </div>
                        <small>{filled.toFixed(1)}%</small>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`order-status ${status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {safeText(status)}
                      </span>
                    </td>

                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "N/A"}
                    </td>

                    <td>
                      {canCancel ? (
                        <button
                          className="action-btn reject-btn"
                          onClick={() => cancelOrder(order._id)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="green-text">Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Orders;