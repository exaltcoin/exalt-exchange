import "./Dashboard.css";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

function Dashboard({ setPage }) {
 const API_BASE = import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;
  const EXALT_ADDRESS = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

 const EXALT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

  const [coins, setCoins] = useState([]);
  const [exaltPrice, setExaltPrice] = useState(0.02456);
  const [exaltHoldings, setExaltHoldings] = useState(0);
  const [marketCap, setMarketCap] = useState(0);
  const [liquidity, setLiquidity] = useState(0);
  const [loading, setLoading] = useState(true);
const [rewardStats, setRewardStats] = useState({
  approvedAmount: 0,
  pendingAmount: 0,
  pendingClaims: 0,
  todayClaims: 0,
  activeMiners: 0,
  miningRemaining: 0,
});
  const portfolioValue = Number(exaltHoldings || 0) * Number(exaltPrice || 0);

  const formatUsd = (value, digits = 2) =>
    Number(value || 0).toLocaleString(undefined, {
      maximumFractionDigits: digits,
    });

  const loadDashboard = async () => {
    try {
      setLoading(true);

      try {
        const marketRes = await fetch(`${API}/api/market/live`);
        const marketData = await marketRes.json();

        const pairs = marketData?.data?.pairs || [];
        setCoins(Array.isArray(pairs) ? pairs.slice(0, 6) : []);

        const exalt = pairs.find(
          (c) => c.baseToken?.symbol?.toUpperCase() === "EXALT"
        );

        if (exalt?.priceUsd) {
          setExaltPrice(Number(exalt.priceUsd));
        }
      } catch (error) {
        console.log("Market API error:", error);
      }

      try {
        const dexRes = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${EXALT_ADDRESS}`
        );

        const dex = await dexRes.json();
        const pair = dex?.pairs?.[0];

        if (pair) {
          setExaltPrice(Number(pair.priceUsd || 0));
          setMarketCap(Number(pair.marketCap || pair.fdv || 0));
          setLiquidity(Number(pair.liquidity?.usd || 0));
        }
      } catch (error) {
        console.log("Dexscreener error:", error);
     try {
  const token = localStorage.getItem("token");

  const rewardRes = await fetch(`${API}/api/rewards/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const rewardData = await rewardRes.json();

  if (rewardData.success) {
    setRewardStats({
      approvedAmount: rewardData.data?.myStats?.approvedAmount || 0,
      pendingAmount: rewardData.data?.myStats?.pendingAmount || 0,
      pendingClaims: rewardData.data?.myStats?.pendingClaims || 0,
      todayClaims: rewardData.data?.platformStats?.todayClaims || 0,
      activeMiners: rewardData.data?.platformStats?.activeMiners || 0,
      miningRemaining: rewardData.data?.pools?.mining?.remaining || 0,
    });
  }
} catch (error) {
  console.log("Reward dashboard error:", error);
} }

      try {
  if (!window.ethereum) {
    setExaltHoldings(0);
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  if (Number(network.chainId) !== 56) {
    setExaltHoldings(0);
    return;
  }

  const accounts = await provider.send("eth_accounts", []);

  if (!accounts?.length) {
    setExaltHoldings(0);
    return;
  }

  const contract = new ethers.Contract(
    EXALT_ADDRESS,
    ["function balanceOf(address owner) view returns (uint256)"],
    provider
  );

  const rawBalance = await contract.balanceOf(accounts[0]);
  const balance = Number(ethers.formatUnits(rawBalance, 18));

  setExaltHoldings(Number(balance.toFixed(2)));
} catch (error) {
  console.log("EXALT balance safe fallback:", error?.message || error);
  setExaltHoldings(0);
}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [API]);

  return (
    <>
      <div className="mobile-home-view">
        <div className="mobile-topbar">
          <div className="mobile-avatar">E</div>

          <div className="mobile-tabs">
            <span className="active">Exchange</span>
            <span onClick={() => setPage("web3wallet")}>Web3</span>
          </div>

          <button onClick={() => setPage("profile")}>👤</button>
        </div>

        <div className="mobile-balance-card">
          <p>Est. Total Value (USDT)</p>
          <h1>${formatUsd(portfolioValue, 2)}</h1>
          <button onClick={() => setPage("wallets")}>Add Funds</button>
        </div>

        <div className="mobile-action-grid">
          {[
            ["👥", "Referral", "referral"],
            ["🔁", "P2P", "p2p"],
            ["📈", "Trade", "trade"],
            ["⚡", "Futures", "futures"],
            ["💰", "Assets", "wallets"],
            ["🌐", "Web3", "web3wallet"],
            ["✅", "KYC", "kyc-submit"],
          ].map(([icon, label, page]) => (
            <button key={page} onClick={() => setPage(page)}>
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="mobile-feature-row">
          <div onClick={() => setPage("p2p")} className="mobile-feature-card">
            <div className="icon">🔁</div>
            <h3>P2P</h3>
            <p>Buy/Sell Crypto</p>
          </div>

          <div onClick={() => setPage("wallets")} className="mobile-feature-card">
            <div className="icon">💳</div>
            <h3>Deposit</h3>
            <p>Bank Transfer / Crypto</p>
          </div>
        </div>

        <div className="mobile-trending-section">
          <h3>Trending Coins</h3>

          {coins.slice(0, 5).map((coin) => (
            <div className="mobile-coin-row" key={coin.pairAddress}>
              <div>
                <strong>{coin.baseToken?.symbol || "COIN"}</strong>
                <p>${Number(coin.priceUsd || 0).toFixed(6)}</p>
              </div>

              <span
                className={
                  Number(coin.priceChange?.h24 || 0) >= 0
                    ? "green-text"
                    : "red-text"
                }
              >
                {Number(coin.priceChange?.h24 || 0).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mobile-bottom-nav">
        {[
          ["🏠", "Home", "dashboard"],
          ["📊", "Markets", "markets"],
          ["📈", "Trade", "trade"],
          ["⚡", "Futures", "futures"],
          ["💼", "Assets", "wallets"],
        ].map(([icon, label, page]) => (
          <button key={page} onClick={() => setPage(page)}>
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="desktop-dashboard-view">
        <div className="dashboard-page">
          <div className="hero-banner">
            <div>
              <h1>EXALT EXCHANGE</h1>
              <p>Next Generation Crypto Market Board & Community Exchange</p>
              <span className="live-status">
                {loading ? "Loading Live Market..." : "● Live Market Active"}
              </span>
            </div>

            <button className="action-btn yellow-btn" onClick={loadDashboard}>
              Refresh Dashboard
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card glow-yellow">
              <h3>Portfolio Value</h3>
              <h1>${formatUsd(portfolioValue, 2)}</h1>
              <span className="green-text">
                EXALT Price: ${Number(exaltPrice || 0).toFixed(8)}
              </span>
            </div>

            <div className="stat-card glow-blue">
              <h3>EXALT Holdings</h3>
              <h1>{Number(exaltHoldings || 0).toLocaleString()} EXALT</h1>
              <span>Live Wallet Balance</span>
            </div>

            <div className="stat-card glow-green">
              <h3>Market Cap</h3>
              <h1>${formatUsd(marketCap, 0)}</h1>
              <span>Live Market</span>
            </div>

            <div className="stat-card glow-red">
              <h3>Liquidity</h3>
              <h1>${formatUsd(liquidity, 0)}</h1>
              <span>PancakeSwap LP</span>
            </div>
            <div className="stat-card glow-yellow reward-stat-card">
  <h3>Approved Rewards</h3>
  <h1>{Number(rewardStats.approvedAmount || 0).toLocaleString()} EXALT</h1>
  <span>Real Credited Rewards</span>
</div>

<div className="stat-card glow-blue reward-stat-card">
  <h3>Pending Rewards</h3>
  <h1>{Number(rewardStats.pendingAmount || 0).toLocaleString()} EXALT</h1>
  <span>{rewardStats.pendingClaims} Claims Under Review</span>
</div>

<div className="stat-card glow-green reward-stat-card">
  <h3>Active Miners</h3>
  <h1>{rewardStats.activeMiners}</h1>
  <span>Today Claims: {rewardStats.todayClaims}</span>
</div>

<div className="stat-card glow-red reward-stat-card">
  <h3>Mining Pool</h3>
  <h1>{Number(rewardStats.miningRemaining || 0).toLocaleString()}</h1>
  <span>EXALT Remaining</span>
</div>
          </div>

          <div className="dashboard-row">
            <div className="big-panel">
              <div className="panel-header">
                <h2>Trending Coins</h2>
              </div>

              {coins.map((coin) => (
                <div className="coin-row" key={coin.pairAddress}>
                  <span>{coin.baseToken?.symbol || "COIN"}</span>
                  <span>${Number(coin.priceUsd || 0).toFixed(6)}</span>
                  <span
                    className={
                      Number(coin.priceChange?.h24 || 0) >= 0
                        ? "green-text"
                        : "red-text"
                    }
                  >
                    {Number(coin.priceChange?.h24 || 0).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>

            <div className="big-panel">
              <div className="panel-header">
                <h2>Quick Actions</h2>
              </div>

              <button
                onClick={() =>
                  window.open(
                    `https://pancakeswap.finance/swap?outputCurrency=${EXALT_ADDRESS}`,
                    "_blank"
                  )
                }
                className="action-btn yellow-btn"
              >
                Buy EXALT
              </button>

              <button
                onClick={() => setPage("trade")}
                className="action-btn green-btn"
              >
                Spot Trading
              </button>

              <button
                onClick={() => setPage("listings")}
                className="action-btn blue-btn"
              >
                Submit Listing
              </button>

              <button
                onClick={() => setPage("markets")}
                className="action-btn red-btn"
              >
                View Market Board
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;