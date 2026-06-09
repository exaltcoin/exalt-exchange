import React, { useEffect, useState } from "react";
import TradingChart from "../components/Tradingchart";

export default function MobileTrade() {
  const API =
    import.meta.env.VITE_API_URL ||
    "https://exalt-exchange-backend.onrender.com";

  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [type, setType] = useState("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const loadCoins = async () => {
      try {
        const res = await fetch(`${API}/api/coins`);
        const data = await res.json();

        const list = Array.isArray(data)
          ? data
          : data.coins || data.data || data.pairs || [];

        const formatted = list.map((coin) => {
          const symbol =
            coin.symbol ||
            coin.baseToken?.symbol ||
            coin.pairSymbol ||
            "COIN";

          return {
            ...coin,
            symbol,
            price: coin.priceUsd || coin.price || coin.lastPrice || 0,
            change: coin.priceChange?.h24 || coin.change || coin.change24h || 0,
            address: coin.address || coin.baseToken?.address || "",
            chartSymbol:
              symbol === "EXALT" ? "BTCUSDT" : `${symbol}USDT`,
          };
        });

        setCoins(formatted);
        setSelectedCoin(formatted[0] || null);
      } catch (err) {
        console.log(err);
        setCoins([]);
        setSelectedCoin(null);
      }
    };

    loadCoins();
  }, []);

  const openPancake = () => {
    const token =
      selectedCoin?.address ||
      "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

    window.open(
      `https://pancakeswap.finance/swap?inputCurrency=${token}&outputCurrency=BNB&chain=bsc`,
      "_blank"
    );
  };

  return (
    <div className="mobile-page">
      <div className="mobile-card">
        <h3>Live Markets</h3>

        {coins.length === 0 && <p>Loading markets...</p>}

        {coins.map((coin, index) => (
          <div
            key={coin.address || coin.symbol || index}
            className="mobile-order-row"
            onClick={() => setSelectedCoin(coin)}
          >
            <b>{coin.symbol}</b>
            <span>${Number(coin.price || 0).toFixed(6)}</span>
            <span
              className={
                Number(coin.change || 0) >= 0 ? "green-text" : "red-text"
              }
            >
              {Number(coin.change || 0).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {selectedCoin && (
        <>
          <div className="mobile-card">
            <h2>{selectedCoin.symbol}USDT</h2>
            <h1>${Number(selectedCoin.price || 0).toFixed(6)}</h1>
            <span
              className={
                Number(selectedCoin.change || 0) >= 0
                  ? "green-text"
                  : "red-text"
              }
            >
              {Number(selectedCoin.change || 0).toFixed(2)}%
            </span>
          </div>

          <div className="mobile-card">
            <h3>Live Trading Chart</h3>
            <div className="mobile-chart-box">
              <TradingChart
                selectedCoin={{
                  ...selectedCoin,
                  baseToken: {
                    symbol: selectedCoin.symbol,
                    address: selectedCoin.address,
                  },
                  chartSymbol: selectedCoin.chartSymbol,
                }}
              />
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
              {type === "buy"
                ? `Buy ${selectedCoin.symbol}`
                : `Sell ${selectedCoin.symbol}`}
            </button>
          </div>

          <div className="mobile-card">
            <h3>Coin Info</h3>

            <div className="mobile-info-row">
              <span>Token</span>
              <b>{selectedCoin.symbol}</b>
            </div>

            <div className="mobile-info-row">
              <span>Contract</span>
              <small>{selectedCoin.address || "N/A"}</small>
            </div>
          </div>
        </>
      )}
    </div>
  );
}