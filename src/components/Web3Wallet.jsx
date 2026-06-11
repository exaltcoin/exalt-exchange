import { useState, useEffect } from "react";
import exaltLogo from "../assets/exalt-coin.png";
import { ethers } from "ethers";
function Web3Wallet() {
  const [wallet, setWallet] = useState("");
  const [bnbBalance, setBnbBalance] = useState("0");
  const [sendTo, setSendTo] = useState("");
  const [amount, setAmount] = useState("");
const [fromCoin, setFromCoin] = useState("BNB");
const [toCoin, setToCoin] = useState("EXALT");
const [swapAmount, setSwapAmount] = useState("");
const [activeTab, setActiveTab] = useState("assets");
const [txHistory, setTxHistory] = useState([]);
const [message, setMessage] = useState("");
const [balances, setBalances] = useState({});
  const connectWeb3 = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or Trust Wallet");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const balance = await provider.getBalance(accounts[0]);

    setWallet(accounts[0]);
    setBnbBalance(Number(ethers.formatEther(balance)).toFixed(5));
    await loadBalances(accounts[0]);
  };
const loadBalances = async (walletAddress) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);

    const tokenList = [
      {
  symbol: "BNB",
  address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png"
},
      {
  symbol: "USDT",
  address: "0x55d398326f99059fF775485246999027B3197955",
 logo: "https://cryptologos.cc/logos/tether-usdt-logo.png"
},
      {
        symbol: "BTCB",
        address: "0x7130d2A12B9BCbF4fF2634d864A1Ee1Ce3Ead9c",
        logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png"
      },
      {
        symbol: "ETH",
        address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
        logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
      },
      {
        symbol: "CAKE",
        address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
        logo: "https://cryptologos.cc/logos/generic-token-logo.png"
      },
    {
  symbol: "EXALT",
  address: "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78",
  logo: exaltLogo
}
    ];

    const ERC20_ABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];

    const newBalances = {};

    for (const token of tokenList) {
      if (token.symbol === "BNB") {
  const bnbBal = await provider.getBalance(walletAddress);
  newBalances.BNB = Number(
    ethers.formatEther(bnbBal)
  ).toFixed(4);
  continue;
}
      const contract = new ethers.Contract(
        token.address,
        ERC20_ABI,
        provider
      );

      const balance = await contract.balanceOf(walletAddress);
      const decimals = await contract.decimals();

      newBalances[token.symbol] =
        Number(ethers.formatUnits(balance, decimals)).toFixed(4);
    }

    setBalances(newBalances);
  } catch (err) {
    console.log("Balance loading error:", err);
  }
};
  const copyAddress = () => {
    if (!wallet) return alert("Wallet not connected");
    navigator.clipboard.writeText(wallet);
    alert("Wallet address copied");
  };

  const sendBNB = async () => {
    if (!wallet) return alert("Connect wallet first");
    if (!sendTo || !amount) return alert("Enter receiver address and amount");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
      to: sendTo,
      value: ethers.parseEther(amount),
    });
setTxHistory(prev => [
  {
    type: "Send",
    amount: amount + " BNB",
    status: "Completed",
    hash: tx.hash
  },
  ...prev
]);

setMessage("✅ Transaction added to history");

    alert("Transaction sent: " + tx.hash);
  };
  const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const EXALT = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";
const USDT = "0x55d398326f99059fF775485246999027B3197955";

const ROUTER_ABI = [
  "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) external payable",
  "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external",
];

const TOKEN_ABI = [
  "function approve(address spender,uint256 amount) external returns(bool)",
  "function decimals() view returns(uint8)",
];

const getTokenAddress = (symbol) => {
  if (symbol === "BNB") return WBNB;
  if (symbol === "USDT") return USDT;
  if (symbol === "EXALT") return EXALT;
  return EXALT;
};

