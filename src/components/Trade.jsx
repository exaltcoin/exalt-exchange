import React, { useEffect, useMemo, useState } from "react";
import { socket } from "../api";
import Tradingchart from "./Tradingchart";
import OrderBook from "./OrderBook";
import { ethers } from "ethers";
import "./Trade.css";

function Trade({ setPage }) {
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://exalt-real-backend-6b6v.onrender.com";

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

  const selectedSymbol = selectedCoin?.baseToken?.symbol || "EXALT";

  const selectedPrice =
    binancePrices[`${selectedSymbol}USDT`] ||
    Number(selectedCoin?.priceUsd || selectedCoin?.price || 0);

  const priceChange = Number(selectedCoin?.priceChange?.h24 || 0);

  const shortAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Connect Wallet";

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
        alert("Please install MetaMask or Trust Wallet");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setWallet(accounts[0]);
      localStorage.setItem("trade_wallet", accounts[0]);
      alert("Wallet connected successfully");
    } catch (error) {
      console.log(error);
      alert("Wallet connection failed");
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
        alert("Enter BNB amount first");
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
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!selectedCoin) {
        alert("Select coin first");
        return;
      }

      if (!amount || Number(amount) <= 0) {
        alert("Amount required");
        return;
      }

      if (orderMode === "limit" && (!price || Number(price) <= 0)) {
        alert("Limit price required");
        return;
      }

      setLoading(true);

      const finalPrice =
        orderMode === "market" ? selectedPrice : Number(price || 0);

      const pair = `${selectedSymbol}USDT`;

      const payload = {
        userId: user._id || user.id || "demo-user",
        pair,
        type,
        orderMode,
        price: finalPrice,
        amount: Number(amount),
      };

      socket.emit("newOrder", payload);

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(payload),
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

  const selectCoin = (coin) => {
    setSelectedCoin(coin);
    setMarketDrawerOpen(false);
  };

  useEffect(() => {
    const savedWallet = localStorage.getItem("trade_wallet");
    if (savedWallet) setWallet(savedWallet);

    const loadMarkets = async () => {
      try {
        setMarketError("");
        setMarketLoading(true);

        const res = await fetch(`${API_BASE}/api/market/live`);
        const response = await res.json();

        const pairs = response?.data?.pairs || [];

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
    const interval = setInterval(loadMarkets, 15000);

    return () => clearInterval(interval);
  }, [API_BASE]);

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
                Buy
              </button>

              <button
                className={type === "sell" ? "active-sell" : ""}
                onClick={() => setType("sell")}
              >
                Sell
              </button>
            </div>

            <select
              value={orderMode}
              onChange={(e) => setOrderMode(e.target.value)}
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
            </select>

            {orderMode === "limit" && (
              <input
                type="number"
                placeholder="Limit Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            )}

            <div className="ms-amount-box">
              <input
                type="number"
                placeholder={type === "buy" ? "Amount" : selectedSymbol}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span>{type === "buy" ? "USDT" : selectedSymbol}</span>
            </div>

            <div className="ms-slider">
              <span onClick={() => setAmount("25")}></span>
              <span onClick={() => setAmount("50")}></span>
              <span onClick={() => setAmount("75")}></span>
              <span onClick={() => setAmount("100")}></span>
            </div>

            <p className="ms-balance">Available: 0.00 USDT</p>

            <button
              disabled={loading}
              onClick={
                selectedSymbol === "EXALT" && type === "buy"
                  ? buyExalt
                  : submitOrder
              }
              className={type === "buy" ? "ms-main-buy" : "ms-main-sell"}
            >
              {loading
                ? "Processing..."
                : type === "buy"
                ? `Buy ${selectedSymbol}`
                : `Sell ${selectedSymbol}`}
            </button>
          </div>

          <div className="ms-orderbook">
            <OrderBook coin={selectedCoin} />
          </div>
        </div>

        <div className="ms-info-card">
          <h3>Coin Info</h3>
          <p>
            <span>Token</span>
            <b>{selectedSymbol}</b>
          </p>
          <p>
            <span>Price</span>
            <b>${formatPrice(selectedPrice)}</b>
          </p>
          <p>
            <span>Liquidity</span>
            <b>${Number(selectedCoin?.liquidity?.usd || 0).toLocaleString()}</b>
          </p>
          <p>
            <span>Contract</span>
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
              <h3>Spot Markets</h3>

              <input
                placeholder="Search coin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {marketLoading && <p>Loading markets...</p>}
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
            <h3>More Options</h3>
            <p onClick={connectWallet}>{shortAddress(wallet)}</p>
            <p onClick={() => setPage && setPage("orders")}>Open Orders</p>
            <p onClick={() => setPage && setPage("transactions")}>
              Trade History
            </p>
            <p onClick={() => setPage && setPage("wallets")}>Assets / Wallet</p>
            <button onClick={() => setMoreOpen(false)}>Close</button>
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
            <h2>Live Markets</h2>

            <input
              type="text"
              placeholder="Search coin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="market-search support-input"
            />

            {marketLoading && <p>Loading markets...</p>}
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

              <button onClick={connectWallet} className="connect-btn">
                {shortAddress(wallet)}
              </button>
            </div>

            <div className="mobile-trade-grid">
              <div className="spot-order-panel trade-panel">
                <h2 className="spot-title">Spot Order</h2>

                <div className="spot-form">
                  <div className="filter-row">
                    <button
                      className={type === "buy" ? "buy-btn" : "tab"}
                      onClick={() => setType("buy")}
                      type="button"
                    >
                      BUY
                    </button>
                    <button
                      className={type === "sell" ? "sell-btn" : "tab"}
                      onClick={() => setType("sell")}
                      type="button"
                    >
                      SELL
                    </button>
                  </div>

                  <select
                    value={orderMode}
                    onChange={(e) => setOrderMode(e.target.value)}
                  >
                    <option value="market">Market Order</option>
                    <option value="limit">Limit Order</option>
                  </select>

                  <input
                    type="number"
                    placeholder={
                      orderMode === "market"
                        ? `Market Price: ${formatPrice(selectedPrice)}`
                        : "Limit Price"
                    }
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={orderMode === "market"}
                  />

                  <input
                    type="number"
                    placeholder={
                      type === "buy"
                        ? "Amount in BNB / USDT"
                        : `Amount ${selectedSymbol}`
                    }
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />

                  <button
                    disabled={loading}
                    onClick={
                      selectedSymbol === "EXALT" && type === "buy"
                        ? buyExalt
                        : submitOrder
                    }
                    className={type === "buy" ? "execute-buy" : "execute-sell"}
                  >
                    {loading
                      ? "Processing..."
                      : type === "buy"
                      ? `Buy ${selectedSymbol}`
                      : `Sell ${selectedSymbol}`}
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
                <span className="coin-value">{selectedSymbol}</span>
              </div>

              <div className="coin-info-row">
                <span className="coin-label">Price</span>
                <span className="coin-value">${formatPrice(selectedPrice)}</span>
              </div>

              <div className="coin-info-row">
                <span className="coin-label">Liquidity</span>
                <span className="coin-value">
                  ${Number(selectedCoin?.liquidity?.usd || 0).toLocaleString()}
                </span>
              </div>

              <div className="coin-info-row">
                <span className="coin-label">Contract</span>
                <span className="coin-value">
                  {selectedCoin?.baseToken?.address || EXALT}
                </span>
              </div>
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