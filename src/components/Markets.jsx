import { useEffect, useMemo, useState } from "react";
import exchangeLogo from "../assets/exalt-exchange.png";
import exaltCoinLogo from "../assets/exalt-coin.png";
import API_BASE_URL, { socket } from "../api";
import "./Markets.css";
const EXALT_COIN_LOGO = exaltCoinLogo;
const EXALT_LOGO = exchangeLogo;
const DEFAULT_COIN_LOGO =
  "https://cryptologos.cc/logos/generic-coin-logo.png";
function Markets() {
  const [coins, setCoins] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [dexData, setDexData] = useState({});
  const [search, setSearch] = useState("");
  const [filterChain, setFilterChain] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState(null);

  const formatMoney = (value, digits = 6) => {
    const n = Number(String(value || 0).replace("$", "").replaceAll(",", ""));
    if (!n) return "$0";
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
  };

  const shortAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-6)}` : "N/A";

  const copyText = async (text) => {
    if (!text) return alert("No contract found");
    await navigator.clipboard.writeText(text);
    alert("Contract copied");
  };

 const getLogo = (coin) => {
  const symbol = String(coin.symbol || "").toUpperCase();
  const name = String(coin.coinName || coin.name || "").toLowerCase();

  if (symbol === "EXALT" || name.includes("exalt")) {
    return EXALT_COIN_LOGO;
  }

  if (coin.logo && !String(coin.logo).includes("exalt-exchange")) return coin.logo;
  if (coin.logoUrl && !String(coin.logoUrl).includes("exalt-exchange")) return coin.logoUrl;
  if (coin.image && !String(coin.image).includes("exalt-exchange")) return coin.image;
  if (coin.icon && !String(coin.icon).includes("exalt-exchange")) return coin.icon;

  return DEFAULT_COIN_LOGO;
};
  const getContract = (coin) =>
    coin.contractAddress || coin.address || coin.tokenAddress || "";

  const normalizeCoin = (coin) => ({
    ...coin,
    coinName: coin.coinName || coin.name || "Exalt Coin",
    symbol: String(coin.symbol || "EXALT").toUpperCase(),
    chain: coin.chain || "BNB Smart Chain",
    contractAddress: getContract(coin),
  });

  const loadDexData = async (approvedCoins) => {
    const nextDexData = {};

    await Promise.all(
      approvedCoins.map(async (coin) => {
        const contract = getContract(coin);
        if (!contract) return;

        try {
          const res = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${contract}`
          );
          const data = await res.json();
          const pair = data?.pairs?.[0];

          if (pair) {
            nextDexData[contract.toLowerCase()] = pair;
          }
        } catch (error) {
          console.log("Dex load failed:", contract, error);
        }
      })
    );

    setDexData(nextDexData);
  };

  const loadListings = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/listings`);
      const data = await res.json();

      const approved = (data.listings || [])
        .filter((coin) => String(coin.status || "").toLowerCase() === "approved")
        .map(normalizeCoin)
        .filter((coin) => coin.symbol && coin.coinName);

      const uniqueMap = new Map();

      approved.forEach((coin) => {
        const contract = String(coin.contractAddress || "").toLowerCase();
        const key = contract || `${coin.symbol}-${coin.coinName}`;

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, coin);
        }
      });

      const uniqueCoins = Array.from(uniqueMap.values());

      setCoins(uniqueCoins);
      await loadDexData(uniqueCoins);
    } catch (error) {
      console.log("Markets API Error:", error);
      setCoins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    const handleMarketUpdate = (data) => {
      if (!data?.symbol) return;

      setLivePrices((prev) => ({
        ...prev,
        [String(data.symbol).toUpperCase()]: Number(data.price || 0),
      }));
    };

    socket.on("marketUpdate", handleMarketUpdate);
    return () => socket.off("marketUpdate", handleMarketUpdate);
  }, []);

  const chains = useMemo(() => {
    const unique = new Set(coins.map((coin) => coin.chain).filter(Boolean));
    return ["ALL", ...Array.from(unique)];
  }, [coins]);

  const getPair = (coin) =>
    dexData[String(coin.contractAddress || "").toLowerCase()] || null;

  const getPrice = (coin) => {
    const symbol = String(coin.symbol || "").toUpperCase();
    const live = livePrices[`${symbol}USDT`] || livePrices[symbol];

    if (Number(live) > 0) return Number(live);

    const pair = getPair(coin);
    if (pair?.priceUsd) return Number(pair.priceUsd);

    return Number(String(coin.price || 0).replace("$", "").replaceAll(",", ""));
  };

  const getMarketCap = (coin) => {
    const pair = getPair(coin);
    return Number(pair?.marketCap || pair?.fdv || coin.marketCap || 0);
  };

  const getLiquidity = (coin) => {
    const pair = getPair(coin);
    return Number(pair?.liquidity?.usd || coin.liquidity || 0);
  };

  const getVolume24h = (coin) => {
    const pair = getPair(coin);
    return Number(pair?.volume?.h24 || coin.volume24h || 0);
  };

  const getChange24h = (coin) => {
    const pair = getPair(coin);
    return Number(pair?.priceChange?.h24 || coin.change24h || 0);
  };

  const filteredCoins = useMemo(() => {
    const keyword = search.toLowerCase();

    return coins.filter((coin) => {
      const name = String(coin.coinName || "").toLowerCase();
      const symbol = String(coin.symbol || "").toLowerCase();
      const contract = String(coin.contractAddress || "").toLowerCase();
      const chain = String(coin.chain || "");

      const matchSearch =
        !keyword ||
        name.includes(keyword) ||
        symbol.includes(keyword) ||
        contract.includes(keyword);

      const matchChain = filterChain === "ALL" || chain === filterChain;

      return matchSearch && matchChain;
    });
  }, [coins, search, filterChain]);

  const topGainers = useMemo(
    () =>
      [...filteredCoins]
        .sort((a, b) => getChange24h(b) - getChange24h(a))
        .slice(0, 3),
    [filteredCoins, dexData]
  );

  const topLosers = useMemo(
    () =>
      [...filteredCoins]
        .sort((a, b) => getChange24h(a) - getChange24h(b))
        .slice(0, 3),
    [filteredCoins, dexData]
  );

  return (
    <div className="markets-page">
      <div className="markets-hero">
        <div>
          <span className="market-live-dot">● Live Market Board</span>
          <h1>EXALT MARKETS</h1>
          <p>Approved coins, verified contracts, live charts, liquidity and volume.</p>
        </div>

        <button className="action-btn yellow-btn" onClick={loadListings}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="market-feature-grid">
        <div className="market-feature-card">
          <span>🔥 Top Gainer</span>
          <h3>{topGainers[0]?.symbol || "EXALT"}</h3>
          <p className="green-text">
            {getChange24h(topGainers[0] || {}).toFixed(2)}%
          </p>
        </div>

        <div className="market-feature-card">
          <span>📉 Top Loser</span>
          <h3>{topLosers[0]?.symbol || "N/A"}</h3>
          <p className="red-text">
            {getChange24h(topLosers[0] || {}).toFixed(2)}%
          </p>
        </div>

        <div className="market-feature-card">
          <span>⭐ Trending</span>
          <h3>{filteredCoins[0]?.symbol || "EXALT"}</h3>
          <p>{formatMoney(getVolume24h(filteredCoins[0] || {}), 2)} Volume</p>
        </div>
      </div>

      <div className="markets-controls">
        <input
          type="text"
          placeholder="Search coin, symbol or contract..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filterChain} onChange={(e) => setFilterChain(e.target.value)}>
          {chains.map((chain) => (
            <option key={chain} value={chain}>
              {chain === "ALL" ? "All Chains" : chain}
            </option>
          ))}
        </select>
      </div>

      <div className="market-stats">
        <div className="stat-card">
          <h3>Total Listed Coins</h3>
          <p>{coins.length}</p>
        </div>
        <div className="stat-card">
          <h3>Filtered Coins</h3>
          <p>{filteredCoins.length}</p>
        </div>
        <div className="stat-card">
          <h3>Market Status</h3>
          <p className="green-text">LIVE</p>
        </div>
        <div className="stat-card">
          <h3>Exchange</h3>
          <p>EXALT</p>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <p className="market-empty">Loading markets...</p>
        ) : filteredCoins.length === 0 ? (
          <p className="market-empty">No approved coins found.</p>
        ) : (
          <table className="market-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Coin</th>
                <th>Price</th>
                <th>24H</th>
                <th>Volume 24H</th>
                <th>Market Cap</th>
                <th>Liquidity</th>
                <th>Chain</th>
                <th>Contract</th>
                <th>Status</th>
                <th>Chart</th>
                <th>Buy</th>
              </tr>
            </thead>

            <tbody>
              {filteredCoins.map((coin, index) => {
                const contract = coin.contractAddress || "";
                const pair = getPair(coin);

                const chartLink =
                  coin.chart ||
                  coin.dexscreener ||
                  pair?.url ||
                  (contract ? `https://dexscreener.com/bsc/${contract}` : "");

                const buyLink =
                  coin.buy ||
                  (contract
                    ? `https://pancakeswap.finance/swap?outputCurrency=${contract}`
                    : "");

                const change = getChange24h(coin);

                return (
                  <tr
                    key={coin._id || contract || index}
                    onClick={() => setSelectedCoin(coin)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{index + 1}</td>

                    <td>
                      <div className="market-coin-cell">
                        <img
                          src={getLogo(coin)}
                          alt={coin.symbol}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = EXALT_LOGO;
                          }}
                        />

                        <div>
                          <strong>{coin.coinName}</strong>
                          <small>{coin.symbol}</small>
                        </div>
                      </div>
                    </td>

                    <td>{formatMoney(getPrice(coin), 8)}</td>

                    <td className={change >= 0 ? "green-text" : "red-text"}>
                      {change.toFixed(2)}%
                    </td>

                    <td>{formatMoney(getVolume24h(coin), 2)}</td>
                    <td>{formatMoney(getMarketCap(coin), 2)}</td>
                    <td>{formatMoney(getLiquidity(coin), 2)}</td>
                    <td>{coin.chain}</td>

                    <td>
                      <button
                        className="contract-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyText(contract);
                        }}
                      >
                        {shortAddress(contract)}
                      </button>
                    </td>

                    <td>
                      <span className="market-status">
                        {coin.status || "Approved"}
                      </span>
                    </td>

                    <td>
                      {chartLink ? (
                        <a
                          className="market-link"
                          href={chartLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Chart
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td>
                      {buyLink ? (
                        <a
                          className="buy-link"
                          href={buyLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Buy
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedCoin && (
        <div className="market-modal-overlay">
          <div className="market-modal">
            <button
              className="close-market-modal"
              onClick={() => setSelectedCoin(null)}
            >
              ✕
            </button>

            <img
              src={getLogo(selectedCoin)}
              className="market-modal-logo"
              alt={selectedCoin.symbol}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = EXALT_LOGO;
              }}
            />

            <h2>{selectedCoin.coinName}</h2>
            <p>{selectedCoin.symbol}</p>

            <div className="market-modal-grid">
              <div>
                <span>Price</span>
                <h3>{formatMoney(getPrice(selectedCoin), 8)}</h3>
              </div>

              <div>
                <span>24H Change</span>
                <h3
                  className={
                    getChange24h(selectedCoin) >= 0 ? "green-text" : "red-text"
                  }
                >
                  {getChange24h(selectedCoin).toFixed(2)}%
                </h3>
              </div>

              <div>
                <span>Market Cap</span>
                <h3>{formatMoney(getMarketCap(selectedCoin), 2)}</h3>
              </div>

              <div>
                <span>Liquidity</span>
                <h3>{formatMoney(getLiquidity(selectedCoin), 2)}</h3>
              </div>

              <div>
                <span>Volume 24H</span>
                <h3>{formatMoney(getVolume24h(selectedCoin), 2)}</h3>
              </div>

              <div>
                <span>Chain</span>
                <h3>{selectedCoin.chain}</h3>
              </div>
            </div>

            <div className="market-links">
              {selectedCoin.website && (
                <a href={selectedCoin.website} target="_blank" rel="noreferrer">
                  Website
                </a>
              )}

              {selectedCoin.telegram && (
                <a href={selectedCoin.telegram} target="_blank" rel="noreferrer">
                  Telegram
                </a>
              )}

              {(selectedCoin.twitter || selectedCoin.x) && (
                <a
                  href={selectedCoin.twitter || selectedCoin.x}
                  target="_blank"
                  rel="noreferrer"
                >
                  X
                </a>
              )}
            </div>

            <button
              className="buy-link modal-buy-btn"
              onClick={() =>
                window.open(
                  `https://pancakeswap.finance/swap?outputCurrency=${selectedCoin.contractAddress}`,
                  "_blank"
                )
              }
            >
              Buy Token
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Markets;