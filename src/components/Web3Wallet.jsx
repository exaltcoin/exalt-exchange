import { useState, useEffect } from "react";
import { ethers } from "ethers";
function Web3Wallet() {
  const [wallet, setWallet] = useState("");
  const [bnbBalance, setBnbBalance] = useState("0");
  const [sendTo, setSendTo] = useState("");
  const [amount, setAmount] = useState("");

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

    alert("Transaction sent: " + tx.hash);
  };
const [coins, setCoins] = useState([]);

const loadCoins = async () => {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=bsc"
    );

    const data = await res.json();

    setCoins((data?.pairs || []).slice(0, 20));
  } catch (err) {
    console.log(err);
  }
};
useEffect(() => {
  loadCoins();
}, []);
  return (
    <div className="wallet-page">
      <h1>WEB3 WALLET</h1>
      <p>Secure • Fast • Global Crypto Exchange</p>

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
<div className="stat-card glow-yellow">
  <h3>All Web3 Coins</h3>

  {coins.map((coin, index) => (
    <div
      key={index}
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "10px",
        padding: "8px",
        borderBottom: "1px solid #333"
      }}
    >
      <div>
        <strong>{coin.baseToken?.symbol}</strong>
      </div>

      <div>
        ${Number(coin.priceUsd || 0).toFixed(4)}
      </div>

      <button
        onClick={() =>
          window.open(
            `https://pancakeswap.finance/swap?outputCurrency=${coin.baseToken?.address}`,
            "_blank"
          )
        }
      >
        Swap
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
  <select className="web3-input">
    <option>BNB</option>
    <option>USDT</option>
    <option>EXALT</option>
  </select>

  <label>To Coin</label>
  <select className="web3-input">
    <option>EXALT</option>
    <option>USDT</option>
    <option>BNB</option>
  </select>

  <input
    className="web3-input"
    placeholder="Enter Amount"
  />

  <button className="action-btn yellow-btn">
    Preview Swap
  </button>
</div>
    </div>
  );
}

export default Web3Wallet;