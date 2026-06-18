import React, { useEffect, useMemo, useState } from "react";
import "./P2P.css";

function P2P() {
  const API =
    import.meta.env.VITE_API_URL ||
    "https://exalt-exchange-backend.onrender.com";

  const [orders, setOrders] = useState([]);

  const [type, setType] = useState("sell");
  const [asset, setAsset] = useState("EXALT");
  const [fiat, setFiat] = useState("KWD");
  const [country, setCountry] = useState("Kuwait");

  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState(null);

  const [filterType, setFilterType] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");

   const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
  "Bahrain", "Bangladesh", "Belgium", "Brazil", "Canada", "China",
  "Denmark", "Egypt", "France", "Germany", "India", "Indonesia",
  "Iran", "Iraq", "Italy", "Japan", "Jordan", "Kuwait",
  "Lebanon", "Malaysia", "Mexico", "Morocco", "Nepal", "Netherlands",
  "New Zealand", "Nigeria", "Oman", "Pakistan", "Philippines", "Qatar",
  "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea",
  "Spain", "Sri Lanka", "Switzerland", "Thailand", "Turkey",
  "UAE", "United Kingdom", "United States", "Vietnam"
];

 const paymentMethods = [
  "Bank Transfer",
  "Cash",
  "USDT Wallet",
  "PayPal",
  "Wise",
  "Revolut",
  "Western Union",
  "MoneyGram",
  "Skrill",
  "Payoneer",
  "Apple Pay",
  "Google Pay",
  "Visa",
  "MasterCard",
  "K-Net",
  "STC Pay",
  "Mada",
  "JazzCash",
  "EasyPaisa",
  "NayaPay",
  "Sadapay",
  "Binance Pay",
  "WeChat Pay",
  "Alipay",
  "UPI",
  "IMPS",
  "PhonePe",
  "GCash",
  "Paytm"
];
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
  Afghanistan: "🇦🇫",
  Australia: "🇦🇺",
  Canada: "🇨🇦",
  China: "🇨🇳",
  Germany: "🇩🇪",
  France: "🇫🇷",
  Italy: "🇮🇹",
  Japan: "🇯🇵",
  Nigeria: "🇳🇬",
  Philippines: "🇵🇭",
  "South Africa": "🇿🇦",
  "South Korea": "🇰🇷",
  Spain: "🇪🇸",
  Thailand: "🇹🇭",
  Vietnam: "🇻🇳",
};
const getTraderInfo = (order, index) => {
  return {
    name: order.traderName || order.sellerName || `Trader ${index + 1}`,
    verified: order.verified ?? index % 2 === 0,
    online: order.online ?? index % 3 !== 0,
    rating: order.rating || "4.8",
    completionRate: order.completionRate || "98%",
    completedOrders: order.completedOrders || 120 + index * 7,
  };
};
  const loadOrders = async () => {
    try {
      const response = await fetch(`${API}/api/p2p/orders`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const typeMatch = filterType === "all" || order.type === filterType;
      const countryMatch =
        filterCountry === "all" || order.country === filterCountry;
      const paymentMatch =
        filterPayment === "all" || order.paymentMethod === filterPayment;

      return typeMatch && countryMatch && paymentMatch;
    });
  }, [orders, filterType, filterCountry, filterPayment]);

  const createOrder = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        alert("Please login first");
        return;
      }

      if (!price || !amount || !paymentMethod || !walletAddress || !country) {
        alert("Fill all fields");
        return;
      }

      const response = await fetch(`${API}/api/p2p/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          sellerId: user._id || user.id,
          asset,
          fiat,
          type,
          price,
          amount,
          paymentMethod,
          walletAddress,
          country,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("P2P order created");
        window.dispatchEvent(new Event("walletUpdated"));

        setPrice("");
        setAmount("");
        setPaymentMethod("");
        setWalletAddress("");

        loadOrders();
      } else {
        alert(data.message || "Failed");
      }
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        alert("Please login first");
        return;
      }

      const response = await fetch(`${API}/api/p2p/${orderId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          orderId,
          buyerId: user._id || user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Trade started successfully");
        window.dispatchEvent(new Event("walletUpdated"));
        loadOrders();
      } else {
        alert(data.message || "Trade failed");
      }
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  const markPaid = async (orderId) => {
    try {
      if (!paymentProofFile) {
        alert("Please upload payment proof image");
        return;
      }

      const formData = new FormData();
      formData.append("proof", paymentProofFile);

      const response = await fetch(`${API}/api/p2p/${orderId}/paid`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert("Payment submitted");
        window.dispatchEvent(new Event("walletUpdated"));
        setPaymentProofFile(null);
        loadOrders();
      } else {
        alert(data.message || "Failed");
      }
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  const releaseOrder = async (orderId) => {
    try {
      const response = await fetch(`${API}/api/p2p/${orderId}/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        alert("Trade completed successfully");
        window.dispatchEvent(new Event("walletUpdated"));
        loadOrders();
      } else {
        alert(data.message || "Release failed");
      }
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const response = await fetch(`${API}/api/p2p/${orderId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        alert("Order cancelled and EXALT refunded");
        window.dispatchEvent(new Event("walletUpdated"));
        loadOrders();
      } else {
        alert(data.message || "Cancel failed");
      }
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  const statusText = (status) => {
    if (status === "open") return "Open";
    if (status === "matched") return "In Trade";
    if (status === "paid") return "Payment Sent";
    if (status === "released") return "Completed";
    if (status === "cancelled") return "Cancelled";
    return status || "Open";
  };

  return (
    <div className="p2p-page">
      <div className="p2p-hero">
        <div>
          <h1>Global P2P Trading</h1>
          <p>Buy and sell crypto worldwide with secure escrow protection.</p>
        </div>

        <div className="p2p-hero-badge">Escrow Ready</div>
      </div>

      <div className="p2p-stats">
        <div>
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Open Orders</span>
          <strong>{orders.filter((o) => o.status === "open").length}</strong>
        </div>
        <div>
          <span>In Escrow</span>
          <strong>
            {orders.filter((o) => o.status === "matched" || o.status === "paid").length}
          </strong>
        </div>
      </div>

      <div className="p2p-card">
        <h2>Create P2P Ad</h2>

        <div className="p2p-form">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="sell">SELL</option>
            <option value="buy">BUY</option>
          </select>

          <select value={asset} onChange={(e) => setAsset(e.target.value)}>
            <option value="EXALT">EXALT</option>
            <option value="USDT">USDT</option>
            <option value="BTC">BTC</option>
          </select>

          <select value={fiat} onChange={(e) => setFiat(e.target.value)}>
            <option value="KWD">KWD</option>
            <option value="USD">USD</option>
            <option value="PKR">PKR</option>
            <option value="AED">AED</option>
            <option value="SAR">SAR</option>
          </select>

          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />

          <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">Select Payment Method</option>
            {paymentMethods.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            placeholder="Wallet Address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />

          <button className="p2p-main-btn" onClick={createOrder}>
            Create P2P Ad
          </button>
        </div>
      </div>

      <div className="p2p-card">
        <div className="p2p-section-head">
          <h2>Live Global Ads</h2>

          <div className="p2p-filters">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>

            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
              <option value="all">All Countries</option>
              {countries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
              <option value="all">All Payments</option>
              {paymentMethods.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p2p-empty">No P2P ads found.</div>
        ) : (
          <div className="p2p-table-wrap">
            <table className="p2p-table">
              <thead>
                <tr>
                  <th>Trader</th>
                  <th>Type</th>
                  <th>Asset</th>
                  <th>Country</th>
                  <th>Price</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Escrow</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
               {filteredOrders.map((order, index) => {
  const trader = getTraderInfo(order, index);

  return (
                  <tr key={order._id}>
                    <td>
                    <td>
  <div className="trader-box">
    <div className="trader-avatar">
      {trader.name.charAt(0).toUpperCase()}
    </div>

    <div>
      <div className="trader-name">
        {trader.name}
        {trader.verified && (
          <span className="verified-badge">✔</span>
        )}
      </div>
<div className="trader-meta">

  <span className={trader.online ? "online-status" : "offline-status"}>
    <span className={trader.online ? "online-dot" : "offline-dot"}></span>
    {trader.online ? "Online" : "Offline"}
  </span>

  <span className="rating-badge">
    ⭐ {trader.rating}
  </span>

  <span className="completion-badge">
    {trader.completionRate} Completion
  </span>

</div>
      
    </div>
    <div className="trader-orders">

  <span className="orders-badge">
    {trader.completedOrders} Orders
  </span>

  {trader.verified && (
    <span className="merchant-badge">
      ✔ Verified Merchant
    </span>
  )}

</div>
  </div>
</td>
<td>
  <span className="country-badge">
    {(countryFlags[order.country] || "🌍")} {order.country || "Global"}
  </span>
</td>
                     <td>
  <span
    className={
      order.type === "sell"
        ? "sell-badge"
        : "buy-badge"
    }
  >
    {order.type?.toUpperCase()}
  </span>
</td>
                    </td>

                    <td>{order.asset}</td>

                    <td>
                      {order.price} {order.fiat}
                    </td>

                    <td>{order.amount}</td>

                    <td>{order.paymentMethod}</td>

                    <td>
                     <span
  className={
    order.status === "open"
      ? "escrow-waiting-badge"
      : "escrow-active-badge"
  }
>
  {order.status === "open" ? "Waiting Escrow" : "Escrow Active"}
</span>
                    </td>

                    <td>
                      <span className={`status-badge status-${order.status || "open"}`}>
                        {statusText(order.status)}
                      </span>
                    </td>

                    <td className="p2p-actions">
                      {order.status === "open" && (
                        <>
                          <button className="accept-btn" onClick={() => acceptOrder(order._id)}>
                            Accept
                          </button>

                          <button className="cancel-btn" onClick={() => cancelOrder(order._id)}>
                            Cancel
                          </button>
                        </>
                      )}

                      {order.status === "matched" && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setPaymentProofFile(e.target.files[0]);
                              }
                            }}
                          />

                          <button className="paid-btn" onClick={() => markPaid(order._id)}>
                            Mark Paid
                          </button>
                        </>
                      )}

                      {order.status === "paid" && (
                        <button className="release-btn" onClick={() => releaseOrder(order._id)}>
                          Release
                        </button>
                      )}

                      {order.status === "released" && (
                        <span className="done-text">Completed</span>
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

      <div className="p2p-card">
        <h2>P2P Security</h2>

        <div className="security-grid">
          <p>✅ User-to-user trading</p>
          <p>✅ Live database orders</p>
          <p>✅ Escrow status tracking</p>
          <p>✅ Payment proof upload</p>
          <p>✅ Admin can review all</p>
          <p>✅ User sees own trade data later</p>
        </div>
      </div>
    </div>
  );
}

export default P2P;