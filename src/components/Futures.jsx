import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useI18n } from "../i18n/index.js";
import {
  socket,
  openPosition as apiOpenPosition,
  getPositions,
  getFuturesHistory,
  closePosition as apiClosePosition,
} from "../api";

import "./Futures.css";

const DEFAULT_PAIR = "BTCUSDT";
const DEFAULT_PRICE = 68500;

const FALLBACK_PAIRS = [
  { pair: "BTCUSDT", price: 68500, change: 2.4 },
  { pair: "ETHUSDT", price: 3800, change: 1.8 },
  { pair: "BNBUSDT", price: 620, change: 0.9 },
  { pair: "SOLUSDT", price: 170, change: 3.1 },
  { pair: "XRPUSDT", price: 0.62, change: 1.2 },
  { pair: "ADAUSDT", price: 0.45, change: 0.8 },
  { pair: "DOGEUSDT", price: 0.16, change: 4.2 },
  { pair: "TRXUSDT", price: 0.12, change: 0.6 },
  { pair: "TONUSDT", price: 6.5, change: 1.9 },
  { pair: "AVAXUSDT", price: 36, change: 2.1 },
  { pair: "DOTUSDT", price: 7.2, change: 1.4 },
  { pair: "LINKUSDT", price: 18, change: 2.8 },
  { pair: "LTCUSDT", price: 85, change: 1.1 },
  { pair: "EXALTUSDT", price: 0.0003, change: 0 },
];

const TIMEFRAMES = [
  "1m",
  "5m",
  "10m",
  "15m",
  "1h",
  "4h",
  "24h",
  "1W",
  "1M",
];

const TV_INTERVAL_MAP = {
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

const LEVERAGE_OPTIONS = ["5", "10", "20", "50", "100"];

const formatPrice = (value) => {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue) || numericValue === 0) {
    return "0.00";
  }

  if (numericValue < 0.000001) {
    return numericValue.toFixed(10);
  }

  if (numericValue < 0.01) {
    return numericValue.toFixed(8);
  }

  if (numericValue < 1) {
    return numericValue.toFixed(6);
  }

  return numericValue.toFixed(2);
};

