function OrderBook() {

  const sellOrders = [
    "0.02466 - 12,450 EXALT",
    "0.02465 - 11,250 EXALT",
    "0.02464 - 10,050 EXALT",
    "0.02463 - 8,850 EXALT",
    "0.02462 - 7,650 EXALT",
    "0.02461 - 6,450 EXALT",
  ];

  const buyOrders = [
    "0.02455 - 6,200 EXALT",
    "0.02454 - 8,000 EXALT",
    "0.02453 - 9,800 EXALT",
    "0.02452 - 11,600 EXALT",
    "0.02451 - 13,400 EXALT",
    "0.02450 - 15,200 EXALT",
  ];

  return (
    <div className="panel orderbook">

      <h3>Order Book</h3>

      <div className="sell-orders">
        {sellOrders.map((item, index) => (
          <p key={index} className="order-red">
            {item}
          </p>
        ))}
      </div>

      <div className="market-price">
        0.02456 ↑
      </div>

      <div className="buy-orders">
        {buyOrders.map((item, index) => (
          <p key={index} className="order-green">
            {item}
          </p>
        ))}
      </div>

    </div>
  );
}

export default OrderBook;