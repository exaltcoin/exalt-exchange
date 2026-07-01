import { socket } from "../api";
import { useEffect, useMemo, useState } from "react";

function OrderBook({ coin }) {
  const API_BASE =
    import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedPair = `${coin?.baseToken?.symbol || "EXALT"}USDT`;

  const loadOrders = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/orders`);
      const data = await res.json();

      const list = Array.isArray(data) ? data : data.orders || [];
      setOrders(list);
    } catch (error) {
      console.log("OrderBook load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const refreshOrders = () => loadOrders();

    socket.on("orderCreated", refreshOrders);
    socket.on("orderMatched", refreshOrders);
    socket.on("newOrder", refreshOrders);

    const interval = setInterval(loadOrders, 15000);

    return () => {
      clearInterval(interval);
      socket.off("orderCreated", refreshOrders);
      socket.off("orderMatched", refreshOrders);
      socket.off("newOrder", refreshOrders);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!order?.pair) return true;
      return String(order.pair).toUpperCase() === selectedPair.toUpperCase();
    });
  }, [orders, selectedPair]);

  const buyOrders = useMemo(() => {
    return filteredOrders
      .filter((order) => String(order.type).toLowerCase() === "buy")
      .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
      .slice(0, 10);
  }, [filteredOrders]);

  const sellOrders = useMemo(() => {
    return filteredOrders
      .filter((order) => String(order.type).toLowerCase() === "sell")
      .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
      .slice(0, 10);
  }, [filteredOrders]);

  const bestBid = Number(buyOrders[0]?.price || 0);
  const bestAsk = Number(sellOrders[0]?.price || 0);
  const spread = bestBid && bestAsk ? bestAsk - bestBid : 0;

  const renderRow = (order, side) => (
    <tr
      key={order._id || `${side}-${order.price}-${order.amount}-${Math.random()}`}
      className={`order-book-row ${side}`}
    >
      <td>{side === "buy" ? "BUY" : "SELL"}</td>
      <td>${Number(order.price || 0).toFixed(6)}</td>
      <td>{Number(order.amount || 0).toFixed(4)}</td>
      <td>{order.status || "open"}</td>
    </tr>
  );

  return (
    <div className="orderbook-card">
      <div className="panel-header">
        <h2 className="orderbook-title">Live Order Book</h2>
        <span>{selectedPair}</span>
      </div>

      <div className="orderbook-spread">
        <div>
          <small>Best Bid</small>
          <strong className="green-text">
            ${bestBid ? bestBid.toFixed(6) : "0.000000"}
          </strong>
        </div>

        <div>
          <small>Spread</small>
          <strong>${spread ? spread.toFixed(6) : "0.000000"}</strong>
        </div>

        <div>
          <small>Best Ask</small>
          <strong className="red-text">
            ${bestAsk ? bestAsk.toFixed(6) : "0.000000"}
          </strong>
        </div>
      </div>

      {loading && <p>Loading order book...</p>}

      {!loading && filteredOrders.length === 0 ? (
        <p>No orders found for this pair.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Side</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {sellOrders.map((order) => renderRow(order, "sell"))}

            <tr className="orderbook-mid-row">
              <td colSpan="4">
                {bestBid && bestAsk
                  ? `Mid: $${((bestBid + bestAsk) / 2).toFixed(6)}`
                  : "Waiting for market orders"}
              </td>
            </tr>

            {buyOrders.map((order) => renderRow(order, "buy"))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OrderBook;