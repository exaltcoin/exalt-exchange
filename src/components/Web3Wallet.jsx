import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import CoinDetails from "./CoinDetails";
import { ethers } from "ethers";
import exaltLogo from "../assets/exalt-coin.png";
import exchangeLogo from "../assets/exalt-exchange-logo.png";
import "./Web3Wallet.css";

import {
  DEFAULT_CHAIN_KEY,
  getChain,
  getChainList,
} from "../web3/web3Config";

import {
  getSavedWallets,
  getActiveWalletAddress,
  saveWallets,
  setActiveWallet,
  shortAddress,
  createLocalWallet,
  importWalletFromValue,
  renameWallet as renameWalletStore,
  removeWallet as removeWalletStore,
  findWallet,
  addWallet,
} from "../web3/walletStore";

import {
  getAllBalances,
  sendToken,
  swapNativeToToken,
  swapTokenToNative,
  getSignerFromPrivateKey,
} from "../web3/transactionService";

import {
  addLocalTx,
  updateLocalTxStatus,
  loadWeb3HistoryFromBackend,
  saveWeb3TxToBackend,
} from "../web3/historyService";

import { submitWeb3SupportTicket } from "../web3/supportService";

import {
  startQRScanner,
  stopQRScanner,
  parseQRCode,
} from "../web3/qrScannerService";

import {
  getAllTokens,
  getWalletTokenList,
  getTokenBySymbol,
  getReceiveAddressForToken,
  getTokenWarning,
  getTokenLogo,
  getTokenBalanceKey,
  getImportableChains,
  importCustomToken,
  removeCustomToken,
  formatTokenAmount,
  formatTokenPrice,
  searchTokens,
  sortTokensByValue,
 toggleFavoriteToken,
  hideTokenById,
  toggleWatchlistToken,
 buildTokenDisplayName,
} from "../web3/tokens";

import {
  formatUsd,
  calculatePortfolio,
  copyToClipboard,
  isValidAddress,
} from "../web3/utils";
import {
  getAssetSettings,
  saveAssetSettings,
  toggleHiddenToken,
  togglePinnedToken,
  toggleFavoriteToken as toggleManagedFavorite,
  setHideZeroBalances,
  setAssetSortBy,
  restoreHiddenTokens,
  getHiddenAssetList,
} from "../web3/assetManagerService";

import {
  getAddressBook,
  addAddressBookContact,
  deleteAddressBookContact,
  toggleAddressFavorite,
  searchAddressBook,
} from "../web3/addressBookService";

import {
  getBackupStatus,
  markWalletBackedUp,
  markWalletVerified,
  dismissBackupReminder,
  shouldShowBackupReminder,
  getBackupLabel,
} from "../web3/backupService";

import {
  getPriceAlerts,
  addPriceAlert,
  deletePriceAlert,
  togglePriceAlert,
  checkPriceAlerts,
} from "../web3/priceAlertService";

import {
  exportHistoryToCsv,
  filterHistory,
  getHistoryStats,
} from "../web3/historyExportService";
function Web3Wallet({ setPage }) {
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://exalt-real-backend-6b6v.onrender.com";

  const API = API_BASE.endsWith("/api")
    ? API_BASE.replace("/api", "")
    : API_BASE;

  const videoRef = useRef(null);

  const [wallet, setWallet] = useState("");
  const [wallets, setWallets] = useState([]);
  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState({});
  const [totalAssets, setTotalAssets] = useState(0);

  const [activeChain, setActiveChain] = useState(
    localStorage.getItem("exalt_active_chain") || DEFAULT_CHAIN_KEY
  );

  const [assetTab, setAssetTab] = useState("holdings");
  const [bottomTab, setBottomTab] = useState("home");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
const [welcomeKey, setWelcomeKey] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMyWallets, setShowMyWallets] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showPhrase, setShowPhrase] = useState("");
  const [showSupport, setShowSupport] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showImportToken, setShowImportToken] = useState(false);
const [selectedCoinDetails, setSelectedCoinDetails] = useState(null);
  const [sendTo, setSendTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sendTokenId, setSendTokenId] = useState("");

  const [receiveTokenId, setReceiveTokenId] = useState("");

  const [fromTokenId, setFromTokenId] = useState("");
  const [toTokenId, setToTokenId] = useState("");
  const [swapAmount, setSwapAmount] = useState("");

  const [txHistory, setTxHistory] = useState([]);
const [lastReceipt, setLastReceipt] = useState(null);
const [hideBalance, setHideBalance] = useState(
  localStorage.getItem("exalt_hide_balance") === "true"
);
  const [importValue, setImportValue] = useState("");

  const [supportMsg, setSupportMsg] = useState("");

  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [customTokenChain, setCustomTokenChain] = useState(activeChain);
  const [tokenImporting, setTokenImporting] = useState(false);
  const [tokenPreview, setTokenPreview] = useState(null);
  const chain = getChain(activeChain);
  const chains = getChainList();
const [assetSettings, setAssetSettings] = useState(getAssetSettings());

const [showManage, setShowManage] = useState(false);

const [showAddressBook, setShowAddressBook] = useState(false);

const [showPriceAlerts, setShowPriceAlerts] = useState(false);

const [showBackup, setShowBackup] = useState(false);

const [priceAlerts, setPriceAlerts] = useState(getPriceAlerts());

const [addressBook, setAddressBook] = useState(getAddressBook());

const [backupStatus, setBackupStatus] = useState(getBackupStatus());

const [historyFilter, setHistoryFilter] = useState("all");

const [historyStats, setHistoryStats] = useState({});

