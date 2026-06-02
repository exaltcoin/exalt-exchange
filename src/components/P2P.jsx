import React, { useEffect, useState } from "react";

function P2P() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [orders, setOrders] = useState([]);

  const [type, setType] = useState("sell");
  const [asset, setAsset] = useState("EXALT");
  const [fiat, setFiat] = useState("KWD");

  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
const [paymentProof, setPaymentProof] = useState("");
const [paymentProofFile, setPaymentProofFile] = useState(null);
  const loadOrders = async () => {
    try {
      const response = await fetch(`${API}/api/p2p/orders`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const createOrder = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        alert("Please login first");
        return;
      }

      if (
        !price ||
        !amount ||
        !paymentMethod ||
        !walletAddress
      ) {
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
      setPaymentProof("");
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
  return (
    <div className="panel">
      <h2>P2P Trading</h2>

      <p>
        Buy and sell EXALT directly with users.
      </p>

      <div
        className="panel"
        style={{ marginTop: "25px" }}
      >
        <h2>Create P2P Order</h2>

        <div className="listing-form">
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
          >
            <option value="sell">
              SELL EXALT
            </option>

            <option value="buy">
              BUY EXALT
            </option>
          </select>

          <select
            value={asset}
            onChange={(e) =>
              setAsset(e.target.value)
            }
          >
            <option value="EXALT">
              EXALT
            </option>

            <option value="USDT">
              USDT
            </option>

            <option value="BTC">
              BTC
            </option>
          </select>

          <select
            value={fiat}
            onChange={(e) =>
              setFiat(e.target.value)
            }
          >
            <option value="KWD">
              KWD
            </option>

            <option value="USD">
              USD
            </option>

            <option value="PKR">
              PKR
            </option>
          </select>

          <input
            placeholder="Price"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
          />

          <input
            placeholder="Amount"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
          />

          <input
            placeholder="Payment Method"
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(
                e.target.value
              )
            }
          />

          <input
            placeholder="Wallet Address"
            value={walletAddress}
            onChange={(e) =>
              setWalletAddress(
                e.target.value
              )
            }
          />

          <button
            className="buy-btn"
            onClick={createOrder}
          >
            Create P2P Order
          </button>
        </div>
      </div>

      <div
        className="panel"
        style={{ marginTop: "25px" }}
      >
        <h2>Live P2P Orders</h2>

        {orders.length === 0 ? (
          <p>No P2P orders found.</p>
        ) : (
          <table width="100%">
            <thead>
              <tr>
                <th>Type</th>
                <th>Asset</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td
                    style={{
                      color:
                        order.type ===
                        "sell"
                          ? "#ff4d6d"
                          : "#00ff99",
                    }}
                  >
                    {order.type.toUpperCase()}
                  </td>

                  <td>
                    {order.asset}
                  </td>

                  <td>
                    {order.price}{" "}
                    {order.fiat}
                  </td>

                  <td>
                    {order.amount}
                  </td>

                  <td>
                    {
                      order.paymentMethod
                    }
                  </td>

                  <td>

 {order.status === "paid" && (
  <button
    className="buy-btn"
    onClick={() => releaseOrder(order._id)}
  >
    Release
  </button>
)}
{order.status === "open" && (
  <button
    className="buy-btn"
    onClick={() => cancelOrder(order._id)}
  >
    Cancel
  </button>
)}
  {order.status === "matched" && (
    <span style={{ color: "#f7b733", fontWeight: "700" }}>
      In Trade
    </span>
  )}

  {order.status === "released" && (
    <span style={{ color: "#00c5ff", fontWeight: "700" }}>
      Completed
    </span>
  )}

</td>

                  <td>
             {order.status === "open" && (
  <button
    className="buy-btn"
    onClick={() => acceptOrder(order._id)}
  >
    Accept
  </button>
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

    <button
      className="buy-btn"
      onClick={() => markPaid(order._id)}
    >
      Mark Paid
    </button>
  </>
)}

{order.status === "paid" && (
  <span style={{ color: "#4dff88", fontWeight: "700" }}>
    Paid
  </span>
)}

{order.status === "released" && (
  <span style={{ color: "#00e5ff", fontWeight: "700" }}>
    Completed
  </span>
)}      
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div
        className="panel"
        style={{ marginTop: "25px" }}
      >
        <h2>P2P Security</h2>

        <p>
          ✅ Real user-to-user
          trading
        </p>

        <p>
          ✅ Live database orders
        </p>

        <p>
          ✅ Real-time order book
        </p>

        <p>
          ✅ Escrow system ready
        </p>

        <p>
          ✅ Manual admin approval
        </p>

        <p>
          ✅ Payment proof system
          coming next
        </p>
      </div>
    </div>
  );
}

export default P2P;