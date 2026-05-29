function Orders() {
  const orders = [
    { pair: "EXALT/USDT", type: "Buy", price: "$0.02456", amount: "12,450 EXALT", status: "Open" },
    { pair: "BNB/USDT", type: "Buy", price: "$662.91", amount: "0.25 BNB", status: "Filled" },
    { pair: "BTC/USDT", type: "Sell", price: "$81,618", amount: "0.001 BTC", status: "Pending" },
  ];

  return (
    <div className="panel">
      <h2>Orders</h2>
      {orders.map((order, index) => (
       <div
  className={`admin-card order-book-row ${order.type === "Buy" ? "buy" : "sell"}`}
  key={index}
>
          <h3>{order.pair}</h3>
          <p>Type: {order.type}</p>
          <p>Price: {order.price}</p>
          <p>Amount: {order.amount}</p>
          <p>Status: {order.status}</p>
        </div>
      ))}
    </div>
  );
}

export default Orders;