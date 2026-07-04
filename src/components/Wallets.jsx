import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { QRCodeCanvas } from "qrcode.react";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";

function Wallets() {
  const { t } = useI18n();

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://exalt-real-backend-6b6v.onrender.com";

  const API = API_BASE.endsWith("/api")
    ? API_BASE.replace("/api", "")
    : API_BASE;

  const DEPOSIT_ADDRESSES = {
    EXALT: { BEP20: "0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9" },
    USDT: {
      BEP20: "0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9",
      ERC20: "0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9",
      TRC20: "TLRQbNZsLbqRHPDSk3EMfBpnhVz9ZfXnRt",
    },
    BNB: { BEP20: "0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9" },
    ETH: { ERC20: "0x55E6a52Af8b31efa7FA926F650EC45419c76b3b9" },
    BTC: { BTC: "bc1qzpqsd2t0mnwvatetsxpk4gyxnhpuvaru2wpt95" },
    TRX: { TRC20: "TLRQbNZsLbqRHPDSk3EMfBpnhVz9ZfXnRt" },
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
    address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : t("walletNotConnected");

  const copyText = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} ${t("copied")}`);
    } catch {
      alert(t("copyFailed"));
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
        alert(t("walletAppNotFound"));
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
        alert(t("noWalletAccountFound"));
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

      alert(t("walletConnectedSuccessfully"));
    } catch (error) {
      console.log(error);
      alert(t("walletConnectionFailed"));
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
        headers: { Authorization: `Bearer ${token}` },
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
        walletStatus: t("verifiedActive"),
      }));

      try {
        const rewardRes = await fetch(`${API}/api/rewards/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
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
  };useEffect(() => {
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
        alert(t("pleaseLoginFirst"));
        return;
      }

      if (!depositForm.senderName || !depositForm.senderAccount || !depositForm.amount) {
        alert(t("depositRequiredFields"));
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
        alert(t("depositSubmittedSuccessfully"));
        setDepositForm({
          senderName: "",
          senderAccount: "",
          amount: "",
          paymentMethod: "EXALT",
          txHash: "",
        });
      } else {
        alert(data.message || t("depositFailed"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    }
  };

  const submitWithdrawal = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert(t("pleaseLoginFirst"));
        return;
      }

      if (!withdrawForm.amount || !withdrawForm.accountName || !withdrawForm.accountNumber) {
        alert(t("withdrawRequiredFields"));
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
        alert(t("withdrawalSubmittedSuccessfully"));
        setWithdrawForm({
          amount: "",
          accountName: "",
          accountNumber: "",
          method: "CRYPTO",
          coin: "USDT",
        });
        loadBalance();
      } else {
        alert(data.message || t("withdrawalFailed"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    }
  };

  return (
    <PageShell titleKey="wallets" subtitleKey="walletsSubtitle">
      <div className="panel wallets-page">
        <div className="stats-grid">
          <div className="stat-card glow-yellow">
            <h3>{t("connectedWallet")}</h3>
            <h1>{shortAddress(walletAddress)}</h1>
            <p>{t("bnbBalance")}: {bnbBalance}</p>
            <p>{t("bnbSmartChainSupported")}</p>
          </div>

          <div className="stat-card glow-green">
            <h3>{t("exaltWallet")}</h3>
            <h1 className="wallet-balance">
              {Number(wallets?.EXALT || 0).toLocaleString()} EXALT
            </h1>
            <p>{t("approvedExchangeBalance")}</p>
            <small>Web3: {Number(balance || 0).toLocaleString()} EXALT</small>
          </div>

          <div className="stat-card glow-green">
            <h3>{t("usdtWallet")}</h3>
            <h1>{wallets?.USDT || 0} USDT</h1>
            <p>{t("approvedBalance")}</p>
          </div>

          <div className="stat-card glow-blue">
            <h3>{t("bnbWallet")}</h3>
            <h1>{wallets?.BNB || 0} BNB</h1>
            <p>{t("approvedBalance")}</p>
          </div>
        </div>

        <div className="wallet-pro-grid">
          <div className="wallet-pro-card">
            <span>{t("totalPortfolioValue")}</span>
            <h2>${Number(walletStats.totalPortfolioUsd || 0).toLocaleString()}</h2>
            <p>{t("estimatedExchangeWalletValue")}</p>
          </div>

          <div className="wallet-pro-card">
            <span>{t("availableBalance")}</span>
            <h2>{Number(walletStats.availableBalance || 0).toLocaleString()} USDT</h2>
            <p>{t("readyTradingWithdrawal")}</p>
          </div>

          <div className="wallet-pro-card">
            <span>{t("lockedBalance")}</span>
            <h2>{Number(walletStats.lockedBalance || 0).toLocaleString()} USDT</h2>
            <p>{t("openOrdersPendingWithdrawal")}</p>
          </div>

          <div className="wallet-pro-card">
            <span>{t("pendingRewards")}</span>
            <h2>{Number(walletStats.pendingRewards || 0).toLocaleString()} EXALT</h2>
            <p>{t("waitingAdminApproval")}</p>
          </div>

          <div className="wallet-pro-card">
            <span>{t("approvedRewards")}</span>
            <h2>{Number(walletStats.approvedRewards || 0).toLocaleString()} EXALT</h2>
            <p>{t("creditedRewardHistory")}</p>
          </div>

          <div className="wallet-pro-card">
            <span>{t("walletStatus")}</span>
            <h2>{walletStats.walletStatus}</h2>
            <p>{t("kycBackendWalletActive")}</p>
          </div>
        </div>

        <div className="wallet-section-grid">
          <div className="wallet-box">
            <h2>{t("depositAddress")}</h2>

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
                <p>{selectedCoin} {selectedNetwork}</p>
                <strong>{activeDepositAddress}</strong>

                <QRCodeCanvas value={activeDepositAddress} size={130} />

                <button
                  className="copy-btn"
                  onClick={() => copyText(activeDepositAddress, `${selectedCoin} ${t("address")}`)}
                >
                  {t("copyAddress")}
                </button>
              </div>
            ) : (
              <p>{t("noAddressAvailable")}</p>
            )}

            <div className="bank-info-box">
              <h3>{t("bankJazzEasyPaisa")}</h3>

              <p>JazzCash / EasyPaisa: {BANK_INFO.jazzCash}</p>
              <button
                className="copy-btn"
                onClick={() => copyText(BANK_INFO.jazzCash, "JazzCash / EasyPaisa")}
              >
                {t("copyNumber")}
              </button>

              <p>{t("accountTitle")}: {BANK_INFO.accountTitle}</p>
              <p>IBAN: {BANK_INFO.iban}</p>
              <p>{t("bank")}: {BANK_INFO.bank}</p>

              <button
                className="copy-btn"
                onClick={() => copyText(BANK_INFO.iban, "Bank IBAN")}
              >
                {t("copyIban")}
              </button>
            </div>
          </div>

          <div className="wallet-box">
            <h2>{t("depositRequest")}</h2>

            <input
              className="deposit-input"
              placeholder={t("yourName")}
              value={depositForm.senderName}
              onChange={(e) =>
                setDepositForm({ ...depositForm, senderName: e.target.value })
              }
            />

            <input
              className="deposit-input"
              placeholder={t("yourWalletBankAccount")}
              value={depositForm.senderAccount}
              onChange={(e) =>
                setDepositForm({ ...depositForm, senderAccount: e.target.value })
              }
            />

            <input
              className="deposit-input"
              placeholder={t("amount")}
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
              placeholder={t("transactionHashReference")}
              value={depositForm.txHash}
              onChange={(e) =>
                setDepositForm({ ...depositForm, txHash: e.target.value })
              }
            />

            <button className="deposit-btn" onClick={submitDeposit}>
              {t("submitDeposit")}
            </button>
          </div>

          <div className="wallet-box">
            <h2>{t("withdrawalRequest")}</h2>

            <input
              className="withdraw-input deposit-input"
              placeholder={t("amount")}
              value={withdrawForm.amount}
              onChange={(e) =>
                setWithdrawForm({ ...withdrawForm, amount: e.target.value })
              }
            />

            <input
              className="withdraw-input deposit-input"
              placeholder={t("accountWalletName")}
              value={withdrawForm.accountName}
              onChange={(e) =>
                setWithdrawForm({ ...withdrawForm, accountName: e.target.value })
              }
            />

            <input
              className="withdraw-input deposit-input"
              placeholder={t("walletBankIbanPlaceholder")}
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
              {t("submitWithdrawal")}
            </button>
          </div>
        </div>

        <div className="wallet-security-box">
          <h2>{t("securitySystem")}</h2>
          <p>✅ {t("securityAdminApproval")}</p>
          <p>✅ {t("securityNoAutoRelease")}</p>
          <p>✅ {t("securityLicensedGateways")}</p>
          <p>✅ {t("securityWalletVerification")}</p>
          <p>✅ {t("securityBackendApproval")}</p>
        </div>
      </div>
    </PageShell>
  );
}

export default Wallets;
