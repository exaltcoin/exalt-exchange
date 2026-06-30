import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { QRCodeCanvas } from "qrcode.react";

function Wallets() {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;
  const DEPOSIT_ADDRESSES = {
    EXALT: {
      BEP20: "0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9",
    },
    USDT: {
      BEP20: "0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9",
      ERC20: "0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9",
      TRC20: "TLRQbNZsLbqRHPDSk3EMfBpnhVz9ZfXnRt",
    },
    BNB: {
      BEP20: "0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9",
    },
    ETH: {
      ERC20: "0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9",
    },
    BTC: {
      BTC: "bc1qzpqsd2t0mnwvatetsxpk4gyxnhpuvaru2wpt95",
    },
    TRX: {
      TRC20: "TLRQbNZsLbqRHPDSk3EMfBpnhVz9ZfXnRt",
    },
  };

  const BANK_INFO = {
    jazzCash: "03001234567",
    easyPaisa: "03001234567",
    accountTitle: "Exalt Exchange",
    iban: "PK00ABCD1234567890",
    bank: "Meezan Bank",
  };

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

  const [wallets, setWallets] = useState({
    USDT: 0,
    EXALT: 0,
    BNB: 0,
  });

  const [balance, setBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [bnbBalance, setBnbBalance] = useState("0.00000");
  const [userId, setUserId] = useState("");
const [walletStats, setWalletStats] = useState({
  totalPortfolioUsd: 0,
  availableBalance: 0,
  lockedBalance: 0,
  pendingRewards: 0,
  approvedRewards: 0,
  miningRewards: 0,
  walletStatus: "Active",
});
  const [selectedCoin, setSelectedCoin] = useState("EXALT");
  const [selectedNetwork, setSelectedNetwork] = useState("BEP20");

  const [depositForm, setDepositForm] = useState({
    senderName: "",
    senderAccount: "",
    amount: "",
    paymentMethod: "EXALT",
    txHash: "",
  });

  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    accountName: "",
    accountNumber: "",
    method: "CRYPTO",
    coin: "USDT",
  });

  const shortAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet not connected";

  const copyText = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied`);
    } catch {
      alert("Copy failed");
    }
  };

  const activeDepositAddress =
    DEPOSIT_ADDRESSES[selectedCoin]?.[selectedNetwork] ||
    DEPOSIT_ADDRESSES[selectedCoin]?.BEP20 ||
    DEPOSIT_ADDRESSES[selectedCoin]?.TRC20 ||
    DEPOSIT_ADDRESSES[selectedCoin]?.BTC ||
    "";

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask / Trust Wallet not found");
        return;
      }

      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      if (chainId !== "0x38") {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }],
        });
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || !accounts.length) {
        alert("No wallet account found");
        return;
      }

      const address = accounts[0];

      localStorage.setItem("wallet", address);
      localStorage.setItem("walletAddress", address);

      setWalletAddress(address);

      const web3 = new Web3(window.ethereum);

      const contract = new web3.eth.Contract(EXALT_ABI, EXALT_CONTRACT);

      const exaltBalance = await contract.methods.balanceOf(address).call();
      const formattedBalance = web3.utils.fromWei(exaltBalance, "ether");

      setBalance(Number(formattedBalance).toFixed(4));

      setWallets((prev) => ({
        ...prev,
        EXALT: Number(formattedBalance).toFixed(4),
      }));

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

  const loadBalance = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setBalance(0);
        setWallets({ USDT: 0, EXALT: 0, BNB: 0 });
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
        setWallets({ USDT: 0, EXALT: 0, BNB: 0 });
        return;
      }

      const balances = data.wallet.balances || {};

      setWallets((prev) => ({
        USDT: Number(balances.USDT || 0),
        EXALT: prev.EXALT || Number(balances.EXALT || 0),
        BNB: Number(balances.BNB || 0),
      }));

      setUserId(data.wallet.userId || "");
      const approvedExalt = Number(balances.EXALT || 0);
const usdt = Number(balances.USDT || 0);
const bnb = Number(balances.BNB || 0);

setWalletStats((prev) => ({
  ...prev,
  totalPortfolioUsd: usdt + approvedExalt * 0.0003 + bnb * 600,
  availableBalance: usdt,
  lockedBalance: Number(data.wallet.locked?.USDT || 0),
  walletStatus: "Verified / Active",
}));

try {
  const rewardRes = await fetch(`${API}/api/rewards/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const rewardData = await rewardRes.json();

  if (rewardData.success) {
    setWalletStats((prev) => ({
      ...prev,
      pendingRewards: rewardData.data?.myStats?.pendingAmount || 0,
      approvedRewards: rewardData.data?.myStats?.approvedAmount || 0,
      miningRewards: rewardData.data?.pools?.mining?.distributed || 0,
    }));
  }
} catch (error) {
  console.log("Wallet reward stats error:", error);
}
    } catch (error) {
      console.log("Wallet balance load error:", error);
      setBalance(0);
      setWallets({ USDT: 0, EXALT: 0, BNB: 0 });
    }
  };

  useEffect(() => {
    const savedWallet = localStorage.getItem("walletAddress") || "";
    if (savedWallet) setWalletAddress(savedWallet);

    loadBalance();

    const interval = setInterval(loadBalance, 10000);
    return () => clearInterval(interval);
  }, [API]);

  const submitDeposit = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first");
        return;
      }

      if (!depositForm.senderName || !depositForm.senderAccount || !depositForm.amount) {
        alert("Name, account/wallet and amount are required");
        return;
      }

      const response = await fetch(`${API}/api/wallets/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coin: depositForm.paymentMethod,
          network: selectedNetwork,
          senderName: depositForm.senderName,
          senderAccount: depositForm.senderAccount,
          amount: Number(depositForm.amount),
          paymentMethod: depositForm.paymentMethod,
          txHash: depositForm.txHash,
          transactionId: depositForm.txHash,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Deposit request submitted successfully");
        setDepositForm({
          senderName: "",
          senderAccount: "",
          amount: "",
          paymentMethod: "EXALT",
          txHash: "",
        });
      } else {
        alert(data.message || "Deposit failed");
      }
    } catch (error) {
      console.log(error);
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

      if (!withdrawForm.amount || !withdrawForm.accountName || !withdrawForm.accountNumber) {
        alert("Amount, account name and wallet/account number are required");
        return;
      }

      const response = await fetch(`${API}/api/wallets/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(withdrawForm.amount),
          walletAddress: withdrawForm.accountNumber,
          accountName: withdrawForm.accountName,
          paymentMethod: withdrawForm.method,
          coin: withdrawForm.coin,
          network: withdrawForm.method === "CRYPTO" ? "BEP20" : withdrawForm.method,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Withdrawal request submitted successfully");
        setWithdrawForm({
          amount: "",
          accountName: "",
          accountNumber: "",
          method: "CRYPTO",
          coin: "USDT",
        });
        loadBalance();
      } else {
        alert(data.message || "Withdrawal failed");
      }
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  return (
    <div className="panel wallets-page">
      <div className="wallets-header">
        <div>
          <h2>WALLETS</h2>
          <p>Manage crypto wallet, deposits, withdrawals and payment requests.</p>
        </div>

        <button className="action-btn yellow-btn" onClick={connectWallet}>
          Connect MetaMask / Trust Wallet
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card glow-yellow">
          <h3>Connected Wallet</h3>
          <h1>{shortAddress(walletAddress)}</h1>
          <p>BNB Balance: {bnbBalance}</p>
          <p>BNB Smart Chain supported</p>
        </div>

        <div className="stat-card glow-green">
  <h3>EXALT Wallet</h3>
  <h1 className="wallet-balance">
    {Number(wallets?.EXALT || 0).toLocaleString()} EXALT
  </h1>
  <p>Approved Exchange Balance</p>
  <small>Web3: {Number(balance || 0).toLocaleString()} EXALT</small>
</div>
        <div className="stat-card glow-green">
          <h3>USDT Wallet</h3>
          <h1>{wallets?.USDT || 0} USDT</h1>
          <p>Approved Balance</p>
        </div>

        <div className="stat-card glow-blue">
          <h3>BNB Wallet</h3>
          <h1>{wallets?.BNB || 0} BNB</h1>
          <p>Approved Balance</p>
        </div>
      </div>
<div className="wallet-pro-grid">
  <div className="wallet-pro-card">
    <span>Total Portfolio Value</span>
    <h2>${Number(walletStats.totalPortfolioUsd || 0).toLocaleString()}</h2>
    <p>Estimated exchange wallet value</p>
  </div>

  <div className="wallet-pro-card">
    <span>Available Balance</span>
    <h2>{Number(walletStats.availableBalance || 0).toLocaleString()} USDT</h2>
    <p>Ready for trading or withdrawal</p>
  </div>

  <div className="wallet-pro-card">
    <span>Locked Balance</span>
    <h2>{Number(walletStats.lockedBalance || 0).toLocaleString()} USDT</h2>
    <p>Open orders / pending withdrawal</p>
  </div>

  <div className="wallet-pro-card">
    <span>Pending Rewards</span>
    <h2>{Number(walletStats.pendingRewards || 0).toLocaleString()} EXALT</h2>
    <p>Waiting for admin approval</p>
  </div>

  <div className="wallet-pro-card">
    <span>Approved Rewards</span>
    <h2>{Number(walletStats.approvedRewards || 0).toLocaleString()} EXALT</h2>
    <p>Credited reward history</p>
  </div>

  <div className="wallet-pro-card">
    <span>Wallet Status</span>
    <h2>{walletStats.walletStatus}</h2>
    <p>KYC and backend wallet active</p>
  </div>
</div>
      <div className="wallet-section-grid">
        <div className="wallet-box">
          <h2>Deposit Address</h2>

          <div className="wallet-select-row">
            <select
              className="deposit-select-display"
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
            >
              <option>EXALT</option>
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
          </div>

          {activeDepositAddress ? (
            <div className="wallet-address-card">
              <p>
                {selectedCoin} {selectedNetwork}
              </p>
              <strong>{activeDepositAddress}</strong>

              <QRCodeCanvas value={activeDepositAddress} size={130} />

              <button
                className="copy-btn"
                onClick={() => copyText(activeDepositAddress, `${selectedCoin} address`)}
              >
                Copy Address
              </button>
            </div>
          ) : (
            <p>No address available for this network.</p>
          )}

          <div className="bank-info-box">
            <h3>Bank / JazzCash / EasyPaisa</h3>

            <p>JazzCash / EasyPaisa: {BANK_INFO.jazzCash}</p>
            <button
              className="copy-btn"
              onClick={() => copyText(BANK_INFO.jazzCash, "JazzCash / EasyPaisa number")}
            >
              Copy Number
            </button>

            <p>Account Title: {BANK_INFO.accountTitle}</p>
            <p>IBAN: {BANK_INFO.iban}</p>
            <p>Bank: {BANK_INFO.bank}</p>

            <button
              className="copy-btn"
              onClick={() => copyText(BANK_INFO.iban, "Bank IBAN")}
            >
              Copy IBAN
            </button>
          </div>
        </div>

        <div className="wallet-box">
          <h2>Deposit Request</h2>

          <input
            className="deposit-input"
            placeholder="Your Name"
            value={depositForm.senderName}
            onChange={(e) =>
              setDepositForm({ ...depositForm, senderName: e.target.value })
            }
          />

          <input
            className="deposit-input"
            placeholder="Your Wallet / Bank Account"
            value={depositForm.senderAccount}
            onChange={(e) =>
              setDepositForm({ ...depositForm, senderAccount: e.target.value })
            }
          />

          <input
            className="deposit-input"
            placeholder="Amount"
            value={depositForm.amount}
            onChange={(e) =>
              setDepositForm({ ...depositForm, amount: e.target.value })
            }
          />

          <select
            className="deposit-input"
            value={depositForm.paymentMethod}
            onChange={(e) =>
              setDepositForm({ ...depositForm, paymentMethod: e.target.value })
            }
          >
            <option>JazzCash</option>
            <option>EasyPaisa</option>
            <option>Bank Transfer</option>
            <option>EXALT</option>
            <option>USDT</option>
            <option>BNB</option>
          </select>

          <input
            className="deposit-input"
            placeholder="Transaction Hash / Reference ID"
            value={depositForm.txHash}
            onChange={(e) =>
              setDepositForm({ ...depositForm, txHash: e.target.value })
            }
          />

          <button className="deposit-btn" onClick={submitDeposit}>
            Submit Deposit
          </button>
        </div>

        <div className="wallet-box">
          <h2>Withdrawal Request</h2>

          <input
            className="withdraw-input deposit-input"
            placeholder="Amount"
            value={withdrawForm.amount}
            onChange={(e) =>
              setWithdrawForm({ ...withdrawForm, amount: e.target.value })
            }
          />

          <input
            className="withdraw-input deposit-input"
            placeholder="Account / Wallet Name"
            value={withdrawForm.accountName}
            onChange={(e) =>
              setWithdrawForm({ ...withdrawForm, accountName: e.target.value })
            }
          />

          <input
            className="withdraw-input deposit-input"
            placeholder="Wallet Address / JazzCash / Easypaisa / Bank Account / IBAN"
            value={withdrawForm.accountNumber}
            onChange={(e) =>
              setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })
            }
          />

          <select
            className="withdraw-input deposit-input"
            value={withdrawForm.method}
            onChange={(e) =>
              setWithdrawForm({ ...withdrawForm, method: e.target.value })
            }
          >
            <option value="CRYPTO">Crypto Wallet</option>
            <option value="JAZZCASH">JazzCash</option>
            <option value="EASYPAISA">Easypaisa</option>
            <option value="BANK">Bank Transfer</option>
          </select>

          <select
            className="withdraw-input deposit-input"
            value={withdrawForm.coin}
            onChange={(e) =>
              setWithdrawForm({ ...withdrawForm, coin: e.target.value })
            }
          >
            <option value="USDT">USDT</option>
            <option value="EXALT">EXALT</option>
            <option value="BNB">BNB</option>
          </select>

          <button className="deposit-btn" onClick={submitWithdrawal}>
            Submit Withdrawal
          </button>
        </div>
      </div>

      <div className="wallet-security-box">
        <h2>Security System</h2>
        <p>✅ Admin approval required before wallet credit</p>
        <p>✅ No automatic token release without verification</p>
        <p>✅ Bank/card payments connected only through licensed gateways</p>
        <p>✅ User wallet address verification required</p>
        <p>✅ Deposit and withdrawal records are protected through backend approval</p>
      </div>
    </div>
  );
}

export default Wallets;