function Futures({ setPage }) {
  const { t } = useI18n();

  const [selectedPair, setSelectedPair] =
    useState(DEFAULT_PAIR);

  const [price, setPrice] = useState(
    String(DEFAULT_PRICE)
  );

  const [amount, setAmount] = useState("");
  const [leverage, setLeverage] = useState("10");

  /*
   * This remains a frontend futures balance until the
   * production futures wallet engine is completed in Phase 9.
   */
  const [balance] = useState(5000);

  const [marketPrice, setMarketPrice] =
    useState(DEFAULT_PRICE);

  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);

  const [side, setSide] = useState("long");
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");

  const [livePrices, setLivePrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});

  const [timeframe, setTimeframe] = useState("15m");
  const [candleStyle, setCandleStyle] =
    useState("normal");

  const [chartZoom, setChartZoom] =
    useState("medium");

  const [volatility, setVolatility] =
    useState("normal");

  const [marketSearch, setMarketSearch] =
    useState("");

  const [orderType, setOrderType] =
    useState("Market");

  const [marginMode, setMarginMode] =
    useState("Cross");

  const [showTPSL, setShowTPSL] =
    useState(false);

  const [reduceOnly, setReduceOnly] =
    useState(false);

  const [slippage, setSlippage] =
    useState(false);

  const [mobileTab, setMobileTab] =
    useState("positions");

  const [orderBook, setOrderBook] = useState({
    bids: [],
    asks: [],
  });

  const [activeFuturesTab, setActiveFuturesTab] =
    useState("USDⓈ-M");

  const [
    marketDrawerOpen,
    setMarketDrawerOpen,
  ] = useState(false);

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [moreOpen, setMoreOpen] =
    useState(false);

  const [
    contractMenuOpen,
    setContractMenuOpen,
  ] = useState(false);

  const [quoteCurrency, setQuoteCurrency] =
    useState("USDT");

  const [positionsLoading, setPositionsLoading] =
    useState(false);

  const [submittingPosition, setSubmittingPosition] =
    useState(false);

  const [closingPositionId, setClosingPositionId] =
    useState("");

  const translateWithFallback = (
    key,
    fallback,
    namespace = "futures"
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
        `Futures translation failed for "${key}":`,
        error
      );

      return fallback;
    }
  };

  const displayPrice =
    Number(marketPrice) > 0
      ? Number(marketPrice)
      : Number(price) > 0
        ? Number(price)
        : DEFAULT_PRICE;

  const selectedChange = Number(
    priceChanges[selectedPair] || 0
  );

  const tvSymbol = `BINANCE:${selectedPair.replace(
    "/",
    ""
  )}`;

  const tvInterval =
    TV_INTERVAL_MAP[timeframe] || "15";

  const tvChartUrl =
    `https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
      tvSymbol
    )}` +
    `&interval=${encodeURIComponent(tvInterval)}` +
    "&theme=dark&style=1&timezone=Etc/UTC";

  const marketPairs = useMemo(() => {
    const normalizedSearch = marketSearch
      .trim()
      .toLowerCase();

    const liveEntries = Object.entries(livePrices);

    if (liveEntries.length === 0) {
      return FALLBACK_PAIRS.filter((coin) =>
        coin.pair
          .toLowerCase()
          .includes(normalizedSearch)
      );
    }

    return liveEntries
      .filter(
        ([symbol, currentPrice]) =>
          symbol
            .toLowerCase()
            .includes(normalizedSearch) &&
          Number(currentPrice) > 0
      )
      .sort(([firstSymbol], [secondSymbol]) => {
        if (firstSymbol === DEFAULT_PAIR) {
          return -1;
        }

        if (secondSymbol === DEFAULT_PAIR) {
          return 1;
        }

        return firstSymbol.localeCompare(secondSymbol);
      })
      .slice(0, 60)
      .map(([symbol, currentPrice]) => ({
        pair: symbol,
        price: Number(currentPrice),
        change: Number(priceChanges[symbol] || 0),
      }));
  }, [livePrices, marketSearch, priceChanges]);

  const mobileOrderBook = useMemo(() => {
    if (
      orderBook.asks.length > 0 ||
      orderBook.bids.length > 0
    ) {
      return [
        ...orderBook.asks.slice(0, 4).map((item) => ({
          type: "sell",
          price: formatPrice(item?.[0]),
          amount: Number(item?.[1] || 0).toFixed(4),
        })),

        ...orderBook.bids.slice(0, 4).map((item) => ({
          type: "buy",
          price: formatPrice(item?.[0]),
          amount: Number(item?.[1] || 0).toFixed(4),
        })),
      ];
    }

    return [
      {
        type: "sell",
        price: formatPrice(displayPrice + 0.04),
        amount: "7.36",
      },
      {
        type: "sell",
        price: formatPrice(displayPrice + 0.03),
        amount: "143.36",
      },
      {
        type: "sell",
        price: formatPrice(displayPrice + 0.02),
        amount: "25.73",
      },
      {
        type: "sell",
        price: formatPrice(displayPrice + 0.01),
        amount: "205.84",
      },
      {
        type: "buy",
        price: formatPrice(displayPrice - 0.01),
        amount: "7.35",
      },
      {
        type: "buy",
        price: formatPrice(displayPrice - 0.02),
        amount: "146.97",
      },
      {
        type: "buy",
        price: formatPrice(displayPrice - 0.03),
        amount: "642.85",
      },
      {
        type: "buy",
        price: formatPrice(displayPrice - 0.04),
        amount: "3630.00",
      },
    ];
  }, [displayPrice, orderBook]);

  const loadPositions = useCallback(async () => {
    try {
      const response = await getPositions();

      if (response?.success) {
        setPositions(
          Array.isArray(response.positions)
            ? response.positions
            : []
        );
      }
    } catch (error) {
      console.error(
        "Futures positions loading failed:",
        error
      );
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const response = await getFuturesHistory();

      if (response?.success) {
        setHistory(
          Array.isArray(response.history)
            ? response.history
            : []
        );
      }
    } catch (error) {
      console.error(
        "Futures history loading failed:",
        error
      );
    }
  }, []);

  const refreshPositionsData =
    useCallback(async () => {
      setPositionsLoading(true);

      try {
        await Promise.allSettled([
          loadPositions(),
          loadHistory(),
        ]);
      } finally {
        setPositionsLoading(false);
      }
    }, [loadHistory, loadPositions]);

  useEffect(() => {
    refreshPositionsData();

    const intervalId = window.setInterval(
      loadPositions,
      5000
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadPositions, refreshPositionsData]);

  useEffect(() => {
    let cancelled = false;

    const loadLivePrices = async () => {
      try {
        const [priceResponse, tickerResponse] =
          await Promise.all([
            fetch(
              "https://api.binance.com/api/v3/ticker/price",
              {
                headers: {
                  Accept: "application/json",
                },
              }
            ),
            fetch(
              "https://api.binance.com/api/v3/ticker/24hr",
              {
                headers: {
                  Accept: "application/json",
                },
              }
            ),
          ]);

        if (
          !priceResponse.ok ||
          !tickerResponse.ok
        ) {
          throw new Error(
            "Binance futures market request failed."
          );
        }

        const [priceData, tickerData] =
          await Promise.all([
            priceResponse.json(),
            tickerResponse.json(),
          ]);

        if (
          cancelled ||
          !Array.isArray(priceData) ||
          !Array.isArray(tickerData)
        ) {
          return;
        }

        const nextPrices = {};
        const nextChanges = {};

        priceData.forEach((item) => {
          if (
            item?.symbol?.endsWith("USDT") &&
            Number(item?.price) > 0
          ) {
            nextPrices[item.symbol] = Number(
              item.price
            );
          }
        });

        tickerData.forEach((item) => {
          if (item?.symbol?.endsWith("USDT")) {
            nextChanges[item.symbol] = Number(
              item.priceChangePercent || 0
            );
          }
        });

        setLivePrices(nextPrices);
        setPriceChanges(nextChanges);

        const selectedLivePrice =
          nextPrices[selectedPair];

        if (Number(selectedLivePrice) > 0) {
          setMarketPrice(selectedLivePrice);
          setPrice(
            String(
              Number(selectedLivePrice).toFixed(8)
            )
          );
        }
      } catch (error) {
        console.error(
          "Futures live price loading failed:",
          error
        );
      }
    };

    loadLivePrices();

    const intervalId = window.setInterval(
      loadLivePrices,
      10000
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedPair]);

  useEffect(() => {
    let cancelled = false;

    const loadOrderBook = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/depth?symbol=${encodeURIComponent(
            selectedPair
          )}&limit=20`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.msg ||
              "Futures order book request failed."
          );
        }

        if (cancelled) {
          return;
        }

        setOrderBook({
          bids: Array.isArray(data?.bids)
            ? data.bids
            : [],

          asks: Array.isArray(data?.asks)
            ? data.asks
            : [],
        });
      } catch (error) {
        console.error(
          "Futures order book loading failed:",
          error
        );
      }
    };

    loadOrderBook();

    const intervalId = window.setInterval(
      loadOrderBook,
      3000
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedPair]);

  useEffect(() => {
    const handleMarketUpdate = (data) => {
      if (!data?.symbol) {
        return;
      }

      const symbol = String(
        data.symbol
      ).toUpperCase();

      const currentPrice = Number(
        data.price || data?.candle?.close || 0
      );

      if (
        !Number.isFinite(currentPrice) ||
        currentPrice <= 0
      ) {
        return;
      }

      setLivePrices((previousPrices) => ({
        ...previousPrices,
        [symbol]: currentPrice,
      }));

      if (symbol === selectedPair.toUpperCase()) {
        setMarketPrice(currentPrice);
        setPrice(
          String(currentPrice.toFixed(8))
        );
      }
    };

    const handleKlineUpdate = (data) => {
      if (
        String(data?.symbol || "").toUpperCase() !==
        selectedPair.toUpperCase()
      ) {
        return;
      }

      const closePrice = Number(
        data?.candle?.close || 0
      );

      if (
        Number.isFinite(closePrice) &&
        closePrice > 0
      ) {
        setMarketPrice(closePrice);
        setPrice(
          String(closePrice.toFixed(8))
        );
      }
    };

    socket.on(
      "marketUpdate",
      handleMarketUpdate
    );

    socket.on(
      "klineUpdate",
      handleKlineUpdate
    );

    return () => {
      socket.off(
        "marketUpdate",
        handleMarketUpdate
      );

      socket.off(
        "klineUpdate",
        handleKlineUpdate
      );
    };
  }, [selectedPair]);

  const selectMarket = (coin) => {
    const nextPair = String(
      coin?.pair || DEFAULT_PAIR
    ).toUpperCase();

    const nextPrice = Number(
      coin?.price ||
        livePrices[nextPair] ||
        DEFAULT_PRICE
    );

    setSelectedPair(nextPair);
    setMarketPrice(nextPrice);
    setPrice(String(nextPrice));
    setMarketDrawerOpen(false);
    setContractMenuOpen(false);
  };

  const setBalancePercentage = (percentage) => {
    const calculatedAmount =
      (balance * percentage) / 100;

    setAmount(
      String(calculatedAmount.toFixed(2))
    );
  };

  const openPosition = async (
    requestedSide = side
  ) => {
    const numericAmount = Number(amount);
    const numericLeverage = Number(leverage);
    const numericEntryPrice = Number(displayPrice);
    const numericTakeProfit = Number(tpPrice || 0);
    const numericStopLoss = Number(slPrice || 0);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      window.alert(
        translateWithFallback(
          "enterValidAmount",
          "Please enter a valid amount.",
          "common"
        )
      );
      return;
    }

    if (
      !Number.isFinite(numericLeverage) ||
      numericLeverage <= 0
    ) {
      window.alert(
        translateWithFallback(
          "invalidLeverage",
          "Invalid leverage."
        )
      );
      return;
    }

    if (
      !Number.isFinite(numericEntryPrice) ||
      numericEntryPrice <= 0
    ) {
      window.alert(
        translateWithFallback(
          "marketPriceUnavailable",
          "Live market price is unavailable."
        )
      );
      return;
    }

    setSubmittingPosition(true);

    try {
      const payload = {
        symbol: selectedPair,
        side: requestedSide,
        quantity: numericAmount,
        leverage: numericLeverage,
        entryPrice: numericEntryPrice,
        takeProfit:
          Number.isFinite(numericTakeProfit)
            ? numericTakeProfit
            : 0,
        stopLoss:
          Number.isFinite(numericStopLoss)
            ? numericStopLoss
            : 0,
        orderType,
        marginMode,
        reduceOnly,
        slippage,
        futuresTab: activeFuturesTab,
        quoteCurrency,
      };

      const response =
        await apiOpenPosition(payload);

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Open position failed."
        );
      }

      await refreshPositionsData();

      setAmount("");
      setTpPrice("");
      setSlPrice("");

      window.alert(
        translateWithFallback(
          "positionOpenedSuccessfully",
          "Position opened successfully."
        )
      );
    } catch (error) {
      console.error(
        "Futures position open failed:",
        error
      );

      window.alert(
        error?.message ||
          translateWithFallback(
            "openPositionFailed",
            "Open position failed."
          )
      );
    } finally {
      setSubmittingPosition(false);
    }
  };

  const closePosition = async (positionId) => {
    if (!positionId) {
      return;
    }

    const confirmed = window.confirm(
      translateWithFallback(
        "confirmClosePosition",
        "Are you sure you want to close this position?"
      )
    );

    if (!confirmed) {
      return;
    }

    setClosingPositionId(positionId);

    try {
      const response =
        await apiClosePosition(positionId);

      if (
        response &&
        response.success === false
      ) {
        throw new Error(
          response.message ||
            "Close position failed."
        );
      }

      await refreshPositionsData();

      window.alert(
        translateWithFallback(
          "positionClosedSuccessfully",
          "Position closed successfully."
        )
      );
    } catch (error) {
      console.error(
        "Futures position close failed:",
        error
      );

      window.alert(
        error?.message ||
          translateWithFallback(
            "closePositionFailed",
            "Close position failed."
          )
      );
    } finally {
      setClosingPositionId("");
    }
  };

  const calculatePositionPnl = (position) => {
    const markPrice = Number(
      livePrices[
        position?.symbol || position?.pair
      ] ||
        position?.markPrice ||
        displayPrice ||
        0
    );

    const entryPrice = Number(
      position?.entryPrice ||
        position?.entry ||
        0
    );

    const quantity = Number(
      position?.quantity ||
        position?.amount ||
        1
    );

    if (
      !Number.isFinite(markPrice) ||
      !Number.isFinite(entryPrice)
    ) {
      return 0;
    }

    const priceDifference =
      position?.side === "short"
        ? entryPrice - markPrice
        : markPrice - entryPrice;

    return priceDifference * quantity;
  };

  const renderMarketChange = (change) => {
    const numericChange = Number(change || 0);

    return `${
      numericChange >= 0 ? "+" : ""
    }${numericChange.toFixed(2)}%`;
  };

  const renderPositionCard = (position) => {
    const positionId =
      position?._id || position?.id;

    const pnl =
      calculatePositionPnl(position);

    return (
      <article
        key={positionId}
        className={`position-card ${
          position?.side === "short"
            ? "short"
            : "long"
        }`}
      >
        <div className="position-top">
          <strong>
            {position?.symbol || position?.pair}{" "}
            {String(
              position?.side || ""
            ).toUpperCase()}
          </strong>

          <span
            className={
              pnl >= 0 ? "profit" : "loss"
            }
          >
            {pnl.toFixed(2)} USD
          </span>
        </div>

        <div className="position-info">
          <p>
            {translateWithFallback(
              "entryPrice",
              "Entry Price"
            )}
            :{" "}
            {position?.entryPrice ||
              position?.entry ||
              "N/A"}
          </p>

          <p>
            {translateWithFallback(
              "markPrice",
              "Mark Price"
            )}
            :{" "}
            {formatPrice(
              livePrices[
                position?.symbol ||
                  position?.pair
              ] ||
                position?.markPrice ||
                displayPrice
            )}
          </p>

          <p>
            {translateWithFallback(
              "leverage",
              "Leverage"
            )}
            : {position?.leverage || 1}x
          </p>

          <p>
            {translateWithFallback(
              "margin",
              "Margin"
            )}
            :{" "}
            {position?.margin ||
              position?.amount ||
              position?.quantity ||
              0}{" "}
            USDT
          </p>

          <p>
            {translateWithFallback(
              "liquidation",
              "Liquidation"
            )}
            :{" "}
            {position?.liquidationPrice ||
              position?.liquidation ||
              "N/A"}
          </p>
        </div>

        <button
          type="button"
          className="close-position"
          disabled={
            closingPositionId === positionId
          }
          onClick={() =>
            closePosition(positionId)
          }
        >
          {closingPositionId === positionId
            ? translateWithFallback(
                "processing",
                "Processing...",
                "common"
              )
            : translateWithFallback(
                "closePosition",
                "Close Position"
              )}
        </button>
      </article>
    );
  };

  return (
    <main className="futures-page">
      <section className="binance-mobile-futures">
        <div className="bm-top-tabs">
          {[
            "USDⓈ-M",
            "COIN-M",
            "Options",
            "Up / D",
          ].map((tab) => (
            <button
              type="button"
              key={tab}
              className={
                activeFuturesTab === tab
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFuturesTab(tab)
              }
            >
              {tab}
            </button>
          ))}

          <button
            type="button"
            aria-label={translateWithFallback(
              "markets",
              "Markets",
              "navigation"
            )}
            onClick={() =>
              setMarketDrawerOpen(true)
            }
          >
            ☰
          </button>
        </div>

        <div className="bm-notice">
          <span>
            🔔{" "}
            {translateWithFallback(
              "importantNotice",
              "Important Notice: Futures Market Live"
            )}
          </span>
        </div>

        <div className="bm-pair-head">
          <button
            type="button"
            className="bm-pair-selector"
            onClick={() =>
              setContractMenuOpen(
                (open) => !open
              )
            }
          >
            <h2>
              {selectedPair}
              <small>
                {translateWithFallback(
                  "perp",
                  "Perp"
                )}
              </small>
            </h2>

            <p>
              {translateWithFallback(
                "live",
                "Live",
                "common"
              )}{" "}
              <span
                className={
                  selectedChange >= 0
                    ? "green-change"
                    : "red-change"
                }
              >
                {renderMarketChange(
                  selectedChange
                )}
              </span>
            </p>
          </button>

          <div className="bm-icons">
            <button
              type="button"
              aria-label={translateWithFallback(
                "futuresSettings",
                "Futures Settings"
              )}
              onClick={() =>
                setSettingsOpen(
                  (open) => !open
                )
              }
            >
              ⚙️
            </button>

            <button
              type="button"
              aria-label={translateWithFallback(
                "moreOptions",
                "More Options",
                "common"
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

        <div className="bm-trade-order-grid">
          <section className="bm-trade-box">
            <div className="bm-buy-sell">
              <button
                type="button"
                className={
                  side === "long"
                    ? "active-buy"
                    : ""
                }
                onClick={() => setSide("long")}
              >
                {translateWithFallback(
                  "buy",
                  "Buy",
                  "trading"
                )}
              </button>

              <button
                type="button"
                className={
                  side === "short"
                    ? "active-sell"
                    : ""
                }
                onClick={() =>
                  setSide("short")
                }
              >
                {translateWithFallback(
                  "sell",
                  "Sell",
                  "trading"
                )}
              </button>
            </div>

            <div className="bm-mini-row">
              <select
                value={marginMode}
                onChange={(event) =>
                  setMarginMode(
                    event.target.value
                  )
                }
              >
                <option value="Cross">
                  {translateWithFallback(
                    "cross",
                    "Cross"
                  )}
                </option>

                <option value="Isolated">
                  {translateWithFallback(
                    "isolated",
                    "Isolated"
                  )}
                </option>
              </select>

              <select
                value={leverage}
                onChange={(event) =>
                  setLeverage(
                    event.target.value
                  )
                }
              >
                {LEVERAGE_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}x
                    </option>
                  )
                )}
              </select>
            </div>

            <select
              className="bm-full-input"
              value={orderType}
              onChange={(event) =>
                setOrderType(
                  event.target.value
                )
              }
            >
              <option value="Market">
                {translateWithFallback(
                  "market",
                  "Market"
                )}
              </option>

              <option value="Limit">
                {translateWithFallback(
                  "limit",
                  "Limit"
                )}
              </option>
            </select>

            <div className="bm-amount-box">
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                placeholder={translateWithFallback(
                  "amount",
                  "Amount",
                  "common"
                )}
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                onClick={() =>
                  setQuoteCurrency(
                    quoteCurrency === "USDT"
                      ? "BUSD"
                      : "USDT"
                  )
                }
              >
                {quoteCurrency} ▾
              </button>
            </div>

            <div className="bm-slider">
              {[25, 50, 75, 100].map(
                (percentage) => (
                  <button
                    type="button"
                    key={percentage}
                    onClick={() =>
                      setBalancePercentage(
                        percentage
                      )
                    }
                  >
                    {percentage}%
                  </button>
                )
              )}
            </div>

            <p className="bm-avbl">
              {translateWithFallback(
                "available",
                "Available",
                "common"
              )}{" "}
              <b>{balance} USDT</b>
            </p>

            <label className="bm-check">
              <input
                type="checkbox"
                checked={slippage}
                onChange={(event) =>
                  setSlippage(
                    event.target.checked
                  )
                }
              />

              {translateWithFallback(
                "slippageTolerance",
                "Slippage Tolerance"
              )}
            </label>

            <label className="bm-check">
              <input
                type="checkbox"
                checked={showTPSL}
                onChange={(event) =>
                  setShowTPSL(
                    event.target.checked
                  )
                }
              />

              {translateWithFallback(
                "tpSl",
                "TP/SL"
              )}
            </label>

            {showTPSL && (
              <div className="bm-tpsl-mobile">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={translateWithFallback(
                    "takeProfit",
                    "Take Profit"
                  )}
                  value={tpPrice}
                  onChange={(event) =>
                    setTpPrice(
                      event.target.value
                    )
                  }
                />

                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={translateWithFallback(
                    "stopLoss",
                    "Stop Loss"
                  )}
                  value={slPrice}
                  onChange={(event) =>
                    setSlPrice(
                      event.target.value
                    )
                  }
                />
              </div>
            )}

            <label className="bm-check">
              <input
                type="checkbox"
                checked={reduceOnly}
                onChange={(event) =>
                  setReduceOnly(
                    event.target.checked
                  )
                }
              />

              {translateWithFallback(
                "reduceOnly",
                "Reduce Only"
              )}
            </label>

            <div className="bm-cost-row">
              <span>
                {translateWithFallback(
                  "max",
                  "Max"
                )}
                <br />
                {balance} USDT
              </span>

              <span>
                {translateWithFallback(
                  "cost",
                  "Cost"
                )}
                <br />
                {Number(amount || 0).toFixed(2)}{" "}
                USDT
              </span>
            </div>

            <button
              type="button"
              disabled={submittingPosition}
              className={
                side === "long"
                  ? "bm-main-buy"
                  : "bm-main-sell"
              }
              onClick={() =>
                openPosition(side)
              }
            >
              {submittingPosition
                ? translateWithFallback(
                    "processing",
                    "Processing...",
                    "common"
                  )
                : side === "long"
                  ? translateWithFallback(
                      "buyLong",
                      "Buy / Long"
                    )
                  : translateWithFallback(
                      "sellShort",
                      "Sell / Short"
                    )}
            </button>
          </section>

          <section className="bm-orderbook">
            <div className="bm-funding">
              <span>
                {translateWithFallback(
                  "funding",
                  "Funding"
                )}{" "}
                (8h)
              </span>
              <b>0.00000%</b>
            </div>

            <div className="bm-ob-head">
              <span>
                {translateWithFallback(
                  "price",
                  "Price",
                  "common"
                )}
                <br />
                (USDT)
              </span>

              <span>
                {translateWithFallback(
                  "amount",
                  "Amount",
                  "common"
                )}
                <br />
                (USDT)
              </span>
            </div>

            {mobileOrderBook
              .filter(
                (item) =>
                  item.type === "sell"
              )
              .map((item, index) => (
                <div
                  className="bm-ob-row"
                  key={`sell-${index}`}
                >
                  <strong className="bm-red">
                    {item.price}
                  </strong>
                  <span>{item.amount}</span>
                </div>
              ))}

            <div className="bm-mid-price">
              {formatPrice(displayPrice)}
              <small>
                {formatPrice(displayPrice)}
              </small>
            </div>

            {mobileOrderBook
              .filter(
                (item) =>
                  item.type === "buy"
              )
              .map((item, index) => (
                <div
                  className="bm-ob-row"
                  key={`buy-${index}`}
                >
                  <strong className="bm-green">
                    {item.price}
                  </strong>
                  <span>{item.amount}</span>
                </div>
              ))}
          </section>
        </div>

        <div className="bm-warning">
          ℹ{" "}
          {translateWithFallback(
            "priceMovementWarning",
            "There may be limited price movement and reduced liquidity outside regular trading hours."
          )}
        </div>

        <div className="bm-bottom-tabs">
          <button
            type="button"
            className={
              mobileTab === "positions"
                ? "active"
                : ""
            }
            onClick={() =>
              setMobileTab("positions")
            }
          >
            {translateWithFallback(
              "positions",
              "Positions"
            )}{" "}
            ({positions.length})
          </button>

          <button
            type="button"
            className={
              mobileTab === "orders"
                ? "active"
                : ""
            }
            onClick={() =>
              setMobileTab("orders")
            }
          >
            {translateWithFallback(
              "openOrders",
              "Open Orders"
            )}{" "}
            (0)
          </button>

          <button
            type="button"
            className={
              mobileTab === "bots"
                ? "active"
                : ""
            }
            onClick={() =>
              setMobileTab("bots")
            }
          >
            {translateWithFallback(
              "bots",
              "Bots"
            )}
          </button>
        </div>

        {mobileTab === "positions" && (
          <section className="bm-mobile-positions">
            {positionsLoading ? (
              <p>
                {translateWithFallback(
                  "loading",
                  "Loading...",
                  "common"
                )}
              </p>
            ) : positions.length === 0 ? (
              <p>
                {translateWithFallback(
                  "noOpenPositions",
                  "No open positions"
                )}
              </p>
            ) : (
              positions.map(renderPositionCard)
            )}
          </section>
        )}

        <section className="bm-chart-section">
          <h3>
            {selectedPair}{" "}
            {translateWithFallback(
              "perpetualFutures",
              "Perpetual Futures"
            )}
          </h3>

          <div className="bm-timeframes">
            {TIMEFRAMES.slice(0, 6).map(
              (selectedTimeframe) => (
                <button
                  type="button"
                  key={selectedTimeframe}
                  className={
                    timeframe ===
                    selectedTimeframe
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setTimeframe(
                      selectedTimeframe
                    )
                  }
                >
                  {selectedTimeframe}
                </button>
              )
            )}
          </div>

          <iframe
            key={`mobile-${tvSymbol}-${tvInterval}`}
            title={translateWithFallback(
              "mobileFuturesChart",
              "Mobile Futures Chart"
            )}
            src={tvChartUrl}
            className="bm-chart-frame"
            allowFullScreen
          />
        </section>

        {marketDrawerOpen && (
          <div
            className="bm-drawer-overlay"
            role="presentation"
            onClick={() =>
              setMarketDrawerOpen(false)
            }
          >
            <section
              className="bm-market-drawer"
              role="dialog"
              aria-modal="true"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <h3>
                {translateWithFallback(
                  "markets",
                  "Markets",
                  "navigation"
                )}
              </h3>

              <input
                type="search"
                placeholder={translateWithFallback(
                  "searchPair",
                  "Search pair..."
                )}
                value={marketSearch}
                onChange={(event) =>
                  setMarketSearch(
                    event.target.value
                  )
                }
              />

              {marketPairs
                .slice(0, 40)
                .map((coin) => (
                  <button
                    type="button"
                    className="bm-drawer-market"
                    key={coin.pair}
                    onClick={() =>
                      selectMarket(coin)
                    }
                  >
                    <strong>{coin.pair}</strong>

                    <span
                      className={
                        Number(coin.change) >= 0
                          ? "bm-green"
                          : "bm-red"
                      }
                    >
                      {renderMarketChange(
                        coin.change
                      )}
                    </span>
                  </button>
                ))}
            </section>
          </div>
        )}

        {settingsOpen && (
          <section className="bm-popup">
            <h3>
              {translateWithFallback(
                "futuresSettings",
                "Futures Settings"
              )}
            </h3>

            <label>
              {translateWithFallback(
                "marginMode",
                "Margin Mode"
              )}
            </label>

            <select
              value={marginMode}
              onChange={(event) =>
                setMarginMode(
                  event.target.value
                )
              }
            >
              <option value="Cross">
                {translateWithFallback(
                  "cross",
                  "Cross"
                )}
              </option>

              <option value="Isolated">
                {translateWithFallback(
                  "isolated",
                  "Isolated"
                )}
              </option>
            </select>

            <label>
              {translateWithFallback(
                "leverage",
                "Leverage"
              )}
            </label>

            <select
              value={leverage}
              onChange={(event) =>
                setLeverage(
                  event.target.value
                )
              }
            >
              {LEVERAGE_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}x
                  </option>
                )
              )}
            </select>

            <label>
              {translateWithFallback(
                "quoteCurrency",
                "Quote Currency"
              )}
            </label>

            <select
              value={quoteCurrency}
              onChange={(event) =>
                setQuoteCurrency(
                  event.target.value
                )
              }
            >
              <option value="USDT">
                USDT
              </option>
              <option value="BUSD">
                BUSD
              </option>
            </select>

            <button
              type="button"
              onClick={() =>
                setSettingsOpen(false)
              }
            >
              {translateWithFallback(
                "close",
                "Close",
                "common"
              )}
            </button>
          </section>
        )}

        {moreOpen && (
          <section className="bm-popup">
            <h3>
              {translateWithFallback(
                "moreOptions",
                "More Options",
                "common"
              )}
            </h3>

            {[
              [
                "orders",
                "openOrders",
                "Open Orders",
              ],
              [
                "transactions",
                "transactionHistory",
                "Transaction History",
              ],
              [
                "wallets",
                "assetsWallet",
                "Assets / Wallet",
              ],
              [
                "support",
                "support",
                "Support",
              ],
            ].map(
              ([
                pageName,
                translationKey,
                fallback,
              ]) => (
                <button
                  type="button"
                  key={pageName}
                  onClick={() =>
                    setPage?.(pageName)
                  }
                >
                  {translateWithFallback(
                    translationKey,
                    fallback
                  )}
                </button>
              )
            )}

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
          </section>
        )}

        {contractMenuOpen && (
          <section className="bm-popup">
            <h3>
              {translateWithFallback(
                "selectContract",
                "Select Contract"
              )}
            </h3>

            {marketPairs
              .slice(0, 20)
              .map((coin) => (
                <button
                  type="button"
                  key={coin.pair}
                  onClick={() =>
                    selectMarket(coin)
                  }
                >
                  {coin.pair}{" "}
                  {translateWithFallback(
                    "perpetualFutures",
                    "Perpetual"
                  )}
                </button>
              ))}

            <button
              type="button"
              onClick={() =>
                setContractMenuOpen(false)
              }
            >
              {translateWithFallback(
                "close",
                "Close",
                "common"
              )}
            </button>
          </section>
        )}

        <nav className="bm-bottom-nav">
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
                  pageName === "futures"
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

      <section className="futures-desktop-view">
        <header className="futures-header">
          <div>
            <h1>
              {translateWithFallback(
                "futuresTitle",
                "EXALT Futures Trading"
              )}
            </h1>

            <p>
              {translateWithFallback(
                "futuresSubtitle",
                "Real-Time Futures Exchange Panel"
              )}
            </p>
          </div>

          <div className="futures-badge">
            <span className="live-dot" />

            {translateWithFallback(
              "liveFuturesMarket",
              "Live Futures Market"
            )}
          </div>
        </header>

        <div className="futures-container">
          <aside className="market-panel markets-list">
            <h2>
              {translateWithFallback(
                "markets",
                "Markets",
                "navigation"
              )}
            </h2>

            <input
              type="search"
              className="futures-search"
              placeholder={translateWithFallback(
                "searchMarket",
                "Search market..."
              )}
              value={marketSearch}
              onChange={(event) =>
                setMarketSearch(
                  event.target.value
                )
              }
            />

            {marketPairs.map((coin, index) => (
              <button
                type="button"
                key={coin.pair || index}
                className={`market-item ${
                  selectedPair === coin.pair
                    ? "active-market"
                    : ""
                }`}
                onClick={() =>
                  selectMarket(coin)
                }
              >
                <div>
                  <strong>{coin.pair}</strong>
                  <p>
                    ${formatPrice(coin.price)}
                  </p>
                </div>

                <span
                  className={
                    Number(coin.change) >= 0
                      ? "green-change"
                      : "red-change"
                  }
                >
                  {renderMarketChange(
                    coin.change
                  )}
                </span>
              </button>
            ))}
          </aside>

          <section className="chart-panel">
            <div className="pair-header">
              <div>
                <h2>{selectedPair}</h2>
                <p>
                  {translateWithFallback(
                    "perpetualFutures",
                    "Perpetual Futures"
                  )}
                </p>
              </div>

              <span>
                ${formatPrice(displayPrice)}
              </span>

              <div className="timeframe-tabs">
                {TIMEFRAMES.map(
                  (selectedTimeframe) => (
                    <button
                      type="button"
                      key={selectedTimeframe}
                      className={
                        timeframe ===
                        selectedTimeframe
                          ? "active-timeframe"
                          : ""
                      }
                      onClick={() =>
                        setTimeframe(
                          selectedTimeframe
                        )
                      }
                    >
                      {selectedTimeframe}
                    </button>
                  )
                )}
              </div>

              <div className="candle-settings">
                <select
                  value={candleStyle}
                  onChange={(event) =>
                    setCandleStyle(
                      event.target.value
                    )
                  }
                >
                  <option value="normal">
                    {translateWithFallback(
                      "normalCandles",
                      "Normal Candles"
                    )}
                  </option>

                  <option value="smooth">
                    {translateWithFallback(
                      "smoothCandles",
                      "Smooth Candles"
                    )}
                  </option>

                  <option value="volatile">
                    {translateWithFallback(
                      "volatileCandles",
                      "Volatile Candles"
                    )}
                  </option>
                </select>

                <select
                  value={volatility}
                  onChange={(event) =>
                    setVolatility(
                      event.target.value
                    )
                  }
                >
                  <option value="low">
                    {translateWithFallback(
                      "lowVolatility",
                      "Low Volatility"
                    )}
                  </option>

                  <option value="normal">
                    {translateWithFallback(
                      "normalVolatility",
                      "Normal Volatility"
                    )}
                  </option>

                  <option value="high">
                    {translateWithFallback(
                      "highVolatility",
                      "High Volatility"
                    )}
                  </option>
                </select>

                <select
                  value={chartZoom}
                  onChange={(event) =>
                    setChartZoom(
                      event.target.value
                    )
                  }
                >
                  <option value="small">
                    {translateWithFallback(
                      "zoomSmall",
                      "Zoom Small"
                    )}
                  </option>

                  <option value="medium">
                    {translateWithFallback(
                      "zoomMedium",
                      "Zoom Medium"
                    )}
                  </option>

                  <option value="large">
                    {translateWithFallback(
                      "zoomLarge",
                      "Zoom Large"
                    )}
                  </option>
                </select>
              </div>
            </div>

            <div className="real-chart">
              <iframe
                key={`${tvSymbol}-${tvInterval}-${chartZoom}`}
                title={translateWithFallback(
                  "tradingViewChart",
                  "TradingView Chart"
                )}
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

            <h3>
              {translateWithFallback(
                "orderBook",
                "Order Book"
              )}
            </h3>

            {mobileOrderBook.map(
              (order, index) => (
                <div
                  key={`${order.type}-${index}`}
                  className={`order-row ${order.type}`}
                >
                  <span>{order.price}</span>
                  <span>{order.amount}</span>
                </div>
              )
            )}

            <section className="positions-panel">
              <h3>
                {translateWithFallback(
                  "openPositions",
                  "Open Positions"
                )}
              </h3>

              {positionsLoading ? (
                <p className="no-position">
                  {translateWithFallback(
                    "loading",
                    "Loading...",
                    "common"
                  )}
                </p>
              ) : positions.length === 0 ? (
                <p className="no-position">
                  {translateWithFallback(
                    "noOpenPositions",
                    "No open positions"
                  )}
                </p>
              ) : (
                positions.map(renderPositionCard)
              )}
            </section>
          </section>

          <aside className="trade-panel">
            <h2>
              {translateWithFallback(
                "trade",
                "Trade",
                "trading"
              )}
            </h2>

            <div className="trade-tabs">
              <button
                type="button"
                className={`buy-btn ${
                  side === "long"
                    ? "active-side"
                    : ""
                }`}
                onClick={() => setSide("long")}
              >
                {translateWithFallback(
                  "buyLong",
                  "Buy / Long"
                )}
              </button>

              <button
                type="button"
                className={`sell-btn ${
                  side === "short"
                    ? "active-side"
                    : ""
                }`}
                onClick={() =>
                  setSide("short")
                }
              >
                {translateWithFallback(
                  "sellShort",
                  "Sell / Short"
                )}
              </button>
            </div>

            <label>
              {translateWithFallback(
                "leverage",
                "Leverage"
              )}
            </label>

            <select
              value={leverage}
              onChange={(event) =>
                setLeverage(
                  event.target.value
                )
              }
            >
              {LEVERAGE_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}x
                  </option>
                )
              )}
            </select>

            <label>
              {translateWithFallback(
                "price",
                "Price",
                "common"
              )}
            </label>

            <input
              type="number"
              min="0"
              step="any"
              value={
                Number.isFinite(
                  Number(price)
                )
                  ? price
                  : ""
              }
              onChange={(event) =>
                setPrice(
                  event.target.value
                )
              }
            />

            <label>
              {translateWithFallback(
                "amount",
                "Amount",
                "common"
              )}
            </label>

            <input
              type="number"
              min="0"
              step="any"
              placeholder={translateWithFallback(
                "enterAmount",
                "Enter Amount"
              )}
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value
                )
              }
            />

            <div className="tpsl-box">
              <label>
                {translateWithFallback(
                  "takeProfit",
                  "Take Profit"
                )}
              </label>

              <input
                type="number"
                min="0"
                step="any"
                placeholder={translateWithFallback(
                  "tpPrice",
                  "TP Price"
                )}
                value={tpPrice}
                onChange={(event) =>
                  setTpPrice(
                    event.target.value
                  )
                }
              />

              <label>
                {translateWithFallback(
                  "stopLoss",
                  "Stop Loss"
                )}
              </label>

              <input
                type="number"
                min="0"
                step="any"
                placeholder={translateWithFallback(
                  "slPrice",
                  "SL Price"
                )}
                value={slPrice}
                onChange={(event) =>
                  setSlPrice(
                    event.target.value
                  )
                }
              />
            </div>

            <button
              type="button"
              className="execute-buy"
              disabled={submittingPosition}
              onClick={() =>
                openPosition("long")
              }
            >
              {submittingPosition
                ? translateWithFallback(
                    "processing",
                    "Processing...",
                    "common"
                  )
                : translateWithFallback(
                    "openLong",
                    "Open Long"
                  )}
            </button>

            <button
              type="button"
              className="execute-sell"
              disabled={submittingPosition}
              onClick={() =>
                openPosition("short")
              }
            >
              {submittingPosition
                ? translateWithFallback(
                    "processing",
                    "Processing...",
                    "common"
                  )
                : translateWithFallback(
                    "openShort",
                    "Open Short"
                  )}
            </button>

            <div className="trade-info">
              <p>
                {translateWithFallback(
                  "availableBalance",
                  "Available Balance"
                )}
                : {balance} USDT
              </p>

              <p>
                {translateWithFallback(
                  "marginMode",
                  "Margin Mode"
                )}
                : {marginMode}
              </p>

              <p>
                {translateWithFallback(
                  "orderType",
                  "Order Type"
                )}
                : {orderType}
              </p>

              <p>
                {translateWithFallback(
                  "quote",
                  "Quote"
                )}
                : {quoteCurrency}
              </p>

              <p>
                {translateWithFallback(
                  "fundingRate",
                  "Funding Rate"
                )}
                : 0.01%
              </p>

              <p>
                {translateWithFallback(
                  "riskLevel",
                  "Risk Level"
                )}
                :{" "}
                {translateWithFallback(
                  "normal",
                  "Normal"
                )}
              </p>
            </div>
          </aside>

          <section className="history-panel">
            <h3>
              {translateWithFallback(
                "positionHistory",
                "Position History"
              )}
            </h3>

            {history.length === 0 ? (
              <p className="no-position">
                {translateWithFallback(
                  "noClosedPositions",
                  "No closed positions"
                )}
              </p>
            ) : (
              history.map((item) => (
                <article
                  key={item._id}
                  className={`history-card ${
                    item.side === "short"
                      ? "short"
                      : "long"
                  }`}
                >
                  <div className="history-left">
                    <strong>
                      {item.symbol}{" "}
                      {String(
                        item.side || ""
                      ).toUpperCase()}
                    </strong>

                    <span
                      className={
                        Number(item.pnl) >= 0
                          ? "profit"
                          : "loss"
                      }
                    >
                      $
                      {Number(
                        item.pnl || 0
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="history-right">
                    <p>
                      {translateWithFallback(
                        "entryPrice",
                        "Entry"
                      )}
                      : {item.entryPrice}
                    </p>

                    <p>
                      {translateWithFallback(
                        "close",
                        "Close",
                        "common"
                      )}
                      : {item.markPrice}
                    </p>

                    <p>
                      {translateWithFallback(
                        "leverage",
                        "Leverage"
                      )}
                      : {item.leverage}x
                    </p>

                    <p>
                      {translateWithFallback(
                        "status",
                        "Status",
                        "common"
                      )}
                      : {item.status}
                    </p>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default Futures;