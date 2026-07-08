import { useEffect, useMemo, useState } from "react";
import { socket } from "../api";
import API_BASE_URL from "../api";

function OrderBook({ coin, bids: propBids = [], asks: propAsks = [] }) {
  const API_BASE =
    API_BASE_URL || "https://exalt-real-backend-6b6v.onrender.com";

  const API = API_BASE.endsWith("/api")
    ? API_BASE.replace("/api", "")
    : API_BASE;

  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedSymbol = coin?.baseToken?.symbol || "EXALT";
  const selectedPair = `${selectedSymbol}/USDT`;
  const encodedPair = encodeURIComponent(selectedPair);
  const marketPrice = Number(coin?.priceUsd || coin?.price || 0);

  const formatPrice = (value) => {
    const num = Number(value || 0);
    if (num === 0) return "0.000000";
    if (num < 0.000001) return num.toFixed(10);
    if (num < 0.01) return num.toFixed(8);
    return num.toFixed(6);
  };

  const loadOrderBook = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/trades/orderbook/${encodedPair}`);
      const data = await res.json();

      if (data.success) {
        setBids(data.bids || []);
        setAsks(data.asks || []);
      } else {
        setBids([]);
        setAsks([]);
      }
    } catch (error) {
      console.log("OrderBook load error:", error);
      setBids([]);
      setAsks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderBook();

    const refreshOrders = () => loadOrderBook();

    socket.on("orderCreated", refreshOrders);
    socket.on("orderMatched", refreshOrders);
    socket.on("newOrder", refreshOrders);

    const interval = setInterval(loadOrderBook, 15000);

    return () => {
      clearInterval(interval);
      socket.off("orderCreated", refreshOrders);
      socket.off("orderMatched", refreshOrders);
      socket.off("newOrder", refreshOrders);
    };
  }, [encodedPair]);

  const sellOrders = useMemo(() => {
  const list = propAsks.length ? propAsks : asks;
  return [...list]
    .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    .slice(0, 10);
}, [asks, propAsks]);

 const buyOrders = useMemo(() => {
  const list = propBids.length ? propBids : bids;
  return [...list]
    .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    .slice(0, 10);
}, [bids, propBids]);

  const bestBid = Number(buyOrders[0]?.price || marketPrice);
  const bestAsk = Number(sellOrders[0]?.price || marketPrice);
  const spread = bestBid && bestAsk ? Math.abs(bestAsk - bestBid) : 0;
const maxOrderTotal = useMemo(() => {
  const totals = [...buyOrders, ...sellOrders].map((order) => {
    const amount = Number(order.remaining || order.amount || 0);
    const price = Number(order.price || 0);
    return amount * price;
  });

  return Math.max(...totals, 1);
}, [buyOrders, sellOrders]);
  const renderRow = (order, side) => {
  const amount = Number(order.remaining || order.amount || 0);
  const total = amount * Number(order.price || 0);
const depthPercent = Math.min(100, (total / maxOrderTotal) * 100);
  return (
    <tr
  key={order._id || `${side}-${order.price}-${order.amount}`}
  className={`order-book-row ${side}`}
  style={{
    background:
      side === "buy"
        ? `linear-gradient(90deg, rgba(0,200,83,.16) ${depthPercent}%, transparent ${depthPercent}%)`
        : `linear-gradient(90deg, rgba(255,68,68,.16) ${depthPercent}%, transparent ${depthPercent}%)`,
  }}
>
      <td className={side === "buy" ? "buy-price" : "sell-price"}>
        ${formatPrice(order.price)}
      </td>

    <td>
  {amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}
</td>

    <td>
  $
  {total.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</td>
    </tr>
  );
};

  return (
    <div className="orderbook-card">
      <div className="panel-header">
        <h2 className="orderbook-title">
  Live Order Book
  <span className="live-dot"></span>
</h2>
        <span>{selectedPair}</span>
      </div>

      <div className="orderbook-spread">
        <div>
          <small>Best Bid</small>
          <strong className="green-text">${formatPrice(bestBid)}</strong>
        </div>

        <div>
          <small>Spread</small>
          <strong>${formatPrice(spread)}</strong>
        </div>

        <div>
          <small>Best Ask</small>
          <strong className="red-text">${formatPrice(bestAsk)}</strong>
        </div>
      </div>

      {loading && <p>Loading order book...</p>}

      {!loading && buyOrders.length === 0 && sellOrders.length === 0 ? (
        <p>No live orders yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
  <th>Price (USDT)</th>
  <th>Amount</th>
  <th>Total</th>
</tr>
          </thead>

          <tbody>
            {sellOrders.map((order) => renderRow(order, "sell"))}

            <tr className="orderbook-mid-row">
              <td colSpan="3">Mid: ${formatPrice((bestBid + bestAsk) / 2)}</td>
            </tr>

            {buyOrders.map((order) => renderRow(order, "buy"))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OrderBook;