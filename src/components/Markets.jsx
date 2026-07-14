import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useI18n } from "../i18n/index.js";
import exchangeLogo from "../assets/exalt-exchange-logo.png";
import exaltCoinLogo from "../assets/exalt-coin.png";
import API_BASE_URL, { socket } from "../api";
import "./Markets.css";

const EXALT_COIN_LOGO = exaltCoinLogo;
const EXCHANGE_LOGO = exchangeLogo;

const DEFAULT_COIN_LOGO =
  "https://cryptologos.cc/logos/generic-coin-logo.png";

const normalizeApiBase = (value) => {
  const base = String(value || "")
    .trim()
    .replace(/\/+$/, "");

  return base.endsWith("/api")
    ? base.slice(0, -4)
    : base;
};

const API = normalizeApiBase(API_BASE_URL);

function Markets() {
  const { t } = useI18n();

  const [coins, setCoins] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [dexData, setDexData] = useState({});
  const [search, setSearch] = useState("");
  const [filterChain, setFilterChain] =
    useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] =
    useState(null);

  const translateWithFallback = (
    key,
    fallback,
    namespace = "markets"
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
        `Markets translation failed for "${key}":`,
        error
      );

      return fallback;
    }
  };

  const formatMoney = (value, digits = 6) => {
    const numberValue = Number(
      String(value || 0)
        .replace("$", "")
        .replaceAll(",", "")
    );

    if (!Number.isFinite(numberValue)) {
      return "$0";
    }

    return `$${numberValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    })}`;
  };

  const shortAddress = (address) =>
    address
      ? `${address.slice(0, 6)}...${address.slice(-6)}`
      : translateWithFallback(
          "notAvailable",
          "N/A",
          "common"
        );

  const copyText = async (text) => {
    if (!text) {
      window.alert(
        translateWithFallback(
          "noContractFound",
          "No contract found."
        )
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(text);

      window.alert(
        translateWithFallback(
          "contractCopied",
          "Contract copied."
        )
      );
    } catch (error) {
      console.error(
        "Contract copy failed:",
        error
      );

      window.alert(
        translateWithFallback(
          "copyFailed",
          "Copy failed.",
          "common"
        )
      );
    }
  };

  const getLogo = (coin) => {
    const symbol = String(
      coin?.symbol || ""
    ).toUpperCase();

    const name = String(
      coin?.coinName || coin?.name || ""
    ).toLowerCase();

    if (
      symbol === "EXALT" ||
      name.includes("exalt")
    ) {
      return EXALT_COIN_LOGO;
    }

    const possibleLogos = [
      coin?.logo,
      coin?.logoUrl,
      coin?.image,
      coin?.icon,
    ];

    const validLogo = possibleLogos.find(
      (logo) =>
        logo &&
        !String(logo).includes(
          "exalt-exchange"
        )
    );

    return validLogo || DEFAULT_COIN_LOGO;
  };

  const getContract = (coin) =>
    coin?.contractAddress ||
    coin?.address ||
    coin?.tokenAddress ||
    "";

  const normalizeCoin = (coin) => ({
    ...coin,

    coinName:
      coin?.coinName ||
      coin?.name ||
      "Exalt Coin",

    symbol: String(
      coin?.symbol || "EXALT"
    ).toUpperCase(),

    chain:
      coin?.chain ||
      "BNB Smart Chain",

    contractAddress: getContract(coin),
  });

  const getPair = useCallback(
    (coin) =>
      dexData[
        String(
          coin?.contractAddress || ""
        ).toLowerCase()
      ] || null,
    [dexData]
  );

  const getPrice = useCallback(
    (coin) => {
      const symbol = String(
        coin?.symbol || ""
      ).toUpperCase();

      const livePrice =
        livePrices[`${symbol}USDT`] ||
        livePrices[symbol];

      if (Number(livePrice) > 0) {
        return Number(livePrice);
      }

      const pair = getPair(coin);

      if (pair?.priceUsd) {
        return Number(pair.priceUsd);
      }

      return Number(
        String(coin?.price || 0)
          .replace("$", "")
          .replaceAll(",", "")
      );
    },
    [getPair, livePrices]
  );

  const getMarketCap = useCallback(
    (coin) => {
      const pair = getPair(coin);

      return Number(
        pair?.marketCap ||
          pair?.fdv ||
          coin?.marketCap ||
          0
      );
    },
    [getPair]
  );

  const getLiquidity = useCallback(
    (coin) => {
      const pair = getPair(coin);

      return Number(
        pair?.liquidity?.usd ||
          coin?.liquidity ||
          0
      );
    },
    [getPair]
  );

  const getVolume24h = useCallback(
    (coin) => {
      const pair = getPair(coin);

      return Number(
        pair?.volume?.h24 ||
          coin?.volume24h ||
          0
      );
    },
    [getPair]
  );

  const getChange24h = useCallback(
    (coin) => {
      const pair = getPair(coin);

      return Number(
        pair?.priceChange?.h24 ||
          coin?.change24h ||
          0
      );
    },
    [getPair]
  );

  const loadDexData = useCallback(
    async (approvedCoins) => {
      const nextDexData = {};

      await Promise.allSettled(
        approvedCoins.map(async (coin) => {
          const contract = getContract(coin);

          if (!contract) {
            return;
          }

          try {
            const response = await fetch(
              `https://api.dexscreener.com/latest/dex/tokens/${contract}`,
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
                data?.message ||
                  "DexScreener request failed"
              );
            }

            const pair = Array.isArray(
              data?.pairs
            )
              ? data.pairs[0]
              : null;

            if (pair) {
              nextDexData[
                contract.toLowerCase()
              ] = pair;
            }
          } catch (error) {
            console.error(
              "Dex market load failed:",
              contract,
              error
            );
          }
        })
      );

      setDexData(nextDexData);
    },
    []
  );

  const loadListings = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${API}/api/listings`,
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
          data?.message ||
            "Listings request failed"
        );
      }

      const approvedListings = Array.isArray(
        data?.listings
      )
        ? data.listings
        : [];

      const approvedCoins = approvedListings
        .filter(
          (coin) =>
            String(
              coin?.status || ""
            ).toLowerCase() === "approved"
        )
        .map(normalizeCoin)
        .filter(
          (coin) =>
            coin?.symbol &&
            coin?.coinName
        );

      const uniqueCoinsMap = new Map();

      approvedCoins.forEach((coin) => {
        const contract = String(
          coin?.contractAddress || ""
        ).toLowerCase();

        const uniqueKey =
          contract ||
          `${coin.symbol}-${coin.coinName}`;

        if (!uniqueCoinsMap.has(uniqueKey)) {
          uniqueCoinsMap.set(
            uniqueKey,
            coin
          );
        }
      });

      const uniqueCoins = Array.from(
        uniqueCoinsMap.values()
      );

      setCoins(uniqueCoins);

      await loadDexData(uniqueCoins);
    } catch (error) {
      console.error(
        "Markets listings API error:",
        error
      );

      setCoins([]);
      setDexData({});
    } finally {
      setLoading(false);
    }
  }, [loadDexData]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    const handleMarketUpdate = (data) => {
      if (!data?.symbol) {
        return;
      }

      const symbol = String(
        data.symbol
      ).toUpperCase();

      const price = Number(data.price || 0);

      if (!Number.isFinite(price)) {
        return;
      }

      setLivePrices((previousPrices) => ({
        ...previousPrices,
        [symbol]: price,
      }));
    };

    socket.on(
      "marketUpdate",
      handleMarketUpdate
    );

    return () => {
      socket.off(
        "marketUpdate",
        handleMarketUpdate
      );
    };
  }, []);

  const chains = useMemo(() => {
    const uniqueChains = new Set(
      coins
        .map((coin) => coin?.chain)
        .filter(Boolean)
    );

    return [
      "ALL",
      ...Array.from(uniqueChains),
    ];
  }, [coins]);

  const filteredCoins = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return coins.filter((coin) => {
      const name = String(
        coin?.coinName || ""
      ).toLowerCase();

      const symbol = String(
        coin?.symbol || ""
      ).toLowerCase();

      const contract = String(
        coin?.contractAddress || ""
      ).toLowerCase();

      const chain = String(
        coin?.chain || ""
      );

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        symbol.includes(keyword) ||
        contract.includes(keyword);

      const matchesChain =
        filterChain === "ALL" ||
        chain === filterChain;

      return (
        matchesSearch &&
        matchesChain
      );
    });
  }, [coins, search, filterChain]);

  const topGainers = useMemo(
    () =>
      [...filteredCoins]
        .sort(
          (firstCoin, secondCoin) =>
            getChange24h(secondCoin) -
            getChange24h(firstCoin)
        )
        .slice(0, 3),
    [filteredCoins, getChange24h]
  );

  const topLosers = useMemo(
    () =>
      [...filteredCoins]
        .sort(
          (firstCoin, secondCoin) =>
            getChange24h(firstCoin) -
            getChange24h(secondCoin)
        )
        .slice(0, 3),
    [filteredCoins, getChange24h]
  );

  const openExternalLink = (url) => {
    if (!url) {
      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <main className="markets-page">
      <section className="markets-hero">
        <div>
          <span className="market-live-dot">
            {translateWithFallback(
              "liveMarketBoard",
              "● Live Market Board"
            )}
          </span>

          <h1>
            {translateWithFallback(
              "marketsTitle",
              "EXALT Markets"
            )}
          </h1>

          <p>
            {translateWithFallback(
              "marketsSubtitle",
              "Approved coins, verified contracts, live charts, liquidity and volume."
            )}
          </p>
        </div>

        <button
          type="button"
          className="action-btn yellow-btn markets-refresh-btn"
          onClick={loadListings}
          disabled={loading}
        >
          {loading
            ? translateWithFallback(
                "loading",
                "Loading...",
                "common"
              )
            : translateWithFallback(
                "refresh",
                "Refresh",
                "common"
              )}
        </button>
      </section>

      <section className="market-feature-grid">
        <article className="market-feature-card">
          <span>
            🔥{" "}
            {translateWithFallback(
              "topGainer",
              "Top Gainer"
            )}
          </span>

          <h3>
            {topGainers[0]?.symbol ||
              "EXALT"}
          </h3>

          <p className="green-text">
            {getChange24h(
              topGainers[0] || {}
            ).toFixed(2)}
            %
          </p>
        </article>

        <article className="market-feature-card">
          <span>
            📉{" "}
            {translateWithFallback(
              "topLoser",
              "Top Loser"
            )}
          </span>

          <h3>
            {topLosers[0]?.symbol ||
              translateWithFallback(
                "notAvailable",
                "N/A",
                "common"
              )}
          </h3>

          <p className="red-text">
            {getChange24h(
              topLosers[0] || {}
            ).toFixed(2)}
            %
          </p>
        </article>

        <article className="market-feature-card">
          <span>
            ⭐{" "}
            {translateWithFallback(
              "trending",
              "Trending"
            )}
          </span>

          <h3>
            {filteredCoins[0]?.symbol ||
              "EXALT"}
          </h3>

          <p>
            {formatMoney(
              getVolume24h(
                filteredCoins[0] || {}
              ),
              2
            )}{" "}
            {translateWithFallback(
              "volume",
              "Volume"
            )}
          </p>
        </article>
      </section>

      <section className="markets-controls">
        <input
          type="search"
          value={search}
          placeholder={translateWithFallback(
            "searchCoin",
            "Search coin, symbol or contract..."
          )}
          aria-label={translateWithFallback(
            "searchCoin",
            "Search coin, symbol or contract..."
          )}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={filterChain}
          aria-label={translateWithFallback(
            "allChains",
            "All Chains"
          )}
          onChange={(event) =>
            setFilterChain(event.target.value)
          }
        >
          {chains.map((chain) => (
            <option
              key={chain}
              value={chain}
            >
              {chain === "ALL"
                ? translateWithFallback(
                    "allChains",
                    "All Chains"
                  )
                : chain}
            </option>
          ))}
        </select>
      </section>

      <section className="market-stats">
        <article className="stat-card">
          <h3>
            {translateWithFallback(
              "totalListedCoins",
              "Total Listed Coins"
            )}
          </h3>

          <p>{coins.length}</p>
        </article>

        <article className="stat-card">
          <h3>
            {translateWithFallback(
              "filteredCoins",
              "Filtered Coins"
            )}
          </h3>

          <p>{filteredCoins.length}</p>
        </article>

        <article className="stat-card">
          <h3>
            {translateWithFallback(
              "marketStatus",
              "Market Status"
            )}
          </h3>

          <p className="green-text">
            {translateWithFallback(
              "live",
              "LIVE"
            )}
          </p>
        </article>

        <article className="stat-card">
          <h3>
            {translateWithFallback(
              "exchange",
              "Exchange",
              "common"
            )}
          </h3>

          <p>EXALT</p>
        </article>
      </section>

      <section className="table-wrapper">
        {loading ? (
          <p className="market-empty">
            {translateWithFallback(
              "loadingMarkets",
              "Loading markets..."
            )}
          </p>
        ) : filteredCoins.length === 0 ? (
          <p className="market-empty">
            {translateWithFallback(
              "noApprovedCoins",
              "No approved coins found."
            )}
          </p>
        ) : (
          <table className="market-table">
            <thead>
              <tr>
                <th>#</th>

                <th>
                  {translateWithFallback(
                    "coin",
                    "Coin"
                  )}
                </th>

                <th>
                  {translateWithFallback(
                    "price",
                    "Price"
                  )}
                </th>

                <th>
                  {translateWithFallback(
                    "change24h",
                    "24H Change"
                  )}
                </th>

                <th>
                  {translateWithFallback(
                    "volume24h",
                    "24H Volume"
                  )}
                </th>

                <th>
                  {translateWithFallback(
                    "marketCap",
                    "Market Cap"
                  )}
                </th>

                <th>
                  {translateWithFallback(
                    "liquidity",
                    "Liquidity"
                  )}
                </th>

                <th>
                  {translateWithFallback(
                    "chain",
                    "Chain"
                  )}
                </th>

                <th>
                  {translateWithFallback(
                    "contract",
                    "Contract"
                  )}
                </th>

                <th>
                  {translateWithFallback(
                    "status",
                    "Status",
                    "common"
                  )}
                </th>

                <th>
                  {translateWithFallback(
                    "chart",
                    "Chart"
                  )}
                </th>

                <th>
                  {translateWithFallback(
                    "buy",
                    "Buy",
                    "trading"
                  )}
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCoins.map(
                (coin, index) => {
                  const contract =
                    coin?.contractAddress || "";

                  const pair = getPair(coin);

                  const chartLink =
                    coin?.chart ||
                    coin?.dexscreener ||
                    pair?.url ||
                    (contract
                      ? `https://dexscreener.com/bsc/${contract}`
                      : "");

                  const buyLink =
                    coin?.buy ||
                    (contract
                      ? `https://pancakeswap.finance/swap?outputCurrency=${contract}`
                      : "");

                  const change =
                    getChange24h(coin);

                  return (
                    <tr
                      key={
                        coin?._id ||
                        contract ||
                        `${coin?.symbol}-${index}`
                      }
                      onClick={() =>
                        setSelectedCoin(coin)
                      }
                    >
                      <td>{index + 1}</td>

                      <td>
                        <div className="market-coin-cell">
                          <img
                            src={getLogo(coin)}
                            alt={
                              coin?.symbol ||
                              "Coin"
                            }
                            onError={(event) => {
                              event.currentTarget.onerror =
                                null;

                              event.currentTarget.src =
                                EXCHANGE_LOGO;
                            }}
                          />

                          <div>
                            <strong>
                              {coin?.coinName}
                            </strong>

                            <small>
                              {coin?.symbol}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {formatMoney(
                          getPrice(coin),
                          8
                        )}
                      </td>

                      <td
                        className={
                          change >= 0
                            ? "green-text"
                            : "red-text"
                        }
                      >
                        {change.toFixed(2)}%
                      </td>

                      <td>
                        {formatMoney(
                          getVolume24h(coin),
                          2
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          getMarketCap(coin),
                          2
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          getLiquidity(coin),
                          2
                        )}
                      </td>

                      <td>{coin?.chain}</td>

                      <td>
                        <button
                          type="button"
                          className="contract-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            copyText(contract);
                          }}
                        >
                          {shortAddress(contract)}
                        </button>
                      </td>

                      <td>
                        <span className="market-status">
                          {coin?.status ||
                            translateWithFallback(
                              "approved",
                              "Approved",
                              "common"
                            )}
                        </span>
                      </td>

                      <td>
                        {chartLink ? (
                          <a
                            className="market-link"
                            href={chartLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            {translateWithFallback(
                              "chart",
                              "Chart"
                            )}
                          </a>
                        ) : (
                          translateWithFallback(
                            "notAvailable",
                            "N/A",
                            "common"
                          )
                        )}
                      </td>

                      <td>
                        {buyLink ? (
                          <a
                            className="buy-link"
                            href={buyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            {translateWithFallback(
                              "buy",
                              "Buy",
                              "trading"
                            )}
                          </a>
                        ) : (
                          translateWithFallback(
                            "notAvailable",
                            "N/A",
                            "common"
                          )
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        )}
      </section>

      {selectedCoin && (
        <div
          className="market-modal-overlay"
          role="presentation"
          onClick={() =>
            setSelectedCoin(null)
          }
        >
          <section
            className="market-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              selectedCoin?.coinName ||
              selectedCoin?.symbol
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="close-market-modal"
              aria-label={translateWithFallback(
                "close",
                "Close",
                "common"
              )}
              onClick={() =>
                setSelectedCoin(null)
              }
            >
              ✕
            </button>

            <img
              src={getLogo(selectedCoin)}
              className="market-modal-logo"
              alt={
                selectedCoin?.symbol ||
                "Coin"
              }
              onError={(event) => {
                event.currentTarget.onerror =
                  null;

                event.currentTarget.src =
                  EXCHANGE_LOGO;
              }}
            />

            <h2>
              {selectedCoin?.coinName}
            </h2>

            <p>{selectedCoin?.symbol}</p>

            <div className="market-modal-grid">
              <div>
                <span>
                  {translateWithFallback(
                    "price",
                    "Price"
                  )}
                </span>

                <h3>
                  {formatMoney(
                    getPrice(selectedCoin),
                    8
                  )}
                </h3>
              </div>

              <div>
                <span>
                  {translateWithFallback(
                    "change24h",
                    "24H Change"
                  )}
                </span>

                <h3
                  className={
                    getChange24h(
                      selectedCoin
                    ) >= 0
                      ? "green-text"
                      : "red-text"
                  }
                >
                  {getChange24h(
                    selectedCoin
                  ).toFixed(2)}
                  %
                </h3>
              </div>

              <div>
                <span>
                  {translateWithFallback(
                    "marketCap",
                    "Market Cap"
                  )}
                </span>

                <h3>
                  {formatMoney(
                    getMarketCap(
                      selectedCoin
                    ),
                    2
                  )}
                </h3>
              </div>

              <div>
                <span>
                  {translateWithFallback(
                    "liquidity",
                    "Liquidity"
                  )}
                </span>

                <h3>
                  {formatMoney(
                    getLiquidity(
                      selectedCoin
                    ),
                    2
                  )}
                </h3>
              </div>

              <div>
                <span>
                  {translateWithFallback(
                    "volume24h",
                    "24H Volume"
                  )}
                </span>

                <h3>
                  {formatMoney(
                    getVolume24h(
                      selectedCoin
                    ),
                    2
                  )}
                </h3>
              </div>

              <div>
                <span>
                  {translateWithFallback(
                    "chain",
                    "Chain"
                  )}
                </span>

                <h3>
                  {selectedCoin?.chain}
                </h3>
              </div>
            </div>

            <div className="market-links">
              {selectedCoin?.website && (
                <a
                  href={
                    selectedCoin.website
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {translateWithFallback(
                    "website",
                    "Website"
                  )}
                </a>
              )}

              {selectedCoin?.telegram && (
                <a
                  href={
                    selectedCoin.telegram
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Telegram
                </a>
              )}

              {(selectedCoin?.twitter ||
                selectedCoin?.x) && (
                <a
                  href={
                    selectedCoin.twitter ||
                    selectedCoin.x
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  X
                </a>
              )}
            </div>

            <button
              type="button"
              className="buy-link modal-buy-btn"
              disabled={
                !selectedCoin?.contractAddress
              }
              onClick={() =>
                openExternalLink(
                  selectedCoin?.contractAddress
                    ? `https://pancakeswap.finance/swap?outputCurrency=${selectedCoin.contractAddress}`
                    : ""
                )
              }
            >
              {translateWithFallback(
                "buyToken",
                "Buy Token"
              )}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default Markets;