const [showExportMenu, setShowExportMenu] = useState(false);

  const activeWallet = useMemo(
    () => findWallet(wallets, wallet),
    [wallets, wallet]
  );

  const activeWalletName = activeWallet?.name || "Exalt Wallet";

  const walletTokens = useMemo(() => {
    const list = getWalletTokenList({
      chainKey: activeChain,
      includeHidden: false,
      includeSpam: false,
      query: search,
    });

    return sortTokensByValue(list, balances, prices);
  }, [activeChain, search, balances, prices]);

  const allChainTokens = useMemo(() => {
    return getAllTokens().filter((token) => token.chainKey === activeChain);
  }, [activeChain, showImportToken]);

  const selectedSendToken = useMemo(() => {
    return (
      getAllTokens().find((token) => token.id === sendTokenId) ||
      walletTokens[0] ||
      getTokenBySymbol(chain.symbol, activeChain)
    );
  }, [sendTokenId, walletTokens, activeChain]);

  const selectedReceiveToken = useMemo(() => {
    return (
      getAllTokens().find((token) => token.id === receiveTokenId) ||
      walletTokens[0] ||
      getTokenBySymbol(chain.symbol, activeChain)
    );
  }, [receiveTokenId, walletTokens, activeChain]);

  const selectedFromToken = useMemo(() => {
    return (
      getAllTokens().find((token) => token.id === fromTokenId) ||
      walletTokens[0] ||
      getTokenBySymbol(chain.symbol, activeChain)
    );
  }, [fromTokenId, walletTokens, activeChain]);

  const selectedToToken = useMemo(() => {
    return (
      getAllTokens().find((token) => token.id === toTokenId) ||
      walletTokens.find((token) => !token.native) ||
      walletTokens[1] ||
      walletTokens[0]
    );
  }, [toTokenId, walletTokens]);

  const portfolioValue = useMemo(() => {
    return calculatePortfolio(walletTokens, balances, prices);
  }, [walletTokens, balances, prices]);

  const receiveAddress = getReceiveAddressForToken(
    selectedReceiveToken?.symbol,
    wallet
  );

  const showToast = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3500);
  };
 const shortHash = (hash = "") => {
  if (!hash) return "No Hash";
  if (!hash.startsWith("0x")) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

const openExplorerTx = (tx) => {
  const explorer = getChain(tx.chainKey || activeChain).explorer;

  if (!tx.hash || !tx.hash.startsWith("0x")) {
    showToast("This is a test transaction. No explorer hash available.");
    return;
  }

 window.open(`${explorer}/tx/${tx.hash}`, "_blank");
}; 
const replayWelcome = () => {
  setShowWelcome(false);

  setTimeout(() => {
    setWelcomeKey((prev) => prev + 1);
    setShowWelcome(true);

    setTimeout(() => {
      setShowWelcome(false);
    }, 1800);
  }, 50);
};
  const syncWalletState = (nextWallets, activeAddress = "") => {
    const saved = saveWallets(nextWallets, activeAddress);
    setWallets(saved);

    if (activeAddress) {
      setWallet(activeAddress);
      setActiveWallet(activeAddress);
    }
  };

  const changeChain = async (chainKey) => {
    setActiveChain(chainKey);
    localStorage.setItem("exalt_active_chain", chainKey);
    setSearch("");
    setSendTokenId("");
    setReceiveTokenId("");
    setFromTokenId("");
    setToTokenId("");

    if (wallet) {
      await loadBalances(wallet, chainKey);
    }
  };const loadBalances = async (address = wallet, chainKey = activeChain) => {
    try {
      if (!address) return;

      const result = await getAllBalances(address, chainKey);
      setBalances((prev) => ({ ...prev, ...result }));

      const tokens = getWalletTokenList({
        chainKey,
        includeHidden: false,
        includeSpam: false,
      });

      const total = calculatePortfolio(tokens, result, prices);
      setTotalAssets(total);
    } catch (err) {
      console.log("Web3 balance error:", err);
    }
  };

  const loadHistory = async (address = wallet) => {
    try {
      if (!address) return;
const history = await loadWeb3HistoryFromBackend(API, address);

setTxHistory(Array.isArray(history) ? history : []);

setHistoryStats(
  getHistoryStats(Array.isArray(history) ? history : [])
);
   } catch (err) {
  console.log("History error:", err);
  setTxHistory([]);
  setHistoryStats({});
}   
  
  };

  const loadMarketPrices = async () => {
    try {
      const res = await fetch(`${API}/api/coins/all-market`);
      const data = await res.json();
      const list = Array.isArray(data.coins) ? data.coins : [];

      const nextPrices = {};

      list.forEach((coin) => {
        const symbol = String(coin.symbol || "").toUpperCase();
        const price = Number(coin.priceUsd || coin.price || 0);

        if (symbol && price > 0) {
          nextPrices[symbol] = price;
        }
      });

      setPrices(nextPrices);
    } catch (err) {
      console.log("Price load error:", err);
    }
  };

  const createWallet = async () => {
    try {
      const result = createLocalWallet(wallets);
      const nextWallets = addWallet(wallets, result.wallet);

      syncWalletState(nextWallets, result.wallet.address);
      setShowPhrase(result.phrase);
      setShowAddWallet(false);

      await loadBalances(result.wallet.address, activeChain);
      await loadHistory(result.wallet.address);

      showToast("Exalt Wallet created. Save your recovery phrase.");
    } catch (err) {
      console.log(err);
      alert(err.message || "Wallet creation failed.");
    }
  };

  const importWallet = async () => {
    try {
      const imported = importWalletFromValue(importValue, wallets);
      const nextWallets = addWallet(wallets, imported);

      syncWalletState(nextWallets, imported.address);
      setImportValue("");
      setShowAddWallet(false);

      await loadBalances(imported.address, activeChain);
      await loadHistory(imported.address);

      showToast("Exalt Wallet imported.");
    } catch (err) {
      console.log(err);
      alert(err.message || "Import failed.");
    }
  };

  const switchWallet = async (address) => {
    syncWalletState(wallets, address);
    await loadBalances(address, activeChain);
    await loadHistory(address);
    setShowMyWallets(false);
  };

  const renameWallet = (address) => {
    const newName = prompt("Enter wallet name");
    if (!newName) return;

    const nextWallets = renameWalletStore(wallets, address, newName);
    syncWalletState(nextWallets, wallet);
  };

  const removeWallet = (address) => {
    if (!window.confirm("Remove this Exalt Wallet from this device?")) return;

    const nextWallets = removeWalletStore(wallets, address);
    const nextActive =
      wallet?.toLowerCase() === address?.toLowerCase()
        ? nextWallets[0]?.address || ""
        : wallet;

    syncWalletState(nextWallets, nextActive);

    if (nextActive) {
      loadBalances(nextActive, activeChain);
      loadHistory(nextActive);
    } else {
      setBalances({});
      setTotalAssets(0);
      setWallet("");
    }
  };

  const copyAddress = async () => {
    if (!wallet) return alert("Create or import Exalt Wallet first.");
    await copyToClipboard(wallet);
    showToast("Wallet address copied.");
  };

 const goExchange = () => {
  try {
    setShowWelcome(false);
    setShowMenu(false);
    setShowMore(false);
    setBottomTab("home");

    if (typeof setPage === "function") {
     setPage("dashboard");
      return;
    }

    window.location.href = "/";
  } catch (err) {
    window.location.href = "/";
  }
};

  const openSupport = () => {
    setShowSupport(true);
    setShowMenu(false);
    setShowMore(false);
  };

  const submitSupport = async () => {
    try {
      const token = localStorage.getItem("token") || "";

      const result = await submitWeb3SupportTicket({
        API,
        token,
        subject: "Exalt Wallet Support",
        message: supportMsg,
        wallet,
        category: "WEB3",
      });

      setSupportMsg("");
      setShowSupport(false);
      showToast(result.message || "Support request submitted.");
    } catch (err) {
      console.log(err);
      alert(err.message || "Support request failed.");
    }
  };

  const startScanner = async () => {
    setShowScanner(true);

    setTimeout(async () => {
      if (!videoRef.current) return;

      await startQRScanner(
        videoRef.current,
        (text) => {
          const parsed = parseQRCode(text);

          if (parsed.type === "wallet" && parsed.address) {
            setSendTo(parsed.address);
            setBottomTab("discover");
            setShowScanner(false);
            stopQRScanner();
            showToast("Wallet address scanned.");
          } else {
            showToast("QR scanned but no wallet address found.");
          }
        },
        (err) => {
          console.log(err);
        }
      );
    }, 300);
  };

  const stopScanner = () => {
    stopQRScanner();
    setShowScanner(false);
  };

  const getActiveSigner = async (chainKey = activeChain) => {
    if (!activeWallet?.privateKey) {
      throw new Error("Please create or import Exalt Wallet first.");
    }

    return getSignerFromPrivateKey(activeWallet.privateKey, chainKey);
  };

  const handleSend = async () => {
    try {
      if (!wallet) return alert("Create or import Exalt Wallet first.");
      if (!isValidAddress(sendTo)) return alert("Invalid wallet address.");
      if (!amount || Number(amount) <= 0) return alert("Enter valid amount.");
if (selectedSendToken.marketOnly || selectedSendToken.watchOnly) {
  return alert(
    "This coin is market/watchlist only. Import its real contract token before sending."
  );
}
      const activeSigner = await getActiveSigner(selectedSendToken.chainKey);

      const result = await sendToken({
        signer: activeSigner,
        token: selectedSendToken,
        to: sendTo,
        amount,
        chainKey: selectedSendToken.chainKey,
      });

      setTxHistory(
        addLocalTx({
          type: "Send",
          hash: result.hash,
          amount,
          coin: selectedSendToken.symbol,
          status: "pending",
          wallet,
          chainKey: selectedSendToken.chainKey,
        })
      );

      showToast("Transaction pending...");
      await result.tx.wait();

      updateLocalTxStatus(result.hash, "success");

      await saveWeb3TxToBackend(API, {
        type: "Send",
        hash: result.hash,
        amount,
        coin: selectedSendToken.symbol,
        status: "success",
        wallet,
        chain: selectedSendToken.network,
        chainKey: selectedSendToken.chainKey,
      });

      await loadBalances(wallet, selectedSendToken.chainKey);
      await loadHistory(wallet);

      setSendTo("");
      setAmount("");
      setLastReceipt({
  type: "Send",
  hash: result.hash,
  amount,
  coin: selectedSendToken.symbol,
  status: "success",
  wallet,
  chain: selectedSendToken.network,
  chainKey: selectedSendToken.chainKey,
});
      showToast("Transaction confirmed.");
    } catch (err) {
      console.log(err);
     const errorText = String(err?.message || "");

if (
  errorText.includes("insufficient funds") ||
  errorText.includes("gas * price") ||
  errorText.includes("intrinsic transaction cost")
) {
  alert(
    `Insufficient BNB for network fee.\n\nPlease add BNB to this wallet for gas fee, then try again.`
  );
} else {
  alert(err.message || "Send failed.");
}
    }
  };
  const handleSwap = async () => {
    try {
      if (!wallet) return alert("Create or import Exalt Wallet first.");
      if (!swapAmount || Number(swapAmount) <= 0) return alert("Enter valid amount.");
      if (!selectedFromToken || !selectedToToken) return alert("Select tokens first.");
      if (selectedFromToken.id === selectedToToken.id) {
        return alert("Select different tokens.");
      }
if (
  selectedFromToken.marketOnly ||
  selectedFromToken.watchOnly ||
  selectedToToken.marketOnly ||
  selectedToToken.watchOnly
) {
  return alert(
    "Market/Watchlist coins cannot be swapped. Import the real contract token first."
  );
}
      if (selectedFromToken.chainKey !== selectedToToken.chainKey) {
        return alert("Cross-chain swap is not enabled yet.");
      }

      const swapChainKey = selectedFromToken.chainKey;
      const activeSigner = await getActiveSigner(swapChainKey);

      let result;

      if (selectedFromToken.native && !selectedToToken.native) {
        result = await swapNativeToToken({
          signer: activeSigner,
          tokenOut: selectedToToken,
          walletAddress: wallet,
          amount: swapAmount,
          chainKey: swapChainKey,
        });
      } else if (!selectedFromToken.native && selectedToToken.native) {
        result = await swapTokenToNative({
          signer: activeSigner,
          tokenIn: selectedFromToken,
          walletAddress: wallet,
          amount: swapAmount,
          chainKey: swapChainKey,
        });
      } else {
        alert("Token-to-token swap is coming next.");
        return;
      }

      setTxHistory(
        addLocalTx({
          type: "Swap",
          hash: result.hash,
          amount: swapAmount,
          coin: `${selectedFromToken.symbol}/${selectedToToken.symbol}`,
          status: "pending",
          wallet,
          chainKey: swapChainKey,
        })
      );

      showToast("Swap pending...");
      await result.tx.wait();

      updateLocalTxStatus(result.hash, "success");

      await saveWeb3TxToBackend(API, {
        type: "Swap",
        hash: result.hash,
        amount: swapAmount,
        coin: `${selectedFromToken.symbol}/${selectedToToken.symbol}`,
        status: "success",
        wallet,
        chain: selectedFromToken.network,
        chainKey: swapChainKey,
      });

      await loadBalances(wallet, swapChainKey);
      await loadHistory(wallet);

      setSwapAmount("");
      showToast("Swap completed.");
    } catch (err) {
      console.log(err);
      alert(err.message || "Swap failed.");
    }
  };

  const handleImportCustomToken = async () => {
    try {
      if (!customTokenAddress) return alert("Enter token contract address.");

      setTokenImporting(true);

      const token = await importCustomToken({
        address: customTokenAddress,
        chainKey: customTokenChain,
      });
      setTokenPreview(token);
      setCustomTokenAddress("");
      setShowImportToken(false);
      setActiveChain(token.chainKey);
      localStorage.setItem("exalt_active_chain", token.chainKey);

      await loadBalances(wallet, token.chainKey);

      showToast(`${token.symbol} imported successfully.`);
    } catch (err) {
      console.log(err);
      alert(err.message || "Token import failed.");
    } finally {
      setTokenImporting(false);
    }
  };

  const handleRemoveCustomToken = async (token) => {
    try {
      if (!token?.custom) return alert("Default token cannot be removed.");

      if (!window.confirm(`Remove ${token.symbol} from wallet?`)) return;

      removeCustomToken(token.id);
      await loadBalances(wallet, activeChain);

      showToast(`${token.symbol} removed.`);
    } catch (err) {
      console.log(err);
      alert(err.message || "Remove token failed.");
    }
  };
const handleFavoriteToken = (token) => {
  if (!token?.id) return;

  toggleFavoriteToken(token.id);
  showToast(`${token.symbol} favorite updated.`);
  setSelectedCoinDetails(null);

  setTimeout(() => {
    setSelectedCoinDetails({
      ...token,
      favorite: !token.favorite,
    });
  }, 50);
};

const handleHideToken = (token) => {
  if (!token?.id) return;

  if (!window.confirm(`Hide ${token.symbol} from wallet list?`)) return;

  hideTokenById(token.id);
  setSelectedCoinDetails(null);
  showToast(`${token.symbol} hidden from wallet.`);
};

const handleWatchlistToken = (token) => {
  if (!token?.id) return;

  toggleWatchlistToken(token.id);
  showToast(`${token.symbol} watchlist updated.`);
};
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const savedWallets = getSavedWallets();
    const active = getActiveWalletAddress();

    setWallets(savedWallets);
    if (active) setWallet(active);

    loadMarketPrices();

    if (active) {
      loadBalances(active, activeChain);
      loadHistory(active);
    }
  }, []);

  useEffect(() => {
    setTotalAssets(portfolioValue);
  }, [portfolioValue]);
  useEffect(() => {
  setAssetSettings(getAssetSettings());
  setPriceAlerts(getPriceAlerts());
  setAddressBook(getAddressBook());

  if (wallet) {
    setBackupStatus(getBackupStatus(wallet));
  }
}, [wallet]);

