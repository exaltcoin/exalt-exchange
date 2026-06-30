import { useEffect, useMemo, useRef, useState } from "react";

function AdminP2P() {
  const API =
    import.meta.env.VITE_API_URL ||
    "https://exalt-exchange-backend.onrender.com";

  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const lastCountRef = useRef(0);
  const initializedRef = useRef(false);

  const countryFlags = {
    Kuwait: "🇰🇼",
    Pakistan: "🇵🇰",
    UAE: "🇦🇪",
    "Saudi Arabia": "🇸🇦",
    Oman: "🇴🇲",
    Qatar: "🇶🇦",
    Bahrain: "🇧🇭",
    India: "🇮🇳",
    Turkey: "🇹🇷",
    "United Kingdom": "🇬🇧",
    "United States": "🇺🇸",
    Canada: "🇨🇦",
    Australia: "🇦🇺",
    Germany: "🇩🇪",
    France: "🇫🇷",
    China: "🇨🇳",
    Japan: "🇯🇵",
    Nigeria: "🇳🇬",
    Philippines: "🇵🇭",
    Vietnam: "🇻🇳",
  };

  const shortWallet = (wallet) => {
    if (!wallet) return "-";
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const statusText = (status) => {
    if (status === "open") return "Open";
    if (status === "matched") return "In Trade";
    if (status === "paid") return "Payment Sent";
    if (status === "released") return "Completed";
    if (status === "cancelled") return "Cancelled";
    if (status === "disputed") return "Disputed";
    return status || "Open";
  };

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 900;
      gain.gain.value = 0.35;

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (error) {
      console.log("Sound error:", error);
    }
  };

  const notifyNewOrder = () => {
    setNewOrderCount((prev) => prev + 1);

    if (soundEnabled) playSound();

    if (Notification.permission === "granted") {
      new Notification("New P2P Order", {
        body: "New P2P order received",
      });
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API}/api/p2p/admin/all`);
      const data = await response.json();

      if (data.success) {
        const list = Array.isArray(data.orders) ? data.orders : [];
        setOrders(list);

        if (!initializedRef.current) {
          lastCountRef.current = list.length;
          initializedRef.current = true;
          return;
        }

        if (list.length > lastCountRef.current) {
          notifyNewOrder();
        }

        lastCountRef.current = list.length;
      }
    } catch (error) {
      console.log("Admin P2P load error:", error);
    }
  };

  const releaseOrder = async (id) => {
    try {
      const response = await fetch(`${API}/api/p2p/${id}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      alert(data.message || "Trade released");
      loadOrders();
    } catch (error) {
      console.log(error);
      alert("Release failed");
    }
  };

  const cancelOrder = async (id) => {
    try {
      const confirmCancel = window.confirm("Cancel this P2P order?");
      if (!confirmCancel) return;

      const response = await fetch(`${API}/api/p2p/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      alert(data.message || "Order cancelled");
      loadOrders();
    } catch (error) {
      console.log(error);
      alert("Cancel failed");
    }
  };

  const copyWallet = async (wallet) => {
    if (!wallet) return alert("Wallet not found");

    try {
      await navigator.clipboard.writeText(wallet);
      alert("Wallet copied");
    } catch {
      alert("Copy failed");
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const filteredOrders = useMemo(() => {
    return filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const totalVolume = useMemo(() => {
    return orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  }, [orders]);

  return (
    <div className="panel admin-p2p-page">
      <div className="live-alert">🔥 Real-Time P2P Monitoring Enabled</div>

      <div className="orders-header">
        <div>
          <h2>Admin P2P Monitoring</h2>
          <p>Monitor global P2P orders, escrow, payment proofs and releases.</p>
        </div>

        <button className="action-btn yellow-btn" onClick={loadOrders}>
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>{orders.length}</p>
        </div>

        <div className="stat-card">
          <h3>Open</h3>
          <p>{orders.filter((o) => o.status === "open").length}</p>
        </div>

        <div className="stat-card">
          <h3>In Trade</h3>
          <p>{orders.filter((o) => o.status === "matched").length}</p>
        </div>

        <div className="stat-card">
          <h3>Paid</h3>
          <p>{orders.filter((o) => o.status === "paid").length}</p>
        </div>

        <div className="stat-card">
          <h3>Completed</h3>
          <p>{orders.filter((o) => o.status === "released").length}</p>
        </div>

        <div className="stat-card">
          <h3>Disputed</h3>
          <p>{orders.filter((o) => o.status === "disputed").length}</p>
        </div>

        <div className="stat-card">
          <h3>Total Volume</h3>
          <p>{totalVolume.toLocaleString()} EXALT</p>
        </div>

        <div className="stat-card">
          <h3>New Alerts</h3>
          <p>{newOrderCount}</p>
        </div>
      </div>

      <h3 className="live-status pulse-live">🟢 Live P2P Monitoring Active</h3>

      <div className="activity-feed activity-box">
        <h3>Recent P2P Activity</h3>

        {orders.slice(0, 5).map((order) => (
          <div className="activity-item" key={order._id}>
            <span className={order.type === "buy" ? "buy-signal" : "sell-signal"}>
              {order.type?.toUpperCase()} {order.asset}
            </span>
            <strong>{statusText(order.status)}</strong>
            <small>{shortWallet(order.walletAddress)}</small>
          </div>
        ))}
      </div>

      <button
        className="buy-btn"
        onClick={() => {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") alert("Notification enabled");
          });

          setSoundEnabled(true);
        }}
      >
        Enable Sound / Notification
      </button>

      <div className="filter-row">
        {["all", "open", "matched", "paid", "released", "cancelled", "disputed"].map(
          (item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item === "all" ? "All" : statusText(item)}
            </button>
          )
        )}
      </div>

      <div className="table-wrapper">
        <table className="markets-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Asset</th>
              <th>Country</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Proof</th>
              <th>Wallet</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="10">No P2P orders found.</td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <span
                      className={
                        order.type === "buy" ? "buy-signal" : "sell-signal"
                      }
                    >
                      {order.type?.toUpperCase()}
                    </span>
                  </td>

                  <td>{order.asset || "-"}</td>

                  <td>
                    {countryFlags[order.country] || "🌍"}{" "}
                    {order.country || "Global"}
                  </td>

                  <td>
                    {order.price || "-"} {order.fiat || "USD"}
                  </td>

                  <td>{order.amount || "-"}</td>

                  <td>{order.paymentMethod || "-"}</td>

                  <td>
                    <span className={`status-badge status-${order.status || "open"}`}>
                      {statusText(order.status)}
                    </span>
                  </td>

                  <td>
                    {order.paymentProof ? (
                      <a
                        href={order.paymentProof}
                        target="_blank"
                        rel="noreferrer"
                        className="proof-btn"
                      >
                        View Proof
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span>{shortWallet(order.walletAddress)}</span>
                      <button
                        className="copy-btn"
                        onClick={() => copyWallet(order.walletAddress)}
                      >
                        Copy
                      </button>
                    </div>
                  </td>

                  <td>
                    {(order.status === "open" || order.status === "matched") && (
                      <button
                        className="cancel-btn"
                        onClick={() => cancelOrder(order._id)}
                      >
                        Cancel
                      </button>
                    )}

                    {order.status === "paid" && (
                      <button
                        className="release-btn"
                        onClick={() => releaseOrder(order._id)}
                      >
                        Release
                      </button>
                    )}

                    {order.status === "released" && (
                      <span className="completed-badge">Completed</span>
                    )}

                    {order.status === "cancelled" && (
                      <span className="cancelled-badge">Cancelled</span>
                    )}

                    {order.status === "disputed" && (
                      <span className="disputed-badge">Disputed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminP2P;