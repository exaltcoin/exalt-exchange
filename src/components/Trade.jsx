import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ethers } from "ethers";

import { useI18n } from "../i18n/index.js";
import API_BASE_URL, { socket } from "../api";
import Tradingchart from "./Tradingchart";
import OrderBook from "./OrderBook";
import "./Trade.css";

const DEFAULT_API_BASE =
  "https://exalt-real-backend-6b6v.onrender.com";

const PANCAKE_ROUTER =
  "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const WBNB =
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

const EXALT =
  "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

const EXALT_MARKET = {
  pairAddress: "EXALT-USDT",
  baseToken: {
    symbol: "EXALT",
    name: "Exalt Coin",
    address: EXALT,
  },
  quoteToken: {
    symbol: "USDT",
  },
  priceUsd: 0,
  price: 0,
  priceChange: {
    h24: 0,
  },
  liquidity: {
    usd: 0,
  },
  source: "EXALT_INTERNAL",
};

const normalizeApiBase = (value) => {
  const normalizedBase = String(
    value || DEFAULT_API_BASE
  )
    .trim()
    .replace(/\/+$/, "");

  return normalizedBase.endsWith("/api")
    ? normalizedBase.slice(0, -4)
    : normalizedBase;
};

function Trade({ setPage }) {
  const { t } = useI18n();

  const API = useMemo(
    () => normalizeApiBase(API_BASE_URL),
    []
  );

  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] =
    useState(null);

  const [type, setType] = useState("buy");
  const [orderMode, setOrderMode] =
    useState("market");

  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [marketLoading, setMarketLoading] =
    useState(true);

  const [marketError, setMarketError] =
    useState("");

  const [search, setSearch] = useState("");
  const [wallet, setWallet] = useState("");

  const [spotTab, setSpotTab] = useState("Spot");

  const [
    marketDrawerOpen,
    setMarketDrawerOpen,
  ] = useState(false);

  const [moreOpen, setMoreOpen] =
    useState(false);

  const [chartOpen, setChartOpen] =
    useState(false);

  const [binancePrices, setBinancePrices] =
    useState({});

  const [walletData, setWalletData] =
    useState(null);

  const [myOrders, setMyOrders] = useState([]);
  const [tradeHistory, setTradeHistory] =
    useState([]);

  const [orderBookData, setOrderBookData] =
    useState({
      bids: [],
      asks: [],
    });

  const translateWithFallback = (
    key,
    fallback,
    namespace = "trading"
  ) => {
    try {
      const translatedValue = t(key, {
        ns: namespace,
        defaultValue: fallback,
      });

      if (
        translatedValue === undefined ||
        translatedValue === null ||
        translatedValue === key ||
        String(translatedValue).trim() === ""
      ) {
        return fallback;
      }

      return translatedValue;
    } catch (error) {
      console.error(
        `Trade translation failed for "${key}":`,
        error
      );

      return fallback;
    }
  };

  const selectedSymbol =
    selectedCoin?.baseToken?.symbol ||
    selectedCoin?.symbol ||
    "EXALT";

  const tradingPair = `${selectedSymbol}/USDT`;

  const selectedPrice =
    Number(
      binancePrices[
        `${selectedSymbol}USDT`
      ] ||
        selectedCoin?.priceUsd ||
        selectedCoin?.price ||
        0
    ) || 0;

  const priceChange = Number(
    selectedCoin?.priceChange?.h24 || 0
  );

  const availableBalance =
    type === "buy"
      ? Number(
          walletData?.balances?.USDT || 0
        )
      : Number(
          walletData?.balances?.[
            selectedSymbol
          ] || 0
        );

  const shortAddress = (address) =>
    address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : translateWithFallback(
          "connectWallet",
          "Connect Wallet",
          "web3"
        );

  const formatPrice = (value) => {
    const numericValue = Number(value || 0);

    if (!Number.isFinite(numericValue)) {
      return "0.000000";
    }

    if (numericValue === 0) {
      return "0.000000";
    }

    if (numericValue < 0.000001) {
      return numericValue.toFixed(10);
    }

    if (numericValue < 0.01) {
      return numericValue.toFixed(8);
    }

    return numericValue.toFixed(6);
  };

  const filteredCoins = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return coins.filter((coin) => {
      const symbol = String(
        coin?.baseToken?.symbol ||
          coin?.symbol ||
          ""
      ).toLowerCase();

      const name = String(
        coin?.baseToken?.name ||
          coin?.name ||
          ""
      ).toLowerCase();

      return (
        !keyword ||
        symbol.includes(keyword) ||
        name.includes(keyword)
      );
    });
  }, [coins, search]);

  const requestJson = useCallback(
    async (url, options = {}) => {
      const response = await fetch(url, options);

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const error = new Error(
          data?.message ||
            `Request failed with status ${response.status}`
        );

        error.status = response.status;
        error.data = data;

        throw error;
      }

      return data;
    },
    []
  );

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        window.alert(
          translateWithFallback(
            "installWallet",
            "Please install MetaMask or Trust Wallet.",
            "web3"
          )
        );
        return;
      }

      const accounts =
        await window.ethereum.request({
          method: "eth_requestAccounts",
        });

      if (!accounts?.length) {
        window.alert(
          translateWithFallback(
            "noWalletAccountFound",
            "No wallet account found.",
            "web3"
          )
        );
        return;
      }

      setWallet(accounts[0]);

      localStorage.setItem(
        "trade_wallet",
        accounts[0]
      );

      window.alert(
        translateWithFallback(
          "walletConnected",
          "Wallet connected successfully.",
          "web3"
        )
      );
    } catch (error) {
      console.error(
        "Trade wallet connection failed:",
        error
      );

      window.alert(
        translateWithFallback(
          "walletConnectionFailed",
          "Wallet connection failed.",
          "web3"
        )
      );
    }
  };

  const switchToBSC = async () => {
    if (!window.ethereum) {
      throw new Error("Wallet provider not found.");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: "0x38",
          },
        ],
      });
    } catch (switchError) {
      if (switchError?.code !== 4902) {
        throw switchError;
      }

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x38",
            chainName: "BNB Smart Chain",
            nativeCurrency: {
              name: "BNB",
              symbol: "BNB",
              decimals: 18,
            },
            rpcUrls: [
              "https://bsc-dataseed.binance.org/",
            ],
            blockExplorerUrls: [
              "https://bscscan.com",
            ],
          },
        ],
      });
    }
  };

  const buyExalt = async () => {
    if (!amount || Number(amount) <= 0) {
      window.alert(
        translateWithFallback(
          "enterValidAmount",
          "Please enter a valid amount."
        )
      );
      return;
    }

    if (!window.ethereum) {
      window.alert(
        translateWithFallback(
          "installWallet",
          "Please install MetaMask or Trust Wallet.",
          "web3"
        )
      );
      return;
    }

    setLoading(true);

    try {
      await switchToBSC();

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer = await provider.getSigner();

      const router = new ethers.Contract(
        PANCAKE_ROUTER,
        [
          "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin,address[] calldata path,address to,uint256 deadline) external payable",
        ],
        signer
      );

      const transaction =
        await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
          0,
          [WBNB, EXALT],
          await signer.getAddress(),
          Math.floor(Date.now() / 1000) +
            60 * 20,
          {
            value: ethers.parseEther(
              String(amount)
            ),
          }
        );

      await transaction.wait();

      window.alert(
        translateWithFallback(
          "exaltPurchasedSuccessfully",
          "EXALT purchased successfully."
        )
      );

      setAmount("");
    } catch (error) {
      console.error(
        "EXALT purchase failed:",
        error
      );

      window.alert(
        error?.shortMessage ||
          error?.message ||
          translateWithFallback(
            "transactionFailed",
            "Transaction failed."
          )
      );
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance =
    useCallback(async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setWalletData(null);
        return;
      }

      try {
        const data = await requestJson(
          `${API}/api/wallets/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (data?.success) {
          setWalletData(data.wallet || null);
        }
      } catch (error) {
        console.error(
          "Trade wallet balance error:",
          error
        );

        if (error?.status === 401) {
          setWalletData(null);
        }
      }
    }, [API, requestJson]);

  const loadOrderBook = useCallback(async () => {
    if (!tradingPair) {
      return;
    }

    try {
      const encodedPair =
        encodeURIComponent(tradingPair);

      const data = await requestJson(
        `${API}/api/trades/orderbook/${encodedPair}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (data?.success) {
        setOrderBookData({
          bids: Array.isArray(data?.bids)
            ? data.bids
            : [],

          asks: Array.isArray(data?.asks)
            ? data.asks
            : [],
        });
      }
    } catch (error) {
      console.error(
        "Trade order book error:",
        error
      );
    }
  }, [API, requestJson, tradingPair]);

  const loadTradeHistory =
    useCallback(async () => {
      if (!tradingPair) {
        return;
      }

      try {
        const encodedPair =
          encodeURIComponent(tradingPair);

        const data = await requestJson(
          `${API}/api/trades/history/${encodedPair}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (data?.success) {
          setTradeHistory(
            Array.isArray(data?.trades)
              ? data.trades
              : []
          );
        }
      } catch (error) {
        console.error(
          "Trade history error:",
          error
        );
      }
    }, [API, requestJson, tradingPair]);

  const loadMyOrders = useCallback(async () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setMyOrders([]);
      return;
    }

    try {
      const data = await requestJson(
        `${API}/api/trades/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (data?.success) {
        setMyOrders(
          Array.isArray(data?.orders)
            ? data.orders
            : []
        );
      }
    } catch (error) {
      console.error(
        "My orders error:",
        error
      );

      if (error?.status === 401) {
        setMyOrders([]);
      }
    }
  }, [API, requestJson]);

  const refreshTradeData = useCallback(
    async () => {
      await Promise.allSettled([
        loadWalletBalance(),
        loadOrderBook(),
        loadTradeHistory(),
        loadMyOrders(),
      ]);
    },
    [
      loadMyOrders,
      loadOrderBook,
      loadTradeHistory,
      loadWalletBalance,
    ]
  );

  const submitOrder = async () => {
    if (!selectedCoin) {
      window.alert(
        translateWithFallback(
          "selectCoinFirst",
          "Select a coin first."
        )
      );
      return;
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      window.alert(
        translateWithFallback(
          "enterValidAmount",
          "Please enter a valid amount."
        )
      );
      return;
    }

    const finalPrice =
      orderMode === "market"
        ? Number(selectedPrice)
        : Number(price);

    if (
      orderMode === "limit" &&
      (!Number.isFinite(finalPrice) ||
        finalPrice <= 0)
    ) {
      window.alert(
        translateWithFallback(
          "enterValidPrice",
          "Please enter a valid limit price."
        )
      );
      return;
    }

    if (
      orderMode === "market" &&
      (!Number.isFinite(finalPrice) ||
        finalPrice <= 0)
    ) {
      window.alert(
        translateWithFallback(
          "marketPriceUnavailable",
          "Live market price is unavailable."
        )
      );
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      window.alert(
        translateWithFallback(
          "pleaseLoginFirst",
          "Please login first.",
          "common"
        )
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        pair: tradingPair,
        side: type,
        type: orderMode,
        price: finalPrice,
        amount: numericAmount,
      };

      const data = await requestJson(
        `${API}/api/trades/order`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Order submission failed."
        );
      }

      socket.emit("orderCreated", {
        ...data,
        pair: tradingPair,
      });

      socket.emit(
        "refreshOrderBook",
        tradingPair
      );

      socket.emit(
        "refreshTrades",
        tradingPair
      );

      window.alert(
        translateWithFallback(
          "orderPlacedSuccessfully",
          "Order submitted successfully."
        )
      );

      setPrice("");
      setAmount("");

      await refreshTradeData();
    } catch (error) {
      console.error(
        "Order submission failed:",
        error
      );

      window.alert(
        error?.message ||
          translateWithFallback(
            "orderFailed",
            "Order failed."
          )
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      window.alert(
        translateWithFallback(
          "pleaseLoginFirst",
          "Please login first.",
          "common"
        )
      );
      return;
    }

    if (!orderId) {
      window.alert(
        translateWithFallback(
          "orderIdMissing",
          "Order ID is missing."
        )
      );
      return;
    }

    const confirmed = window.confirm(
      translateWithFallback(
        "confirmCancelOrder",
        "Are you sure you want to cancel this order?"
      )
    );

    if (!confirmed) {
      return;
    }

    try {
      const data = await requestJson(
        `${API}/api/trades/order/${orderId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Order cancellation failed."
        );
      }

      socket.emit("orderCancelled", {
        pair: tradingPair,
        orderId,
      });

      window.alert(
        translateWithFallback(
          "orderCancelledSuccessfully",
          "Order cancelled successfully."
        )
      );

      await refreshTradeData();
    } catch (error) {
      console.error(
        "Order cancellation failed:",
        error
      );

      window.alert(
        error?.message ||
          translateWithFallback(
            "cancelOrderFailed",
            "Cancel order failed."
          )
      );
    }
  };

  const selectCoin = (coin) => {
    setSelectedCoin(coin);
    setMarketDrawerOpen(false);
    setPrice("");
    setAmount("");
  };

  const loadMarkets = useCallback(async () => {
    setMarketError("");
    setMarketLoading(true);

    try {
      const data = await requestJson(
        `${API}/api/market/live`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      let pairs =
        data?.data?.pairs ||
        data?.pairs ||
        data?.coins ||
        data?.data ||
        [];

      pairs = Array.isArray(pairs)
        ? pairs
        : [];

      const hasExalt = pairs.some(
        (pair) =>
          String(
            pair?.baseToken?.symbol ||
              pair?.symbol ||
              ""
          ).toUpperCase() === "EXALT"
      );

      if (!hasExalt) {
        pairs = [EXALT_MARKET, ...pairs];
      }

      if (pairs.length === 0) {
        setCoins([]);

        setMarketError(
          translateWithFallback(
            "noMarketData",
            "No market data found.",
            "markets"
          )
        );

        return;
      }

      const initialPrices = {};

      pairs.forEach((item) => {
        const symbol = String(
          item?.baseToken?.symbol ||
            item?.symbol ||
            ""
        ).toUpperCase();

        if (!symbol) {
          return;
        }

        initialPrices[`${symbol}USDT`] =
          Number(
            item?.priceUsd ||
              item?.price ||
              0
          );
      });

      setBinancePrices(initialPrices);
      setCoins(pairs);

      setSelectedCoin((previousCoin) => {
        if (previousCoin) {
          const previousSymbol = String(
            previousCoin?.baseToken?.symbol ||
              previousCoin?.symbol ||
              ""
          ).toUpperCase();

          const existingCoin = pairs.find(
            (pair) =>
              String(
                pair?.baseToken?.symbol ||
                  pair?.symbol ||
                  ""
              ).toUpperCase() ===
              previousSymbol
          );

          if (existingCoin) {
            return existingCoin;
          }
        }

        return (
          pairs.find(
            (pair) =>
              String(
                pair?.baseToken?.symbol ||
                  pair?.symbol ||
                  ""
              ).toUpperCase() === "EXALT"
          ) || pairs[0]
        );
      });
    } catch (error) {
      console.error(
        "Trade market loading error:",
        error
      );

      setMarketError(
        translateWithFallback(
          "failedLoadMarkets",
          "Failed to load live market data.",
          "markets"
        )
      );
    } finally {
      setMarketLoading(false);
    }
  }, [API, requestJson]);

  useEffect(() => {
    const savedWallet =
      localStorage.getItem("trade_wallet");

    if (savedWallet) {
      setWallet(savedWallet);
    }

    loadMarkets();

    const intervalId =
      window.setInterval(
        loadMarkets,
        120000
      );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadMarkets]);

  useEffect(() => {
    if (!selectedCoin) {
      return;
    }

    refreshTradeData();

    const intervalId =
      window.setInterval(
        refreshTradeData,
        15000
      );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    refreshTradeData,
    selectedCoin,
    tradingPair,
  ]);

  useEffect(() => {
    const handleMarketUpdate = (data) => {
      if (!data?.symbol || !data?.price) {
        return;
      }

      const symbol = String(
        data.symbol
      ).toUpperCase();

      const numericPrice = Number(
        data.price
      );

      if (!Number.isFinite(numericPrice)) {
        return;
      }

      setBinancePrices(
        (previousPrices) => ({
          ...previousPrices,
          [symbol]: numericPrice,
        })
      );

      setCoins((previousCoins) =>
        previousCoins.map((coin) => {
          const coinSymbol = String(
            coin?.baseToken?.symbol ||
              coin?.symbol ||
              ""
          ).toUpperCase();

          const pairSymbol =
            `${coinSymbol}USDT`;

          if (pairSymbol !== symbol) {
            return coin;
          }

          return {
            ...coin,
            priceUsd: numericPrice,
            source: "BINANCE_SOCKET_LIVE",
          };
        })
      );
    };

    const handleTradingUpdate = (data) => {
      if (
        data?.pair &&
        data.pair !== tradingPair
      ) {
        return;
      }

      refreshTradeData();
    };

    socket.on(
      "marketUpdate",
      handleMarketUpdate
    );

    socket.on(
      "orderMatched",
      handleTradingUpdate
    );

    socket.on(
      "orderCreated",
      handleTradingUpdate
    );

    socket.on(
      "orderCancelled",
      handleTradingUpdate
    );

    return () => {
      socket.off(
        "marketUpdate",
        handleMarketUpdate
      );

      socket.off(
        "orderMatched",
        handleTradingUpdate
      );

      socket.off(
        "orderCreated",
        handleTradingUpdate
      );

      socket.off(
        "orderCancelled",
        handleTradingUpdate
      );
    };
  }, [
    refreshTradeData,
    tradingPair,
  ]);

  const setPercentageAmount = (
    percentage
  ) => {
    if (
      !availableBalance ||
      availableBalance <= 0
    ) {
      return;
    }

    if (type === "buy") {
      const usableBalance =
        (availableBalance * percentage) /
        100;

      const referencePrice =
        orderMode === "limit"
          ? Number(price || selectedPrice)
          : Number(selectedPrice);

      if (
        !referencePrice ||
        referencePrice <= 0
      ) {
        return;
      }

      const calculatedAmount =
        usableBalance / referencePrice;

      setAmount(
        String(
          Number(
            calculatedAmount
          ).toFixed(6)
        )
      );

      return;
    }

    const calculatedAmount =
      (availableBalance * percentage) /
      100;

    setAmount(
      String(
        Number(
          calculatedAmount
        ).toFixed(6)
      )
    );
  };

  const renderOrderStatus = (status) =>
    String(status || "pending")
      .replaceAll("_", " ")
      .toUpperCase();

  const mobileTabs = [
    ["Convert", "convert"],
    ["Spot", "spot"],
    ["P2P", "p2p"],
    ["Alpha", "alpha"],
  ];

  return (
    <main className="trade-page-pro">
      <section className="mobile-spot-view">
        <div className="ms-top-tabs">
          {mobileTabs.map(
            ([fallbackLabel, tabKey]) => (
              <button
                type="button"
                key={tabKey}
                className={
                  spotTab === fallbackLabel
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setSpotTab(fallbackLabel);

                  if (
                    tabKey === "p2p" &&
                    setPage
                  ) {
                    setPage("p2p");
                  }
                }}
              >
                {translateWithFallback(
                  tabKey,
                  fallbackLabel
                )}
              </button>
            )
          )}

          <button
            type="button"
            aria-label={translateWithFallback(
              "spotMarkets",
              "Spot Markets"
            )}
            onClick={() =>
              setMarketDrawerOpen(true)
            }
          >
            ☰
          </button>
        </div>

        <div className="ms-pair-head">
          <button
            type="button"
            className="ms-pair-selector"
            onClick={() =>
              setMarketDrawerOpen(true)
            }
          >
            <h2>
              {selectedSymbol}/USDT ▾
            </h2>

            <p
              className={
                priceChange >= 0
                  ? "green-text"
                  : "red-text"
              }
            >
              ${formatPrice(selectedPrice)} •{" "}
              {priceChange.toFixed(2)}%
            </p>
          </button>

          <div className="ms-icons">
            <button
              type="button"
              aria-label={translateWithFallback(
                "spotMarkets",
                "Spot Markets"
              )}
              onClick={() =>
                setMarketDrawerOpen(true)
              }
            >
              📋
            </button>

            <button
              type="button"
              aria-label={translateWithFallback(
                "tradingViewChart",
                "Trading Chart"
              )}
              onClick={() =>
                setChartOpen(
                  (open) => !open
                )
              }
            >
              📊
            </button>

            <button
              type="button"
              aria-label={translateWithFallback(
                "moreOptions",
                "More Options"
              )}
              onClick={() =>
                setMoreOpen(
                  (open) => !open
                )
              }
            >
              ⋯
            </button>
          </div>
        </div>

        {chartOpen && selectedCoin && (
          <div className="ms-chart-box">
            <Tradingchart
              selectedCoin={{
                ...selectedCoin,
                chartSymbol:
                  `${selectedSymbol}USDT`,
              }}
            />
          </div>
        )}

        <div className="ms-trade-grid">
          <section className="ms-order-box">
            <div className="ms-buy-sell">
              <button
                type="button"
                className={
                  type === "buy"
                    ? "active-buy"
                    : ""
                }
                onClick={() => setType("buy")}
              >
                {translateWithFallback(
                  "buy",
                  "Buy"
                )}
              </button>

              <button
                type="button"
                className={
                  type === "sell"
                    ? "active-sell"
                    : ""
                }
                onClick={() => setType("sell")}
              >
                {translateWithFallback(
                  "sell",
                  "Sell"
                )}
              </button>
            </div>

            <select
              value={orderMode}
              onChange={(event) =>
                setOrderMode(
                  event.target.value
                )
              }
            >
              <option value="market">
                {translateWithFallback(
                  "marketOrder",
                  "Market Order"
                )}
              </option>

              <option value="limit">
                {translateWithFallback(
                  "limitOrder",
                  "Limit Order"
                )}
              </option>
            </select>

            {orderMode === "limit" && (
              <input
                type="number"
                min="0"
                step="any"
                placeholder={translateWithFallback(
                  "limitPrice",
                  "Limit Price"
                )}
                value={price}
                onChange={(event) =>
                  setPrice(
                    event.target.value
                  )
                }
              />
            )}

            <div className="ms-amount-box">
              <input
                type="number"
                min="0"
                step="any"
                placeholder={translateWithFallback(
                  "amount",
                  "Amount"
                )}
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
              />

              <span>
                {selectedSymbol}
              </span>
            </div>

            <div className="ms-slider">
              {[25, 50, 75, 100].map(
                (percentage) => (
                  <button
                    type="button"
                    key={percentage}
                    title={`${percentage}%`}
                    onClick={() =>
                      setPercentageAmount(
                        percentage
                      )
                    }
                  >
                    {percentage}%
                  </button>
                )
              )}
            </div>

            <p className="ms-balance">
              {translateWithFallback(
                "available",
                "Available"
              )}
              :{" "}
              {availableBalance.toFixed(4)}{" "}
              {type === "buy"
                ? "USDT"
                : selectedSymbol}
            </p>

            <button
              type="button"
              disabled={loading}
              onClick={submitOrder}
              className={
                type === "buy"
                  ? "ms-main-buy"
                  : "ms-main-sell"
              }
            >
              {loading
                ? translateWithFallback(
                    "processing",
                    "Processing...",
                    "common"
                  )
                : type === "buy"
                ? `${translateWithFallback(
                    "buy",
                    "Buy"
                  )} ${selectedSymbol}`
                : `${translateWithFallback(
                    "sell",
                    "Sell"
                  )} ${selectedSymbol}`}
            </button>
          </section>

          <section className="ms-orderbook">
            <OrderBook
              coin={selectedCoin}
              bids={orderBookData.bids}
              asks={orderBookData.asks}
            />
          </section>
        </div>

        <section className="ms-live-section">
          <h3>
            {translateWithFallback(
              "myOrders",
              "My Orders"
            )}
          </h3>

          {myOrders.length === 0 ? (
            <p>
              {translateWithFallback(
                "noOrdersFound",
                "No orders yet."
              )}
            </p>
          ) : (
            myOrders
              .slice(0, 5)
              .map((order) => (
                <div
                  className="order-line"
                  key={order._id}
                >
                  <div>
                    <strong>
                      {String(
                        order.side || ""
                      ).toUpperCase()}{" "}
                      {order.pair}
                    </strong>

                    <small>
                      <span
                        className={`status-badge ${
                          order.status || ""
                        }`}
                      >
                        {renderOrderStatus(
                          order.status
                        )}
                      </span>

                      {" • "}
                      {translateWithFallback(
                        "filled",
                        "Filled"
                      )}{" "}
                      {Number(
                        order.filled || 0
                      ).toFixed(4)}

                      {" • "}
                      {translateWithFallback(
                        "remaining",
                        "Remaining"
                      )}{" "}
                      {Number(
                        order.remaining || 0
                      ).toFixed(4)}
                    </small>

                    <div className="order-progress">
                      <div
                        className="order-progress-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            (Number(
                              order.filled ||
                                0
                            ) /
                              Number(
                                order.amount ||
                                  1
                              )) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <span>
                    $
                    {formatPrice(
                      order.averagePrice ||
                        order.price
                    )}
                  </span>

                  {[
                    "open",
                    "partial",
                  ].includes(
                    order.status
                  ) && (
                    <button
                      type="button"
                      className="cancel-order-btn"
                      onClick={() =>
                        cancelOrder(
                          order._id
                        )
                      }
                    >
                      {translateWithFallback(
                        "cancel",
                        "Cancel",
                        "common"
                      )}
                    </button>
                  )}
                </div>
              ))
          )}
        </section>

        <section className="ms-live-section">
          <h3>
            {translateWithFallback(
              "tradeHistory",
              "Trade History"
            )}
          </h3>

          {tradeHistory.length === 0 ? (
            <p>
              {translateWithFallback(
                "noTradeHistory",
                "No trades yet."
              )}
            </p>
          ) : (
            tradeHistory
              .slice(0, 5)
              .map((trade) => (
                <div
                  className="trade-line"
                  key={trade._id}
                >
                  <div>
                    <strong>
                      {trade.pair}
                    </strong>

                    <small>
                      {trade.createdAt
                        ? new Date(
                            trade.createdAt
                          ).toLocaleString()
                        : ""}
                    </small>
                  </div>

                  <span>
                    {Number(
                      trade.amount || 0
                    ).toFixed(4)}
                  </span>

                  <b>
                    $
                    {formatPrice(
                      trade.price
                    )}
                  </b>
                </div>
              ))
          )}
        </section>

        <section className="ms-info-card">
          <h3>
            {translateWithFallback(
              "coinInfo",
              "Coin Info"
            )}
          </h3>

          <p>
            <span>
              {translateWithFallback(
                "token",
                "Token"
              )}
            </span>

            <b>{selectedSymbol}</b>
          </p>

          <p>
            <span>
              {translateWithFallback(
                "price",
                "Price"
              )}
            </span>

            <b>
              ${formatPrice(selectedPrice)}
            </b>
          </p>

          <p>
            <span>
              {translateWithFallback(
                "liquidity",
                "Liquidity",
                "markets"
              )}
            </span>

            <b>
              $
              {Number(
                selectedCoin?.liquidity
                  ?.usd || 0
              ).toLocaleString()}
            </b>
          </p>

          <p>
            <span>
              {translateWithFallback(
                "contract",
                "Contract",
                "markets"
              )}
            </span>

            <b>
              {selectedCoin?.baseToken
                ?.address || EXALT}
            </b>
          </p>
        </section>

        {marketDrawerOpen && (
          <div
            className="ms-drawer-overlay"
            role="presentation"
            onClick={() =>
              setMarketDrawerOpen(false)
            }
          >
            <section
              className="ms-market-drawer"
              role="dialog"
              aria-modal="true"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <h3>
                {translateWithFallback(
                  "spotMarkets",
                  "Spot Markets"
                )}
              </h3>

              <input
                type="search"
                placeholder={translateWithFallback(
                  "searchCoin",
                  "Search coin...",
                  "markets"
                )}
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              {marketLoading && (
                <p>
                  {translateWithFallback(
                    "loadingMarkets",
                    "Loading markets...",
                    "markets"
                  )}
                </p>
              )}

              {marketError && (
                <p className="red-text">
                  {marketError}
                </p>
              )}

              {!marketLoading &&
                !marketError &&
                filteredCoins.map(
                  (coin, index) => {
                    const symbol =
                      coin?.baseToken
                        ?.symbol ||
                      coin?.symbol ||
                      "COIN";

                    const change = Number(
                      coin?.priceChange?.h24 ||
                        0
                    );

                    return (
                      <button
                        type="button"
                        key={
                          coin?.pairAddress ||
                          `${symbol}-${index}`
                        }
                        className="ms-drawer-market"
                        onClick={() =>
                          selectCoin(coin)
                        }
                      >
                        <strong>
                          {symbol}/USDT
                        </strong>

                        <span>
                          {formatPrice(
                            coin?.priceUsd ||
                              coin?.price
                          )}
                        </span>

                        <span
                          className={
                            change >= 0
                              ? "green-text"
                              : "red-text"
                          }
                        >
                          {change.toFixed(
                            2
                          )}
                          %
                        </span>
                      </button>
                    );
                  }
                )}
            </section>
          </div>
        )}

        {moreOpen && (
          <div className="ms-popup">
            <h3>
              {translateWithFallback(
                "moreOptions",
                "More Options"
              )}
            </h3>

            <button
              type="button"
              onClick={() =>
                setPage?.("orders")
              }
            >
              {translateWithFallback(
                "openOrders",
                "Open Orders"
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setPage?.(
                  "transactions"
                )
              }
            >
              {translateWithFallback(
                "tradeHistory",
                "Trade History"
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setPage?.("wallets")
              }
            >
              {translateWithFallback(
                "assetsWallet",
                "Assets / Wallet"
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setMoreOpen(false)
              }
            >
              {translateWithFallback(
                "close",
                "Close",
                "common"
              )}
            </button>
          </div>
        )}

        <nav className="ms-bottom-nav">
          {[
            ["⌂", "dashboard", "Home"],
            ["⌁", "markets", "Markets"],
            ["⇄", "trade", "Trade"],
            ["▣", "futures", "Futures"],
            ["▤", "wallets", "Assets"],
          ].map(
            ([icon, pageName, fallback]) => (
              <button
                type="button"
                key={pageName}
                className={
                  pageName === "trade"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage?.(pageName)
                }
              >
                {icon}
                <span>
                  {translateWithFallback(
                    pageName,
                    fallback,
                    "navigation"
                  )}
                </span>
              </button>
            )
          )}
        </nav>
      </section>

      <section className="desktop-spot-view">
        <div className="trade-layout">
          <aside className="trade-sidebar">
            <div className="trade-sidebar-header">
              <h2>
                {translateWithFallback(
                  "liveMarkets",
                  "Live Markets",
                  "markets"
                )}
              </h2>

              {wallet && (
                <button
                  type="button"
                  className="trade-wallet-chip"
                  onClick={connectWallet}
                >
                  {shortAddress(wallet)}
                </button>
              )}
            </div>

            <input
              type="search"
              placeholder={translateWithFallback(
                "searchCoin",
                "Search coin...",
                "markets"
              )}
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              className="market-search support-input"
            />

            {marketLoading && (
              <p>
                {translateWithFallback(
                  "loadingMarkets",
                  "Loading markets...",
                  "markets"
                )}
              </p>
            )}

            {marketError && (
              <p className="red-text">
                {marketError}
              </p>
            )}

            {!marketLoading &&
              !marketError &&
              filteredCoins.map(
                (coin, index) => {
                  const symbol =
                    coin?.baseToken?.symbol ||
                    coin?.symbol ||
                    "COIN";

                  const change = Number(
                    coin?.priceChange?.h24 ||
                      0
                  );

                  const isActive =
                    String(
                      selectedCoin
                        ?.baseToken
                        ?.symbol ||
                        selectedCoin
                          ?.symbol ||
                        ""
                    ).toUpperCase() ===
                    String(
                      symbol
                    ).toUpperCase();

                  return (
                    <button
                      type="button"
                      key={
                        coin?.pairAddress ||
                        `${symbol}-${index}`
                      }
                      className={`coin-item ${
                        isActive
                          ? "active-coin"
                          : ""
                      }`}
                      onClick={() =>
                        selectCoin(coin)
                      }
                    >
                      <div>
                        <strong>
                          {symbol}/USDT
                        </strong>

                        <p>
                          $
                          {formatPrice(
                            coin?.priceUsd ||
                              coin?.price
                          )}
                        </p>
                      </div>

                      <span
                        className={
                          change >= 0
                            ? "green-text"
                            : "red-text"
                        }
                      >
                        {change.toFixed(2)}%
                      </span>
                    </button>
                  );
                }
              )}
          </aside>

          <section className="trade-main">
            <header className="trade-header">
              <div className="trade-title">
                <div>
                  <h2>
                    {selectedSymbol}/USDT
                  </h2>

                  <p
                    className={
                      priceChange >= 0
                        ? "green-text"
                        : "red-text"
                    }
                  >
                    $
                    {formatPrice(
                      selectedPrice
                    )}{" "}
                    •{" "}
                    {priceChange.toFixed(
                      2
                    )}
                    %
                  </p>
                </div>
              </div>

              {!wallet && (
                <button
                  type="button"
                  className="trade-connect-wallet-btn"
                  onClick={connectWallet}
                >
                  {translateWithFallback(
                    "connectWallet",
                    "Connect Wallet",
                    "web3"
                  )}
                </button>
              )}
            </header>

            <div className="mobile-trade-grid">
              <section className="spot-order-panel trade-panel">
                <h2 className="spot-title">
                  {translateWithFallback(
                    "spotOrder",
                    "Spot Order"
                  )}
                </h2>

                <div className="spot-form">
                  <div className="filter-row">
                    <button
                      className={
                        type === "buy"
                          ? "buy-btn"
                          : "tab"
                      }
                      onClick={() =>
                        setType("buy")
                      }
                      type="button"
                    >
                      {translateWithFallback(
                        "buy",
                        "Buy"
                      )}
                    </button>

                    <button
                      className={
                        type === "sell"
                          ? "sell-btn"
                          : "tab"
                      }
                      onClick={() =>
                        setType("sell")
                      }
                      type="button"
                    >
                      {translateWithFallback(
                        "sell",
                        "Sell"
                      )}
                    </button>
                  </div>

                  <select
                    value={orderMode}
                    onChange={(event) =>
                      setOrderMode(
                        event.target.value
                      )
                    }
                  >
                    <option value="market">
                      {translateWithFallback(
                        "marketOrder",
                        "Market Order"
                      )}
                    </option>

                    <option value="limit">
                      {translateWithFallback(
                        "limitOrder",
                        "Limit Order"
                      )}
                    </option>
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder={
                      orderMode === "market"
                        ? `${translateWithFallback(
                            "marketPrice",
                            "Market Price"
                          )}: ${formatPrice(
                            selectedPrice
                          )}`
                        : translateWithFallback(
                            "limitPrice",
                            "Limit Price"
                          )
                    }
                    value={price}
                    onChange={(event) =>
                      setPrice(
                        event.target.value
                      )
                    }
                    disabled={
                      orderMode === "market"
                    }
                  />

                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder={translateWithFallback(
                      "amount",
                      "Amount"
                    )}
                    value={amount}
                    onChange={(event) =>
                      setAmount(
                        event.target.value
                      )
                    }
                  />

                  <p className="desktop-available-balance">
                    {translateWithFallback(
                      "available",
                      "Available"
                    )}
                    :{" "}
                    {availableBalance.toFixed(
                      4
                    )}{" "}
                    {type === "buy"
                      ? "USDT"
                      : selectedSymbol}
                  </p>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={submitOrder}
                    className={
                      type === "buy"
                        ? "execute-buy"
                        : "execute-sell"
                    }
                  >
                    {loading
                      ? translateWithFallback(
                          "processing",
                          "Processing...",
                          "common"
                        )
                      : type === "buy"
                      ? `${translateWithFallback(
                          "buy",
                          "Buy"
                        )} ${selectedSymbol}`
                      : `${translateWithFallback(
                          "sell",
                          "Sell"
                        )} ${selectedSymbol}`}
                  </button>

                  {selectedSymbol ===
                    "EXALT" &&
                    wallet && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={buyExalt}
                        className="pancake-buy-btn"
                      >
                        {translateWithFallback(
                          "buyExaltOnPancake",
                          "Buy EXALT on PancakeSwap"
                        )}
                      </button>
                    )}
                </div>
              </section>

              <section className="mobile-orderbook-box">
                <OrderBook
                  coin={selectedCoin}
                  bids={
                    orderBookData.bids
                  }
                  asks={
                    orderBookData.asks
                  }
                />
              </section>
            </div>

            <section className="coin-details-box">
              <h3 className="coin-info-title">
                {translateWithFallback(
                  "coinInfo",
                  "Coin Info"
                )}
              </h3>

              <div className="coin-info-row">
                <span className="coin-label">
                  {translateWithFallback(
                    "token",
                    "Token"
                  )}
                </span>

                <span className="coin-value">
                  {selectedSymbol}
                </span>
              </div>

              <div className="coin-info-row">
                <span className="coin-label">
                  {translateWithFallback(
                    "price",
                    "Price"
                  )}
                </span>

                <span className="coin-value">
                  $
                  {formatPrice(
                    selectedPrice
                  )}
                </span>
              </div>

              <div className="coin-info-row">
                <span className="coin-label">
                  {translateWithFallback(
                    "liquidity",
                    "Liquidity",
                    "markets"
                  )}
                </span>

                <span className="coin-value">
                  $
                  {Number(
                    selectedCoin?.liquidity
                      ?.usd || 0
                  ).toLocaleString()}
                </span>
              </div>

              <div className="coin-info-row">
                <span className="coin-label">
                  {translateWithFallback(
                    "contract",
                    "Contract",
                    "markets"
                  )}
                </span>

                <span className="coin-value">
                  {selectedCoin?.baseToken
                    ?.address || EXALT}
                </span>
              </div>
            </section>

            <section className="trade-live-section">
              <h3>
                {translateWithFallback(
                  "myOrders",
                  "My Orders"
                )}
              </h3>

              {myOrders.length === 0 ? (
                <p>
                  {translateWithFallback(
                    "noOrdersFound",
                    "No orders yet."
                  )}
                </p>
              ) : (
                myOrders
                  .slice(0, 8)
                  .map((order) => (
                    <div
                      className="order-line"
                      key={order._id}
                    >
                      <div>
                        <strong>
                          {String(
                            order.side ||
                              ""
                          ).toUpperCase()}{" "}
                          {order.pair}
                        </strong>

                        <small>
                          <span
                            className={`status-badge ${
                              order.status ||
                              ""
                            }`}
                          >
                            {renderOrderStatus(
                              order.status
                            )}
                          </span>

                          {" • "}
                          {translateWithFallback(
                            "filled",
                            "Filled"
                          )}{" "}
                          {Number(
                            order.filled ||
                              0
                          ).toFixed(4)}

                          {" • "}
                          {translateWithFallback(
                            "remaining",
                            "Remaining"
                          )}{" "}
                          {Number(
                            order.remaining ||
                              0
                          ).toFixed(4)}
                        </small>

                        <div className="order-progress">
                          <div
                            className="order-progress-fill"
                            style={{
                              width: `${Math.min(
                                100,
                                (Number(
                                  order.filled ||
                                    0
                                ) /
                                  Number(
                                    order.amount ||
                                      1
                                  )) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <span>
                        $
                        {formatPrice(
                          order.averagePrice ||
                            order.price
                        )}
                      </span>

                      {[
                        "open",
                        "partial",
                      ].includes(
                        order.status
                      ) && (
                        <button
                          type="button"
                          className="cancel-order-btn"
                          onClick={() =>
                            cancelOrder(
                              order._id
                            )
                          }
                        >
                          {translateWithFallback(
                            "cancel",
                            "Cancel",
                            "common"
                          )}
                        </button>
                      )}
                    </div>
                  ))
              )}
            </section>

            <section className="trade-live-section">
              <h3>
                {translateWithFallback(
                  "tradeHistory",
                  "Trade History"
                )}
              </h3>

              {tradeHistory.length === 0 ? (
                <p>
                  {translateWithFallback(
                    "noTradeHistory",
                    "No trades yet."
                  )}
                </p>
              ) : (
                tradeHistory
                  .slice(0, 8)
                  .map((trade) => (
                    <div
                      className="trade-line"
                      key={trade._id}
                    >
                      <div>
                        <strong>
                          {trade.pair}
                        </strong>

                        <small>
                          {trade.createdAt
                            ? new Date(
                                trade.createdAt
                              ).toLocaleString()
                            : ""}
                        </small>
                      </div>

                      <span>
                        {Number(
                          trade.amount ||
                            0
                        ).toFixed(4)}
                      </span>

                      <b>
                        $
                        {formatPrice(
                          trade.price
                        )}
                      </b>
                    </div>
                  ))
              )}
            </section>

            {selectedCoin && (
              <section className="mobile-chart-box chart-panel">
                <Tradingchart
                  selectedCoin={{
                    ...selectedCoin,
                    chartSymbol:
                      `${selectedSymbol}USDT`,
                  }}
                />
              </section>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default Trade;