const executeSwap = async () => {
  if (!wallet) return alert("Connect wallet first");
  if (!swapAmount) return alert("Enter swap amount");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, signer);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  if (fromCoin === "BNB") {
    const path = [WBNB, getTokenAddress(toCoin)];
    const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      path,
      wallet,
      deadline,
      { value: ethers.parseEther(swapAmount) }
    );
    alert("Swap sent: " + tx.hash);
    return;
  }

  if (toCoin === "BNB") {
    const tokenAddress = getTokenAddress(fromCoin);
    const token = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
    const decimals = await token.decimals();
    const amountIn = ethers.parseUnits(swapAmount, decimals);

    const approveTx = await token.approve(ROUTER, amountIn);
    await approveTx.wait();

    const path = [tokenAddress, WBNB];
    const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountIn,
      0,
      path,
      wallet,
      deadline
    );
    alert("Swap sent: " + tx.hash);
    return;
  }

  alert("Token to token swap next step: use BNB route");
};
const [coins, setCoins] = useState([]);
const [search, setSearch] = useState("");
const loadCoins = async () => {
  const tokens = [
    { symbol: "BNB", name: "BNB", chain: "BSC", address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" },
    { symbol: "USDT", name: "Tether USD", chain: "BSC", address: "0x55d398326f99059fF775485246999027B3197955" },
    { symbol: "BTCB", name: "Bitcoin", chain: "BSC", address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c" },
    { symbol: "ETH", name: "Ethereum", chain: "BSC", address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" },
    { symbol: "CAKE", name: "PancakeSwap", chain: "BSC", address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82" },
    { symbol: "EXALT", name: "Exalt Coin", chain: "BSC", address: "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78" },
  ];

  try {
    const result = await Promise.all(
      tokens.map(async (token) => {
        try {
          const res = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${token.address}`
          );
          const data = await res.json();

          const pair = data?.pairs?.[0];

         return {
  ...token,
  priceUsd: pair?.priceUsd ? Number(pair.priceUsd) : 0,
  logo: pair?.info?.imageUrl || "",
};
        } catch {
          return {
            ...token,
            priceUsd: 0,
            logo: "",
          };
        }
      })
    );
console.log(result);
    setCoins(result);
  } catch (error) {
    console.log("Coins loading error:", error);
  }
};
useEffect(() => {
  loadCoins();
}, []);
  return (
    <div className="wallet-page">
      <div
  style={{
    textAlign: "center",
    marginBottom: "20px",
    padding: "15px",
    background: "#181A20",
    borderRadius: "12px",
    border: "1px solid #f0b90b"
  }}
>
  <h2 style={{ color: "#f0b90b", margin: 0 }}>
    Exalt Exchange Wallet
  </h2>

  <p style={{ color: "#999", marginTop: "8px" }}>
   Exalt Secure Web3 Wallet
  </p>
</div>

<div
  style={{
    background: "#181A20",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "15px",
    border: "1px solid #2a3142"
  }}
>
  <div style={{ color: "#888", fontSize: "14px" }}>
    Total Assets
  </div>
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "8px",
  }}
>
  <div
    style={{
      color: "#ffffff",
      fontSize: "34px",
      fontWeight: "700",
    }}
  >
    ${bnbBalance ? (Number(bnbBalance) * 650).toFixed(2) : "0.00"}
  </div>

  <button
    style={{
      background: "#f0b90b",
      color: "#000",
      border: "none",
      padding: "10px 18px",
      borderRadius: "10px",
      fontWeight: "700",
      cursor: "pointer",
    }}
    onClick={() => setActiveTab("receive")}
  >
    Receive
  </button>
</div>
  
      <div className="stat-card glow-yellow">
        <h2>Web3 Wallet</h2>
        <p>Connect MetaMask / Trust Wallet</p>

        <button onClick={connectWeb3} className="action-btn yellow-btn">
          Connect Web3 Wallet
        </button>
      </div>

      <div className="stat-card glow-blue">
        <h3>Wallet Address</h3>
        <p>{wallet ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}` : "Wallet not connected"}</p>
        <button onClick={copyAddress} className="action-btn blue-btn">
          Copy Address / Receive
        </button>
      </div>
      <div className="stat-card glow-green">
        <h3>BNB Balance</h3>
        <h1>{bnbBalance} BNB</h1>
      </div>
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "12px",
    marginBottom: "15px"
  }}
>
<div
style={{
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "16px",
  padding: "12px",
  marginBottom: "20px",
  justifyItems: "center",
  alignItems: "center",
}}
>
  {[
    { icon: "📤", label: "Send", tab: "send" },
    { icon: "📥", label: "Receive", tab: "receive" },
    { icon: "📜", label: "History", tab: "history" },
    { icon: "✅", label: "Approvals", tab: "approvals" },
  ].map((item) => (
    <div
      key={item.tab}
      onClick={() => setActiveTab(item.tab)}
      style={{ textAlign: "center", cursor: "pointer" }}
    >
      <div
  style={{
   background:
  item.tab === activeTab
    ? "linear-gradient(135deg,#f0b90b,#ffcc33)"
    : "#2a3142",
    border:
  item.tab === activeTab
    ? "2px solid #f0b90b"
    : "1px solid #3a4458",
    width: "58px",
    height: "58px",
    borderRadius: "14px",
    margin: "auto",
    lineHeight: "58px",
    fontSize: "26px",
    boxShadow:
  item.tab === activeTab
    ? "0 0 20px rgba(240,185,11,0.45)"
    : "0 0 12px rgba(255,255,255,0.05)",
    transition: "0.3s",
  }}
>
  {item.icon}
</div>
      <div style={{ marginTop: "6px" }}>
        {item.label}
      </div>
    </div>
  ))}
</div>

</div>
</div>

{message && (
  <div
    style={{
      background: "#0f172a",
      border: "1px solid #f0b90b",
      color: "#f0b90b",
      padding: "12px",
      borderRadius: "10px",
      marginBottom: "15px",
      fontWeight: "600",
    }}
  >
    {message}
  </div>
)}
{activeTab === "send" && (
  <div className="stat-card glow-yellow">
    <h3>Send BNB</h3>

    <input
      className="web3-input"
      placeholder="Receiver Address"
      value={sendTo}
      onChange={(e) => setSendTo(e.target.value)}
    />

    <input
      className="web3-input"
      placeholder="Amount BNB"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
    />

    <button onClick={sendBNB} className="action-btn yellow-btn">
      Send Now
    </button>
  </div>
)}
{activeTab === "history" && (
  <div className="stat-card glow-blue">
    <h3>📜 Transaction History</h3>

    {txHistory.length === 0 ? (
      <p>No transactions yet</p>
    ) : (
      txHistory.map((tx, index) => (
        <div
          key={index}
          style={{
            padding: "10px",
            borderBottom: "1px solid #2a3142",
            marginTop: "8px"
          }}
        >
          <div><b>Type:</b> {tx.type}</div>
          <div><b>Amount:</b> {tx.amount}</div>
          <div><b>Status:</b> {tx.status}</div>
        </div>
      ))
    )}
  </div>
)}
<div className="stat-card glow-yellow">
  <h3>All Web3 Coins</h3>
<input
  type="text"
  placeholder="Search Coin..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="web3-input"
  style={{ marginBottom: "10px" }}
/>
{coins
.filter(
  (coin) =>
    coin.name.toLowerCase().includes(search.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(search.toLowerCase())
)
.map((coin, index) => (
    <div
  key={index}
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    padding: "12px",
    background: "#1a1f2e",
    border: "1px solid #2a3142",
    borderRadius: "12px"
  }}
>
    <div
  style={{
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#f0b90b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000",
    fontWeight: "700",
    marginRight: "12px"
  }}
>
  {coin.logo ? (
  <img
    src={coin.logo}
    alt={coin.symbol}
    style={{
      width: "32px",
      height: "32px",
      borderRadius: "50%"
    }}
  />
) : (
  coin.symbol.charAt(0)
)}
</div>
 <div
  style={{
    flex: "0 0 35%"
  }}
>
  <div style={{ fontWeight: "700", fontSize: "16px" }}>
    {coin.symbol}
  </div>

  <div
    style={{
      fontSize: "12px",
      color: "#999",
      marginTop: "2px"
    }}
  >
    {coin.name}
  </div>
</div>

  <div
  style={{
    flex: "0 0 30%",
    textAlign: "right"
  }}
>
  <div
    style={{
      color: "#f0b90b",
      fontSize: "18px",
      fontWeight: "700"
    }}
  >
    ${Number(coin.priceUsd || 0).toFixed(6)}
  </div> 

  <div
    style={{
     fontSize: "12px",
fontWeight: "600",
      color: "#888"
    }}
  >
    BSC
  </div>
</div>
<div
  style={{
    width: "100%",
    height: "1px",
    background: "#2a3142",
    marginTop: "12px"
  }}
/>
    <button
  className="action-btn yellow-btn"
  style={{
  width: "80px",
  height: "38px",
  borderRadius: "10px",
  fontWeight: "700",
  flexShrink: 0
}}
  onClick={() => {
    setFromCoin("BNB");
    setToCoin(coin.symbol);
  }}
>
  🚀 Select
</button>

    </div>
  ))}
</div>
     <div className="stat-card glow-red">
  <div className="panel-header">
    <h3>Send Crypto</h3>
    <span>BNB Smart Chain</span>
  </div>

  <label>Receiver Address</label>
  <input
    className="web3-input"
    placeholder="0x..."
    value={sendTo}
    onChange={(e) => setSendTo(e.target.value)}
  />

  <label>Amount</label>
  <div className="send-amount-row">
    <input
      className="web3-input"
      placeholder="0.00"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
    />
    <span>BNB</span>
  </div>

  <button onClick={sendBNB} className="action-btn red-btn">
    Send Now
  </button>
</div>
    <div className="stat-card glow-yellow">
  <h3>Swap / Trade</h3>

  <label>From Coin</label>
 <select
  className="web3-input"
  value={fromCoin}
  onChange={(e) => setFromCoin(e.target.value)}
>
    <option>BNB</option>
    <option>USDT</option>
    <option>EXALT</option>
  </select>

  <label>To Coin</label>
<select
  className="web3-input"
  value={toCoin}
  onChange={(e) => setToCoin(e.target.value)}
>
    <option>EXALT</option>
    <option>USDT</option>
    <option>BNB</option>
  </select>

<input
  className="web3-input"
  placeholder="Enter Amount"
  value={swapAmount}
  onChange={(e) => setSwapAmount(e.target.value)}
/>

<button
  className="action-btn yellow-btn"
  onClick={executeSwap}
>
  Swap Now
</button>
  
</div>
    </div>
  );
}

export default Web3Wallet;