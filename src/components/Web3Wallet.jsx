import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { ethers } from "ethers";
import exaltLogo from "../assets/exalt-coin.png";
import exchangeLogo from "../assets/exalt-exchange-logo.png";
import "./Web3Wallet.css";

import { DEFAULT_TOKENS, BSC_CHAIN } from "../web3/web3Config";

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
  swapBnbToToken,
  swapTokenToBnb,
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
  getTokenBySymbol,
  getReceiveAddressForToken,
  getTokenWarning,
  formatTokenAmount,
  formatTokenPrice,
  searchTokens,
} from "../web3/tokens";

import {
  formatUsd,
  calculatePortfolio,
  copyToClipboard,
  isValidAddress,
} from "../web3/utils";

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

  const [assetTab, setAssetTab] = useState("holdings");
  const [bottomTab, setBottomTab] = useState("home");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);

  const [showMenu, setShowMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showMyWallets, setShowMyWallets] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showPhrase, setShowPhrase] = useState("");
  const [showSupport, setShowSupport] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [sendTo, setSendTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sendCoin, setSendCoin] = useState("BNB");

  const [receiveCoin, setReceiveCoin] = useState("BNB");

  const [fromCoin, setFromCoin] = useState("BNB");
  const [toCoin, setToCoin] = useState("EXALT");
  const [swapAmount, setSwapAmount] = useState("");

  const [txHistory, setTxHistory] = useState([]);
  const [importValue, setImportValue] = useState("");
  const [supportMsg, setSupportMsg] = useState("");

  const activeWallet = useMemo(
    () => findWallet(wallets, wallet),
    [wallets, wallet]
  );

  const activeWalletName = activeWallet?.name || "Exalt Wallet";

  const selectedReceiveToken = useMemo(
    () => getTokenBySymbol(receiveCoin),
    [receiveCoin]
  );

  const visibleTokens = useMemo(() => {
    return searchTokens(DEFAULT_TOKENS, search);
  }, [search]);

  const portfolioValue = useMemo(() => {
    return calculatePortfolio(DEFAULT_TOKENS, balances, prices);
  }, [balances, prices]);

  const showToast = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3500);
  };

  const syncWalletState = (nextWallets, activeAddress = "") => {
    const saved = saveWallets(nextWallets, activeAddress);
    setWallets(saved);

    if (activeAddress) {
      setWallet(activeAddress);
      setActiveWallet(activeAddress);
    }
  };

  const loadBalances = async (address = wallet) => {
    try {
      if (!address) return;

      const result = await getAllBalances(address);
      setBalances(result);

      const total = calculatePortfolio(DEFAULT_TOKENS, result, prices);
      setTotalAssets(total);
    } catch (err) {
      console.log("Web3 balance error:", err);
    }
  };

  const loadHistory = async (address = wallet) => {
    try {
      if (!address) return;

      const history = await loadWeb3HistoryFromBackend(API, address);
      setTxHistory(history);
    } catch (err) {
      console.log("History error:", err);
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

      await loadBalances(result.wallet.address);

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

      await loadBalances(imported.address);

      showToast("Exalt Wallet imported.");
    } catch (err) {
      console.log(err);
      alert(err.message || "Import failed.");
    }
  };
  const switchWallet = async (address) => {
    syncWalletState(wallets, address);
    await loadBalances(address);
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
      loadBalances(nextActive);
      loadHistory(nextActive);
    } else {
      setBalances({});
      setTotalAssets(0);
      setWallet("");
    }
  };

  const copyAddress = () => {
    if (!wallet) return alert("Create or import Exalt Wallet first.");
    copyToClipboard(wallet);
    showToast("Wallet address copied.");
  };

  const goExchange = () => {
    if (setPage) setPage("trade");
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

  const getActiveSigner = async () => {
    if (!activeWallet?.privateKey) {
      throw new Error("Please create or import Exalt Wallet first.");
    }

    const provider = new ethers.JsonRpcProvider(BSC_CHAIN.rpc);
    return new ethers.Wallet(activeWallet.privateKey, provider);
  };

  const handleSend = async () => {
    try {
      if (!wallet) return alert("Create or import Exalt Wallet first.");
      if (!isValidAddress(sendTo)) return alert("Invalid BSC address.");
      if (!amount || Number(amount) <= 0) return alert("Enter valid amount.");

      const activeSigner = await getActiveSigner();

      const tx = await sendToken({
        signer: activeSigner,
        tokenSymbol: sendCoin,
        to: sendTo,
        amount,
      });

      setTxHistory(
        addLocalTx({
          type: "Send",
          hash: tx.hash,
          amount,
          coin: sendCoin,
          status: "pending",
          wallet,
        })
      );

      showToast("Transaction pending...");
      await tx.wait();

      updateLocalTxStatus(tx.hash, "success");

      await saveWeb3TxToBackend(API, {
        type: "Send",
        hash: tx.hash,
        amount,
        coin: sendCoin,
        status: "success",
        wallet,
      });

      await loadBalances(wallet);
      await loadHistory(wallet);

      setSendTo("");
      setAmount("");
      showToast("Transaction confirmed.");
    } catch (err) {
      console.log(err);
      alert(err.message || "Send failed.");
    }
  };

  const handleSwap = async () => {
    try {
      if (!wallet) return alert("Create or import Exalt Wallet first.");
      if (!swapAmount || Number(swapAmount) <= 0) return alert("Enter valid amount.");
      if (fromCoin === toCoin) return alert("Select different coins.");

      const activeSigner = await getActiveSigner();

      let tx;

      if (fromCoin === "BNB") {
        tx = await swapBnbToToken({
          signer: activeSigner,
          tokenOutSymbol: toCoin,
          walletAddress: wallet,
          amount: swapAmount,
        });
      } else if (toCoin === "BNB") {
        tx = await swapTokenToBnb({
          signer: activeSigner,
          tokenInSymbol: fromCoin,
          walletAddress: wallet,
          amount: swapAmount,
        });
      } else {
        alert("Token-to-token swap coming soon.");
        return;
      }

      setTxHistory(
        addLocalTx({
          type: "Swap",
          hash: tx.hash,
          amount: swapAmount,
          coin: `${fromCoin}/${toCoin}`,
          status: "pending",
          wallet,
        })
      );

      showToast("Swap pending...");
      await tx.wait();

      updateLocalTxStatus(tx.hash, "success");

      await saveWeb3TxToBackend(API, {
        type: "Swap",
        hash: tx.hash,
        amount: swapAmount,
        coin: toCoin,
        status: "success",
        wallet,
      });

      await loadBalances(wallet);
      await loadHistory(wallet);

      setSwapAmount("");
      showToast("Swap completed.");
    } catch (err) {
      console.log(err);
      alert(err.message || "Swap failed.");
    }
  };

  const receiveAddress = getReceiveAddressForToken(receiveCoin, wallet);

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
      loadBalances(active);
      loadHistory(active);
    }
  }, []);

  useEffect(() => {
    setTotalAssets(portfolioValue);
  }, [portfolioValue]);
  return (
    <div className="ex-web3-page">
      <div className="ex-web3-phone">
        {showWelcome && (
          <div className="ex-welcome-overlay">
            <img src={exchangeLogo} alt="Exalt Exchange" className="welcome-logo" />
            <h3>Welcome To</h3>
            <h1>Exalt Wallet</h1>
            <p>Secure • Private • Exalt Internal Wallet</p>
          </div>
        )}

        <div className="ex-web3-topbar">
          <button className="ex-icon-btn" onClick={() => setShowMenu(true)}>☰</button>
          <button className="ex-icon-btn" onClick={openSupport}>🎧</button>

          <div className="ex-main-tabs">
            <button onClick={goExchange}>Exchange</button>
            <button className="active">Wallet</button>
          </div>

          <button className="ex-icon-btn" onClick={startScanner}>⌗</button>
          <button className="ex-icon-btn" onClick={openSupport}>💬</button>
        </div>

        <div className="ex-search">
          <span>BNB Smart Chain • Exalt Wallet</span>
          <button>⌕</button>
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
                  {shortAddress(wallet)} 📋
                </button>
              </div>

              <button className="ex-receive-btn" onClick={() => setBottomTab("assets")}>
                Receive
              </button>
            </div>

            <div className="ex-balance-card">
              <h1>{formatUsd(totalAssets)}</h1>
              <p>{BSC_CHAIN.name}</p>
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
            <h3>Exalt Wallet</h3>
            <p>Create your own wallet, backup phrase, receive, send and swap BSC assets.</p>
            <span onClick={goExchange}>Open Exchange ›</span>
          </div>
          <img src={exaltLogo} alt="EXALT" />
        </div>

        <div className="ex-asset-tabs">
          {["holdings", "tokens", "history", "security"].map((tab) => (
            <button
              key={tab}
              className={assetTab === tab ? "active" : ""}
              onClick={() => {
                setAssetTab(tab);
                if (tab === "history") setBottomTab("market");
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
          placeholder="Search coins"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="ex-coin-list">
          {visibleTokens.slice(0, 25).map((coin, index) => {
            const symbol = String(coin.symbol || "COIN").toUpperCase();
            const balance = balances[symbol] || 0;
            const price = Number(prices[symbol] || coin.fallbackPrice || 0);

            return (
              <div className="ex-coin-item" key={`${symbol}-${index}`}>
                <img
                  src={coin.logoType === "local-exalt" ? exaltLogo : coin.logo}
                  alt={symbol}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                <div>
                  <strong>{symbol}</strong>
                  <p>{coin.name || symbol}</p>
                </div>

                <div>
                  <strong>{formatTokenAmount(balance)}</strong>
                  <p>${formatTokenPrice(price)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {bottomTab === "assets" && wallet && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setBottomTab("home")}>×</button>
            <h3>Receive {receiveCoin}</h3>

            <p className="ex-network-warning">
              {getTokenWarning(receiveCoin)}
            </p>

            <select value={receiveCoin} onChange={(e) => setReceiveCoin(e.target.value)}>
              {DEFAULT_TOKENS.map((x) => (
                <option key={x.symbol} value={x.symbol}>
                  {x.symbol} - {x.chain?.toUpperCase?.() || "BSC"}
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
          </div>
        )}

        {bottomTab === "discover" && wallet && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setBottomTab("home")}>×</button>
            <h3>Send Crypto</h3>

            <select value={sendCoin} onChange={(e) => setSendCoin(e.target.value)}>
              {DEFAULT_TOKENS.map((x) => (
                <option key={x.symbol} value={x.symbol}>{x.symbol}</option>
              ))}
            </select>

            <input
              placeholder="Receiver BSC address"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
            />

            <input
              placeholder={`Amount ${sendCoin}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <button onClick={handleSend}>Send Now</button>
          </div>
        )}

        {bottomTab === "trade" && wallet && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setBottomTab("home")}>×</button>
            <h3>Swap</h3>

            <select value={fromCoin} onChange={(e) => setFromCoin(e.target.value)}>
              <option>BNB</option>
              <option>USDT</option>
              <option>EXALT</option>
            </select>

            <select value={toCoin} onChange={(e) => setToCoin(e.target.value)}>
              <option>EXALT</option>
              <option>USDT</option>
              <option>BNB</option>
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
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setBottomTab("home")}>×</button>
            <h3>Transaction History</h3>

            {txHistory.length === 0 ? (
              <p>No transactions yet.</p>
            ) : (
              txHistory.map((tx, i) => (
                <div className="ex-history-item" key={`${tx.hash || tx.id || i}`}>
                  <strong>{tx.type} {tx.coin}</strong>
                  <span>{tx.amount}</span>
                  {tx.hash && (
                    <a href={tx.explorer} target="_blank" rel="noreferrer">
                      BscScan
                    </a>
                  )}
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
            <button onClick={openSupport}>Support Center</button>
            <button onClick={() => setBottomTab("market")}>Transactions</button>
            <button onClick={goExchange}>Go to Exchange</button>
          </div>
        )}

        {showMore && (
          <div className="ex-modal-panel ex-menu-panel">
            <button className="ex-close" onClick={() => setShowMore(false)}>×</button>
            <h3>More</h3>
            <button onClick={() => setShowMyWallets(true)}>My Exalt Wallets</button>
            <button onClick={() => setShowAddWallet(true)}>Create / Import Wallet</button>
            <button onClick={startScanner}>Scan QR</button>
            <button onClick={openSupport}>Support</button>
          </div>
        )}

        {showSupport && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setShowSupport(false)}>×</button>
            <h3>Support Center</h3>
            <p>Need help with Exalt Wallet, receive, send, swap, or transaction?</p>

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