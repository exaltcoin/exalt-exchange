import React, { useState } from "react";

export default function MobileTrade() {
  const [type, setType] = useState("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");

  const openPancake = () => {
    window.open(
      "https://pancakeswap.finance/swap?inputCurrency=0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78&outputCurrency=BNB&chain=bsc",
      "_blank"
    );
  };

  return (
    <div className="mobile-page">
      <div className="mobile-card">
        <h2>Spot Trading</h2>
        <p>EXALT / USDT</p>

        <div className="mobile-price-box">
          <h1>$0.000046</h1>
          <span className="green-text">+0.00%</span>
        </div>
      </div>

      <div className="mobile-card">
        <h3>Place Real Order</h3>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="buy">BUY Order</option>
          <option value="sell">SELL Order</option>
        </select>

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button
          className={type === "buy" ? "mobile-buy-btn" : "mobile-sell-btn"}
          onClick={openPancake}
        >
          {type === "buy" ? "Buy EXALT" : "Sell EXALT"}
        </button>
      </div>

      <div className="mobile-card">
        <h3>Live Order Book</h3>

        <div className="mobile-order-row head">
          <span>Type</span>
          <span>Price</span>
          <span>Amount</span>
        </div>

        <div className="mobile-order-row">
          <b className="red-text">SELL</b>
          <span>$5.000000</span>
          <span>30.00</span>
        </div>

        <div className="mobile-order-row">
          <b className="green-text">BUY</b>
          <span>$10.000000</span>
          <span>20.00</span>
        </div>

        <div className="mobile-order-row">
          <b className="green-text">BUY</b>
          <span>$10.000000</span>
          <span>200.00</span>
        </div>
      </div>

      <div className="mobile-card">
        <h3>Coin Info</h3>

        <div className="mobile-info-row">
          <span>Token</span>
          <b>EXALT</b>
        </div>

        <div className="mobile-info-row">
          <span>Contract</span>
          <small>0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78</small>
        </div>

        <button
          className="mobile-secondary-btn"
          onClick={() =>
            navigator.clipboard.writeText(
              "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78"
            )
          }
        >
          Copy Address
        </button>

        <button
          className="mobile-secondary-btn"
          onClick={() =>
            window.open(
              "https://bscscan.com/token/0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78",
              "_blank"
            )
          }
        >
          View on BscScan
        </button>
      </div>
    </div>
  );
}