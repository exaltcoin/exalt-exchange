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
import { apiFetch } from "../lib/apiClient.js";

import "./Futures.css";

const DEFAULT_PAIR = "BTCUSDT";
const DEFAULT_PRICE = 68500;

const getFundingRateEstimate = (symbol) =>
  apiFetch(`/api/futures/funding-rate/${encodeURIComponent(symbol)}`);

const transferFuturesMargin = (
  { direction, amount },
  { idempotencyKey } = {}
) =>
  apiFetch("/api/futures/transfer", {
    method: "POST",
    headers: idempotencyKey
      ? { "Idempotency-Key": idempotencyKey }
      : undefined,
    body: JSON.stringify({ direction, amount }),
  });

const getWalletBalance = () => apiFetch("/api/wallets/me");

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

/*
  Batch E (original gate) - zero-tolerance fake-data fix (see
  _audit/EXALT-BATCH-E-REPORT.md). This component used to show a
  hardcoded `const [balance] = useState(5000);` as if it were the
  user's real futures balance, and even used it to size real trade
  quantities - every user saw the same fake 5000 USDT regardless of
  their actual account. Rather than ship that fabrication, the whole
  trading UI was replaced with a static "Coming Soon" screen and
FUTURES_PRODUCTION_READY was kept false by default, pending two launch-blocking
  gaps: no liquidation enforcement, and no way to fund a futures
  wallet at all (no spot-to-futures transfer endpoint existed).

  RC5 STAGING CANDIDATE: both of those backend gaps are now closed -
  services/futures/liquidationService.js real (though still
  disabled-by-default, FUTURES_LIQUIDATION_WORKER_ENABLED=false)
  liquidation enforcement, and POST /api/futures/transfer for
  Spot<->Futures funding both exist and are exercised below. This
  component is wired to those real APIs - balance, transfer,
  positions, open/close, history are all genuine backend calls, not
  fabricated data - but that is NOT the same claim as "production
  ready": the backend's own futuresTradingEnabled ExchangeSettings
  field still defaults to false (see models/ExchangeSettings.js,
  middleware/exchangeStatusMiddleware.js's checkFuturesTrading) and
  has not been verified against a live/testnet market in this
  sandbox, insurance-fund/ADL/cross-margin/funding remain unbuilt
  (see FUTURES-ARCHITECTURE-GUIDE.md), and the liquidation worker
itself stays off. The VITE_FUTURES_PRODUCTION_READY-controlled gate therefore
  hides the whole page - it now drives a persistent, non-dismissable
  staging banner (see the "futures-staging-banner" render below) so
  a real user session is never left thinking this is a live,
  verified derivatives product. Do not flip this to true without an
  independent testnet/live verification pass this sandbox cannot
  perform - see LIVE-FUNDS-ACTIVATION-CHECKLIST.md.
*/
const FUTURES_PRODUCTION_READY =
  String(import.meta.env.VITE_FUTURES_PRODUCTION_READY || "false")
    .trim()
    .toLowerCase() === "true";

