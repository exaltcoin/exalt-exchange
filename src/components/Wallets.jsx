import React, { useEffect, useMemo, useState } from "react";
import exaltLogo from "../assets/exalt-coin.png";
import { QRCodeCanvas } from "qrcode.react";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./Wallets.css";

const API_FALLBACK = "https://exalt-real-backend-6b6v.onrender.com";

const COIN_LOGOS = {
  BTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
  ETH: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  USDT: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
  BNB: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
  EXALT: exaltLogo,
  SOL: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
  XRP: "https://s2.coinmarketcap.com/static/img/coins/64x64/52.png",
  DOGE: "https://s2.coinmarketcap.com/static/img/coins/64x64/74.png",
  TRX: "https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png",
  ADA: "https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png",
  AVAX: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
  LINK: "https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png",
  LTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/2.png",
  DOT: "https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png",
  SHIB: "https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png",
};

const DEFAULT_ASSETS = [
  { symbol: "USDT", name: "Tether USD", balance: 0, price: 1, change24h: 0, network: "BEP20", favorite: true },
  { symbol: "EXALT", name: "Exalt Coin", balance: 0, price: 0.0003, change24h: 0, network: "BEP20", favorite: true },
  { symbol: "BNB", name: "BNB", balance: 0, price: 650, change24h: 0, network: "BEP20", favorite: true },
  { symbol: "BTC", name: "Bitcoin", balance: 0, price: 103000, change24h: 0, network: "BTC", favorite: false },
  { symbol: "ETH", name: "Ethereum", balance: 0, price: 2400, change24h: 0, network: "ERC20", favorite: false },
  { symbol: "SOL", name: "Solana", balance: 0, price: 150, change24h: 0, network: "SOL", favorite: false },
  { symbol: "XRP", name: "XRP", balance: 0, price: 0.55, change24h: 0, network: "XRP", favorite: false },
  { symbol: "DOGE", name: "Dogecoin", balance: 0, price: 0.12, change24h: 0, network: "DOGE", favorite: false },
  { symbol: "TRX", name: "TRON", balance: 0, price: 0.13, change24h: 0, network: "TRC20", favorite: false },
  { symbol: "ADA", name: "Cardano", balance: 0, price: 0.45, change24h: 0, network: "ADA", favorite: false },
  { symbol: "AVAX", name: "Avalanche", balance: 0, price: 25, change24h: 0, network: "AVAX", favorite: false },
  { symbol: "LINK", name: "Chainlink", balance: 0, price: 14, change24h: 0, network: "ERC20", favorite: false },
  { symbol: "LTC", name: "Litecoin", balance: 0, price: 80, change24h: 0, network: "LTC", favorite: false },
  { symbol: "DOT", name: "Polkadot", balance: 0, price: 6, change24h: 0, network: "DOT", favorite: false },
  { symbol: "SHIB", name: "Shiba Inu", balance: 0, price: 0.00002, change24h: 0, network: "ERC20", favorite: false },
];

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

const NETWORK_META = {
  BEP20: { minDeposit: 1, confirmations: 15, fee: 0.8, time: "3–10 min" },
  ERC20: { minDeposit: 10, confirmations: 12, fee: 5, time: "5–20 min" },
  TRC20: { minDeposit: 1, confirmations: 20, fee: 1, time: "2–10 min" },
  BTC: { minDeposit: 0.0001, confirmations: 2, fee: 0.0002, time: "10–60 min" },
};

