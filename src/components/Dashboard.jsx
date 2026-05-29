import { useEffect, useState } from "react";
import { ethers } from "ethers";
function Dashboard({ setPage }) {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const [coins, setCoins] = useState([]);
const [exaltPrice, setExaltPrice] = useState(0.02456);
const EXALT_ADDRESS = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";
const EXALT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const [exaltHoldings, setExaltHoldings] = useState(0);
const portfolioValue = Number(exaltHoldings || 0) * Number(exaltPrice || 0);
const [marketCap, setMarketCap] = useState(0);
const [liquidity, setLiquidity] = useState(0);
const [wallet, setWallet] = useState("");

const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask or Trust Wallet");
    return;
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  setWallet(accounts[0]);
};
  useEffect(() => {
  fetch(`${API}/api/market/live`)
    .then((res) => res.json())
    .then(async (data) => {
      const pairs = data?.data?.pairs || [];

      setCoins(pairs.slice(0, 4));

      const exalt = pairs.find(
        (c) => c.baseToken?.symbol?.toUpperCase() === "EXALT"
      );

      if (exalt?.priceUsd) {
        setExaltPrice(Number(exalt.priceUsd));
      }

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);

        const signer = await provider.getSigner();

        const walletAddress = await signer.getAddress();

        const contract = new ethers.Contract(
          EXALT_ADDRESS,
          EXALT_ABI,
          provider
        );

        const decimals = await contract.decimals();

        const rawBalance = await contract.balanceOf(walletAddress);

        const balance = Number(
          ethers.formatUnits(rawBalance, decimals)
        );

     setExaltHoldings(balance.toFixed(2));
      }
    })

 fetch(`https://api.dexscreener.com/latest/dex/tokens/${EXALT_ADDRESS}`)
  .then((res) => res.json())
  .then((dex) => {

    const pair = dex?.pairs?.[0];

    if (pair) {

      setExaltPrice(
        Number(pair.priceUsd || 0)
      );

      setMarketCap(
        Number(pair.marketCap || pair.fdv || 0)
      );

      setLiquidity(
        Number(pair.liquidity?.usd || 0)
      );

    }

  })
  .catch((err) => console.log(err));

}, []);

return (
    <div className="dashboard-page">

      <div className="hero-banner">
        <div>
          <h1>EXALT EXCHANGE</h1>
          <p>
            Next Generation Crypto Market Board & Community Exchange
          </p>
        </div>

      </div>

      <div className="stats-grid">

        <div className="stat-card glow-yellow">
          <h3>Portfolio Value</h3>
     <h1>
  $
  {(exaltHoldings * exaltPrice).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}
</h1>
        <span className="green-text">
  {exaltPrice > 0 ? "Live Price" : "Loading..."}
</span>
        </div>

        <div className="stat-card glow-blue">
          <h3>EXALT Holdings</h3>
         <h1>{exaltHoldings.toLocaleString()} EXALT</h1>
          <span>Live Wallet Balance</span>
        </div>

        <div className="stat-card glow-green">
          <h3>Market Cap</h3>
      <h1>
  $
  {marketCap.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}
</h1>
          <span>Live Market</span>
        </div>

        <div className="stat-card glow-red">
          <h3>Liquidity</h3>
      <h1>
  $
  {liquidity.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}
</h1>
          <span>PancakeSwap LP</span>
        </div>

      </div>

      <div className="dashboard-row">

        <div className="big-panel">

          <div className="panel-header">
            <h2>Trending Coins</h2>
          </div>

         {coins.map((coin) => (
  <div className="coin-row" key={coin.pairAddress}>
    <span>{coin.baseToken?.symbol}</span>

    <span>
      ${Number(coin.priceUsd || 0).toFixed(6)}
    </span>

    <span
      className={
        (coin.priceChange?.h24 || 0) >= 0
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
      "https://pancakeswap.finance/swap?outputCurrency=0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78",
      "_blank"
    )
  }
  className="action-btn yellow-btn"
>
  Buy EXALT
</button>
<button onClick={() => setPage("listings")} className="action-btn green-btn">
  Launch Coin
</button>

<button onClick={() => setPage("listings")} className="action-btn blue-btn">
  Submit Listing
</button>

<button onClick={() => setPage("markets")} className="action-btn red-btn">
  View Market Board
</button>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;