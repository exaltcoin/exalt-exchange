import React, { useEffect, useState } from "react";
import { socket } from "../api";
import Tradingchart from "./Tradingchart";
import OrderBook from "./OrderBook";
import { ethers } from "ethers";
function Trade() {
  const API = import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);

  const [type, setType] = useState("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [wallet, setWallet] = useState("");
  const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask or Trust Wallet");
    return;
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  setWallet(accounts[0]);
};
const PANCAKE_ROUTER =
  "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const buyExalt = async () => {
  try {
    if (!window.ethereum) {
      alert("Install MetaMask");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    const signer = await provider.getSigner();

    const router = new ethers.Contract(
      PANCAKE_ROUTER,
      [
        "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) external payable"
      ],
      signer
    );

    const path = [
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78"
    ];

    const tx =
      await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
        0,
        path,
        await signer.getAddress(),
        Math.floor(Date.now() / 1000) + 60 * 10,
        {
          value: ethers.parseEther("0.001")
        }
      );

    await tx.wait();

    alert("EXALT Purchased Successfully");

  } catch (err) {
    console.log(err);
    alert("Transaction Failed");
  }
};
const submitOrder = async () =>{
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!price || !amount) {
        alert("Price and amount required");
        return;
      }

      setLoading(true);
      socket.emit("newOrder", {
 pair: `${selectedCoin?.baseToken?.symbol || "BTC"}USDT`,
  price,
  amount,
  type,
});

      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          userId: user._id || user.id || "demo-user",
         pair: `${selectedCoin?.baseToken?.symbol || "BTC"}USDT`,
          type,
          price: Number(price),
          amount: Number(amount),
        }),
      });

      const data = await res.json();
socket.emit("orderCreated", data);
      if (!data.success) {
        alert(data.message || "Order failed");
        return;
      }

      alert(`${type.toUpperCase()} order submitted successfully`);
      setPrice("");
      setAmount("");
    } catch (error) {
      console.log(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
 const loadMarkets = () => {
  fetch(`${API}/api/market/live`)
    .then((res) => res.json())
    .then((response) => {
      const pairs = response?.data?.pairs || response?.data || [];

      if (Array.isArray(pairs) && pairs.length > 0) {
        setCoins(pairs);

        setSelectedCoin((prev) => {
          if (prev) {
            const stillExists = pairs.find(
              (p) => p.baseToken?.symbol === prev.baseToken?.symbol
            );
            return stillExists || prev;
          }

          return pairs[0];
        });
      }
    })
    .catch((err) => console.log(err));
};

  loadMarkets();

  const interval = setInterval(loadMarkets, 30000);

  return () => clearInterval(interval);
}, []);
return (
  <div className="trade-layout">
    <div className="mobile-spot-tabs">
      <span>Convert</span>
      <span className="active">Spot</span>
      <span>P2P</span>
      <span>Alpha</span>
    </div>

    <div className="trade-sidebar">
      <h2>Live Markets</h2>

      <input
        type="text"
        placeholder="Search coin..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="market-search"
      />

     {Array.isArray(coins) &&
  coins
    .filter((coin) =>
      (coin.baseToken?.symbol || coin.symbol || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .map((coin, index) => (
      <div
        key={coin.pairAddress || index}
        className={`coin-item ${
          selectedCoin?.baseToken?.symbol === coin.baseToken?.symbol
            ? "active-coin"
            : ""
        }`}
        onClick={() => setSelectedCoin(coin)}
      >
        <div>
          <strong>{coin.baseToken?.symbol || coin.symbol || "COIN"}</strong>
          <p>${Number(coin.priceUsd || coin.price || 0).toFixed(6)}</p>
        </div>

        <span
          className={
            Number(coin.priceChange?.h24 || 0) >= 0
              ? "green-text"
              : "red-text"
          }
        >
          {Number(coin.priceChange?.h24 || 0).toFixed(2)}%
        </span>
      </div>
    ))}
    </div>

    <div className="trade-main">
      <div className="mobile-trade-grid">
        <div className="spot-order-panel">
          <h2 className="spot-title">Place Real Order</h2>

          <div className="spot-form">
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
              onClick={() => {
                if (type === "buy") {
                  buyExalt();
                } else {
                  window.open(
                    "https://pancakeswap.finance/swap?inputCurrency=0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78&outputCurrency=BNB&chain=bsc",
                    "_blank"
                  );
                }
              }}
              className={`trade-btn ${type === "buy" ? "buy-btn" : "sell-btn"}`}
            >
              {type === "buy" ? "Buy EXALT" : "Sell EXALT"}
            </button>
          </div>
        </div>

        <div className="mobile-orderbook-box">
          <OrderBook coin={selectedCoin} />
        </div>
      </div>

      <div className="coin-details-box">
        <h3 className="coin-info-title">Coin Info</h3>

        <div className="coin-info-row">
          <span className="coin-label">Token</span>
          <span className="coin-value">
            {selectedCoin?.baseToken?.symbol || "EXALT"}
          </span>
        </div>

        <div className="coin-info-row">
          <span className="coin-label">Contract</span>
          <span className="coin-value">
            {selectedCoin?.baseToken?.address ||
              "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78"}
          </span>
        </div>
      </div>

      {selectedCoin && (
        <div className="mobile-chart-box">
          <Tradingchart
            selectedCoin={{
              ...selectedCoin,
              chartSymbol: `${selectedCoin?.baseToken?.symbol || "BTC"}USDT`,
            }}
          />
        </div>
      )}
    </div>
  </div>
);
}

export default Trade;