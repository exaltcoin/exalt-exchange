import { createChart, CandlestickSeries } from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import "./Futures.css";
import { socket } from "../api";
import {
    openPosition as apiOpenPosition,
    getPositions,
    getFuturesHistory,
    closePosition as apiClosePosition
} from "../api";
function Futures() {
    const chartContainerRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const lastCandleRef = useRef(null);
    const [selectedPair, setSelectedPair] = useState("BTCUSDT");
    const [price, setPrice] = useState("");
    const [amount, setAmount] = useState("");
    const [leverage, setLeverage] = useState("10x");
    const [balance, setBalance] = useState(5000);
    const [marketPrice, setMarketPrice] = useState(68500);
    const displayPrice =
  Number(marketPrice) > 0
    ? Number(marketPrice)
    : Number(price) > 0
    ? Number(price)
    : 68500;
    const [positions, setPositions] = useState([]);
    const [side, setSide] = useState("long");
    const [tpPrice, setTpPrice] = useState("");
    const [slPrice, setSlPrice] = useState("");
    const [history, setHistory] = useState([]);
    const [volume, setVolume] = useState(0);
    const [chartCandles, setChartCandles] = useState([]);
    const [livePrices, setLivePrices] = useState({});
    const [timeframe, setTimeframe] = useState("1D");
    const timeframes = [
  "1m",
  "5m",
  "10m",
  "15m",
  "1h",
  "4h",
  "24h",
  "1W",
  "1M"
];
    const [candleStyle, setCandleStyle] = useState("normal");
const [chartZoom, setChartZoom] = useState("medium");
const [volatility, setVolatility] = useState("normal");
const [marketSearch, setMarketSearch] = useState("");
const marketPairs =
Object.entries(livePrices).length > 0
? Object.entries(livePrices)
.filter(([symbol, price]) => {
return (
symbol.toLowerCase().includes(marketSearch.toLowerCase()) &&
Number(price) > 0
);
})
.sort(([a], [b]) => {
if (a === "BTCUSDT") return -1;
if (b === "BTCUSDT") return 1;
return a.localeCompare(b);
})
.map(([symbol, price]) => ({
pair: symbol,
price: Number(price),
change: window.realChanges?.[symbol]
  ? window.realChanges[symbol] + "%"
  : "+0.00%",
}))
: [
{ pair: "BTCUSDT", price: 68500, change: "+2.4%" },
{ pair: "ETHUSDT", price: 3800, change: "+1.8%" },
{ pair: "BNBUSDT", price: 620, change: "+0.9%" },
{ pair: "SOLUSDT", price: 170, change: "+3.1%" },
{ pair: "XRPUSDT", price: 0.62, change: "+1.2%" },
{ pair: "ADAUSDT", price: 0.45, change: "+0.8%" },
{ pair: "DOGEUSDT", price: 0.16, change: "+4.2%" },
{ pair: "TRXUSDT", price: 0.12, change: "+0.6%" },
{ pair: "TONUSDT", price: 6.5, change: "+1.9%" },
{ pair: "AVAXUSDT", price: 36, change: "+2.1%" },
{ pair: "DOTUSDT", price: 7.2, change: "+1.4%" },
{ pair: "MATICUSDT", price: 0.75, change: "+0.7%" },
{ pair: "LINKUSDT", price: 18, change: "+2.8%" },
{ pair: "LTCUSDT", price: 85, change: "+1.1%" },
{ pair: "BCHUSDT", price: 460, change: "+1.5%" },
{ pair: "UNIUSDT", price: 10, change: "+0.9%" },
{ pair: "ATOMUSDT", price: 8.5, change: "+1.3%" },
{ pair: "NEARUSDT", price: 6.2, change: "+2.6%" },
{ pair: "APTUSDT", price: 9.4, change: "+1.7%" },
{ pair: "ARBUSDT", price: 1.1, change: "+1.0%" },
{ pair: "OPUSDT", price: 2.4, change: "+1.6%" },
{ pair: "SUIUSDT", price: 1.9, change: "+2.0%" },
{ pair: "PEPEUSDT", price: 0.000012, change: "+5.4%" },
{ pair: "SHIBUSDT", price: 0.000025, change: "+3.8%" },
{ pair: "EXALTUSDT", price: 0.0003, change: "+0.0%" },
];
    const loadPositions = async () => {
        try {
            const response = await getPositions();

            if (response.success) {
                setPositions(response.positions || []);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const loadHistory = async () => {
        try {
            const response = await getFuturesHistory();

            if (response.success) {
                setHistory(response.history || []);
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        loadPositions();
         loadHistory();
        const interval = setInterval(() => {
            loadPositions();
        }, 2000);

        return () => clearInterval(interval);
    }, []);
useEffect(() => {
  const loadLivePrices = async () => {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/price");
      const data = await res.json();
const tickerRes = await fetch("https://api.binance.com/api/v3/ticker/24hr");
const tickerData = await tickerRes.json();

const changes = {};

tickerData.forEach((item) => {
  if (item.symbol.endsWith("USDT")) {
    changes[item.symbol] = Number(item.priceChangePercent).toFixed(2);
  }
});
      const prices = {};

      data.forEach((item) => {
        if (item.symbol.endsWith("USDT")) {
          prices[item.symbol] = Number(item.price);
        }
      });

      setLivePrices(prices);
      window.realChanges = changes;
    } catch (error) {
      console.log(error);
    }
  };

  loadLivePrices();
  const interval = setInterval(loadLivePrices, 5000);

  return () => clearInterval(interval);
}, []);
    useEffect(() => {
  const handleMarketUpdate = (data) => {
    setLivePrices((prev) => ({
      ...prev,
      [data.symbol]: Number(data.price),
    }));

    if (data.symbol === selectedPair) {
      setPrice(String(Number(data.price).toFixed(2)));
      setMarketPrice(Number(data.price));
    }
  };
  socket.on("marketUpdate", handleMarketUpdate);
  return () => {
    socket.off("marketUpdate", handleMarketUpdate);
  };
}, [selectedPair]);
useEffect(() => {
  const handleKlineUpdate = (data) => {
    console.log("KLINE DATA:", data);
    if (data.symbol !== selectedPair) return;

    const c = data.candle;

    setMarketPrice(Number(c.close));
    setPrice(String(Number(c.close).toFixed(2)));
    setVolume(Number(c.volume));
  };

  socket.on("klineUpdate", handleKlineUpdate);

  return () => {
    socket.off("klineUpdate", handleKlineUpdate);
  };
}, [selectedPair]);

useEffect(() => {
  const handleMarketUpdate = (data) => {
    console.log("LIVE DATA:", data);

    const symbol = (data.symbol || "").toUpperCase();
    if (symbol !== selectedPair.toUpperCase()) return;

    const currentPrice = Number(data.price || data.candle?.close || 0);

    if (currentPrice > 0) {
      setMarketPrice(currentPrice);
    }
  };

  socket.on("marketUpdate", handleMarketUpdate);

  return () => {
    socket.off("marketUpdate", handleMarketUpdate);
  };
}, [selectedPair]);
const tvIntervalMap = {
  "15s": "1",
  "1m": "1",
  "5m": "5",
  "10m": "10",
  "15m": "15",
  "1h": "60",
  "4h": "240",
  "24h": "D",
  "1W": "W",
  "1M": "M",
};

const tvSymbol = `BINANCE:${selectedPair.replace("/", "")}`;
const tvInterval = tvIntervalMap[timeframe] || "15";

const tvChartUrl =
  `https://www.tradingview.com/widgetembed/?symbol=${tvSymbol}` +
  `&interval=${tvInterval}` +
  `&theme=dark&style=1&timezone=Etc/UTC`;
const openPosition = async (type) => {
  try {
    if (!amount || Number(amount) <= 0) {
      alert("Please enter amount first");
      return;
    }

    const realLeverage = Number(leverage.replace("x", ""));

    const payload = {
      symbol: selectedPair,
      side: type,
      quantity: Number(amount),
      leverage: realLeverage,
      entryPrice: Number(marketPrice),
      takeProfit: tpPrice ? Number(tpPrice) : 0,
      stopLoss: slPrice ? Number(slPrice) : 0,
    };

    const response = await apiOpenPosition(payload);

    if (response.success) {
      await loadPositions();
      setAmount("");
      setTpPrice("");
      setSlPrice("");
      alert("Position opened successfully");
    }
  } catch (error) {
    console.log(error);
    alert(error.message || "Open position failed");
  }
};

    const closePosition = async (id) => {
        try {
            await apiClosePosition(id);
            await loadPositions();
            await loadHistory();
            alert("Position closed");
        } catch (error) {
            console.log(error);
            alert(error.message || "Close position failed");
        }
    };

    return (
        <div className="futures-page">
            <div className="futures-header">
                <div>
                    <h1>EXALT Futures Trading</h1>
                    <p>Real-Time Futures Exchange Panel</p>
                </div>

                <div className="futures-badge">
                    <span className="live-dot"></span>
                    Live Futures Market
                </div>
            </div>

            <div className="futures-container">
            <div className="market-panel markets-list">
                    <h2>Markets</h2>
                    {marketPairs.length === 0 && (
  <div style={{ color: "#fff", padding: "10px" }}>
    No markets found
  </div>
)}

      {marketPairs &&
marketPairs
  .filter((coin) => coin.pair && Number(coin.price) > 0)
  .map((coin, index) => {
  const coinPrice = Number(coin.price || 0);

  return (
    <div
      key={index}
      className={`market-item ${selectedPair === coin.pair ? "active-market" : ""}`}
     onClick={() => {
  setSelectedPair(coin.pair);
  setPrice(coinPrice);
  setMarketPrice(coinPrice);
  lastCandleRef.current = null;
  setChartCandles([]);
  if (candleSeriesRef.current) {
  candleSeriesRef.current.setData([]);
}
}}
    >
      <div>
        <strong>{coin.pair}</strong>
        <p>${coinPrice > 1 ? coinPrice.toFixed(2) : coinPrice.toFixed(6)}</p>
      </div>

      <span className={coin.change?.includes("-") ? "red-change" : "green-change"}>
        {coin.change || "+0.0%"}
      </span>
    </div>
  );
})}
                </div>

                <div className="chart-panel">
                    <div className="pair-header">
                        <div>
                            <h2>{selectedPair}</h2>
                            <p>Perpetual Futures</p>
                        </div>
                      <span>
  $
  {Number.isFinite(Number(displayPrice))
    ? Number(displayPrice).toFixed(2)
    : ""}
</span>
                        <div className="timeframe-tabs">
  {timeframes.map((tf) => (
    <button
      key={tf}
      className={timeframe === tf ? "active-timeframe" : ""}
      onClick={() => setTimeframe(tf)}
    >
      {tf}
    </button>
  ))}
</div>
<div className="candle-settings">
  <select value={candleStyle} onChange={(e) => setCandleStyle(e.target.value)}>
    <option value="normal">Normal Candles</option>
    <option value="smooth">Smooth Candles</option>
    <option value="volatile">Volatile Candles</option>
  </select>

  <select value={volatility} onChange={(e) => setVolatility(e.target.value)}>
    <option value="low">Low Volatility</option>
    <option value="normal">Normal Volatility</option>
    <option value="high">High Volatility</option>
  </select>

  <select value={chartZoom} onChange={(e) => setChartZoom(e.target.value)}>
    <option value="small">Zoom Small</option>
    <option value="medium">Zoom Medium</option>
    <option value="large">Zoom Large</option>
  </select>
</div>
                    </div>

                <div className="real-chart">
  <iframe
    key={`${tvSymbol}-${tvInterval}-${chartZoom}`}
    title="TradingView Chart"
    src={tvChartUrl}
    style={{
      width: "100%",
      height:
        chartZoom === "large"
          ? "650px"
          : chartZoom === "small"
          ? "420px"
          : "520px",
      border: "0",
      borderRadius: "14px",
    }}
    allowFullScreen
  />
</div>
                  
                        <h3>Order Book</h3>
                         {[
  {
    type: "sell",
    price: (marketPrice + 120).toFixed(2),
    amount: "0.45 BTC",
  },
  {
    type: "sell",
    price: (marketPrice + 80).toFixed(2),
    amount: "0.32 BTC",
  },
  {
    type: "buy",
    price: (marketPrice - 70).toFixed(2),
    amount: "0.28 BTC",
  },
  {
    type: "buy",
    price: (marketPrice - 120).toFixed(2),
    amount: "0.51 BTC",
  },
].map((order, index) => (
  <div
    key={index}
    className={`order-row ${order.type}`}
  >
    <span>{order.price}</span>
    <span>{order.amount}</span>
  </div>
))}

                    <div className="positions-panel">
                        <h3>Open Positions</h3>
{positions.length === 0 ? (
  <p className="no-position">No open positions</p>
) : (
  positions.map((position) => (
    <div
      key={position._id || position.id}
      className={`position-card ${
        position.side === "long" ? "long" : "short"
      }`}
    >
      <div className="position-top">
        <strong>
          {position.symbol || position.pair}{" "}
          {String(position.side).toUpperCase()}
        </strong>

        <span
  className={
    (
      position.side === "long"
        ? Number(livePrices[position.symbol || position.pair] || position.markPrice || 0) - Number(position.entryPrice || 0)
        : Number(position.entryPrice || 0) - Number(livePrices[position.symbol || position.pair] || position.markPrice || 0)
    ) >= 0
      ? "profit"
      : "loss"
  }
>
  {(
    position.side === "long"
      ? Number(livePrices[position.symbol || position.pair] || position.markPrice || 0) - Number(position.entryPrice || 0)
      : Number(position.entryPrice || 0) - Number(livePrices[position.symbol || position.pair] || position.markPrice || 0)
  ).toFixed(2)} USD
</span>
      </div>

      <div className="position-info">
        <p>
          Entry Price:{" "}
          {position.entryPrice || position.entry}
        </p>

        <p>
          Mark Price:{" "}
          {position.markPrice || marketPrice}
        </p>

        <p>
          Leverage: {position.leverage}x
        </p>

        <p>
          Margin:{" "}
          {position.margin ||
            position.amount}{" "}
          USDT
        </p>

        <p>
          Liquidation:{" "}
          {position.liquidationPrice ||
            position.liquidation}
        </p>
      </div>

      <button
        className="close-position"
        onClick={() =>
          closePosition(
            position._id || position.id
          )
        }
      >
        Close Position
      </button>
    </div>
  ))
)}
   </div>
     </div>
  <div className="trade-panel">
                    <h2>Trade</h2>

                    <div className="trade-tabs">
                        <button
                            className={side === "long" ? "buy-btn active-side" : "buy-btn"}
                            onClick={() => setSide("long")}
                        >
                            Buy / Long
                        </button>

                        <button
                            className={side === "short" ? "sell-btn active-side" : "sell-btn"}
                            onClick={() => setSide("short")}
                        >
                            Sell / Short
                        </button>
                    </div>

                    <label>Leverage</label>
                    <select value={leverage} onChange={(e) => setLeverage(e.target.value)}>
                        <option>5x</option>
                        <option>10x</option>
                        <option>20x</option>
                        <option>50x</option>
                        <option>100x</option>
                    </select>

                    <label>Price</label>
                    <input
                        type="text"
                 value={Number.isFinite(Number(price)) ? price : ""}   
                        onChange={(e) => setPrice(e.target.value)}
                    />

                    <label>Amount</label>
                    <input
                        type="text"
                        placeholder="Enter Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    <div className="tpsl-box">
                        <label>Take Profit</label>
                        <input
                            type="text"
                            placeholder="TP Price"
                            value={tpPrice}
                            onChange={(e) => setTpPrice(e.target.value)}
                        />

                        <label>Stop Loss</label>
                        <input
                            type="text"
                            placeholder="SL Price"
                            value={slPrice}
                            onChange={(e) => setSlPrice(e.target.value)}
                        />
                    </div>

                    <button
                        className="execute-buy"
                       onClick={() => openPosition("long")}
                    >
                        Open Long
                    </button>

                    <button
                        className="execute-sell"
                        onClick={() => openPosition("short")}
                    >
                        Open Short
                    </button>

                    <div className="trade-info">
                        <p>Available Balance: {balance} USDT</p>
                        <p>Margin Mode: Cross</p>
                        <p>Funding Rate: 0.01%</p>
                        <p>Risk Level: Normal</p>
                    </div>
                </div>
                    <div className="history-panel">
  <h3>Position History</h3>

  {history.length === 0 ? (
    <p className="no-position">No closed positions</p>
  ) : (
    history.map((item) => (
      <div
        key={item._id}
        className={`history-card ${
          item.side === "long" ? "long" : "short"
        }`}
      >
       <div className="history-left">
          <strong>
            {item.symbol} {String(item.side).toUpperCase()}
          </strong>

          <span
            className={
              Number(item.pnl) >= 0 ? "profit" : "loss"
            }
          >
            ${Number(item.pnl || 0).toFixed(2)}
          </span>
        </div>

       <div className="history-right">
          <p>Entry: {item.entryPrice}</p>
          <p>Close: {item.markPrice}</p>
          <p>Leverage: {item.leverage}x</p>
          <p>Status: {item.status}</p>
        </div>
      </div>
    ))
  )}
</div>      
 </div> 
   </div>
    );
}

export default Futures;