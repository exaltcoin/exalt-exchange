import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { QRCodeCanvas } from "qrcode.react";
function Wallets() {
 const API = "https://exalt-exchange-backend.onrender.com";
  const [balance, setBalance] = useState(0);
  const [wallets, setWallets] = useState({
    USDT: 0,
    EXALT: 0,
    BNB: 0,
  });
const [walletAddress, setWalletAddress] = useState("");
const [bnbBalance, setBnbBalance] = useState("0");
const [selectedCoin, setSelectedCoin] = useState("USDT");
const [selectedNetwork, setSelectedNetwork] = useState("BEP20");
const EXALT_CONTRACT = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";
const EXALT_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
];
const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      alert("MetaMask / Trust Wallet not found");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const address = accounts[0];
    localStorage.setItem("wallet", address);
localStorage.setItem("walletAddress", address);
    setWalletAddress(address);
const web3 = new Web3(window.ethereum);

const contract = new web3.eth.Contract(
  EXALT_ABI,
  EXALT_CONTRACT
);

const exaltBalance = await contract.methods
  .balanceOf(address)
  .call();

const formattedBalance = web3.utils.fromWei(
  exaltBalance,
  "ether"
);

setBalance(Number(formattedBalance).toFixed(4));

setWallets((prev) => ({
  ...prev,
  EXALT: Number(formattedBalance).toFixed(4),
}));
    const chainId = await window.ethereum.request({ method: "eth_chainId" });

    if (chainId !== "0x38") {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
    }

    const balanceHex = await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    });

    const balanceBNB = parseInt(balanceHex, 16) / 1e18;
    setBnbBalance(balanceBNB.toFixed(5));

    alert("Wallet connected successfully");
  } catch (error) {
    console.log(error);
    alert("Wallet connection failed");
  }
};
  const [userId, setUserId] = useState("");

 useEffect(() => {
  const loadBalance = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setBalance(0);
        setWallets({
          USDT: 0,
          EXALT: 0,
          BNB: 0,
        });
        return;
      }

      const res = await fetch(`${API}/api/wallets/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.success || !data.wallet) {
        setBalance(0);
        setWallets({
          USDT: 0,
          EXALT: 0,
          BNB: 0,
        });
        return;
      }

      const balances = data.wallet.balances || {};

      setWallets((prev) => ({
  USDT: Number(balances.USDT || 0),
  EXALT: prev.EXALT || Number(balances.EXALT || 0),
  BNB: Number(balances.BNB || 0),
}));

     // setBalance(Number(balances.EXALT || 0));
      setUserId(data.wallet.userId || "");
    } catch (error) {
      console.log("Wallet balance load error:", error);
      setBalance(0);
      setWallets({
        USDT: 0,
        EXALT: 0,
        BNB: 0,
      });
    }
  };

  loadBalance();

  const interval = setInterval(() => {
    loadBalance();
  }, 5000);

  return () => clearInterval(interval);
}, [API]);

 const submitDeposit = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    const inputs = document.querySelectorAll(".deposit-input");
   const senderName = inputs[0].value;
const senderAccount = inputs[1].value;
const amount = inputs[2].value;
const paymentMethod = inputs[3].value;
const txHash = inputs[4].value;

const coin = selectedCoin;
const network = selectedNetwork;
    const response = await fetch(`${API}/api/wallets/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
     body: JSON.stringify({
coin,
network,
senderName,
senderAccount,
amount,
paymentMethod,
txHash,
transactionId: txHash,
}),
 });
    const data = await response.json();

    if (data.success) {
      alert("Deposit request submitted successfully");
      inputs.forEach((input) => {
        input.value = "";
      });
    } else {
      alert(data.message || "Deposit failed");
    }
  } catch (err) {
    console.log(err);
    alert("Server error");
  }
};
const submitWithdrawal = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    const inputs = document.querySelectorAll(".withdraw-input");
    const response = await fetch(`${API}/api/wallets/withdraw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: inputs[0].value,
        walletAddress: inputs[1].value,
        network: "BSC",
      }),
    });

    const data = await response.json();

    if (data.success) {
      alert("Withdrawal request submitted successfully");

      inputs.forEach((input) => {
        input.value = "";
      });

      loadBalance();
    } else {
      alert(data.message || "Withdrawal failed");
    }
  } catch (err) {
    console.log(err);
    alert("Server error");
  }
};
 return (
    <>
      <div className="panel">
        <h2>WALLETS</h2>

        <p>
          Manage crypto wallet, deposits, withdrawals and
          payment requests.
        </p>

        <div className="stats-grid">
          <div className="stat-card glow-yellow">
            <h3>Connected Wallets</h3>
<button
  className="buy-btn"
  onClick={connectWallet}
>
  Connect MetaMask / Trust Wallet
</button>

<p>
  {
    walletAddress
      ? walletAddress.slice(0, 6) +
        "..." +
        walletAddress.slice(-4)
      : "Wallet not connected"
  }
</p>

<p>
  BNB Balance: {bnbBalance}
</p>
            <h1>MetaMask / Trust Wallet</h1>

            <p>BNB Smart Chain supported</p>
          </div>

          <div className="stat-card glow-green">
            <h3>EXALT Wallet</h3>

            <h1>{balance} EXALT</h1>

            <p>Live Balance</p>
          </div>

          <div className="stat-card glow-blue">
            <h3>Bank / Card Deposit</h3>

            <h1>Secure Request</h1>

            <p>
              Bank, Easypaisa, JazzCash ready for
              integration
            </p>
          </div>
        </div>
<select
  className="deposit-select-display"
  value={selectedCoin}
  onChange={(e) => setSelectedCoin(e.target.value)}
>
  <option>USDT</option>
  <option>BNB</option>
  <option>BTC</option>
  <option>ETH</option>
  <option>TRX</option>
</select>
<select
  className="deposit-select-display"
  value={selectedNetwork}
  onChange={(e) => setSelectedNetwork(e.target.value)}
>
  <option>BEP20</option>
  <option>ERC20</option>
  <option>TRC20</option>
  <option>BTC</option>
</select>
<div className="wallet-box">
<p>JazzCash / EasyPaisa:</p>
<p>03001234567</p>
<button
  className="copy-btn"
  onClick={() => {
    navigator.clipboard.writeText("03001234567");
    alert("JazzCash / EasyPaisa Number Copied");
  }}
>
  Copy Number
</button>

<p>Bank Transfer:</p>
<p>Account Title: Exalt Exchange</p>
<p>IBAN: PK00ABCD1234567890</p>
<p>Bank: Meezan Bank</p>
<button
  className="copy-btn"
  onClick={() => {
    navigator.clipboard.writeText("PK00ABCD1234567890");
    alert("Bank IBAN Copied");
  }}
>
  Copy IBAN
</button>
{selectedCoin === "USDT" && selectedNetwork === "BEP20" && (
  <>
    <p>USDT BEP20:</p>
    <p>0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9</p>
    <QRCodeCanvas value="0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9" size={120} />
    <button className="copy-btn" onClick={() => {
      navigator.clipboard.writeText("0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9");
      alert("USDT Address Copied");
    }}>Copy Address</button>
  </>
)}

{selectedCoin === "BNB" && (
  <>
    <p>BNB BEP20:</p>
    <p>0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9</p>
    <QRCodeCanvas value="0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9" size={120} />
    <button className="copy-btn" onClick={() => {
      navigator.clipboard.writeText("0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9");
      alert("BNB Address Copied");
    }}>Copy Address</button>
  </>
)}

{selectedCoin === "ETH" && (
  <>
    <p>ETH ERC20:</p>
    <p>0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9</p>
    <QRCodeCanvas value="0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9" size={120} />
    <button className="copy-btn" onClick={() => {
      navigator.clipboard.writeText("0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9");
      alert("ETH Address Copied");
    }}>Copy Address</button>
  </>
)}

{selectedCoin === "BTC" && (
  <>
    <p>BTC:</p>
    <p>bc1qzpqsd2t0mnwvatetsxpk4gyxnhpuvaru2wpt95</p>
    <QRCodeCanvas value="bc1qzpqsd2t0mnwvatetsxpk4gyxnhpuvaru2wpt95" size={120} />
    <button className="copy-btn" onClick={() => {
      navigator.clipboard.writeText("bc1qzpqsd2t0mnwvatetsxpk4gyxnhpuvaru2wpt95");
      alert("BTC Address Copied");
    }}>Copy Address</button>
  </>
)}

{selectedCoin === "TRX" && (
  <>
    <p>TRX TRC20:</p>
    <p>TLRQbNZsLbqRHPDSk3EMfBpnhVz9ZfXnRt</p>
    <QRCodeCanvas value="TLRQbNZsLbqRHPDSk3EMfBpnhVz9ZfXnRt" size={120} />
    <button className="copy-btn" onClick={() => {
      navigator.clipboard.writeText("TLRQbNZsLbqRHPDSk3EMfBpnhVz9ZfXnRt");
      alert("TRX Address Copied");
    }}>Copy Address</button>
  </>
)}
</div>
<div className="panel" style={{ marginTop: "20px" }}>

<h2>Deposit Options</h2>

<input
className="deposit-input"
placeholder="Your Name"
/>

<input
className="deposit-input"
placeholder="Your Wallet / Bank Account"
/>

<input
className="deposit-input"
placeholder="Amount"
/>

<select className="deposit-input">
<option>JazzCash</option>
<option>EasyPaisa</option>
<option>Bank Transfer</option>
<option>USDT</option>
<option>BNB</option>
<option>BTC</option>
</select>

<input
className="deposit-input"
placeholder="Transaction Hash / Reference ID"
/>

<button className="deposit-btn" onClick={submitDeposit}>
Submit Deposit
</button>

</div>
        <div
          className="panel"
          style={{ marginTop: "25px" }}
        >
          <h2>Security System</h2>

          <p>✅ Admin approval required before wallet credit</p>

          <p>
            ✅ No automatic token release without
            verification
          </p>

          <p>
            ✅ Bank/card payments connected only through
            licensed gateways
          </p>

          <p>
            ✅ User wallet address verification required
          </p>

          <p>
            ✅ Deposit history and withdrawal security can
            be added next
          </p>
        </div>
      </div>
    </>
  );
}

export default Wallets;