useEffect(() => {
  setHistoryStats(getHistoryStats(txHistory));
}, [txHistory]);

useEffect(() => {
  const result = checkPriceAlerts(prices);

  if (result.triggered.length > 0) {
    showToast(`${result.triggered.length} price alert triggered.`);
    setPriceAlerts(result.alerts);
  }
}, [prices]);
  useEffect(() => {
  if (!wallet) return;

  const interval = setInterval(() => {
    loadBalances(wallet, activeChain);
    loadHistory(wallet);
  }, 30000);

  return () => clearInterval(interval);
}, [wallet, activeChain]);
if (selectedCoinDetails) {
  
  return (
    <CoinDetails
      coin={selectedCoinDetails}
      balance={
        balances[getTokenBalanceKey(selectedCoinDetails)] || 0
      }
      price={
        prices[selectedCoinDetails.symbol] ||
        selectedCoinDetails.fallbackPrice ||
        0
      }
onBack={() => {
  setSelectedCoinDetails(null);
  setBottomTab("home");
  replayWelcome();
}}
      onSend={() => {
        setSendTokenId(selectedCoinDetails.id);
        setBottomTab("discover");
        setSelectedCoinDetails(null);
      }}
      onReceive={() => {
        setReceiveTokenId(selectedCoinDetails.id);
        setBottomTab("assets");
        setSelectedCoinDetails(null);
      }}
      onSwap={() => {
        setFromTokenId(selectedCoinDetails.id);
        setBottomTab("trade");
        setSelectedCoinDetails(null);
      }}
      onImport={() => {
        setShowImportToken(true);
        setSelectedCoinDetails(null);
      }}
      onFavorite={() => handleFavoriteToken(selectedCoinDetails)}
      onWatchlist={() => handleWatchlistToken(selectedCoinDetails)}
      onHide={() => handleHideToken(selectedCoinDetails)}
    />
  );
}
  return (
    <div className="ex-web3-page">
      <div className="ex-web3-phone">
        {showWelcome && (
        <div key={welcomeKey} className="ex-welcome-overlay">
            <img src={exchangeLogo} alt="Exalt Exchange" className="welcome-logo" />
            <h3>Welcome To</h3>
            <h1>Exalt Wallet</h1>
            <p>Multi-Chain • Private • Exalt Internal Wallet</p>
          </div>
        )}

        <div className="ex-web3-topbar">
          <button className="ex-icon-btn" onClick={() => setShowMenu(true)}>☰</button>
          <button className="ex-icon-btn" onClick={openSupport}>🎧</button>
<div className="ex-main-tabs">
  <button
    type="button"
    onClick={goExchange}
    onTouchStart={goExchange}
  >
    Exchange
  </button>

  <button type="button" className="active">
    Wallet
  </button>
</div>
         
          <button className="ex-icon-btn" onClick={startScanner}>⌗</button>
          <button className="ex-icon-btn" onClick={openSupport}>💬</button>
        </div>

        <div className="ex-search">
         <span>
  <b>{chain.name}</b>
  <small className="ex-network-badge">{chain.network}</small>
  <em>Exalt Multi-Chain Wallet</em>
</span>
          <button onClick={() => setShowImportToken(true)}>＋</button>
        </div>

        <div className="ex-chain-tabs">
          {chains.map((item) => (
            <button
              key={item.key}
              className={activeChain === item.key ? "active" : ""}
              onClick={() => changeChain(item.key)}
            >
              {item.shortName || item.symbol}
            </button>
          ))}
        </div>

        {!wallet ? (
          <div className="ex-welcome-card">
            <img src={exchangeLogo} alt="Exalt Exchange" />
            <p>Welcome to</p>
            <h1>
              Exalt Exchange <span>Wallet</span>
            </h1>
            <button onClick={() => setShowAddWallet(true)}>
              Create Exalt Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="ex-wallet-head">
              <div>
                <div className="ex-wallet-name">
                  <span>💼</span>
                  <button
                    className="ex-wallet-select-btn"
                    onClick={() => setShowMyWallets(true)}
                  >
                    {activeWalletName}⌄
                  </button>
                  <button onClick={() => setShowAddWallet(true)}>＋</button>
                </div>
<button className="ex-address-btn" onClick={copyAddress}>
  <span>{shortAddress(wallet)}</span>
  <span className="copy-icon">📋</span>
</button>
               
              </div>

              <button className="ex-receive-btn" onClick={() => setBottomTab("assets")}>
                Receive
              </button>
            </div>

            <div className="ex-balance-card">
             <div className="ex-balance-row">
  <h1>
    {hideBalance ? "••••••••" : formatUsd(totalAssets)}
  </h1>

  <button
    className="ex-eye-btn"
    onClick={() => {
      const next = !hideBalance;
      setHideBalance(next);
      localStorage.setItem("exalt_hide_balance", next);
    }}
  >
    {hideBalance ? "👁️" : "🙈"}
  </button>
</div>
              <p>{chain.name}</p>
            </div>
          </>
        )}

        <div className="ex-action-row">
          {[
            ["Receive", "⬇️"],
            ["Send", "⬆️"],
            ["Swap", "⇄"],
            ["History", "▧"],
            ["More", "🔳"],
          ].map(([label, icon]) => (
            <button
              key={label}
              onClick={() => {
                if (!wallet && label !== "More") {
                  setShowAddWallet(true);
                  return;
                }

                if (label === "Receive") setBottomTab("assets");
                if (label === "Send") setBottomTab("discover");
                if (label === "Swap") setBottomTab("trade");
                if (label === "History") setBottomTab("market");
                if (label === "More") setShowMore(true);
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="ex-promo-card">
          <div>
            <h3>Exalt Multi-Chain Wallet</h3>
            <p>Create wallet, import custom tokens, receive, send and swap supported assets.</p>
            <span onClick={() => setShowImportToken(true)}>Import Token ›</span>
          </div>
          <img src={exaltLogo} alt="EXALT" />
        </div>
        <div className="ex-holdings-head">
  <h3>Wallet Assets</h3>

  <button
    onClick={() => {
      if (!wallet) return setShowAddWallet(true);
      loadBalances(wallet, activeChain);
      loadHistory(wallet);
      showToast("Wallet refreshed.");
    }}
  >
    🔄 Refresh
  </button>
</div>
        <div className="ex-asset-tabs">
          {["holdings", "tokens", "history", "security"].map((tab) => (
            <button
              key={tab}
              className={assetTab === tab ? "active" : ""}
              onClick={() => {
                setAssetTab(tab);
                if (tab === "history") setBottomTab("market");
                if (tab === "tokens") setShowImportToken(true);
              }}
            >
              {tab === "holdings"
                ? "★ Holdings"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <input
          className="ex-web3-search-input"
          placeholder={`Search ${chain.name} tokens`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="ex-coin-list">
          {walletTokens.slice(0, 40).map((coin, index) => {
            const key = getTokenBalanceKey(coin);
            const balance =
              balances[key] ??
              balances[`${coin.chainKey}:${coin.symbol}`] ??
              balances[coin.symbol] ??
              0;

            const price =
              prices[key] ??
              prices[`${coin.chainKey}:${coin.symbol}`] ??
              prices[coin.symbol] ??
              coin.fallbackPrice ??
              0;

           return (
  <div
    className={`ex-coin-item ${coin.marketOnly ? "market-only" : ""}`}
    onClick={() => setSelectedCoinDetails(coin)}
  >
                <img
                  src={getTokenLogo(coin, exaltLogo)}
                  alt={coin.symbol}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                <div>
                  <strong>{coin.symbol}</strong>
                  <p>{buildTokenDisplayName(coin)}</p>
                </div>

                <div>
                 <strong>
  {hideBalance ? "••••" : formatTokenAmount(balance)}
</strong> 
                 <p>{hideBalance ? "••••" : `$${formatTokenPrice(price)}`}</p>
                  {coin.custom && (
                    <button
                      className="ex-token-mini-btn"
                      onClick={() => handleRemoveCustomToken(coin)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {showImportToken && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setShowImportToken(false)}>×</button>
            <h3>Import Custom Token</h3>
            <p>Add any supported EVM token by contract address.</p>

           <select
  value={customTokenChain}
  onChange={(e) => {
    setCustomTokenChain(e.target.value);
    setTokenPreview(null);
  }}
>
            
              {getImportableChains().map((item) => (
                <option key={item.key} value={item.key}>
                  {item.name} - {item.network}
                </option>
              ))}
            </select>

            <input
              placeholder="Token contract address"
              value={customTokenAddress}
             onChange={(e) => {
  setCustomTokenAddress(e.target.value);
  setTokenPreview(null);
}}
            />
{tokenPreview && (
  <div className="ex-token-preview">
    <strong>{tokenPreview.name}</strong>
    <p>Symbol: {tokenPreview.symbol}</p>
    <p>Decimals: {tokenPreview.decimals}</p>
    <p>Network: {tokenPreview.network}</p>
    <small>{tokenPreview.address}</small>
  </div>
)}
            <button disabled={tokenImporting} onClick={handleImportCustomToken}>
              {tokenImporting ? "Importing..." : "Import Token"}
            </button>
          </div>
        )}

        {bottomTab === "assets" && wallet && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setBottomTab("home")}>×</button>
            <h3>Receive {selectedReceiveToken?.symbol}</h3>

            <p className="ex-network-warning">
              {getTokenWarning(selectedReceiveToken?.symbol, selectedReceiveToken?.chainKey)}
            </p>
{selectedReceiveToken?.marketOnly && (
  <p className="ex-network-warning">
    This is a market/watchlist coin. Import the real contract token before receiving.
  </p>
)}
            <select
              value={selectedReceiveToken?.id || ""}
              onChange={(e) => setReceiveTokenId(e.target.value)}
            >
              {walletTokens.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.symbol} - {x.network}
                </option>
              ))}
            </select>

            <div className="ex-qr">
              <QRCode value={receiveAddress || wallet} size={170} />
            </div>

            <p>{receiveAddress || wallet}</p>

            <button onClick={() => copyToClipboard(receiveAddress || wallet)}>
              Copy Address
            </button>
            <button
  onClick={() => {
    const address = receiveAddress || wallet;

    if (navigator.share) {
      navigator.share({
        title: "Exalt Wallet Address",
        text: address,
      });
    } else {
      copyToClipboard(address);
      showToast("Address copied for sharing.");
    }
  }}
>
  Share Address
</button>

<button
  onClick={() => {
    const chainData = getChain(selectedReceiveToken?.chainKey || activeChain);
    window.open(`${chainData.explorer}/address/${receiveAddress || wallet}`, "_blank");
  }}
>
  Open Explorer
</button>
          </div>
        )}

        {bottomTab === "discover" && wallet && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setBottomTab("home")}>×</button>
            <h3>Send Crypto</h3>

            <select
              value={selectedSendToken?.id || ""}
              onChange={(e) => setSendTokenId(e.target.value)}
            >
              {walletTokens.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.symbol} - {x.network}
                </option>
              ))}
            </select>

            <input
              placeholder="Receiver wallet address"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
            />

            <input
              placeholder={`Amount ${selectedSendToken?.symbol || ""}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
<button
  type="button"
  className="ex-max-btn"
  onClick={() => {
    const key = getTokenBalanceKey(selectedSendToken);
    const available =
      balances[key] ??
      balances[`${selectedSendToken.chainKey}:${selectedSendToken.symbol}`] ??
      balances[selectedSendToken.symbol] ??
      0;

    setAmount(String(available));
  }}
>
  Max
</button>
            <button onClick={handleSend}>Send Now</button>
          </div>
        )}

        {bottomTab === "trade" && wallet && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setBottomTab("home")}>×</button>
            <h3>Swap</h3>

            <select
              value={selectedFromToken?.id || ""}
              onChange={(e) => setFromTokenId(e.target.value)}
            >
              {walletTokens.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.symbol} - {x.network}
                </option>
              ))}
            </select>

            <select
              value={selectedToToken?.id || ""}
              onChange={(e) => setToTokenId(e.target.value)}
            >
              {walletTokens.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.symbol} - {x.network}
                </option>
              ))}
            </select>

            <input
              placeholder="Amount"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
            />

            <button onClick={handleSwap}>Swap Now</button>
          </div>
        )}

      {bottomTab === "market" && (
  <div className="ex-modal-panel ex-history-panel">
    <button className="ex-close" onClick={() => setBottomTab("home")}>×</button>

    <div className="ex-history-head">
      <div>
        <h3>Transaction History</h3>
        <p>{txHistory.length} transaction{txHistory.length !== 1 ? "s" : ""}</p>
      </div>

      <button
        className="ex-history-refresh"
        onClick={() => {
          if (wallet) loadHistory(wallet);
          showToast("History refreshed.");
        }}
      >
        ↻
      </button>
    </div>

    {txHistory.length === 0 ? (
      <div className="ex-history-empty">
        <span>🧾</span>
        <strong>No transactions yet</strong>
        <p>Your Web3 send and swap records will appear here.</p>
      </div>
    ) : (
      txHistory.map((tx, i) => (
        <div className="ex-history-item pro" key={`${tx.hash || tx.id || i}`}>
          <div className="ex-history-top">
            <div className="ex-history-token">
              <span className="ex-history-token-icon">
                {tx.type === "Send" ? "↗" : tx.type === "Receive" ? "↙" : "⇄"}
              </span>

              <div>
                <strong>{tx.type} {tx.coin}</strong>
                <small>{timeAgo(tx.createdAt)}</small>
              </div>
            </div>

            <small className={`ex-status ${(tx.status || "success").toLowerCase()}`}>
              {tx.status || "success"}
            </small>
          </div>

          <div className="ex-history-amount">
            <strong>{tx.amount} {tx.coin}</strong>
            <span>{tx.chain || getChain(tx.chainKey || activeChain).network}</span>
          </div>

          <div className="ex-history-hash-box">
            <span>Tx Hash</span>
            <strong>{shortHash(tx.hash)}</strong>
          </div>

          <div className="ex-history-actions">
            <button
              onClick={() => {
                copyToClipboard(tx.hash || "");
                showToast("Transaction hash copied.");
              }}
            >
              📋 Copy
            </button>

            <button onClick={() => openExplorerTx(tx)}>
              🔗 Explorer
            </button>
          </div>
        </div>
      ))
    )}
  </div>
)}
              

        {showMenu && (
          <div className="ex-modal-panel ex-menu-panel">
            <button className="ex-close" onClick={() => setShowMenu(false)}>×</button>
            <h3>Menu</h3>
            <button onClick={() => setShowMyWallets(true)}>My Exalt Wallets</button>
            <button onClick={() => setShowImportToken(true)}>Import Token</button>
            <button onClick={openSupport}>Support Center</button>
            <button onClick={() => setBottomTab("market")}>Transactions</button>
            <button onClick={goExchange}>Go to Exchange</button>
          </div>
        )}

        {showMore && (
          <div className="ex-modal-panel ex-menu-panel">
            <button className="ex-close" onClick={() => setShowMore(false)}>×</button>
            <h3>More</h3>
            <button onClick={() => setShowSettings(true)}>Wallet Settings</button>
            <button onClick={() => setShowMyWallets(true)}>My Exalt Wallets</button>
            <button onClick={() => setShowAddWallet(true)}>Create / Import Wallet</button>
            <button onClick={() => setShowImportToken(true)}>Import Custom Token</button>
            <button onClick={startScanner}>Scan QR</button>
            <button onClick={openSupport}>Support</button>
          </div>
        )}
{showSettings && (
  <div className="ex-modal-panel ex-settings-panel">
    <button className="ex-close" onClick={() => setShowSettings(false)}>×</button>

    <div className="ex-settings-head">
      <h3>Wallet Settings</h3>
      <p>Manage your Exalt Wallet, security and activity.</p>
    </div>

    <div className="ex-settings-section">
      <span>Wallet</span>

      <button onClick={() => setShowMyWallets(true)}>
        <b>👛 Manage Wallets</b>
        <small>Switch, rename or remove wallets</small>
      </button>

      <button onClick={() => setShowAddWallet(true)}>
        <b>➕ Create Wallet</b>
        <small>Create a new Exalt Wallet</small>
      </button>

      <button onClick={() => setShowAddWallet(true)}>
        <b>📥 Import Wallet</b>
        <small>Import phrase or private key</small>
      </button>

      <button onClick={() => setBottomTab("assets")}>
        <b>⬇️ Receive</b>
        <small>Show wallet QR and address</small>
      </button>
    </div>

    <div className="ex-settings-section">
      <span>Tools</span>

     <button
  onClick={() => {
    setBottomTab("market");
    setAssetTab("history");
    setShowSettings(false);
    if (wallet) loadHistory(wallet);
  }}
>
  <b>📜 History</b>
  <small>View transactions and receipts</small>
</button>

      <button onClick={() => setShowAddressBook(true)}>
        <b>📒 Address Book</b>
        <small>Save trusted wallet addresses</small>
      </button>

      <button onClick={() => setShowPriceAlerts(true)}>
        <b>🔔 Price Alerts</b>
        <small>Create token price notifications</small>
      </button>

      <button onClick={() => setShowImportToken(true)}>
        <b>🪙 Import Token</b>
        <small>Add custom BEP20/ERC20 token</small>
      </button>
    </div>

    <div className="ex-settings-section">
      <span>Security</span>

      <button onClick={() => setShowBackup(true)}>
        <b>🔐 Wallet Backup</b>
        <small>Backup and verify wallet safety</small>
      </button>

      <button onClick={() => {
        const next = !hideBalance;
        setHideBalance(next);
        localStorage.setItem("exalt_hide_balance", next);
      }}>
        <b>{hideBalance ? "👁 Show Balances" : "🙈 Hide Balances"}</b>
        <small>Privacy mode for portfolio value</small>
      </button>

      <button onClick={copyAddress}>
        <b>📋 Copy Active Wallet</b>
        <small>{shortAddress(wallet)}</small>
      </button>
    </div>
  </div>
)}

         {showManage && (
  <div className="ex-modal-panel ex-menu-panel">
    <button className="ex-close" onClick={() => setShowManage(false)}>×</button>

    <h3>Manage Assets</h3>

    <button
      onClick={() => {
        const next = !assetSettings.hideZeroBalances;
        const updated = setHideZeroBalances(next);
        setAssetSettings(updated);
        showToast(next ? "Zero balances hidden." : "Zero balances visible.");
      }}
    >
      {assetSettings.hideZeroBalances ? "Show Zero Balances" : "Hide Zero Balances"}
    </button>

    <button
      onClick={() => {
        const updated = setAssetSortBy("value");
        setAssetSettings(updated);
        showToast("Sorted by value.");
      }}
    >
      Sort by Value
    </button>

    <button
      onClick={() => {
        const updated = setAssetSortBy("name");
        setAssetSettings(updated);
        showToast("Sorted by name.");
      }}
    >
      Sort by Name
    </button>

    <button
      onClick={() => {
        const updated = setAssetSortBy("balance");
        setAssetSettings(updated);
        showToast("Sorted by balance.");
      }}
    >
      Sort by Balance
    </button>

    <button
      onClick={() => {
        const updated = restoreHiddenTokens();
        setAssetSettings(updated);
        showToast("Hidden tokens restored.");
      }}
    >
      Restore Hidden Tokens
    </button>

    <button onClick={() => setShowImportToken(true)}>
      Import Custom Token
    </button>
  </div>
)}
{showAddressBook && (
  <div className="ex-modal-panel ex-menu-panel">
    <button
      className="ex-close"
      onClick={() => setShowAddressBook(false)}
    >
      ×
    </button>

    <h3>Address Book</h3>

    {addressBook.length === 0 ? (
      <p>No saved addresses yet.</p>
    ) : (
      addressBook.map((item) => (
        <div className="ex-manage-row" key={item.id}>
          <div>
            <strong>{item.name}</strong>
            <small>{shortAddress(item.address)} • {item.network}</small>
          </div>

          <button onClick={() => setSendTo(item.address)}>
            Use
          </button>

          <button
            onClick={() => {
              const updated = toggleAddressFavorite(item.id);
              setAddressBook(updated);
            }}
          >
            {item.favorite ? "★" : "☆"}
          </button>

          <button
            onClick={() => {
              const updated = deleteAddressBookContact(item.id);
              setAddressBook(updated);
              showToast("Address deleted.");
            }}
          >
            Delete
          </button>
        </div>
      ))
    )}

    <button
      onClick={() => {
        const name = prompt("Contact name");
        const address = prompt("Wallet address");

        if (!name || !address) return;

        try {
          const updated = addAddressBookContact({
            name,
            address,
            network: chain.network,
            chainKey: activeChain,
          });

          setAddressBook(updated);
          showToast("Address saved.");
        } catch (err) {
          alert(err.message || "Address save failed.");
        }
      }}
    >
      Add New Address
    </button>
  </div>
)}
{showBackup && (
  <div className="ex-modal-panel ex-menu-panel">
    <button
      className="ex-close"
      onClick={() => setShowBackup(false)}
    >
      ×
    </button>

    <h3>Wallet Backup</h3>

    <p>
      Backup status:
      <strong>
        {backupStatus?.completed ? " ✅ Completed" : " ❌ Not Backed Up"}
      </strong>
    </p>

   <button
  onClick={() => {
    const updated = markWalletBackedUp(wallet);
    setBackupStatus(updated);
    showToast("Wallet marked as backed up.");
  }}
>
  Mark as Backed Up
</button>

<button
  onClick={() => {
    const updated = markWalletVerified(wallet);
    setBackupStatus(updated);
    showToast("Wallet backup verified.");
  }}
>
  Verify Backup
</button>

<button
  onClick={() => {
    const updated = dismissBackupReminder(wallet);
    setBackupStatus(updated);
    showToast("Backup reminder dismissed.");
  }}
>
  Dismiss Reminder
</button>
  </div>
)}
{showPriceAlerts && (
  <div className="ex-modal-panel ex-menu-panel">
    <button
      className="ex-close"
      onClick={() => setShowPriceAlerts(false)}
    >
      ×
    </button>

    <h3>Price Alerts</h3>

    {!priceAlerts.length ? (
      <p>No active price alerts.</p>
    ) : (
      priceAlerts.map((alert) => (
        <div className="ex-manage-row" key={alert.id}>
          <div>
            <strong>{alert.symbol}</strong>
            <small>
              {alert.condition} ${alert.targetPrice}
            </small>
          </div>

          <button
            onClick={() => {
              const updated =deletePriceAlert(alert.id);
              setPriceAlerts(updated);
              showToast("Alert removed.");
            }}
          >
            Delete
          </button>
        </div>
      ))
    )}

    <button
      onClick={() => {
        const symbol = prompt("Token Symbol");
        const target = Number(prompt("Target Price"));
        const condition = prompt("above / below");

        if (!symbol || !target || !condition) return;

        const updated = addPriceAlert({
          symbol: symbol.toUpperCase(),
          targetPrice: target,
          condition,
        });

        setPriceAlerts(updated);
        showToast("Price Alert Added.");
      }}
    >
      Add Price Alert
    </button>
  </div>
)}
        {showSupport && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setShowSupport(false)}>×</button>
            <h3>Support Center</h3>
            <p>Need help with Exalt Wallet, token import, receive, send, swap, or transaction?</p>

            <textarea
              className="ex-support-textarea"
              placeholder="Write your issue here..."
              value={supportMsg}
              onChange={(e) => setSupportMsg(e.target.value)}
            />

            <button onClick={submitSupport}>Submit Support Request</button>
          </div>
        )}

        {showScanner && (
          <div className="ex-wallets-screen">
            <div className="ex-wallets-top">
              <button onClick={stopScanner}>‹</button>
              <h3>QR Scanner</h3>
              <span />
            </div>

            <div className="ex-scanner-box">
              <video ref={videoRef} className="ex-scanner-video" />
              <p>Scan wallet address QR code.</p>
            </div>
          </div>
        )}

        {showMyWallets && (
          <div className="ex-wallets-screen">
            <div className="ex-wallets-top">
              <button onClick={() => setShowMyWallets(false)}>‹</button>
              <h3>My Exalt Wallets</h3>
              <button onClick={() => setShowAddWallet(true)}>Manage</button>
            </div>

            <div className="ex-wallets-portfolio">
              <span>Portfolio ›</span>
              <h1>{formatUsd(totalAssets)}</h1>
            </div>

            <h4>Exalt Wallets</h4>

            {wallets.length === 0 ? (
              <p>No wallets added yet.</p>
            ) : (
              wallets.map((w) => (
                <div
                  key={w.id || w.address}
                  className={`ex-wallet-list-row ${
                    wallet?.toLowerCase() === w.address?.toLowerCase() ? "active" : ""
                  }`}
                >
                  <div onClick={() => switchWallet(w.address)}>
                    <strong>{w.name}</strong>
                    <p>{shortAddress(w.address)}</p>
                    <small>{w.type || "Exalt Wallet"}</small>
                  </div>

                  <span>✓</span>

                  <button onClick={() => renameWallet(w.address)}>Rename</button>
                  <button onClick={() => removeWallet(w.address)}>Remove</button>
                </div>
              ))
            )}

            <button className="ex-add-wallet-main" onClick={() => setShowAddWallet(true)}>
              Create / Import Wallet
            </button>
          </div>
        )}

        {showAddWallet && (
          <div className="ex-wallets-screen">
            <div className="ex-wallets-top">
              <button onClick={() => setShowAddWallet(false)}>‹</button>
              <h3>Exalt Wallet Setup</h3>
              <span />
            </div>

            <div className="ex-add-wallet-card">
              <h3>Create Exalt Wallet</h3>
              <p>Create your own secure Exalt Wallet with a 12-word recovery phrase.</p>
              <button onClick={createWallet}>Create Exalt Wallet</button>
              <div className="ex-security-card">
  <h3>🔐 Security Reminder</h3>

  <ul>
    <li>Never share your 12-word recovery phrase.</li>
    <li>Exalt Exchange can never recover your wallet.</li>
    <li>Store your backup offline.</li>
    <li>Anyone with your phrase can access your funds.</li>
  </ul>

  <button
    className="ex-security-btn"
    onClick={() => setShowPhrase(true)}
  >
    View Recovery Phrase
  </button>
</div>
            </div>

            <div className="ex-add-wallet-card">
              <h3>Import Exalt Wallet</h3>
              <p>Import using 12-word recovery phrase or private key.</p>
              <textarea
                placeholder="12-word recovery phrase or private key"
                value={importValue}
                onChange={(e) => setImportValue(e.target.value)}
              />
              <button onClick={importWallet}>Import Wallet</button>
            </div>
          </div>
        )}

        {showPhrase && (
          <div className="ex-modal-panel ex-seed-warning">
            <button className="ex-close" onClick={() => setShowPhrase("")}>×</button>
            <h3>Recovery Phrase</h3>
            <p>Save these 12 words safely. Anyone with this phrase can access the wallet.</p>
            <div className="ex-seed-box">{showPhrase}</div>
            <button onClick={() => copyToClipboard(showPhrase)}>Copy Phrase</button>
          </div>
        )}
        {lastReceipt && (
  <div className="ex-modal-panel ex-receipt-panel">
    <button className="ex-close" onClick={() => setLastReceipt(null)}>×</button>

    <div className="ex-receipt-success">✅</div>

    <h3>Transaction Successful</h3>
    <p className="ex-receipt-subtitle">
      Your {lastReceipt.type} transaction has been confirmed.
    </p>

    <div className="ex-receipt-row">
      <span>Type</span>
      <strong>{lastReceipt.type}</strong>
    </div>

    <div className="ex-receipt-row">
      <span>Amount</span>
      <strong>{lastReceipt.amount} {lastReceipt.coin}</strong>
    </div>

    <div className="ex-receipt-row">
      <span>Network</span>
      <strong>{lastReceipt.chain || lastReceipt.chainKey}</strong>
    </div>

    <div className="ex-receipt-hash">
      <span>Transaction Hash</span>
      <small>{lastReceipt.hash}</small>
    </div>

    <button
      onClick={() => copyToClipboard(lastReceipt.hash)}
    >
      Copy Hash
    </button>

    <button
      onClick={() => {
        const chainData = getChain(lastReceipt.chainKey || activeChain);
        window.open(`${chainData.explorer}/tx/${lastReceipt.hash}`, "_blank");
      }}
    >
      View on Explorer
    </button>

    <button
      onClick={() => {
        if (navigator.share) {
          navigator.share({
            title: "Exalt Wallet Transaction",
            text: `${lastReceipt.type} ${lastReceipt.amount} ${lastReceipt.coin}\nHash: ${lastReceipt.hash}`,
          });
        } else {
          copyToClipboard(lastReceipt.hash);
          showToast("Hash copied for sharing.");
        }
      }}
    >
      Share Receipt
    </button>
  </div>
)}

        {message && <div className="ex-web3-toast">{message}</div>}

        <div className="ex-bottom-nav">
          {[
            ["home", "Home", "⌂"],
            ["market", "Markets", "▧"],
            ["trade", "Trade", "⇄"],
            ["discover", "Discover", "◉"],
            ["assets", "Assets", "▣"],
          ].map(([key, label, icon]) => (
            <button
              key={key}
              className={bottomTab === key ? "active" : ""}
              onClick={() => {
                if (!wallet && key !== "home") {
                  setShowAddWallet(true);
                  return;
                }

                setBottomTab(key);
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Web3Wallet;
