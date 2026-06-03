import { socket } from "../api";
import { useEffect, useState } from "react";

function OrderBook() {
  const [orders, setOrders] = useState([]);

 const loadOrders = async () => {
  try {
    fetch("https://exalt-exchange-backend.onrender.com/api/orders");
    const data = await res.json();

    const list = Array.isArray(data) ? data : data.orders || [];

    setOrders(list);
  } catch (err) {
    console.log(err);
  }
};

  useEffect(() => {
    loadOrders();
socket.on("orderCreated", () => {
  loadOrders();
});

socket.on("orderMatched", () => {
  loadOrders();
});
    const interval = setInterval(() => {
      loadOrders();
    }, 15000);

    return () => {
  clearInterval(interval);

  socket.off("orderCreated");
  socket.off("orderMatched");
};
  }, []);

  return (
    <div className="orderbook">
      <h2>Live Order Book</h2>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table width="100%">
          <thead>
            <tr>
              <th>Type</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
            <tr
  key={order._id}
  className={`order-book-row ${
    order.type === "buy" ? "buy" : "sell"
  }`}
>
                <td
                  style={{
                    color:
                      order.type === "buy"
                        ? "#00ff99"
                        : "#ff4d6d",
                  }}
                >
                  {order.type.toUpperCase()}
                </td>

                <td>${Number(order.price || 0).toFixed(6)}</td>

<td>{Number(order.amount || 0).toFixed(2)}</td>

<td>{order.status || "open"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OrderBook;