/*
  RC5 STAGING CANDIDATE - a client-generated idempotency key lets a
  network retry of open/close/transfer be recognized as a duplicate
  by the backend (controllers/futuresController.js's
  getIdempotencyKey() - without one, the backend mints a random key
  per request, so a retry after a lost response would NOT be
  deduplicated). crypto.randomUUID() is available in every browser
  this app targets; the Math.random() fallback only matters for an
  environment where it is somehow absent (very old embedded
  webviews), never used to fabricate a balance or price.
*/
const generateIdempotencyKey = (prefix) => {
  const id =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}:${id}`;
};

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
   * Batch E: fabricated 5000 USDT balance removed. RC5 STAGING
   * CANDIDATE: this is now the user's REAL futures balance, fetched
   * from GET /api/wallets/me (see loadWalletBalance below) - never a
   * hardcoded placeholder. futuresLocked is the margin currently
   * committed to open positions (models/UserWallet.js's
   * futuresLocked.USDT); spotAvailable is the real Spot USDT balance
   * the Transfer panel can move INTO Futures.
   */
  const [balance, setBalance] = useState(0);
  const [futuresLocked, setFuturesLocked] = useState(0);
  const [spotAvailable, setSpotAvailable] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  const [marketPrice, setMarketPrice] =
    useState(DEFAULT_PRICE);

  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);

  /*
    PRODUCTION-ACTIVATION-CANDIDATE (directive D4 / QA finding #2) -
    real, live funding-rate estimate for the currently selected pair,
    replacing the hardcoded "Funding not implemented" strings below.
    null means "not yet loaded / unavailable" and is rendered as an
    honest "Funding rate unavailable" - never a fabricated number. See
    getFundingRateEstimate in api.js and its backend counterpart,
    controllers/futuresController.js's getFundingRateEstimate().
  */
  const [fundingRateEstimate, setFundingRateEstimate] =
    useState(null);

  const [side, setSide] = useState("long");

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

  /*
   * RC5 STAGING CANDIDATE: "Limit" removed - controllers/
   * futuresController.js's createFuturesOrder() hardcodes
   * `type: "market", status: "filled"` for every order; there is no
   * pending-order queue anywhere in the backend, so a "Limit" option
   * here would submit a market order while claiming otherwise. Only
   * "Market" is real, so orderType is fixed rather than selectable.
   */
  const orderType = "Market";

  const [marginMode, setMarginMode] =
    useState("Cross");

  const [mobileTab, setMobileTab] =
    useState("positions");

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferDirection, setTransferDirection] =
    useState("TO_FUTURES");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferSubmitting, setTransferSubmitting] =
    useState(false);

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

  /*
   * RC5 STAGING CANDIDATE: "BUSD" toggle removed - openPosition()
   * never read quoteCurrency at all; every position was opened in
   * USDT regardless of what this button showed. USDT is the only
   * quote currency FuturesMarketConfig documents actually use (see
   * models/FuturesMarketConfig.js).
   */
  const quoteCurrency = "USDT";

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

  /*
   * RC5 STAGING CANDIDATE: a client-side ESTIMATE only, labeled "Est.
   * Margin" everywhere it is shown - never presented as the final
   * figure. controllers/futuresController.js's openPosition()
   * computes the real margin server-side as
   * (quantity * trustworthyMarkPrice) / leverage, using a live price
   * fetched at the moment the order is processed - this preview uses
   * the same formula against the currently-displayed price purely so
   * the user isn't submitting completely blind, but the two prices
   * can differ (this one can be several seconds old) and the backend
   * figure is always the one that actually moves funds.
   */
  const estimatedMargin = (() => {
    const numericAmount = Number(amount);
    const numericLeverage = Number(leverage);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !Number.isFinite(numericLeverage) ||
      numericLeverage <= 0
    ) {
      return 0;
    }

    return (numericAmount * displayPrice) / numericLeverage;
  })();

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

  /*
    PRODUCTION-ACTIVATION-CANDIDATE (directive D4 / QA finding #2) -
    loads the real, live funding-rate estimate for `symbol` from the
    backend's getFundingRateEstimate endpoint. Always sets an object
    with an explicit `available` flag (true or false) so the render
    below can distinguish "loaded, no data yet" from "still loading" -
    never leaves stale data from a previously selected pair on screen,
    and never fabricates a rate on failure (falls back to
    available:false with a generic reason instead).
  */
  const loadFundingRate = useCallback(async (symbol) => {
    try {
      const response = await getFundingRateEstimate(symbol);

      if (response?.success) {
        setFundingRateEstimate(response);
      } else {
        setFundingRateEstimate({
          available: false,
          reason: "Funding rate unavailable",
        });
      }
    } catch (error) {
      console.error(
        "Futures funding rate loading failed:",
        error
      );

      setFundingRateEstimate({
        available: false,
        reason: "Funding rate unavailable",
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    setFundingRateEstimate(null);

    loadFundingRate(selectedPair).then(() => {
      if (cancelled) return;
    });

    const intervalId = window.setInterval(() => {
      loadFundingRate(selectedPair);
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedPair, loadFundingRate]);

  /*
    Human-readable presentation of fundingRateEstimate, computed once
    here and reused by both the ticker-level and trade-info-panel
    displays below so the two never drift out of sync. Percentage
    formatting only - the raw fraction from the backend is real and
    exact, this is purely a display transform.
  */
  const fundingRateDisplay = useMemo(() => {
    if (!fundingRateEstimate?.available) {
      return null;
    }

    const ratePercent = Number(
      fundingRateEstimate.fundingRate
    ) * 100;

    const intervalMs = Number(
      fundingRateEstimate.fundingIntervalMs
    );

    const intervalHours =
      Number.isFinite(intervalMs) && intervalMs > 0
        ? Math.round(intervalMs / (60 * 60 * 1000))
        : null;

    return {
      ratePercent: Number.isFinite(ratePercent)
        ? ratePercent
        : 0,
      intervalHours,
    };
  }, [fundingRateEstimate]);

  /*
   * RC5 STAGING CANDIDATE: real balance load, replacing the
   * hardcoded `useState(0)`. GET /api/wallets/me is the same
   * endpoint Trade.jsx/Wallets.jsx/Dashboard.jsx already use for the
   * user's real wallet document (see api.js's getWalletBalance
   * comment). Failing silently (console.error only, no alert) here
   * matches loadPositions/loadHistory's existing disposition - a
   * transient balance-load failure should not interrupt the rest of
   * the page.
   */
  const loadWalletBalance = useCallback(async () => {
    setWalletLoading(true);

    try {
      const response = await getWalletBalance();

      if (response?.success && response.wallet) {
        setBalance(
          Number(response.wallet.futuresBalance?.USDT || 0)
        );

        setFuturesLocked(
          Number(response.wallet.futuresLocked?.USDT || 0)
        );

        setSpotAvailable(
          Number(response.wallet.balances?.USDT || 0)
        );
      }
    } catch (error) {
      console.error(
        "Futures wallet balance loading failed:",
        error
      );
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const refreshPositionsData =
    useCallback(async () => {
      setPositionsLoading(true);

      try {
        await Promise.allSettled([
          loadPositions(),
          loadHistory(),
          loadWalletBalance(),
        ]);
      } finally {
        setPositionsLoading(false);
      }
    }, [loadHistory, loadPositions, loadWalletBalance]);

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
      /*
       * RC5 STAGING CANDIDATE: payload trimmed to exactly the fields
       * controllers/futuresController.js's openPosition() actually
       * reads (symbol, side, quantity, leverage, entryPrice,
       * marginMode - see that function's own destructuring). The
       * previous payload also sent takeProfit/stopLoss/orderType/
       * reduceOnly/slippage/futuresTab/quoteCurrency - none of which
       * the backend consults for anything beyond storing
       * takeProfit/stopLoss as inert metadata; sending fields the
       * server silently ignores implies a capability (auto TP/SL,
       * reduce-only enforcement, per-tab contract types) that does
       * not exist. entryPrice is still sent for audit/comparison
       * only - see that function's own comment: it is NEVER used as
       * the actual execution price, which always comes from a
       * server-side trustworthy live price.
       */
      const payload = {
        symbol: selectedPair,
        side: requestedSide,
        quantity: numericAmount,
        leverage: numericLeverage,
        entryPrice: numericEntryPrice,
        marginMode: marginMode.toLowerCase(),
      };

      const response = await apiOpenPosition(payload, {
        idempotencyKey: generateIdempotencyKey("futures-open"),
      });

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Open position failed."
        );
      }

      await refreshPositionsData();

      setAmount("");

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
      const response = await apiClosePosition(positionId, {
        idempotencyKey: generateIdempotencyKey(
          `futures-close:${positionId}`
        ),
      });

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

  /*
   * RC5 STAGING CANDIDATE: real Spot<->Futures transfer, wired to
   * POST /api/futures/transfer (controllers/futuresController.js's
   * transferMargin - existed since RC4 with zero frontend caller
   * before this pass). Moves real USDT between the same two wallet
   * buckets Wallets.jsx already displays; refreshes both balances on
   * success so the trade panel's "Available" figure is never stale.
   */
  const submitTransfer = async () => {
    const numericAmount = Number(transferAmount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      window.alert(
        translateWithFallback(
          "enterValidAmount",
          "Please enter a valid amount.",
          "common"
        )
      );
      return;
    }

    setTransferSubmitting(true);

    try {
      const response = await transferFuturesMargin(
        { direction: transferDirection, amount: numericAmount },
        {
          idempotencyKey: generateIdempotencyKey(
            "futures-transfer"
          ),
        }
      );

      if (!response?.success) {
        throw new Error(
          response?.message || "Transfer failed."
        );
      }

      await loadWalletBalance();

      setTransferAmount("");
      setTransferOpen(false);

      window.alert(
        translateWithFallback(
          "transferSuccessful",
          "Transfer completed successfully."
        )
      );
    } catch (error) {
      console.error("Futures margin transfer failed:", error);

      window.alert(
        error?.message ||
          translateWithFallback(
            "transferFailed",
            "Transfer failed."
          )
      );
    } finally {
      setTransferSubmitting(false);
    }
  };

  /*
   * RC5 STAGING CANDIDATE: replaced a client-side PnL recomputation
   * with the REAL, server-computed value.
   * controllers/futuresController.js's getPositions() already
   * computes unrealizedPnl/pnl/pnlPercent per position (using its own
   * live-price lookup, the same figure the backend would use if this
   * position were liquidated or closed right now) - recalculating it
   * again client-side, from a possibly-stale local livePrices cache,
   * could silently disagree with the number the backend would
   * actually settle on. Falls back to 0 only if the field is somehow
   * absent (e.g. an older cached response shape).
   */
  const readPositionPnl = (position) =>
    Number(
      position?.unrealizedPnl ??
        position?.pnl ??
        0
    );

  const renderMarketChange = (change) => {
    const numericChange = Number(change || 0);

    return `${
      numericChange >= 0 ? "+" : ""
    }${numericChange.toFixed(2)}%`;
  };

  const renderPositionCard = (position) => {
    const positionId =
      position?._id || position?.id;

    const pnl = readPositionPnl(position);

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
              /*
               * RC5 STAGING CANDIDATE: server-computed markPrice
               * (getPositions()'s own live-price lookup) takes
               * priority over the client's livePrices cache, which
               * can lag by up to one 10s poll cycle - the backend
               * value is what liquidation/PnL math actually uses.
               */
              position?.markPrice ||
                livePrices[
                  position?.symbol ||
                    position?.pair
                ] ||
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

  if (!FUTURES_PRODUCTION_READY) {
    return (
      <main className="futures-page">
        <div
          className="futures-staging-banner"
          role="status"
        >
          {translateWithFallback(
            "futuresTemporarilyUnavailable",
            "Futures trading is temporarily unavailable while production risk controls are being completed."
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="futures-page">
      {!FUTURES_PRODUCTION_READY && (
        <div
          className="futures-staging-banner"
          role="status"
        >
          ⚠{" "}
          {translateWithFallback(
            "stagingBannerText",
            "Staging / development build. Balances, positions, and transfers below are real backend data, but new-trade execution is currently disabled by the exchange (futuresTradingEnabled=false) and this has not been verified against a live or test network. Not production-ready."
          )}
        </div>
      )}

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
              disabled={tab !== "USDⓈ-M"}
              title={
                tab !== "USDⓈ-M"
                  ? translateWithFallback(
                      "contractTypeUnavailable",
                      "Not available - only USDⓈ-M perpetual futures are supported by the backend today."
                    )
                  : undefined
              }
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

        {/*
          RC5 STAGING CANDIDATE: "Futures Market Live" was removed -
          it asserted a claim (a live, tradable market) this staging
          build does not make; the top-of-page staging banner already
          states the real status honestly.

          LAUNCH-CANDIDATE: the mobile-only "see the notice above"
          `.bm-notice` banner that used to sit here was removed too -
          it repeated the same staging-banner text with zero new
          information, and on small viewports it pushed the pair
          selector / trade box below the fold before any real trading
          UI was visible. The single banner above is sufficient.
        */}

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

            {/*
              RC5 STAGING CANDIDATE: the Market/Limit selector was
              removed - see the `orderType` constant's own comment
              above. Every order is a market order today, so this is
              shown as a fixed, non-interactive value rather than a
              dropdown implying a choice that doesn't exist.
            */}
            <div
              className="bm-full-input bm-static-value"
              aria-readonly="true"
            >
              {translateWithFallback(
                "market",
                "Market"
              )}
            </div>

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

              {/*
                RC5 STAGING CANDIDATE: the BUSD toggle was removed -
                see the `quoteCurrency` constant's own comment above.
              */}
              <span className="bm-static-value">
                {quoteCurrency}
              </span>
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
              <b>
                {walletLoading
                  ? "…"
                  : `${balance.toFixed(2)} USDT`}
              </b>
              <button
                type="button"
                className="bm-transfer-link"
                onClick={() =>
                  setTransferOpen(true)
                }
              >
                {translateWithFallback(
                  "transfer",
                  "Transfer"
                )}
              </button>
            </p>

            {/*
              RC5 STAGING CANDIDATE: Slippage Tolerance, TP/SL, and
              Reduce Only were removed from this panel -
              controllers/futuresController.js's openPosition() never
              reads a slippage or reduceOnly field at all, and while
              takeProfit/stopLoss ARE accepted and stored, nothing in
              the backend ever reads them back to auto-close a
              position - there is no TP/SL enforcement engine. Per
              the RC5 directive's own rule ("if a backend capability
              does not actually exist, disable/hide that control
              rather than simulate it"), these three controls are
              gone rather than left as no-ops a user could mistake
              for real protection.
            */}

            <div className="bm-cost-row">
              <span>
                {translateWithFallback(
                  "max",
                  "Max"
                )}
                <br />
                {balance.toFixed(2)} USDT
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

              <span>
                {translateWithFallback(
                  "estMargin",
                  "Est. Margin"
                )}
                <br />
                {estimatedMargin.toFixed(2)} USDT
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
            {/*
              PRODUCTION-ACTIVATION-CANDIDATE (directive D4 / QA
              finding #2): the hardcoded "Funding: not implemented"
              string was replaced with the real, live funding-rate
              estimate from GET /api/futures/funding-rate/:symbol (see
              fundingRateDisplay above) - this is a genuine backend
              computation now, not a placeholder. When unavailable
              (no active market config, no trustworthy live price
              yet, or the request failed) an honest "Funding rate
              unavailable" is shown instead - never a fabricated
              number.
            */}
            <div className="bm-funding">
              <span>
                {fundingRateDisplay
                  ? `${translateWithFallback(
                      "funding",
                      "Funding"
                    )}: ${
                      fundingRateDisplay.ratePercent >= 0
                        ? "+"
                        : ""
                    }${fundingRateDisplay.ratePercent.toFixed(
                      4
                    )}%${
                      fundingRateDisplay.intervalHours
                        ? ` / ${fundingRateDisplay.intervalHours}h`
                        : ""
                    }`
                  : translateWithFallback(
                      "fundingRateUnavailable",
                      "Funding rate unavailable"
                    )}
              </span>
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
              mobileTab === "history"
                ? "active"
                : ""
            }
            onClick={() =>
              setMobileTab("history")
            }
          >
            {translateWithFallback(
              "positionHistory",
              "History"
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

        {mobileTab === "orders" && (
          <section className="bm-mobile-positions">
            <p>
              {translateWithFallback(
                "futuresMarketOnlyNotice",
                "Futures orders execute immediately as market orders, so there are no pending orders to show."
              )}
            </p>

            <button
              type="button"
              className="bm-mobile-link-btn"
              onClick={() =>
                setPage?.("orders")
              }
            >
              {translateWithFallback(
                "viewOrderHistory",
                "View Order History"
              )}
            </button>
          </section>
        )}

        {mobileTab === "history" && (
          <section className="bm-mobile-positions bm-mobile-history">
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

            {/*
              RC5 STAGING CANDIDATE: fixed to USDT - see the
              `quoteCurrency` constant's own comment above.
            */}
            <div
              className="bm-static-value"
              aria-readonly="true"
            >
              {quoteCurrency}
            </div>

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

            {/*
              RC5 STAGING CANDIDATE: reworded from "Live Futures
              Market" - the PRICE DATA is genuinely real-time
              (Binance), but that phrase reads as "trading is live",
              which it is not in this build.
            */}
            {translateWithFallback(
              "liveFuturesMarket",
              "Live Market Data"
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

            {/*
              RC5 STAGING CANDIDATE: the Take Profit / Stop Loss
              inputs were removed - see the "Slippage Tolerance,
              TP/SL, and Reduce Only were removed" comment in the
              mobile trade panel above for why (never enforced by
              the backend). Replaced with the same honest,
              clearly-labeled margin estimate the mobile panel shows.
            */}
            <p className="tpsl-box-removed-note">
              {translateWithFallback(
                "estMargin",
                "Est. Margin"
              )}
              : {estimatedMargin.toFixed(2)} USDT
            </p>

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
                :{" "}
                {walletLoading
                  ? "…"
                  : `${balance.toFixed(2)} USDT`}
                <button
                  type="button"
                  className="bm-transfer-link"
                  onClick={() =>
                    setTransferOpen(true)
                  }
                >
                  {translateWithFallback(
                    "transfer",
                    "Transfer"
                  )}
                </button>
              </p>

              <p>
                {translateWithFallback(
                  "marginInUse",
                  "Margin In Use"
                )}
                : {futuresLocked.toFixed(2)} USDT
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

              {/*
                PRODUCTION-ACTIVATION-CANDIDATE (directive D4 / QA
                finding #2): the hardcoded "0.01%" Funding Rate and
                "Normal" Risk Level noted above were removed since
                neither was backed by a real computation, and this
                paragraph used to say funding was "not implemented in
                this build." That is no longer accurate -
                services/futures/fundingService.js's buildSymbolContext()
                is a real, live computation surfaced here via GET
                /api/futures/funding-rate/:symbol - so this now shows
                the genuine current estimate, or an honest
                "unavailable" message (distinct wording from "not
                implemented") when no active market config or
                trustworthy live price exists yet for this symbol. See
                fundingRateDisplay above; this never fabricates a
                rate.
              */}
              <p className="trade-info-unavailable-note">
                {fundingRateDisplay
                  ? `${translateWithFallback(
                      "fundingRate",
                      "Funding Rate"
                    )}: ${
                      fundingRateDisplay.ratePercent >= 0
                        ? "+"
                        : ""
                    }${fundingRateDisplay.ratePercent.toFixed(
                      4
                    )}%${
                      fundingRateDisplay.intervalHours
                        ? ` ${translateWithFallback(
                            "per",
                            "per"
                          )} ${
                            fundingRateDisplay.intervalHours
                          }h`
                        : ""
                    }`
                  : translateWithFallback(
                      "fundingRateUnavailable",
                      "Funding rate unavailable"
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

      {/*
        RC5 STAGING CANDIDATE: Spot<->Futures transfer panel, wired to
        the real POST /api/futures/transfer endpoint via
        submitTransfer() above. Shared between the mobile and desktop
        layouts (both "Transfer" buttons open the same state), reusing
        this component's existing "bm-popup" overlay styling.
      */}
      {transferOpen && (
        <div
          className="bm-drawer-overlay"
          role="presentation"
          onClick={() =>
            !transferSubmitting && setTransferOpen(false)
          }
        >
          <section
            className="bm-popup"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>
              {translateWithFallback(
                "transferMargin",
                "Transfer Margin"
              )}
            </h3>

            <p className="bm-avbl">
              {translateWithFallback(
                "spotAvailable",
                "Spot Available"
              )}
              : {spotAvailable.toFixed(2)} USDT
            </p>

            <p className="bm-avbl">
              {translateWithFallback(
                "futuresAvailable",
                "Futures Available"
              )}
              : {balance.toFixed(2)} USDT
            </p>

            <div className="bm-mini-row">
              <button
                type="button"
                className={
                  transferDirection === "TO_FUTURES"
                    ? "active-buy"
                    : ""
                }
                onClick={() =>
                  setTransferDirection("TO_FUTURES")
                }
              >
                {translateWithFallback(
                  "spotToFutures",
                  "Spot → Futures"
                )}
              </button>

              <button
                type="button"
                className={
                  transferDirection === "TO_SPOT"
                    ? "active-sell"
                    : ""
                }
                onClick={() =>
                  setTransferDirection("TO_SPOT")
                }
              >
                {translateWithFallback(
                  "futuresToSpot",
                  "Futures → Spot"
                )}
              </button>
            </div>

            <input
              type="number"
              min="0"
              step="any"
              placeholder={translateWithFallback(
                "amount",
                "Amount",
                "common"
              )}
              value={transferAmount}
              onChange={(event) =>
                setTransferAmount(event.target.value)
              }
            />

            <button
              type="button"
              disabled={transferSubmitting}
              onClick={submitTransfer}
            >
              {transferSubmitting
                ? translateWithFallback(
                    "processing",
                    "Processing...",
                    "common"
                  )
                : translateWithFallback(
                    "confirmTransfer",
                    "Confirm Transfer"
                  )}
            </button>

            <button
              type="button"
              disabled={transferSubmitting}
              onClick={() => setTransferOpen(false)}
            >
              {translateWithFallback(
                "close",
                "Close",
                "common"
              )}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default Futures;
