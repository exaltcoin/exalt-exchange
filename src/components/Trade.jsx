import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import API_BASE_URL, { socket } from "../api";
import Tradingchart from "./Tradingchart";
import OrderBook from "./OrderBook";
import { ethers } from "ethers";
import "./Trade.css";

function Trade({ setPage }) {
  const { t } = useI18n();
 const API_BASE = API_BASE_URL || "https://api.exaltexchange.io";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;
  const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  const EXALT = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [type, setType] = useState("buy");
  const [orderMode, setOrderMode] = useState("market");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState("");
  const [search, setSearch] = useState("");
  const [wallet, setWallet] = useState("");
  const [spotTab, setSpotTab] = useState("Spot");
  const [marketDrawerOpen, setMarketDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [binancePrices, setBinancePrices] = useState({});
  const [walletData, setWalletData] = useState(null);
const [myOrders, setMyOrders] = useState([]);
const [tradeHistory, setTradeHistory] = useState([]);
const [orderBookData, setOrderBookData] = useState({ bids: [], asks: [] });

  const selectedSymbol = selectedCoin?.baseToken?.symbol || "EXALT";
const tradingPair = `${selectedSymbol}/USDT`;

const availableBalance =
  type === "buy"
    ? Number(walletData?.balances?.USDT || 0)
    : Number(walletData?.balances?.[selectedSymbol] || 0);
  const selectedPrice =
    binancePrices[`${selectedSymbol}USDT`] ||
    Number(selectedCoin?.priceUsd || selectedCoin?.price || 0);

  const priceChange = Number(selectedCoin?.priceChange?.h24 || 0);

  const shortAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : t("connectWallet");

  const formatPrice = (value) => {
    const num = Number(value || 0);
    if (num === 0) return "0.000000";
    if (num < 0.000001) return num.toFixed(10);
    if (num < 0.01) return num.toFixed(8);
    return num.toFixed(6);
  };

  const filteredCoins = useMemo(() => {
    const keyword = search.toLowerCase();

    return coins.filter((coin) => {
      const symbol = coin.baseToken?.symbol || coin.symbol || "";
      const name = coin.baseToken?.name || coin.name || "";

      return (
        symbol.toLowerCase().includes(keyword) ||
        name.toLowerCase().includes(keyword)
      );
    });
  }, [coins, search]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert(t("installWallet"));
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setWallet(accounts[0]);
      localStorage.setItem("trade_wallet", accounts[0]);
      alert(t("walletConnected"));
    } catch (error) {
      console.log(error);
      alert(t("walletConnectionFailed"));
    }
  };

  const switchToBSC = async () => {
    if (!window.ethereum) throw new Error("Wallet not found");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (Number(network.chainId) !== 56) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
    }
  };

  const buyExalt = async () => {
    try {
      if (!amount || Number(amount) <= 0) {
        alert(t("enterBnbAmount"));
        return;
      }

      if (!window.ethereum) {
        alert("Install MetaMask / Trust Wallet");
        return;
      }

      await switchToBSC();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const router = new ethers.Contract(
        PANCAKE_ROUTER,
        [
          "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) external payable",
        ],
        signer
      );

      setLoading(true);

      const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
        0,
        [WBNB, EXALT],
        await signer.getAddress(),
        Math.floor(Date.now() / 1000) + 60 * 20,
        { value: ethers.parseEther(String(amount)) }
      );

      await tx.wait();

      alert("EXALT purchased successfully");
      setAmount("");
    } catch (error) {
      console.log(error);
      alert("Transaction failed");
    } finally {
      setLoading(false);
    }
  };

 const submitOrder = async () => {
  try {
    if (!selectedCoin) {
      alert("Select coin first");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Amount required");
      return;
    }

    const finalPrice =
      orderMode === "market"
        ? selectedPrice
        : Number(price || 0);

    if (orderMode === "limit" && finalPrice <= 0) {
      alert("Limit price required");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    setLoading(true);

    const payload = {
      pair: tradingPair,
      side: type,
      type: orderMode,
      price: finalPrice,
      amount: Number(amount),
    };

    const res = await fetch(`${API}/api/trades/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Order failed");
      return;
    }

    socket.emit("orderCreated", data);
    socket.emit("refreshOrderBook", tradingPair);
socket.emit("refreshTrades", tradingPair);

    alert("Order submitted successfully");

    setPrice("");
    setAmount("");
loadWalletBalance();
loadMyOrders();
loadOrderBook();
loadTradeHistory();

socket.emit("orderCancelled", {
  pair: tradingPair,
  orderId,
});
   
  } catch (err) {
    console.log(err);
    alert("Server error");
  } finally {
    setLoading(false);
  }
};
  const selectCoin = (coin) => {
    setSelectedCoin(coin);
    setMarketDrawerOpen(false);
  };
  const loadWalletBalance = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API}/api/wallets/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (data.success) setWalletData(data.wallet);
  } catch (error) {
    console.log("Wallet balance error:", error);
  }
};

const loadOrderBook = async () => {
  try {
    const encodedPair = encodeURIComponent(tradingPair);

    const res = await fetch(`${API}/api/trades/orderbook/${encodedPair}`);
    const data = await res.json();

    if (data.success) {
      setOrderBookData({
        bids: data.bids || [],
        asks: data.asks || [],
      });
    }
  } catch (error) {
    console.log("Order book error:", error);
  }
};

const loadTradeHistory = async () => {
  try {
    const encodedPair = encodeURIComponent(tradingPair);

    const res = await fetch(`${API}/api/trades/history/${encodedPair}`);
    const data = await res.json();

    if (data.success) setTradeHistory(data.trades || []);
  } catch (error) {
    console.log("Trade history error:", error);
  }
};

const loadMyOrders = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API}/api/trades/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (data.success) setMyOrders(data.orders || []);
  } catch (error) {
    console.log("My orders error:", error);
  }
};

const cancelOrder = async (orderId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login first.");

    const res = await fetch(`${API}/api/trades/order/${orderId}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Cancel failed");
      return;
    }

    alert("Order cancelled");
    loadWalletBalance();
    loadMyOrders();
    loadOrderBook();
  } catch (error) {
    console.log(error);
    alert("Server error");
  }
};
useEffect(() => {
  if (!selectedCoin) return;

  loadWalletBalance();
  loadOrderBook();
  loadTradeHistory();
  loadMyOrders();

  const interval = setInterval(() => {
    loadWalletBalance();
    loadOrderBook();
    loadTradeHistory();
    loadMyOrders();
  }, 15000);

  return () => clearInterval(interval);
}, [tradingPair, selectedCoin]);
useEffect(() => {
  const handleMarketUpdate = (data) => {
    if (!data?.symbol || !data?.price) return;

    const symbol = data.symbol.toUpperCase();

    setBinancePrices((prev) => ({
      ...prev,
      [symbol]: Number(data.price),
    }));

    setCoins((prevCoins) =>
      prevCoins.map((coin) => {
        const coinSymbol = coin.baseToken?.symbol;
        const pair = `${coinSymbol}USDT`.toUpperCase();

        if (pair === symbol) {
          return {
            ...coin,
            priceUsd: Number(data.price),
            source: "BINANCE_SOCKET_LIVE",
          };
        }

        return coin;
      })
    );
  };
const handleOrderMatched = (data) => {
  if (data?.pair && data.pair !== tradingPair) return;

  loadOrderBook();
  loadTradeHistory();
  loadMyOrders();
  loadWalletBalance();
};

socket.on("orderMatched", handleOrderMatched);
socket.on("orderCreated", handleOrderMatched);
socket.on("orderCancelled", handleOrderMatched);
  socket.on("marketUpdate", handleMarketUpdate);

  return () => {
  socket.off("marketUpdate", handleMarketUpdate);
  socket.off("orderMatched", handleOrderMatched);
  socket.off("orderCreated", handleOrderMatched);
  socket.off("orderCancelled", handleOrderMatched);
};
}, [tradingPair]);
  useEffect(() => {
    const savedWallet = localStorage.getItem("trade_wallet");
    if (savedWallet) setWallet(savedWallet);

    const loadMarkets = async () => {
      try {
        setMarketError("");
        setMarketLoading(true);

        const res = await fetch(`${API}/api/market/live`);
        const response = await res.json();

      let pairs =
  response?.data?.pairs ||
  response?.pairs ||
  response?.coins ||
  response?.data ||
  [];

pairs = Array.isArray(pairs) ? pairs : [];

const exaltCoin = {
  pairAddress: "EXALT-USDT",
  baseToken: {
    symbol: "EXALT",
    name: "Exalt Coin",
    address: EXALT,
  },
  quoteToken: { symbol: "USDT" },
  priceUsd: 0.000000,
  price: 0.000000,
  priceChange: { h24: 0 },
  liquidity: { usd: 0 },
  source: "EXALT_INTERNAL",
};

const hasExalt = pairs.some(
  (p) => (p.baseToken?.symbol || p.symbol || "").toUpperCase() === "EXALT"
);

if (!hasExalt) {
  pairs = [exaltCoin, ...pairs];
}

        console.log("MARKET API RESPONSE:", response);
        console.log("COIN LIST COUNT:", pairs.length);
        console.log("COIN LIST DATA:", pairs);

        if (!Array.isArray(pairs) || pairs.length === 0) {
          setMarketError("No market data found");
          setCoins([]);
          return;
        }

        const prices = {};
        pairs.forEach((item) => {
          const symbol = item.baseToken?.symbol;
          if (symbol) {
            prices[`${symbol}USDT`] = Number(item.priceUsd || item.price || 0);
          }
        });

        setBinancePrices(prices);
        setCoins(pairs);

        setSelectedCoin((prev) => {
          if (prev) {
            const stillExists = pairs.find(
              (p) => p.baseToken?.symbol === prev.baseToken?.symbol
            );
            return stillExists || prev;
          }

          return (
            pairs.find((p) => p.baseToken?.symbol?.toUpperCase() === "EXALT") ||
            pairs[0]
          );
        });
      } catch (error) {
        console.log("Market loading error:", error);
        setMarketError("Failed to load live market data");
      } finally {
        setMarketLoading(false);
      }
    };

    loadMarkets();
    const interval = setInterval(loadMarkets, 120000);

    return () => clearInterval(interval);
 }, []);

  return (
    <div className="trade-page-pro">
      <div className="mobile-spot-view">
        <div className="ms-top-tabs">
          {["Convert", "Spot", "P2P", "Alpha"].map((tab) => (
            <span
              key={tab}
              className={spotTab === tab ? "active" : ""}
              onClick={() => {
                setSpotTab(tab);
                if (tab === "P2P" && setPage) setPage("p2p");
              }}
            >
              {tab}
            </span>
          ))}

          <b onClick={() => setMarketDrawerOpen(true)}>☰</b>
        </div>

        <div className="ms-pair-head">
          <div onClick={() => setMarketDrawerOpen(true)}>
            <h2>{selectedSymbol}/USDT ▾</h2>
            <p className={priceChange >= 0 ? "green-text" : "red-text"}>
              ${formatPrice(selectedPrice)} • {priceChange.toFixed(2)}%
            </p>
          </div>

          <div className="ms-icons">
            <span onClick={() => setMarketDrawerOpen(true)}>📋</span>
            <span onClick={() => setChartOpen(!chartOpen)}>📊</span>
            <span onClick={() => setMoreOpen(!moreOpen)}>⋯</span>
          </div>
        </div>

        {chartOpen && selectedCoin && (
          <div className="ms-chart-box">
            <Tradingchart
              selectedCoin={{
                ...selectedCoin,
                chartSymbol: `${selectedSymbol}USDT`,
              }}
            />
          </div>
        )}

        <div className="ms-trade-grid">
          <div className="ms-order-box">
            <div className="ms-buy-sell">
              <button
                className={type === "buy" ? "active-buy" : ""}
                onClick={() => setType("buy")}
              >
               {t("buy")}
              </button>

              <button
                className={type === "sell" ? "active-sell" : ""}
                onClick={() => setType("sell")}
              >
                {t("sell")}
              </button>
            </div>

            <select
              value={orderMode}
              onChange={(e) => setOrderMode(e.target.value)}
            >
             <option value="market">{t("marketOrder")}</option>
              <option value="limit">{t("limitOrder")}</option>
            </select>

            {orderMode === "limit" && (
              <input
                type="number"
                placeholder={t("limitPrice")}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            )}

            <div className="ms-amount-box">
              <input
                type="number"
                placeholder={t("amount")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span>{type === "buy" ? "USDT" : selectedSymbol}</span>
            </div>
<div className="ms-slider">
  {[25, 50, 75, 100].map((percent) => (
    <span
      key={percent}
      onClick={() => {
        if (!availableBalance || availableBalance <= 0) return;

        if (type === "buy") {
          const buyAmount =
            orderMode === "market"
              ? (availableBalance * percent) / 100
              : ((availableBalance * percent) / 100) / Number(price || selectedPrice || 1);

          setAmount(String(Number(buyAmount).toFixed(6)));
        } else {
          const sellAmount = (availableBalance * percent) / 100;
          setAmount(String(Number(sellAmount).toFixed(6)));
        }
      }}
      title={`${percent}%`}
    >
      {percent}%
    </span>
  ))}
</div>
           

            <p className="ms-balance">
  {t("available")}: {availableBalance.toFixed(4)}{" "}
  {type === "buy" ? "USDT" : selectedSymbol}
</p>

           <button
  disabled={loading}
  onClick={submitOrder}
  className={type === "buy" ? "ms-main-buy" : "ms-main-sell"}
>
  {loading
    ? t("processing")
    : type === "buy"
    ? `Buy ${selectedSymbol}`
    : `Sell ${selectedSymbol}`}
</button>
              
          </div>

          <div className="ms-orderbook">
            <OrderBook
              coin={selectedCoin}
              bids={orderBookData.bids}
              asks={orderBookData.asks}
            />
          </div>
        </div>
<div className="ms-live-section">
  <h3>My Orders</h3>
  {myOrders.length === 0 ? (
    <p>No orders yet.</p>
  ) : (
    myOrders.slice(0, 5).map((order) => (
      <div className="order-line" key={order._id}>
        <div>
          <strong>{order.side?.toUpperCase()} {order.pair}</strong>
       <small>
  <span className={`status-badge ${order.status}`}>
    {order.status.toUpperCase()}
  </span>

  {" • "}Filled {Number(order.filled || 0).toFixed(4)}

  {" • "}Remaining {Number(order.remaining || 0).toFixed(4)}
</small>
<div className="order-progress">
  <div
    className="order-progress-fill"
    style={{
      width: `${Math.min(
        100,
        (Number(order.filled || 0) / Number(order.amount || 1)) * 100
      )}%`,
    }}
  />
</div>
        </div>
       <span>
  ${formatPrice(order.averagePrice || order.price)}
</span>
        {["open", "partial"].includes(order.status) && (
          <button className="cancel-order-btn" onClick={() => cancelOrder(order._id)}>
            Cancel
          </button>
        )}
      </div>
    ))
  )}
</div>

<div className="ms-live-section">
  <h3>Trade History</h3>
  {tradeHistory.length === 0 ? (
    <p>No trades yet.</p>
  ) : (
    tradeHistory.slice(0, 5).map((trade) => (
      <div className="trade-line" key={trade._id}>
        <div>
          <strong>{trade.pair}</strong>
          <small>{new Date(trade.createdAt).toLocaleString()}</small>
        </div>
        <span>{Number(trade.amount || 0).toFixed(4)}</span>
        <b>${formatPrice(trade.price)}</b>
      </div>
    ))
  )}
</div>
        <div className="ms-info-card">
          <h3>{t("coinInfo")}</h3>
          <p>
            <span>{t("token")}</span>
            <b>{selectedSymbol}</b>
          </p>
          <p>
            <span>{t("price")}</span>
            <b>${formatPrice(selectedPrice)}</b>
          </p>
          <p>
            <span>{t("liquidity")}</span>
            <b>${Number(selectedCoin?.liquidity?.usd || 0).toLocaleString()}</b>
          </p>
          <p>
            <span>{t("contract")}</span>
            <b>{selectedCoin?.baseToken?.address || EXALT}</b>
          </p>
        </div>

        {marketDrawerOpen && (
          <div
            className="ms-drawer-overlay"
            onClick={() => setMarketDrawerOpen(false)}
          >
            <div
              className="ms-market-drawer"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{t("spotMarkets")}</h3>

              <input
                placeholder={t("searchCoin")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {marketLoading && <p>{t("loadingMarkets")}</p>}
              {marketError && <p className="red-text">{marketError}</p>}

              {!marketLoading &&
                !marketError &&
                filteredCoins.map((coin, index) => {
                  const symbol = coin.baseToken?.symbol || coin.symbol || "COIN";
                  const change = Number(coin.priceChange?.h24 || 0);

                  return (
                    <div
                      key={coin.pairAddress || index}
                      className="ms-drawer-market"
                      onClick={() => selectCoin(coin)}
                    >
                      <strong>{symbol}/USDT</strong>
                      <span>{formatPrice(coin.priceUsd || coin.price)}</span>
                      <span className={change >= 0 ? "green-text" : "red-text"}>
                        {change.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {moreOpen && (
          <div className="ms-popup">
            <h3>{t("moreOptions")}</h3>
            <p onClick={() => setPage && setPage("orders")}>{t("openOrders")}</p>
            <p onClick={() => setPage && setPage("transactions")}>
              {t("tradeHistory")}
            </p>
            <p onClick={() => setPage && setPage("wallets")}>{t("assetsWallet")}</p>
            <button onClick={() => setMoreOpen(false)}>{t("close")}</button>
          </div>
        )}

        <div className="ms-bottom-nav">
          <button onClick={() => setPage && setPage("dashboard")}>
            ⌂<span>Home</span>
          </button>
          <button onClick={() => setPage && setPage("markets")}>
            ⌁<span>Markets</span>
          </button>
          <button
            className="active"
            onClick={() => setPage && setPage("trade")}
          >
            ⇄<span>Trade</span>
          </button>
          <button onClick={() => setPage && setPage("futures")}>
            ▣<span>Futures</span>
          </button>
          <button onClick={() => setPage && setPage("wallets")}>
            ▤<span>Assets</span>
          </button>
        </div>
      </div>

      <div className="desktop-spot-view">
        <div className="trade-layout">
          <div className="trade-sidebar">
           <h2>{t("liveMarkets")}</h2>

            <input
              type="text"
              placeholder={t("searchCoin")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="market-search support-input"
            />

            {marketLoading && <p>{t("loadingMarkets")}</p>}
            {marketError && <p className="red-text">{marketError}</p>}

            {!marketLoading &&
              !marketError &&
              filteredCoins.map((coin, index) => {
                const symbol = coin.baseToken?.symbol || coin.symbol || "COIN";
                const change = Number(coin.priceChange?.h24 || 0);

                return (
                  <div
                    key={coin.pairAddress || index}
                    className={`coin-item ${
                      selectedCoin?.pairAddress === coin.pairAddress
                        ? "active-coin"
                        : ""
                    }`}
                    onClick={() => setSelectedCoin(coin)}
                  >
                    <div>
                      <strong>{symbol}/USDT</strong>
                      <p>${formatPrice(coin.priceUsd || coin.price)}</p>
                    </div>

                    <span className={change >= 0 ? "green-text" : "red-text"}>
                      {change.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
          </div>

          <div className="trade-main">
            <div className="trade-header">
              <div className="trade-title">
                <div>
                  <h2>{selectedSymbol}/USDT</h2>
                  <p className={priceChange >= 0 ? "green-text" : "red-text"}>
                    ${formatPrice(selectedPrice)} • {priceChange.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mobile-trade-grid">
              <div className="spot-order-panel trade-panel">
                <h2 className="spot-title">{t("spotOrder")}</h2>

                <div className="spot-form">
                  <div className="filter-row">
                    <button
                      className={type === "buy" ? "buy-btn" : "tab"}
                      onClick={() => setType("buy")}
                      type="button"
                    >
                    {t("buy")} 
                    </button>
                    <button
                      className={type === "sell" ? "sell-btn" : "tab"}
                      onClick={() => setType("sell")}
                      type="button"
                    >
                      {t("sell")}
                    </button>
                  </div>

                  <select
                    value={orderMode}
                    onChange={(e) => setOrderMode(e.target.value)}
                  >
                   <option value="market">{t("marketOrder")}</option>
                    <option value="limit">{t("limitOrder")}</option>
                  </select>

                  <input
                    type="number"
                    placeholder={
                      orderMode === "market"
                        ? `Market Price: ${formatPrice(selectedPrice)}`
                        : t("limitPrice")
                    }
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={orderMode === "market"}
                  />

                  <input
                    type="number"
                    placeholder={
                      type === "buy"
                        ? t("amountInBNB")
                        : t("amount")
                    }
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
<button
  disabled={loading}
  onClick={submitOrder}
  className={type === "buy" ? "execute-buy" : "execute-sell"}
>
  {loading
    ? t("processing")
    : type === "buy"
    ? `Buy ${selectedSymbol}`
    : `Sell ${selectedSymbol}`}
</button>
                  
                </div>
              </div>

              <div className="mobile-orderbook-box">
               <OrderBook
    coin={selectedCoin}
    bids={orderBookData.bids}
    asks={orderBookData.asks}
/>
              </div>
            </div>

            <div className="coin-details-box">
              <h3 className="coin-info-title">{t("coinInfo")}</h3>

              <div className="coin-info-row">
                <span className="coin-label">{t("token")}</span>
                <span className="coin-value">{selectedSymbol}</span>
              </div>

              <div className="coin-info-row">
                <span className="coin-label">{t("price")}</span>
                <span className="coin-value">${formatPrice(selectedPrice)}</span>
              </div>

              <div className="coin-info-row">
                <span className="coin-label">{t("liquidity")}</span>
                <span className="coin-value">
                  ${Number(selectedCoin?.liquidity?.usd || 0).toLocaleString()}
                </span>
              </div>

              <div className="coin-info-row">
                <span className="coin-label">{t("contract")}</span>
                <span className="coin-value">
                  {selectedCoin?.baseToken?.address || EXALT}
                </span>
              </div>
            </div>
<div className="trade-live-section">
  <h3>My Orders</h3>
  {myOrders.length === 0 ? (
    <p>No orders yet.</p>
  ) : (
    myOrders.slice(0, 8).map((order) => (
      <div className="order-line" key={order._id}>
        <div>
          <strong>{order.side?.toUpperCase()} {order.pair}</strong>
        <small>
  <span className={`status-badge ${order.status}`}>
    {order.status.toUpperCase()}
  </span>

  {" • "}Filled {Number(order.filled || 0).toFixed(4)}

  {" • "}Remaining {Number(order.remaining || 0).toFixed(4)}
</small>
<div className="order-progress">
  <div
    className="order-progress-fill"
    style={{
      width: `${Math.min(
        100,
        (Number(order.filled || 0) / Number(order.amount || 1)) * 100
      )}%`,
    }}
  />
</div>
        </div>
       <span>
  ${formatPrice(order.averagePrice || order.price)}
</span>
        {["open", "partial"].includes(order.status) && (
          <button className="cancel-order-btn" onClick={() => cancelOrder(order._id)}>
            Cancel
          </button>
        )}
      </div>
    ))
  )}
</div>

<div className="trade-live-section">
  <h3>Trade History</h3>
  {tradeHistory.length === 0 ? (
    <p>No trades yet.</p>
  ) : (
    tradeHistory.slice(0, 8).map((trade) => (
      <div className="trade-line" key={trade._id}>
        <div>
          <strong>{trade.pair}</strong>
          <small>{new Date(trade.createdAt).toLocaleString()}</small>
        </div>
        <span>{Number(trade.amount || 0).toFixed(4)}</span>
        <b>${formatPrice(trade.price)}</b>
      </div>
    ))
  )}
</div>
            {selectedCoin && (
              <div className="mobile-chart-box chart-panel">
                <Tradingchart
                  selectedCoin={{
                    ...selectedCoin,
                    chartSymbol: `${selectedSymbol}USDT`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trade;