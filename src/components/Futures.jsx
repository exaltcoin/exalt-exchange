import { useEffect, useRef, useState } from "react";
import "./Futures.css";
import { socket } from "../api";
import {
  openPosition as apiOpenPosition,
  getPositions,
  getFuturesHistory,
  closePosition as apiClosePosition,
} from "../api";

function Futures({ setPage }) {
  const candleSeriesRef = useRef(null);
  const lastCandleRef = useRef(null);

  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [leverage, setLeverage] = useState("10x");
  const [balance] = useState(5000);
  const [marketPrice, setMarketPrice] = useState(68500);
  const [positions, setPositions] = useState([]);
  const [side, setSide] = useState("long");
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [history, setHistory] = useState([]);
  const [volume, setVolume] = useState(0);
  const [livePrices, setLivePrices] = useState({});
  const [timeframe, setTimeframe] = useState("15m");
  const [candleStyle, setCandleStyle] = useState("normal");
  const [chartZoom, setChartZoom] = useState("medium");
  const [volatility, setVolatility] = useState("normal");
  const [marketSearch, setMarketSearch] = useState("");

  const [orderType, setOrderType] = useState("Market");
  const [marginMode, setMarginMode] = useState("Cross");
  const [showTPSL, setShowTPSL] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [slippage, setSlippage] = useState(false);
  const [mobileTab, setMobileTab] = useState("positions");
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });

  const [activeFuturesTab, setActiveFuturesTab] = useState("USDⓈ-M");
  const [marketDrawerOpen, setMarketDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [contractMenuOpen, setContractMenuOpen] = useState(false);
  const [quoteCurrency, setQuoteCurrency] = useState("USDT");

  const displayPrice =
    Number(marketPrice) > 0
      ? Number(marketPrice)
      : Number(price) > 0
      ? Number(price)
      : 68500;

  const timeframes = ["1m", "5m", "10m", "15m", "1h", "4h", "24h", "1W", "1M"];

  const tvIntervalMap = {
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

  const fallbackPairs = [
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
    { pair: "LINKUSDT", price: 18, change: "+2.8%" },
    { pair: "LTCUSDT", price: 85, change: "+1.1%" },
    { pair: "EXALTUSDT", price: 0.0003, change: "+0.0%" },
  ];

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
          .slice(0, 60)
          .map(([symbol, price]) => ({
            pair: symbol,
            price: Number(price),
            change: window.realChanges?.[symbol]
              ? window.realChanges[symbol] + "%"
              : "+0.00%",
          }))
      : fallbackPairs;

  const mobileOrderBook =
    orderBook.asks.length > 0 || orderBook.bids.length > 0
      ? [
          ...orderBook.asks.slice(0, 4).map((item) => ({
            type: "sell",
            price: Number(item[0]).toFixed(2),
            amount: Number(item[1]).toFixed(2),
          })),
          ...orderBook.bids.slice(0, 4).map((item) => ({
            type: "buy",
            price: Number(item[0]).toFixed(2),
            amount: Number(item[1]).toFixed(2),
          })),
        ]
      : [
          { type: "sell", price: (displayPrice + 0.04).toFixed(2), amount: "7.36" },
          { type: "sell", price: (displayPrice + 0.03).toFixed(2), amount: "143.36" },
          { type: "sell", price: (displayPrice + 0.02).toFixed(2), amount: "25.73" },
          { type: "sell", price: (displayPrice + 0.01).toFixed(2), amount: "205.84" },
          { type: "buy", price: (displayPrice - 0.01).toFixed(2), amount: "7.35" },
          { type: "buy", price: (displayPrice - 0.02).toFixed(2), amount: "146.97" },
          { type: "buy", price: (displayPrice - 0.03).toFixed(2), amount: "642.85" },
          { type: "buy", price: (displayPrice - 0.04).toFixed(2), amount: "3.63K" },
        ];

  const loadPositions = async () => {
    try {
      const response = await getPositions();
      if (response.success) setPositions(response.positions || []);
    } catch (error) {
      console.log(error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await getFuturesHistory();
      if (response.success) setHistory(response.history || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadPositions();
    loadHistory();

    const interval = setInterval(loadPositions, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadLivePrices = async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/price");
        const data = await res.json();

        const tickerRes = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        const tickerData = await tickerRes.json();

        const prices = {};
        const changes = {};

        data.forEach((item) => {
          if (item.symbol.endsWith("USDT")) prices[item.symbol] = Number(item.price);
        });

        tickerData.forEach((item) => {
          if (item.symbol.endsWith("USDT")) {
            changes[item.symbol] = Number(item.priceChangePercent).toFixed(2);
          }
        });

        setLivePrices(prices);
        window.realChanges = changes;

        if (prices[selectedPair]) {
          setMarketPrice(Number(prices[selectedPair]));
          setPrice(String(Number(prices[selectedPair]).toFixed(2)));
        }
      } catch (error) {
        console.log("Price load error:", error);
      }
    };

    loadLivePrices();
    const interval = setInterval(loadLivePrices, 5000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  useEffect(() => {
    const loadOrderBook = async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/depth?symbol=${selectedPair}&limit=20`
        );
        const data = await res.json();

        setOrderBook({
          bids: data.bids || [],
          asks: data.asks || [],
        });
      } catch (error) {
        console.log("Orderbook error:", error);
      }
    };

    loadOrderBook();
    const interval = setInterval(loadOrderBook, 2000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  useEffect(() => {
    const handleMarketUpdate = (data) => {
      if (!data?.symbol) return;

      const symbol = String(data.symbol).toUpperCase();
      const currentPrice = Number(data.price || data.candle?.close || 0);

      if (currentPrice > 0) {
        setLivePrices((prev) => ({ ...prev, [symbol]: currentPrice }));

        if (symbol === selectedPair.toUpperCase()) {
          setMarketPrice(currentPrice);
          setPrice(String(currentPrice.toFixed(2)));
        }
      }
    };

    socket.on("marketUpdate", handleMarketUpdate);
    return () => socket.off("marketUpdate", handleMarketUpdate);
  }, [selectedPair]);

  useEffect(() => {
    const handleKlineUpdate = (data) => {
      if (data.symbol !== selectedPair) return;
      const c = data.candle;

      setMarketPrice(Number(c.close));
      setPrice(String(Number(c.close).toFixed(2)));
      setVolume(Number(c.volume || 0));
    };

    socket.on("klineUpdate", handleKlineUpdate);
    return () => socket.off("klineUpdate", handleKlineUpdate);
  }, [selectedPair]);

  const selectMarket = (coin) => {
    const coinPrice = Number(coin.price || 0);

    setSelectedPair(coin.pair);
    setPrice(String(coinPrice));
    setMarketPrice(coinPrice);
    lastCandleRef.current = null;

    if (candleSeriesRef.current) {
      candleSeriesRef.current.setData([]);
    }
  };

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
        entryPrice: Number(displayPrice),
        takeProfit: tpPrice ? Number(tpPrice) : 0,
        stopLoss: slPrice ? Number(slPrice) : 0,
        orderType,
        marginMode,
        reduceOnly,
        slippage,
        futuresTab: activeFuturesTab,
        quoteCurrency,
      };

      const response = await apiOpenPosition(payload);

      if (response.success) {
        await loadPositions();
        await loadHistory();
        setAmount("");
        setTpPrice("");
        setSlPrice("");
        alert("Position opened successfully");
      } else {
        alert(response.message || "Open position failed");
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
      <div className="binance-mobile-futures">
        <div className="bm-top-tabs">
          {["USDⓈ-M", "COIN-M", "Options", "Up / D"].map((tab) => (
            <span
              key={tab}
              className={activeFuturesTab === tab ? "active" : ""}
              onClick={() => setActiveFuturesTab(tab)}
            >
              {tab}
            </span>
          ))}

          <b onClick={() => setMarketDrawerOpen(true)}>☰</b>
        </div>

        <div className="bm-notice">
          🔔 Important Notice: EXALT Futures Market Live
          <span>×</span>
        </div>

        <div className="bm-pair-head">
          <div>
            <h2 onClick={() => setContractMenuOpen(!contractMenuOpen)}>
              {selectedPair} <small>Perp</small> ▾
            </h2>
            <p>
              Live <span className="green-change">+0.11%</span>
            </p>
          </div>

          <div className="bm-icons">
            <span onClick={() => setSettingsOpen(!settingsOpen)}>⚙️</span>
            <span onClick={() => setMoreOpen(!moreOpen)}>⋯</span>
          </div>
        </div>

        <div className="bm-trade-order-grid">
          <div className="bm-trade-box">
            <div className="bm-buy-sell">
              <button
                className={side === "long" ? "active-buy" : ""}
                onClick={() => setSide("long")}
              >
                Buy
              </button>

              <button
                className={side === "short" ? "active-sell" : ""}
                onClick={() => setSide("short")}
              >
                Sell
              </button>
            </div>

            <div className="bm-mini-row">
              <select value={marginMode} onChange={(e) => setMarginMode(e.target.value)}>
                <option>Cross</option>
                <option>Isolated</option>
              </select>

              <select value={leverage} onChange={(e) => setLeverage(e.target.value)}>
                <option>5x</option>
                <option>10x</option>
                <option>20x</option>
                <option>50x</option>
                <option>100x</option>
              </select>

              <button>S</button>
            </div>

            <select
              className="bm-full-input"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
            >
              <option>Market</option>
              <option>Limit</option>
            </select>

            <div className="bm-amount-box">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
              />
              <span
                onClick={() =>
                  setQuoteCurrency(quoteCurrency === "USDT" ? "BUSD" : "USDT")
                }
              >
                {quoteCurrency} ▾
              </span>
            </div>

            <div className="bm-slider">
              <span onClick={() => setAmount(String((balance * 0.25).toFixed(2)))}></span>
              <span onClick={() => setAmount(String((balance * 0.5).toFixed(2)))}></span>
              <span onClick={() => setAmount(String((balance * 0.75).toFixed(2)))}></span>
              <span onClick={() => setAmount(String(balance))}></span>
            </div>

            <p className="bm-avbl">
              Avbl <b>{balance} USDT</b> ⇆
            </p>

            <label className="bm-check">
              <input
                type="checkbox"
                checked={slippage}
                onChange={(e) => setSlippage(e.target.checked)}
              />
              Slippage Tolerance
            </label>

            <label className="bm-check">
              <input
                type="checkbox"
                checked={showTPSL}
                onChange={(e) => setShowTPSL(e.target.checked)}
              />
              TP/SL
            </label>

            {showTPSL && (
              <div className="bm-tpsl-mobile">
                <input
                  placeholder="Take Profit"
                  value={tpPrice}
                  onChange={(e) => setTpPrice(e.target.value)}
                />
                <input
                  placeholder="Stop Loss"
                  value={slPrice}
                  onChange={(e) => setSlPrice(e.target.value)}
                />
              </div>
            )}

            <label className="bm-check">
              <input
                type="checkbox"
                checked={reduceOnly}
                onChange={(e) => setReduceOnly(e.target.checked)}
              />
              Reduce Only
            </label>

            <div className="bm-cost-row">
              <span>
                Max
                <br />
                {balance} USDT
              </span>
              <span>
                Cost
                <br />
                {Number(amount || 0).toFixed(2)} USDT
              </span>
            </div>

            <button
              className={side === "long" ? "bm-main-buy" : "bm-main-sell"}
              onClick={() => openPosition(side)}
            >
              {side === "long" ? "Buy / Long" : "Sell / Short"}
            </button>
          </div>

          <div className="bm-orderbook">
            <div className="bm-funding">
              <span>Funding (8h)</span>
              <b>0.00000%</b>
            </div>

            <div className="bm-ob-head">
              <span>
                Price
                <br />
                (USDT)
              </span>
              <span>
                Amount
                <br />
                (USDT)
              </span>
            </div>

            {mobileOrderBook.slice(0, 4).map((item, index) => (
              <div className="bm-ob-row" key={`sell-${index}`}>
                <strong className="bm-red">{item.price}</strong>
                <span>{item.amount}</span>
              </div>
            ))}

            <div className="bm-mid-price">
              {Number(displayPrice).toFixed(2)}
              <small>{Number(displayPrice).toFixed(2)}</small>
            </div>

            {mobileOrderBook.slice(4).map((item, index) => (
              <div className="bm-ob-row" key={`buy-${index}`}>
                <strong className="bm-green">{item.price}</strong>
                <span>{item.amount}</span>
              </div>
            ))}

            <div className="bm-ratio">
              <span></span>
              <b>66.16%</b>
              <b>33.84%</b>
            </div>
          </div>
        </div>

        <div className="bm-warning">
          ℹ There may be limited price movement and reduced liquidity outside regular trading hours.
        </div>

        <div className="bm-bottom-tabs">
          <span
            className={mobileTab === "positions" ? "active" : ""}
            onClick={() => setMobileTab("positions")}
          >
            Positions ({positions.length})
          </span>
          <span
            className={mobileTab === "orders" ? "active" : ""}
            onClick={() => setMobileTab("orders")}
          >
            Open Orders (0)
          </span>
          <span
            className={mobileTab === "bots" ? "active" : ""}
            onClick={() => setMobileTab("bots")}
          >
            Bots
          </span>
        </div>

        <div className="bm-chart-section">
          <h3>{selectedPair} Perp Chart</h3>

          <div className="bm-timeframes">
            {timeframes.slice(0, 6).map((tf) => (
              <button
                key={tf}
                className={timeframe === tf ? "active" : ""}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          <iframe
            key={`mobile-${tvSymbol}-${tvInterval}`}
            title="Mobile Futures Chart"
            src={tvChartUrl}
            className="bm-chart-frame"
            allowFullScreen
          />
        </div>

        {marketDrawerOpen && (
          <div className="bm-drawer-overlay" onClick={() => setMarketDrawerOpen(false)}>
            <div className="bm-market-drawer" onClick={(e) => e.stopPropagation()}>
              <h3>Markets</h3>

              <input
                placeholder="Search pair..."
                value={marketSearch}
                onChange={(e) => setMarketSearch(e.target.value)}
              />

              {marketPairs.slice(0, 40).map((coin) => (
                <div
                  className="bm-drawer-market"
                  key={coin.pair}
                  onClick={() => {
                    selectMarket(coin);
                    setMarketDrawerOpen(false);
                  }}
                >
                  <strong>{coin.pair}</strong>
                  <span className={String(coin.change).includes("-") ? "bm-red" : "bm-green"}>
                    {coin.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {settingsOpen && (
          <div className="bm-popup">
            <h3>Futures Settings</h3>

            <label>Margin Mode</label>
            <select value={marginMode} onChange={(e) => setMarginMode(e.target.value)}>
              <option>Cross</option>
              <option>Isolated</option>
            </select>

            <label>Leverage</label>
            <select value={leverage} onChange={(e) => setLeverage(e.target.value)}>
              <option>5x</option>
              <option>10x</option>
              <option>20x</option>
              <option>50x</option>
              <option>100x</option>
            </select>

            <label>Quote Currency</label>
            <select value={quoteCurrency} onChange={(e) => setQuoteCurrency(e.target.value)}>
              <option>USDT</option>
              <option>BUSD</option>
            </select>

            <button onClick={() => setSettingsOpen(false)}>Close</button>
          </div>
        )}

        {moreOpen && (
          <div className="bm-popup">
            <h3>More Options</h3>
            <p onClick={() => setPage && setPage("orders")}>Open Orders</p>
            <p onClick={() => setPage && setPage("transactions")}>Transaction History</p>
            <p onClick={() => setPage && setPage("wallets")}>Assets / Wallet</p>
            <p onClick={() => setPage && setPage("support")}>Support</p>
            <button onClick={() => setMoreOpen(false)}>Close</button>
          </div>
        )}

        {contractMenuOpen && (
          <div className="bm-popup">
            <h3>Select Contract</h3>

            {marketPairs.slice(0, 20).map((coin) => (
              <p
                key={coin.pair}
                onClick={() => {
                  selectMarket(coin);
                  setContractMenuOpen(false);
                }}
              >
                {coin.pair} Perpetual
              </p>
            ))}

            <button onClick={() => setContractMenuOpen(false)}>Close</button>
          </div>
        )}

        <div className="bm-bottom-nav">
          <button onClick={() => setPage && setPage("dashboard")}>
            ⌂<span>Home</span>
          </button>
          <button onClick={() => setPage && setPage("markets")}>
            ⌁<span>Markets</span>
          </button>
          <button onClick={() => setPage && setPage("trade")}>
            ⇄<span>Trade</span>
          </button>
          <button className="active" onClick={() => setPage && setPage("futures")}>
            ▣<span>Futures</span>
          </button>
          <button onClick={() => setPage && setPage("wallets")}>
            ▤<span>Assets</span>
          </button>
        </div>
      </div>

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

          <input
            className="futures-search"
            placeholder="Search market..."
            value={marketSearch}
            onChange={(e) => setMarketSearch(e.target.value)}
          />

          {marketPairs.map((coin, index) => {
            const coinPrice = Number(coin.price || 0);

            return (
              <div
                key={coin.pair || index}
                className={`market-item ${selectedPair === coin.pair ? "active-market" : ""}`}
                onClick={() => selectMarket(coin)}
              >
                <div>
                  <strong>{coin.pair}</strong>
                  <p>${coinPrice > 1 ? coinPrice.toFixed(2) : coinPrice.toFixed(6)}</p>
                </div>

                <span className={String(coin.change).includes("-") ? "red-change" : "green-change"}>
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

            <span>${Number(displayPrice).toFixed(2)}</span>

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

          {mobileOrderBook.map((order, index) => (
            <div key={index} className={`order-row ${order.type}`}>
              <span>{order.price}</span>
              <span>{order.amount}</span>
            </div>
          ))}

          <div className="positions-panel">
            <h3>Open Positions</h3>

            {positions.length === 0 ? (
              <p className="no-position">No open positions</p>
            ) : (
              positions.map((position) => {
                const mark = Number(
                  livePrices[position.symbol || position.pair] ||
                    position.markPrice ||
                    displayPrice ||
                    0
                );

                const entry = Number(position.entryPrice || position.entry || 0);
                const pnl = position.side === "long" ? mark - entry : entry - mark;

                return (
                  <div
                    key={position._id || position.id}
                    className={`position-card ${position.side === "long" ? "long" : "short"}`}
                  >
                    <div className="position-top">
                      <strong>
                        {position.symbol || position.pair} {String(position.side).toUpperCase()}
                      </strong>

                      <span className={pnl >= 0 ? "profit" : "loss"}>
                        {pnl.toFixed(2)} USD
                      </span>
                    </div>

                    <div className="position-info">
                      <p>Entry Price: {position.entryPrice || position.entry}</p>
                      <p>Mark Price: {position.markPrice || displayPrice}</p>
                      <p>Leverage: {position.leverage}x</p>
                      <p>Margin: {position.margin || position.amount} USDT</p>
                      <p>Liquidation: {position.liquidationPrice || position.liquidation || "N/A"}</p>
                    </div>

                    <button
                      className="close-position"
                      onClick={() => closePosition(position._id || position.id)}
                    >
                      Close Position
                    </button>
                  </div>
                );
              })
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

          <button className="execute-buy" onClick={() => openPosition("long")}>
            Open Long
          </button>

          <button className="execute-sell" onClick={() => openPosition("short")}>
            Open Short
          </button>

          <div className="trade-info">
            <p>Available Balance: {balance} USDT</p>
            <p>Margin Mode: {marginMode}</p>
            <p>Order Type: {orderType}</p>
            <p>Quote: {quoteCurrency}</p>
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
                className={`history-card ${item.side === "long" ? "long" : "short"}`}
              >
                <div className="history-left">
                  <strong>
                    {item.symbol} {String(item.side).toUpperCase()}
                  </strong>

                  <span className={Number(item.pnl) >= 0 ? "profit" : "loss"}>
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