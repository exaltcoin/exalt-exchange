import { useState } from "react";
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

      <div className="stat-card glow-red">
        <h3>Send BNB</h3>

        <input
          placeholder="Receiver wallet address"
          value={sendTo}
          onChange={(e) => setSendTo(e.target.value)}
        />

        <input
          placeholder="Amount BNB"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button onClick={sendBNB} className="action-btn red-btn">
          Send
        </button>
      </div>

      <div className="stat-card glow-yellow">
        <h3>Swap / Trade</h3>
        <button
          onClick={() =>
            window.open(
              "https://pancakeswap.finance/swap",
              "_blank"
            )
          }
          className="action-btn yellow-btn"
        >
          Open PancakeSwap
        </button>
      </div>
    </div>
  );
}

export default Web3Wallet;