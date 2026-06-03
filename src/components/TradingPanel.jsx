import { useEffect, useState } from "react";
function TradingPanel() {
  const [price, setPrice] = useState(0);
const [change24h, setChange24h] = useState(0);
const [volume24h, setVolume24h] = useState(0);
const [liquidity, setLiquidity] = useState(0);
useEffect(() => {
 fetch("https://exalt-exchange-backend.onrender.com/api/market/live")
    .then((res) => res.json())
    .then((data) => {
      const pairs = data?.data?.pairs || [];
     const exalt = pairs.find(
 (p) =>
 p.baseToken?.symbol?.toUpperCase() === "EXALT"
);

      if (exalt) {
        setPrice(Number(exalt.priceUsd || 0));
        setChange24h(Number(exalt.priceChange?.h24 || 0));
        setVolume24h(Number(exalt.volume?.h24 || 0));
        setLiquidity(Number(exalt.liquidity?.usd || 0));
      }
    })
    .catch((err) => console.log(err));
}, []);
  return (
    <div
      style={{
        marginTop: "20px",
        background: "#1a1f2e",
        borderRadius: "16px",
        padding: "20px",
        color: "white",
      }}
    >
      <h2 style={{ color: "#f7b733" }}>Live Trading Panel</h2>

      <div
        style={{
          marginTop: "15px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "15px",
        }}
      >
        <div
          style={{
            background: "#111827",
            padding: "15px",
            borderRadius: "12px",
          }}
        >
         <h3>EXALT/USDT</h3>
<p>${Number(price || 0).toFixed(8)}</p>

<span
  style={{
    color:
      Number(change24h || 0) >= 0 ? "lime" : "#ff4d6d",
  }}
>
  {Number(change24h || 0).toFixed(2)}%
</span>
        </div>

        <div
          style={{
            background: "#111827",
            padding: "15px",
            borderRadius: "12px",
          }}
        >
          <h3>24H Volume</h3>
         <p>${Number(volume24h || 0).toLocaleString()}</p>
        </div>

        <div
          style={{
            background: "#111827",
            padding: "15px",
            borderRadius: "12px",
          }}
        >
          <h3>Liquidity</h3>
          <p>${Number(liquidity || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default TradingPanel;