function Wallets() {
  const { t } = useI18n();

  const API_BASE = import.meta.env.VITE_API_URL || API_FALLBACK;
  const API = API_BASE.endsWith("/api") ? API_BASE.replace("/api", "") : API_BASE;

  const [activeTab, setActiveTab] = useState("overview");
  const [assetSearch, setAssetSearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [hideSmall, setHideSmall] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [walletAddress, setWalletAddress] = useState("");
  const [userId, setUserId] = useState("");

  const [wallets, setWallets] = useState({
    USDT: 0,
    EXALT: 0,
    BNB: 0,
  });

  const [walletStats, setWalletStats] = useState({
    totalPortfolioUsd: 0,
    todayPnl: 0,
    todayPnlPercent: 0,
    availableBalance: 0,
    lockedBalance: 0,
    inOrders: 0,
    pendingRewards: 0,
    approvedRewards: 0,
    miningRewards: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    walletStatus: "Active",
    securityScore: 86,
  });

  const [assets, setAssets] = useState(DEFAULT_ASSETS);
  const [favorites, setFavorites] = useState(["USDT", "EXALT", "BNB"]);

  const [selectedCoin, setSelectedCoin] = useState("EXALT");
  const [selectedNetwork, setSelectedNetwork] = useState("BEP20");

  const [depositForm, setDepositForm] = useState({
    senderName: "",
    senderAccount: "",
    amount: "",
    paymentMethod: "EXALT",
    txHash: "",
    memo: "",
  });

  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    accountName: "",
    accountNumber: "",
    method: "CRYPTO",
    coin: "USDT",
    network: "BEP20",
    memo: "",
  });

  const [addressBook, setAddressBook] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("exalt_address_book") || "[]");
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState([]);

  const shortAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : t("walletNotConnected");

  const formatUsd = (value) =>
    `$${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatAmount = (value, decimals = 4) => {
    const num = Number(value || 0);
    if (num === 0) return "0.0000";
    if (num > 0 && num < 0.0001) return num.toFixed(8);
    return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
  };

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
    DEPOSIT_ADDRESSES[selectedCoin]?.ERC20 ||
    DEPOSIT_ADDRESSES[selectedCoin]?.TRC20 ||
    DEPOSIT_ADDRESSES[selectedCoin]?.BTC ||
    "";

  const activeNetworkMeta = NETWORK_META[selectedNetwork] || NETWORK_META.BEP20;

  const activeAsset = useMemo(() => {
    return assets.find((asset) => asset.symbol === selectedCoin) || assets[0];
  }, [assets, selectedCoin]);

  const withdrawFee = useMemo(() => {
    const meta = NETWORK_META[withdrawForm.network] || NETWORK_META.BEP20;
    return Number(meta.fee || 0);
  }, [withdrawForm.network]);

  const receiveAmount = useMemo(() => {
    const amount = Number(withdrawForm.amount || 0);
    if (!amount) return 0;
    return Math.max(amount - withdrawFee, 0);
  }, [withdrawForm.amount, withdrawFee]);

  const filteredAssets = useMemo(() => {
    const q = assetSearch.toLowerCase();

    return assets
      .map((asset) => {
        const balance = Number(wallets[asset.symbol] ?? asset.balance ?? 0);
        const price = Number(asset.price || 0);
        const valueUsd = balance * price;

        return {
          ...asset,
          balance,
          valueUsd,
          logo: COIN_LOGOS[asset.symbol] || asset.logo,
          favorite: favorites.includes(asset.symbol),
        };
      })
      .filter((asset) => {
        const matchSearch =
          !q ||
          asset.symbol.toLowerCase().includes(q) ||
          asset.name.toLowerCase().includes(q) ||
          asset.network.toLowerCase().includes(q);

        const matchSmall = !hideSmall || asset.valueUsd >= 1;

        return matchSearch && matchSmall;
      })
      .sort((a, b) => {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return b.valueUsd - a.valueUsd;
      });
  }, [assets, wallets, favorites, assetSearch, hideSmall]);

  const allocation = useMemo(() => {
    const total = filteredAssets.reduce((sum, asset) => sum + Number(asset.valueUsd || 0), 0);

    return filteredAssets
      .filter((asset) => asset.valueUsd > 0)
      .slice(0, 5)
      .map((asset) => ({
        ...asset,
        percent: total ? (asset.valueUsd / total) * 100 : 0,
      }));
  }, [filteredAssets]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "ALL") return history;
    return history.filter((item) => item.type === historyFilter);
  }, [history, historyFilter]);
  const loadWalletData = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setWallets({ USDT: 0, EXALT: 0, BNB: 0 });
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${API}/api/wallets/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!data.success || !data.wallet) {
        setWallets({ USDT: 0, EXALT: 0, BNB: 0 });
        setIsLoading(false);
        return;
      }

      const balances = data.wallet.balances || {};
      const locked = data.wallet.locked || {};

      const nextWallets = {
        USDT: Number(balances.USDT || 0),
        EXALT: Number(balances.EXALT || 0),
        BNB: Number(balances.BNB || 0),
      };

      setWallets(nextWallets);
      setUserId(data.wallet.userId || "");

      const updatedAssets = DEFAULT_ASSETS.map((asset) => ({
        ...asset,
        balance: Number(nextWallets[asset.symbol] || asset.balance || 0),
      }));

      setAssets(updatedAssets);

      const totalPortfolio =
        nextWallets.USDT +
        nextWallets.EXALT * 0.0003 +
        nextWallets.BNB * 650;

      setWalletStats((prev) => ({
        ...prev,
        totalPortfolioUsd: totalPortfolio,
        availableBalance: nextWallets.USDT,
        lockedBalance:
          Number(locked.USDT || 0) +
          Number(locked.BNB || 0) +
          Number(locked.EXALT || 0),
        walletStatus: t("verifiedActive") || "Verified Active",
      }));

      await loadRewardStats(token);
      await loadWalletHistory(token);
      await loadMarketPrices();

      setIsLoading(false);
    } catch (error) {
      console.log("Wallet V2 load error:", error);
      setIsLoading(false);
    }
  };

  const loadRewardStats = async (token) => {
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
      console.log("Reward stats error:", error);
    }
  };

  const loadWalletHistory = async (token) => {
    try {
      const items = [];

      const depositRes = await fetch(`${API}/api/deposit-request/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      if (depositRes) {
        const depositData = await depositRes.json();
        if (Array.isArray(depositData.deposits)) {
          depositData.deposits.forEach((item) => {
            items.push({
              id: item._id || item.id,
              type: "DEPOSIT",
              coin: item.coin || item.paymentMethod || "USDT",
              amount: item.amount || 0,
              status: item.status || "Pending",
              date: item.createdAt || new Date().toISOString(),
              txHash: item.txHash || item.transactionId || "",
            });
          });
        }
      }

      const withdrawRes = await fetch(`${API}/api/withdrawals/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      if (withdrawRes) {
        const withdrawData = await withdrawRes.json();
        if (Array.isArray(withdrawData.withdrawals)) {
          withdrawData.withdrawals.forEach((item) => {
            items.push({
              id: item._id || item.id,
              type: "WITHDRAW",
              coin: item.coin || "USDT",
              amount: item.amount || 0,
              status: item.status || "Pending",
              date: item.createdAt || new Date().toISOString(),
              txHash: item.txHash || "",
            });
          });
        }
      }

      setHistory(
        items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 100)
      );
    } catch (error) {
      console.log("History load error:", error);
    }
  };

  const loadMarketPrices = async () => {
    try {
      const res = await fetch(`${API}/api/coins/all-market`);
      const data = await res.json();
      const coins = Array.isArray(data.coins) ? data.coins : [];

      if (!coins.length) return;

      setAssets((prev) =>
        prev.map((asset) => {
          const found = coins.find(
            (coin) =>
              String(coin.symbol || "").toUpperCase() ===
              String(asset.symbol || "").toUpperCase()
          );

          if (!found) return asset;

          return {
            ...asset,
            price: Number(found.priceUsd || found.price || asset.price || 0),
            change24h: Number(found.change24h || found.priceChange24h || 0),
          };
        })
      );
    } catch (error) {
      console.log("Market price load error:", error);
    }
  };

  useEffect(() => {
    const savedWallet = localStorage.getItem("walletAddress") || "";
    if (savedWallet) setWalletAddress(savedWallet);

    loadWalletData();

    const interval = setInterval(loadWalletData, 15000);
    return () => clearInterval(interval);
  }, [API]);

  const toggleFavorite = (symbol) => {
    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((item) => item !== symbol)
        : [...prev, symbol]
    );
  };

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
          memo: depositForm.memo,
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
          memo: "",
        });
        loadWalletData();
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
          network: withdrawForm.method === "CRYPTO" ? withdrawForm.network : withdrawForm.method,
          memo: withdrawForm.memo,
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
          network: "BEP20",
          memo: "",
        });

        loadWalletData();
      } else {
        alert(data.message || t("withdrawalFailed"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    }
  };

  const saveAddressBook = () => {
    if (!withdrawForm.accountNumber || !withdrawForm.accountName) {
      alert("Wallet name and address required.");
      return;
    }

    const item = {
      id: Date.now(),
      name: withdrawForm.accountName,
      address: withdrawForm.accountNumber,
      coin: withdrawForm.coin,
      network: withdrawForm.network,
      createdAt: new Date().toISOString(),
    };

    const updated = [item, ...addressBook].slice(0, 50);
    setAddressBook(updated);
    localStorage.setItem("exalt_address_book", JSON.stringify(updated));

    alert("Address saved.");
  };

  const useSavedAddress = (item) => {
    setWithdrawForm((prev) => ({
      ...prev,
      accountName: item.name,
      accountNumber: item.address,
      coin: item.coin,
      network: item.network,
    }));
  };

  const renderAssetList = () => (
    <div className="wallet-v2-assets">
      <div className="wallet-v2-section-head">
        <div>
          <h2>Assets</h2>
          <p>Search, favorite and manage your exchange assets.</p>
        </div>

        <button onClick={loadWalletData}>
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="wallet-v2-tools">
        <input
          placeholder="Search coin, network, symbol..."
          value={assetSearch}
          onChange={(e) => setAssetSearch(e.target.value)}
        />

        <button
          className={hideSmall ? "active" : ""}
          onClick={() => setHideSmall(!hideSmall)}
        >
          Hide Small
        </button>

        <button onClick={() => setHideBalance(!hideBalance)}>
          {hideBalance ? "Show Balance" : "Hide Balance"}
        </button>
      </div>

      <div className="wallet-v2-asset-list">
        {filteredAssets.length === 0 ? (
          <div className="wallet-v2-empty">
            <h3>No assets found</h3>
            <p>Try another search keyword.</p>
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <div className="wallet-v2-asset-row" key={asset.symbol}>
              <div className="asset-main">
                <img src={asset.logo} alt={asset.symbol} />
                <div>
                  <strong>{asset.symbol}</strong>
                  <p>{asset.name} • {asset.network}</p>
                </div>
              </div>

              <div className="asset-price">
                <strong>{formatUsd(asset.price)}</strong>
                <span className={Number(asset.change24h) >= 0 ? "green" : "red"}>
                  {Number(asset.change24h || 0).toFixed(2)}%
                </span>
              </div>

              <div className="asset-balance">
                <strong>
                  {hideBalance ? "****" : formatAmount(asset.balance)}
                </strong>
                <p>{hideBalance ? "****" : formatUsd(asset.valueUsd)}</p>
              </div>

              <button
                className={asset.favorite ? "fav active" : "fav"}
                onClick={() => toggleFavorite(asset.symbol)}
              >
                ★
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPortfolioAllocation = () => (
    <div className="wallet-v2-card">
      <div className="wallet-v2-section-head">
        <div>
          <h2>Portfolio Allocation</h2>
          <p>Top holdings by estimated USD value.</p>
        </div>
      </div>

      {allocation.length === 0 ? (
        <div className="wallet-v2-empty">
          <h3>No allocation yet</h3>
          <p>Deposit assets to see portfolio allocation.</p>
        </div>
      ) : (
        <div className="wallet-v2-allocation">
          {allocation.map((asset) => (
            <div className="allocation-row" key={asset.symbol}>
              <div>
                <strong>{asset.symbol}</strong>
                <span>{asset.percent.toFixed(2)}%</span>
              </div>

              <div className="allocation-bar">
                <span style={{ width: `${Math.min(asset.percent, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="wallet-v2-hero">
        <div>
          <p>Total Portfolio Value</p>
          <h1>
            {hideBalance ? "******" : formatUsd(walletStats.totalPortfolioUsd)}
          </h1>

          <span className={Number(walletStats.todayPnl) >= 0 ? "green" : "red"}>
            {Number(walletStats.todayPnl || 0) >= 0 ? "+" : ""}
            {formatUsd(walletStats.todayPnl)} / {Number(walletStats.todayPnlPercent || 0).toFixed(2)}%
          </span>
        </div>

        <button onClick={() => setHideBalance(!hideBalance)}>
          {hideBalance ? "👁️" : "🙈"}
        </button>
      </div>

      <div className="wallet-v2-stats">
        <div>
          <span>Available</span>
          <strong>{hideBalance ? "****" : `${formatAmount(walletStats.availableBalance)} USDT`}</strong>
        </div>

        <div>
          <span>Locked</span>
          <strong>{hideBalance ? "****" : `${formatAmount(walletStats.lockedBalance)} USDT`}</strong>
        </div>

        <div>
          <span>In Orders</span>
          <strong>{hideBalance ? "****" : `${formatAmount(walletStats.inOrders)} USDT`}</strong>
        </div>

        <div>
          <span>Status</span>
          <strong>{walletStats.walletStatus}</strong>
        </div>
      </div>

      <div className="wallet-v2-grid">
        <div className="wallet-v2-card">
          <h3>Funding Wallet</h3>
          <strong>{hideBalance ? "****" : `${formatAmount(wallets.USDT)} USDT`}</strong>
          <p>Deposits, withdrawals and fiat funding.</p>
        </div>

        <div className="wallet-v2-card">
          <h3>Spot Wallet</h3>
          <strong>{hideBalance ? "****" : `${formatAmount(wallets.EXALT)} EXALT`}</strong>
          <p>Trading balance and exchange assets.</p>
        </div>

        <div className="wallet-v2-card">
          <h3>BNB Wallet</h3>
          <strong>{hideBalance ? "****" : `${formatAmount(wallets.BNB)} BNB`}</strong>
          <p>Gas and BNB Smart Chain assets.</p>
        </div>

        <div className="wallet-v2-card">
          <h3>Rewards</h3>
          <strong>{hideBalance ? "****" : `${formatAmount(walletStats.pendingRewards)} EXALT`}</strong>
          <p>Pending and approved reward balances.</p>
        </div>
      </div>

      {renderPortfolioAllocation()}
      {renderAssetList()}
    </>
  );
  const renderDeposit = () => (
    <div className="wallet-v2-two-col">
      <div className="wallet-v2-card">
        <div className="wallet-v2-section-head">
          <div>
            <h2>Deposit Crypto</h2>
            <p>Select coin and network, then send only supported assets.</p>
          </div>
        </div>

        <div className="wallet-v2-form-row">
          <select
            value={selectedCoin}
            onChange={(e) => {
              setSelectedCoin(e.target.value);
              const coinNetworks = Object.keys(DEPOSIT_ADDRESSES[e.target.value] || {});
              setSelectedNetwork(coinNetworks[0] || "BEP20");
            }}
          >
            {Object.keys(DEPOSIT_ADDRESSES).map((coin) => (
              <option key={coin} value={coin}>{coin}</option>
            ))}
          </select>

          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
          >
            {Object.keys(DEPOSIT_ADDRESSES[selectedCoin] || {}).map((network) => (
              <option key={network} value={network}>{network}</option>
            ))}
          </select>
        </div>

        {activeDepositAddress ? (
          <div className="wallet-v2-address-card">
            <div className="deposit-coin-head">
              <img
                src={COIN_LOGOS[selectedCoin] || COIN_LOGOS.USDT}
                alt={selectedCoin}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div>
                <strong>{selectedCoin} Deposit</strong>
                <p>{selectedNetwork} Network</p>
              </div>
            </div>

            <div className="wallet-v2-qr">
              <QRCodeCanvas value={activeDepositAddress} size={150} />
            </div>

            <div className="wallet-v2-address-text">
              <span>Deposit Address</span>
              <strong>{activeDepositAddress}</strong>
            </div>

            <div className="wallet-v2-action-row">
              <button onClick={() => copyText(activeDepositAddress, `${selectedCoin} address`)}>
                Copy Address
              </button>
              <button onClick={() => copyText(activeDepositAddress, "QR address")}>
                Copy QR Value
              </button>
            </div>

            <div className="wallet-v2-warning">
              <strong>Important</strong>
              <p>
                Send only {selectedCoin} on {selectedNetwork}. Sending unsupported assets
                or wrong network deposits may cause permanent loss.
              </p>
            </div>

            <div className="wallet-v2-mini-grid">
              <div>
                <span>Minimum Deposit</span>
                <strong>{activeNetworkMeta.minDeposit} {selectedCoin}</strong>
              </div>

              <div>
                <span>Confirmations</span>
                <strong>{activeNetworkMeta.confirmations}</strong>
              </div>

              <div>
                <span>Arrival Time</span>
                <strong>{activeNetworkMeta.time}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="wallet-v2-empty">
            <h3>No address available</h3>
            <p>This network is not enabled yet.</p>
          </div>
        )}
      </div>

      <div className="wallet-v2-card">
        <div className="wallet-v2-section-head">
          <div>
            <h2>Submit Deposit</h2>
            <p>Send proof after making crypto, bank or mobile wallet deposit.</p>
          </div>
        </div>

        <input
          placeholder="Your name"
          value={depositForm.senderName}
          onChange={(e) =>
            setDepositForm({ ...depositForm, senderName: e.target.value })
          }
        />

        <input
          placeholder="Wallet / Bank / Mobile account"
          value={depositForm.senderAccount}
          onChange={(e) =>
            setDepositForm({ ...depositForm, senderAccount: e.target.value })
          }
        />

        <input
          placeholder="Amount"
          value={depositForm.amount}
          onChange={(e) =>
            setDepositForm({ ...depositForm, amount: e.target.value })
          }
        />

        <select
          value={depositForm.paymentMethod}
          onChange={(e) =>
            setDepositForm({ ...depositForm, paymentMethod: e.target.value })
          }
        >
          <option>EXALT</option>
          <option>USDT</option>
          <option>BNB</option>
          <option>JazzCash</option>
          <option>EasyPaisa</option>
          <option>Bank Transfer</option>
        </select>

        <input
          placeholder="Transaction hash / reference"
          value={depositForm.txHash}
          onChange={(e) =>
            setDepositForm({ ...depositForm, txHash: e.target.value })
          }
        />

        <input
          placeholder="Memo / Tag (optional)"
          value={depositForm.memo}
          onChange={(e) =>
            setDepositForm({ ...depositForm, memo: e.target.value })
          }
        />

        <button className="wallet-v2-primary" onClick={submitDeposit}>
          Submit Deposit
        </button>

        <div className="wallet-v2-fiat-box">
          <h3>Fiat Deposit Methods</h3>

          <div>
            <span>JazzCash / Easypaisa</span>
            <strong>{BANK_INFO.jazzCash}</strong>
            <button onClick={() => copyText(BANK_INFO.jazzCash, "JazzCash / Easypaisa")}>
              Copy
            </button>
          </div>

          <div>
            <span>Account Title</span>
            <strong>{BANK_INFO.accountTitle}</strong>
          </div>

          <div>
            <span>IBAN</span>
            <strong>{BANK_INFO.iban}</strong>
            <button onClick={() => copyText(BANK_INFO.iban, "IBAN")}>
              Copy
            </button>
          </div>

          <div>
            <span>Bank</span>
            <strong>{BANK_INFO.bank}</strong>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWithdraw = () => (
    <div className="wallet-v2-two-col">
      <div className="wallet-v2-card">
        <div className="wallet-v2-section-head">
          <div>
            <h2>Withdraw</h2>
            <p>Submit withdrawal request with network fee preview.</p>
          </div>
        </div>

        <div className="wallet-v2-form-row">
          <select
            value={withdrawForm.coin}
            onChange={(e) =>
              setWithdrawForm({ ...withdrawForm, coin: e.target.value })
            }
          >
            <option value="USDT">USDT</option>
            <option value="EXALT">EXALT</option>
            <option value="BNB">BNB</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>

          <select
            value={withdrawForm.network}
            onChange={(e) =>
              setWithdrawForm({ ...withdrawForm, network: e.target.value })
            }
          >
            <option value="BEP20">BEP20</option>
            <option value="ERC20">ERC20</option>
            <option value="TRC20">TRC20</option>
            <option value="BTC">BTC</option>
          </select>
        </div>

        <input
          placeholder="Amount"
          value={withdrawForm.amount}
          onChange={(e) =>
            setWithdrawForm({ ...withdrawForm, amount: e.target.value })
          }
        />

        <div className="wallet-v2-max-row">
          <span>
            Available: {formatAmount(wallets[withdrawForm.coin] || 0)} {withdrawForm.coin}
          </span>
          <button
            onClick={() =>
              setWithdrawForm({
                ...withdrawForm,
                amount: String(wallets[withdrawForm.coin] || 0),
              })
            }
          >
            Max
          </button>
        </div>

        <input
          placeholder="Wallet / Account name"
          value={withdrawForm.accountName}
          onChange={(e) =>
            setWithdrawForm({ ...withdrawForm, accountName: e.target.value })
          }
        />

        <input
          placeholder="Wallet address / Bank IBAN / Mobile number"
          value={withdrawForm.accountNumber}
          onChange={(e) =>
            setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })
          }
        />

        <select
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

        <input
          placeholder="Memo / Tag (optional)"
          value={withdrawForm.memo}
          onChange={(e) =>
            setWithdrawForm({ ...withdrawForm, memo: e.target.value })
          }
        />
        <div className="wallet-v2-fee-box">
          <div>
            <span>Estimated Network Fee</span>
            <strong>
              {NETWORK_FEES[withdrawForm.network] || "0"} {withdrawForm.coin}
            </strong>
          </div>

          <div>
            <span>You Will Receive</span>
            <strong>
              {Math.max(
                Number(withdrawForm.amount || 0) -
                  Number(NETWORK_FEES[withdrawForm.network] || 0),
                0
              ).toFixed(6)}{" "}
              {withdrawForm.coin}
            </strong>
          </div>
        </div>

        <div className="wallet-v2-action-row">
          <button onClick={saveAddressBook}>
            Save Address
          </button>

          <button
            className="wallet-v2-primary"
            onClick={submitWithdrawal}
          >
            Submit Withdrawal
          </button>
        </div>
      </div>

      <div className="wallet-v2-card">
        <div className="wallet-v2-section-head">
          <div>
            <h2>Saved Address Book</h2>
            <p>Quick withdrawal destinations.</p>
          </div>
        </div>

        {addressBook.length === 0 ? (
          <div className="wallet-v2-empty">
            <h3>No saved addresses</h3>
            <p>Your saved withdrawal wallets will appear here.</p>
          </div>
        ) : (
          <div className="wallet-v2-address-list">
            {addressBook.map((item) => (
              <div
                key={item.id}
                className="wallet-v2-address-row"
              >
                <div>
                  <strong>{item.name}</strong>

                  <p>
                    {item.coin} • {item.network}
                  </p>

                  <small>
                    {item.address.slice(0, 10)}...
                    {item.address.slice(-8)}
                  </small>
                </div>

                <div className="wallet-v2-address-actions">
                  <button onClick={() => useSavedAddress(item)}>
                    Use
                  </button>

                  <button
                    onClick={() =>
                      copyText(item.address, "Wallet Address")
                    }
                  >
                    Copy
                  </button>

                  <button
                    className="danger"
                    onClick={() => {
                      const updated = addressBook.filter(
                        (x) => x.id !== item.id
                      );

                      setAddressBook(updated);

                      localStorage.setItem(
                        "exalt_address_book",
                        JSON.stringify(updated)
                      );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="wallet-v2-security">
          <h3>Withdrawal Security</h3>

          <ul>
            <li>✅ Email verification required</li>
            <li>✅ Admin approval system</li>
            <li>✅ Risk engine verification</li>
            <li>✅ AML monitoring</li>
            <li>✅ Withdrawal history recorded</li>
            <li>✅ Audit trail enabled</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="wallet-v2-card">
      <div className="wallet-v2-section-head">
        <div>
          <h2>Wallet History</h2>
          <p>Deposits, withdrawals and rewards.</p>
        </div>

        <button onClick={loadWalletData}>
          Refresh
        </button>
      </div>

      {history.length === 0 ? (
        <div className="wallet-v2-empty">
          <h3>No history available</h3>
          <p>Your wallet transactions will appear here.</p>
        </div>
      ) : (
        <div className="wallet-v2-history">
          {history.map((item) => (
            <div
              className="wallet-v2-history-row"
              key={item.id}
            >
              <div>
                <strong>{item.type}</strong>

                <p>
                  {item.coin} •{" "}
                  {new Date(item.date).toLocaleString()}
                </p>

                {item.txHash && (
                  <small>
                    {item.txHash.slice(0, 14)}...
                    {item.txHash.slice(-10)}
                  </small>
                )}
              </div>

              <div className="history-right">
                <strong>
                  {Number(item.amount).toLocaleString()}
                </strong>

                <span
                  className={
                    item.status === "Approved" ||
                    item.status === "Completed"
                      ? "green"
                      : item.status === "Rejected"
                      ? "red"
                      : "orange"
                  }
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  const NETWORK_FEES = {
    BEP20: 0.8,
    ERC20: 5,
    TRC20: 1,
    BTC: 0.0002,
  };

  const renderSecurity = () => (
    <div className="wallet-v2-card">
      <h2>Wallet Security</h2>
      <div className="wallet-v2-security-score">
        <h1>{walletStats.securityScore}%</h1>
        <p>Security Score</p>
      </div>
      <ul>
        <li>✅ Admin withdrawal approval</li>
        <li>✅ No automatic fund release</li>
        <li>✅ Wallet verification enabled</li>
        <li>✅ Backend approval system</li>
        <li>✅ Risk monitoring ready</li>
      </ul>
    </div>
  );

  return (
    <PageShell titleKey="wallets" subtitleKey="walletsSubtitle">
      <div className="wallet-v2-page">
        <div className="wallet-v2-tabs">
          {[
            ["overview", "Overview"],
            ["assets", "Assets"],
            ["deposit", "Deposit"],
            ["withdraw", "Withdraw"],
            ["history", "History"],
            ["security", "Security"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={activeTab === key ? "active" : ""}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && renderOverview()}
        {activeTab === "assets" && renderAssetList()}
        {activeTab === "deposit" && renderDeposit()}
        {activeTab === "withdraw" && renderWithdraw()}
        {activeTab === "history" && renderHistory()}
        {activeTab === "security" && renderSecurity()}
      </div>
    </PageShell>
  );
}

export default Wallets;