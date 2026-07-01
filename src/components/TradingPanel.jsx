import { useEffect, useState } from "react";

function TradingPanel({ setPage }) {
  const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
  const [market, setMarket] = useState({
    price: 0,
    change24h: 0,
    volume24h: 0,
    liquidity: 0,
    marketCap: 0,
  });

  const loadExaltMarket = async () => {
    try {
      const res = await fetch(`${API}/api/market/live`);
      const data = await res.json();

      const pairs = data?.data?.pairs || [];
      const exalt = pairs.find(
        (p) => p.baseToken?.symbol?.toUpperCase() === "EXALT"
      );

      if (exalt) {
        setMarket({
          price: Number(exalt.priceUsd || 0),
          change24h: Number(exalt.priceChange?.h24 || 0),
          volume24h: Number(exalt.volume?.h24 || 0),
          liquidity: Number(exalt.liquidity?.usd || 0),
          marketCap: Number(exalt.marketCap || exalt.fdv || 0),
        });
      }
    } catch (error) {
      console.log("Trading panel market load error:", error);
    }
  };

  useEffect(() => {
    loadExaltMarket();

    const interval = setInterval(loadExaltMarket, 30000);
    return () => clearInterval(interval);
  }, []);

  const positive = Number(market.change24h || 0) >= 0;

  return (
    <div className="trading-panel">
      <div className="trading-panel-header">
        <div>
          <h2>Live Trading Panel</h2>
          <p>EXALT/USDT market overview powered by Exalt Exchange</p>
        </div>

        <span className={positive ? "market-badge up" : "market-badge down"}>
          {positive ? "Bullish" : "Bearish"} {market.change24h.toFixed(2)}%
        </span>
      </div>

      <div className="trading-panel-grid">
        <div className="trading-metric-card main">
          <h3>EXALT/USDT</h3>
          <h1>${Number(market.price || 0).toFixed(8)}</h1>
          <span className={positive ? "green-text" : "red-text"}>
            24H Change: {market.change24h.toFixed(2)}%
          </span>
        </div>

        <div className="trading-metric-card">
          <h3>24H Volume</h3>
          <h2>${Number(market.volume24h || 0).toLocaleString()}</h2>
          <p>Live trading activity</p>
        </div>

        <div className="trading-metric-card">
          <h3>Liquidity</h3>
          <h2>${Number(market.liquidity || 0).toLocaleString()}</h2>
          <p>PancakeSwap liquidity</p>
        </div>

        <div className="trading-metric-card">
          <h3>Market Cap / FDV</h3>
          <h2>${Number(market.marketCap || 0).toLocaleString()}</h2>
          <p>Live market valuation</p>
        </div>
      </div>

      <div className="trading-panel-actions">
        <button
          onClick={() =>
            window.open(
              "https://pancakeswap.finance/swap?outputCurrency=0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78",
              "_blank"
            )
          }
          className="action-btn yellow-btn"
        >
          Buy EXALT
        </button>

        <button
          onClick={() => setPage && setPage("trade")}
          className="action-btn blue-btn"
        >
          Open Spot Trade
        </button>

        <button
          onClick={() => setPage && setPage("web3wallet")}
          className="action-btn green-btn"
        >
          Open Web3 Wallet
        </button>
      </div>
    </div>
  );
}

export default TradingPanel;