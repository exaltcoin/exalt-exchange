import { useState } from "react";
import { ethers } from "ethers";

function Web3Wallet() {
  const [wallet, setWallet] = useState("");
  const [bnbBalance, setBnbBalance] = useState("0");

  const connectWeb3 = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or Trust Wallet");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const balance = await provider.getBalance(accounts[0]);

    setWallet(accounts[0]);
    setBnbBalance(Number(ethers.formatEther(balance)).toFixed(4));
  };

  return (
    <div className="wallet-page">
      <h1>Web3 Wallet</h1>
      <p>Connect MetaMask / Trust Wallet</p>

      <button onClick={connectWeb3} className="action-btn yellow-btn">
        Connect Web3 Wallet
      </button>

      {wallet && (
        <div className="stat-card glow-yellow">
          <h3>Wallet Address</h3>
          <p>{wallet}</p>
          <h3>BNB Balance</h3>
          <h1>{bnbBalance} BNB</h1>
        </div>
      )}
    </div>
  );
}

export default Web3Wallet;