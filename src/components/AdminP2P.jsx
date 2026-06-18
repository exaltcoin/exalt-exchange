
import { useEffect, useState, useRef } from "react";

const API = "https://exalt-exchange-backend.onrender.com";

function AdminP2P() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
 const lastCountRef = useRef(0);
const initializedRef = useRef(false);
const [newOrderCount, setNewOrderCount] = useState(0);
const [soundEnabled, setSoundEnabled] = useState(false);
const playSound = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = 900;
  gain.gain.value = 0.5;

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};
const filteredOrders =
  filter === "all"
    ? orders
    : orders.filter((o) => o.status === filter);
const shortWallet = (wallet) => {
  if (!wallet) return "-";
  return wallet.slice(0, 6) + "..." + wallet.slice(-4);
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

const countryFlags = {
  Afghanistan: "🇦🇫",
  Albania: "🇦🇱",
  Algeria: "🇩🇿",
  Argentina: "🇦🇷",
  Australia: "🇦🇺",
  Austria: "🇦🇹",
  Bahrain: "🇧🇭",
  Bangladesh: "🇧🇩",
  Belgium: "🇧🇪",
  Brazil: "🇧🇷",
  Canada: "🇨🇦",
  China: "🇨🇳",
  Denmark: "🇩🇰",
  Egypt: "🇪🇬",
  France: "🇫🇷",
  Germany: "🇩🇪",
  India: "🇮🇳",
  Indonesia: "🇮🇩",
  Iran: "🇮🇷",
  Iraq: "🇮🇶",
  Italy: "🇮🇹",
  Japan: "🇯🇵",
  Jordan: "🇯🇴",
  Kuwait: "🇰🇼",
  Lebanon: "🇱🇧",
  Malaysia: "🇲🇾",
  Mexico: "🇲🇽",
  Morocco: "🇲🇦",
  Nepal: "🇳🇵",
  Netherlands: "🇳🇱",
  "New Zealand": "🇳🇿",
  Nigeria: "🇳🇬",
  Oman: "🇴🇲",
  Pakistan: "🇵🇰",
  Philippines: "🇵🇭",
  Qatar: "🇶🇦",
  Russia: "🇷🇺",
  "Saudi Arabia": "🇸🇦",
  Singapore: "🇸🇬",
  "South Africa": "🇿🇦",
  "South Korea": "🇰🇷",
  Spain: "🇪🇸",
  "Sri Lanka": "🇱🇰",
  Switzerland: "🇨🇭",
  Thailand: "🇹🇭",
  Turkey: "🇹🇷",
  UAE: "🇦🇪",
  "United Kingdom": "🇬🇧",
  "United States": "🇺🇸",
  Vietnam: "🇻🇳",
};
  const loadOrders = async () => {
    try {
      const response = await fetch(`${API}/api/p2p/admin/all`);
      const data = await response.json();

      if (data.success) {
  setOrders(data.orders);

  if (!initializedRef.current) {
    lastCountRef.current = data.orders.length;
    initializedRef.current = true;
    return;
  }

  if (data.orders.length > lastCountRef.current) {
    console.log("New P2P Order Received");
  if (Notification.permission === "granted") {
  new Notification("New P2P Order", {
    body: "New P2P order received",
  });
}
    setNewOrderCount((prev) => prev + 1);
    alert("🚀 New P2P Order Received");
  }

  lastCountRef.current = data.orders.length;
}
    } catch (error) {
      console.log(error);
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
const totalVolume = orders.reduce((sum, order) => {
  return sum + Number(order.amount || 0);
}, 0);
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel">
    <div className="live-alert">
🔥 Real-Time Exchange Monitoring Enabled
</div>    
<h2>Admin P2P Monitoring</h2>

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
</div>
<div className="stat-card">
  <h3>Total Volume</h3>
  <p>{totalVolume} EXALT</p>
</div>
<h3 className="live-status pulse-live">
🟢 Live P2P Monitoring Active
</h3>
<div className="live-clock">
  {new Date().toLocaleTimeString()}
</div>
<div className="activity-feed activity-box">
  <h3>Recent P2P Activity</h3>

  {orders.slice(0, 5).map((order) => (
    <div className="activity-item" key={order._id}>
    <span
  className={
    order.type === "buy"
      ? "buy-signal"
      : "sell-signal"
  }
>
  {order.type?.toUpperCase()} {order.asset}
</span>
      <strong>{order.status}</strong>
      <small>{shortWallet(order.walletAddress)}</small>
    </div>
  ))}
</div>
<button
  className="buy-btn"
 onClick={() => {
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      alert("Notification enabled");
    }
  });

  setSoundEnabled(true);
}}
>
  Enable Sound
</button>
<div className="filter-row">
  <button className="active" onClick={() => setFilter("all")}>
  All
</button>
  <button onClick={() => setFilter("open")}>Open</button>
  <button onClick={() => setFilter("matched")}>In Trade</button>
  <button onClick={() => setFilter("paid")}>Paid</button>
  <button onClick={() => setFilter("released")}>Completed</button>
</div>
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
          {filteredOrders.map((order) => (
            <tr key={order._id}>
  <td>
    <span className={order.type === "buy" ? "buy-signal" : "sell-signal"}>
      {order.type?.toUpperCase()}
    </span>
  </td>

  <td>{order.asset}</td>

  <td>
    {(countryFlags[order.country] || "🌍")} {order.country || "Global"}
  </td>

  <td>
    {order.price || "-"} {order.fiat || "USD"}
  </td>

  <td>{order.amount}</td>

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
             <td>{shortWallet(order.walletAddress)}</td>

              <td>
                {order.status === "paid" && (
                  <button
                    className="release-btn"
                    onClick={() => releaseOrder(order._id)}
                  >
                    Release
                  </button>
                )}

                {order.status === "open" && (
                  <button
                    className="cancel-btn"
                    onClick={() => cancelOrder(order._id)}
                  >
                    Cancel
                  </button>
                )}

                {order.status === "matched" && (
                  <button
                    className="cancel-btn"
                    onClick={() => cancelOrder(order._id)}
                  >
                    Cancel
                  </button>
                )}

                {order.status === "released" && (
                 <span className="completed-badge">
               Completed
               </span>
                )}

                {order.status === "cancelled" && (
                  <span className="cancelled-badge">
                     Cancelled
                   </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminP2P;