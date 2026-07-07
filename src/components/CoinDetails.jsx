import { useMemo } from "react";
import exaltLogo from "../assets/exalt-coin.png";
import "./CoinDetails.css";

import {
  getTokenLogo,
  getTokenExplorerUrl,
  formatTokenAmount,
  formatTokenPrice,
  buildTokenDisplayName,
} from "../web3/tokens";

import { copyToClipboard } from "../web3/utils";

function CoinDetails({
  coin,
  balance = 0,
  price = 0,
  onBack,
  onSend,
  onReceive,
  onSwap,
  onImport,
  onFavorite,
  onWatchlist,
  onHide,
}) {
  const token = coin || {};

  const tokenPrice = Number(price || token.fallbackPrice || 0);
  const tokenBalance = Number(balance || 0);
  const valueUsd = tokenBalance * tokenPrice;

  const change24h = Number(token.change24h || token.priceChange24h || 0);
  const marketCap = Number(token.marketCap || token.market_cap || 0);
  const volume24h = Number(token.volume24h || token.total_volume || 0);
  const supply = Number(token.circulatingSupply || token.supply || 0);

  const explorerUrl = useMemo(() => {
    try {
      return getTokenExplorerUrl(token);
    } catch {
      return "";
    }
  }, [token]);

  const copyAddress = async () => {
    if (!token.address) return alert("Contract address not available.");
    await copyToClipboard(token.address);
    alert("Contract address copied.");
  };

  const copySymbol = async () => {
    await copyToClipboard(token.symbol || "");
    alert("Symbol copied.");
  };

  const openExplorer = () => {
    if (!explorerUrl) return alert("Explorer not available.");
    window.open(explorerUrl, "_blank", "noopener,noreferrer");
  };
const getDexChartUrl = () => {
  if (!token?.address || token.native || token.marketOnly || token.watchOnly) {
    return "";
  }

  const chainMap = {
    bsc: "bsc",
    ethereum: "ethereum",
    polygon: "polygon",
    arbitrum: "arbitrum",
    optimism: "optimism",
    base: "base",
    avalanche: "avalanche",
    fantom: "fantom",
    cronos: "cronos",
  };

  const dexChain = chainMap[token.chainKey || token.chain] || "bsc";

  return `https://dexscreener.com/${dexChain}/${token.address}?embed=1&theme=dark&info=0`;
};
  const canUseOnChain =
    !token.marketOnly && !token.watchOnly && (token.native || token.address);

  return (
    <div className="coin-detail-page">
      <div className="coin-detail-phone">
        <div className="coin-detail-top">
          <button onClick={onBack}>‹</button>
          <h3>{token.symbol || "Coin"} Details</h3>
          <button onClick={onFavorite}>⭐</button>
        </div>

        <div className="coin-hero-card">
          <img
            src={getTokenLogo(token, exaltLogo)}
            alt={token.symbol}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <h1>{token.symbol || "TOKEN"}</h1>
          <p>{token.name || buildTokenDisplayName(token)}</p>

          <h2>${formatTokenPrice(tokenPrice)}</h2>

          <span className={change24h >= 0 ? "coin-green" : "coin-red"}>
            {change24h >= 0 ? "+" : ""}
            {change24h.toFixed(2)}% / 24h
          </span>
        </div>

        <div className="coin-action-grid">
          <button disabled={!canUseOnChain} onClick={() => onSend?.(token)}>
            ⬆️ Send
          </button>

          <button onClick={() => onReceive?.(token)}>
            ⬇️ Receive
          </button>

          <button disabled={!canUseOnChain} onClick={() => onSwap?.(token)}>
            ⇄ Swap
          </button>

          <button onClick={() => onImport?.(token)}>
            ＋ Import
          </button>
        </div>

        {(token.marketOnly || token.watchOnly) && (
          <div className="coin-warning">
            This is a market/watchlist coin. Import the real contract token
            before send, receive or swap.
          </div>
        )}

        <div className="coin-balance-card">
          <div>
            <span>Your Balance</span>
            <strong>
              {formatTokenAmount(tokenBalance)} {token.symbol}
            </strong>
          </div>

          <div>
            <span>Estimated Value</span>
            <strong>${formatTokenPrice(valueUsd)}</strong>
          </div>
        </div>

        <div className="coin-chart-card">
          <div className="coin-section-head">
            <h3>Price Chart</h3>
<span className="coin-live-badge">
  🟢 Live
</span>
          </div>

      {getDexChartUrl() ? (
  <iframe
    className="coin-live-chart"
    src={getDexChartUrl()}
    title={`${token.symbol} live chart`}
    loading="lazy"
  />
) : (
  <div className="coin-chart-placeholder">
    <div />
    <p>Live chart available after real contract import</p>
  </div>
)}
            
        </div>

        <div className="coin-stats-card">
          <h3>Market Stats</h3>

          <div className="coin-stat-row">
            <span>Price</span>
            <strong>${formatTokenPrice(tokenPrice)}</strong>
          </div>

          <div className="coin-stat-row">
            <span>24h Change</span>
            <strong className={change24h >= 0 ? "coin-green" : "coin-red"}>
              {change24h >= 0 ? "+" : ""}
              {change24h.toFixed(2)}%
            </strong>
          </div>

          <div className="coin-stat-row">
            <span>Market Cap</span>
            <strong>
              {marketCap > 0 ? `$${marketCap.toLocaleString()}` : "N/A"}
            </strong>
          </div>

          <div className="coin-stat-row">
            <span>24h Volume</span>
            <strong>
              {volume24h > 0 ? `$${volume24h.toLocaleString()}` : "N/A"}
            </strong>
          </div>

          <div className="coin-stat-row">
            <span>Circulating Supply</span>
            <strong>
              {supply > 0
                ? `${supply.toLocaleString()} ${token.symbol}`
                : "N/A"}
            </strong>
          </div>
        </div>

        <div className="coin-network-card">
          <h3>Network Info</h3>

          <div className="coin-stat-row">
            <span>Network</span>
            <strong>{token.network || token.chainKey || "N/A"}</strong>
          </div>

          <div className="coin-stat-row">
            <span>Chain</span>
            <strong>{token.chainKey || token.chain || "N/A"}</strong>
          </div>

          <div className="coin-stat-row">
            <span>Decimals</span>
            <strong>{token.decimals ?? "N/A"}</strong>
          </div>

          <div className="coin-contract-box">
            <span>Contract Address</span>

            <strong>
              {token.native
                ? "Native Coin"
                : token.address || "Not imported yet"}
            </strong>

            <div>
              <button onClick={copyAddress} disabled={!token.address}>
                Copy Contract
              </button>

              <button onClick={openExplorer} disabled={!explorerUrl}>
                Explorer
              </button>
            </div>
          </div>
        </div>

        <div className="coin-manage-card">
          <h3>Manage Coin</h3>

          <button onClick={copySymbol}>Copy Symbol</button>
<button onClick={() => onFavorite?.(token)}>
  {token.favorite ? "★ Remove Favorite" : "☆ Add Favorite"}
</button>

<button onClick={() => onWatchlist?.(token)}>
  {token.watchlisted ? "👁 Remove Watchlist" : "👁 Add Watchlist"}
</button>

<button className="danger" onClick={() => onHide?.(token)}>
  Hide Coin
</button>
         
        </div>
      </div>
    </div>
  );
}

export default CoinDetails;