import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { ethers } from "ethers";
import exaltLogo from "../assets/exalt-coin.png";
import exchangeLogo from "../assets/exalt-exchange-logo.png";
import "./Web3Wallet.css";

function Web3Wallet({ setPage }) {
  const API_BASE =
    import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
  const API = API_BASE.endsWith("/api")
    ? API_BASE.replace("/api", "")
    : API_BASE;

  const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  const EXALT = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";
  const USDT = "0x55d398326f99059fF775485246999027B3197955";

  const TOKEN_ABI = [
    "function approve(address spender,uint256 amount) external returns(bool)",
    "function decimals() view returns(uint8)",
    "function transfer(address to,uint256 amount) external returns(bool)",
    "function balanceOf(address account) view returns(uint256)",
  ];

  const ROUTER_ABI = [
    "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) external payable",
    "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external",
  ];

  const DEFAULT_TOKENS = [
    {
      symbol: "BNB",
      name: "BNB",
      address: WBNB,
      fallbackPrice: 650,
      logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      address: USDT,
      fallbackPrice: 1,
      logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
    },
    {
      symbol: "EXALT",
      name: "Exalt Coin",
      address: EXALT,
      fallbackPrice: 0,
      logo: exaltLogo,
    },
    {
      symbol: "BTCB",
      name: "Bitcoin BEP20",
      address: "0x7130d2A12B9BCbF4fF2634d864A1Ee1Ce3Ead9c",
      fallbackPrice: 103000,
      logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    },
    {
      symbol: "ETH",
      name: "Ethereum BEP20",
      address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      fallbackPrice: 2400,
      logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    },
    {
      symbol: "CAKE",
      name: "PancakeSwap",
      address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
      fallbackPrice: 2.5,
      logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/7186.png",
    },
  ];

  const [wallet, setWallet] = useState("");
  const [wallets, setWallets] = useState([]);
  const [balances, setBalances] = useState({});
  const [bnbBalance, setBnbBalance] = useState("0.0000");
  const [totalAssets, setTotalAssets] = useState("0.00");
  const [coins, setCoins] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [mainTab, setMainTab] = useState("wallet");
  const [bottomTab, setBottomTab] = useState("home");
  const [assetTab, setAssetTab] = useState("holdings");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [sendTo, setSendTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sendCoin, setSendCoin] = useState("BNB");
  const [receiveCoin, setReceiveCoin] = useState("BNB");
  const [fromCoin, setFromCoin] = useState("BNB");
  const [toCoin, setToCoin] = useState("EXALT");
  const [swapAmount, setSwapAmount] = useState("");
  const [txHistory, setTxHistory] = useState([]);

  const shortAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet";

  const getTokenAddress = (symbol) => {
    if (symbol === "BNB") return WBNB;
    if (symbol === "USDT") return USDT;
    if (symbol === "EXALT") return EXALT;
    return DEFAULT_TOKENS.find((x) => x.symbol === symbol)?.address || EXALT;
  };

  const getTokenPrice = (symbol) => {
    const live = Number(livePrices[symbol] || 0);
    if (live > 0) return live;
    return DEFAULT_TOKENS.find((x) => x.symbol === symbol)?.fallbackPrice || 0;
  };

  const getCoinLogo = (coin) => {
    const symbol = String(coin?.symbol || "").toUpperCase();
    if (symbol === "EXALT") return exaltLogo;
    return (
      coin?.logo ||
      coin?.image ||
      coin?.icon ||
      `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`
    );
  };

  const switchToBSC = async () => {
    if (!window.ethereum) throw new Error("Wallet not found");

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x38",
              chainName: "BNB Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: ["https://bsc-dataseed.binance.org/"],
              blockExplorerUrls: ["https://bscscan.com"],
            },
          ],
        });
      } else {
        throw err;
      }
    }
  };

  const loadCoins = async () => {
    try {
      const res = await fetch(`${API}/api/coins/all-market`);
      const data = await res.json();
      const list = Array.isArray(data.coins) ? data.coins : [];
      setCoins(list);

      const prices = {};
      list.forEach((coin) => {
        const symbol = String(coin.symbol || "").toUpperCase();
        const price = Number(coin.priceUsd || 0);
        if (symbol && price > 0) prices[symbol] = price;
      });

      setLivePrices((prev) => ({ ...prev, ...prices }));
    } catch (error) {
      console.log("Coins load error:", error);
    }
  };

  const loadBalances = async (walletAddress) => {
    try {
      if (!window.ethereum || !walletAddress) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const newBalances = {};
      let total = 0;

      for (const token of DEFAULT_TOKENS) {
        try {
          if (token.symbol === "BNB") {
            const raw = await provider.getBalance(walletAddress);
            const value = Number(ethers.formatEther(raw));
            newBalances.BNB = value.toFixed(4);
            setBnbBalance(value.toFixed(5));
            total += value * getTokenPrice("BNB");
            continue;
          }

          const contract = new ethers.Contract(token.address, TOKEN_ABI, provider);
          const raw = await contract.balanceOf(walletAddress);
          const decimals = await contract.decimals();
          const value = Number(ethers.formatUnits(raw, decimals));

          newBalances[token.symbol] =
            value > 0 && value < 0.0001 ? value.toFixed(8) : value.toFixed(4);

          total += value * getTokenPrice(token.symbol);
        } catch {
          newBalances[token.symbol] = "0.0000";
        }
      }

      setBalances(newBalances);
      setTotalAssets(total.toFixed(2));
    } catch (error) {
      console.log("Balance error:", error);
    }
  };

  const loadMongoHistory = async (walletAddress) => {
    try {
      if (!walletAddress) return;
      const res = await fetch(`${API}/api/web3-transactions/${walletAddress}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.transactions)) {
        const formatted = data.transactions.map((tx) => ({
          type: tx.type,
          hash: tx.hash,
          amount: tx.amount,
          coin: tx.coin,
          status: tx.status || "success",
          time: tx.createdAt
            ? new Date(tx.createdAt).toLocaleString()
            : new Date().toLocaleString(),
        }));

        setTxHistory(formatted);
        localStorage.setItem("exalt_tx_history", JSON.stringify(formatted));
      }
    } catch (error) {
      console.log("History error:", error);
    }
  };

  const saveTx = async (type, hash, amountValue, coin) => {
    const txItem = {
      type,
      hash,
      amount: amountValue,
      coin,
      status: "success",
      time: new Date().toLocaleString(),
    };

    const updated = [txItem, ...txHistory];
    setTxHistory(updated);
    localStorage.setItem("exalt_tx_history", JSON.stringify(updated));

    try {
      await fetch(`${API}/api/web3-transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: wallet?.toLowerCase(),
          type: type.includes("Send")
            ? "Send"
            : type.includes("Receive")
            ? "Receive"
            : "Swap",
          coin,
          amount: Number(amountValue),
          hash,
          status: "success",
          chain: "BSC",
          source: "web3-wallet",
        }),
      });
    } catch (error) {
      console.log("Save tx error:", error);
    }
  };

  const connectWeb3 = async () => {
    try {
      if (!window.ethereum) {
        alert("Please open inside Binance Wallet, Trust Wallet, MetaMask, or wallet browser.");
        return;
      }

      await switchToBSC();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (!accounts?.length) {
        alert("No wallet account found.");
        return;
      }

      const address = accounts[0];
      const savedWallets = JSON.parse(localStorage.getItem("exalt_web3_wallets") || "[]");
      const exists = savedWallets.some(
        (w) => w.address.toLowerCase() === address.toLowerCase()
      );

      const nextWallets = exists
        ? savedWallets
        : [
            ...savedWallets,
            {
              id: Date.now(),
              name: `My Wallet ${savedWallets.length + 1}`,
              address,
            },
          ].slice(0, 6);

      setWallet(address);
      setWallets(nextWallets);
      localStorage.setItem("web3_wallet", address);
      localStorage.setItem("exalt_web3_wallets", JSON.stringify(nextWallets));

      await loadCoins();
      await loadBalances(address);
      await loadMongoHistory(address);
    } catch (error) {
      console.log(error);
      alert("Wallet connection failed.");
    }
  };

  const switchWallet = async (address) => {
    setWallet(address);
    localStorage.setItem("web3_wallet", address);
    await loadBalances(address);
    await loadMongoHistory(address);
  };

  const removeWallet = (address) => {
    const next = wallets.filter(
      (w) => w.address.toLowerCase() !== address.toLowerCase()
    );

    setWallets(next);
    localStorage.setItem("exalt_web3_wallets", JSON.stringify(next));

    if (wallet.toLowerCase() === address.toLowerCase()) {
      const first = next[0]?.address || "";
      setWallet(first);
      localStorage.setItem("web3_wallet", first);
    }
  };

  const renameWallet = (address) => {
    const newName = prompt("Enter wallet name");
    if (!newName) return;

    const next = wallets.map((w) =>
      w.address.toLowerCase() === address.toLowerCase()
        ? { ...w, name: newName }
        : w
    );

    setWallets(next);
    localStorage.setItem("exalt_web3_wallets", JSON.stringify(next));
  };

  const copyAddress = () => {
    if (!wallet) return alert("Wallet not connected.");
    navigator.clipboard.writeText(wallet);
    alert("Wallet address copied.");
  };

  const sendBNB = async () => {
    try {
      if (!wallet) return alert("Connect wallet first.");
      if (!sendTo || !amount) return alert("Enter receiver address and amount.");

      await switchToBSC();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: sendTo,
        value: ethers.parseEther(amount),
      });

      setMessage("Transaction pending...");
      await tx.wait();

      await saveTx("Send BNB", tx.hash, amount, "BNB");
      await loadBalances(wallet);
      setMessage(`Confirmed: https://bscscan.com/tx/${tx.hash}`);
    } catch (error) {
      console.log(error);
      alert("BNB send failed.");
    }
  };

  const sendToken = async (coin) => {
    try {
      if (!wallet) return alert("Connect wallet first.");
      if (!sendTo || !amount) return alert("Enter receiver address and amount.");

      await switchToBSC();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new ethers.Contract(getTokenAddress(coin), TOKEN_ABI, signer);
      const decimals = await token.decimals();

      setMessage(`${coin} transaction pending...`);

      const tx = await token.transfer(sendTo, ethers.parseUnits(amount, decimals));
      await tx.wait();

      await saveTx(`Send ${coin}`, tx.hash, amount, coin);
      await loadBalances(wallet);
      setMessage(`Confirmed: https://bscscan.com/tx/${tx.hash}`);
    } catch (error) {
      console.log(error);
      alert(`${coin} send failed.`);
    }
  };

  const executeSwap = async () => {
    try {
      if (!wallet) return alert("Connect wallet first.");
      if (!swapAmount) return alert("Enter swap amount.");
      if (fromCoin === toCoin) return alert("Select different coins.");

      await switchToBSC();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const router = new ethers.Contract(ROUTER, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      setMessage("Swap pending...");

      if (fromCoin === "BNB") {
        const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
          0,
          [WBNB, getTokenAddress(toCoin)],
          wallet,
          deadline,
          { value: ethers.parseEther(swapAmount) }
        );

        await tx.wait();
        await saveTx("Swap", tx.hash, swapAmount, toCoin);
        await loadBalances(wallet);
        setMessage(`Swap completed: https://bscscan.com/tx/${tx.hash}`);
        return;
      }

      if (toCoin === "BNB") {
        const tokenAddress = getTokenAddress(fromCoin);
        const token = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
        const decimals = await token.decimals();
        const amountIn = ethers.parseUnits(swapAmount, decimals);

        const approveTx = await token.approve(ROUTER, amountIn);
        await approveTx.wait();

        const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountIn,
          0,
          [tokenAddress, WBNB],
          wallet,
          deadline
        );

        await tx.wait();
        await saveTx("Swap", tx.hash, swapAmount, toCoin);
        await loadBalances(wallet);
        setMessage(`Swap completed: https://bscscan.com/tx/${tx.hash}`);
        return;
      }

      alert("Token-to-token route coming soon.");
    } catch (error) {
      console.log(error);
      alert("Swap failed.");
    }
  };

  const activeWalletName = useMemo(() => {
    return (
      wallets.find((w) => w.address?.toLowerCase() === wallet?.toLowerCase())
        ?.name || "My Wallet"
    );
  }, [wallets, wallet]);

  const trendingCoins = (coins || []).slice(0, 20);

  const visibleCoins = (
    assetTab === "holdings" ? DEFAULT_TOKENS : trendingCoins
  ).filter((coin) => {
    const keyword = search.toLowerCase();
    return (
      String(coin.symbol || "").toLowerCase().includes(keyword) ||
      String(coin.name || "").toLowerCase().includes(keyword)
    );
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const savedWallet = localStorage.getItem("web3_wallet");
    const savedWallets = JSON.parse(localStorage.getItem("exalt_web3_wallets") || "[]");
    const savedHistory = localStorage.getItem("exalt_tx_history");

    setWallets(savedWallets);
    if (savedWallet) setWallet(savedWallet);

    if (savedHistory) {
      try {
        setTxHistory(JSON.parse(savedHistory));
      } catch {
        setTxHistory([]);
      }
    }

    loadCoins();
  }, []);

  useEffect(() => {
    if (wallet) loadBalances(wallet);
  }, [wallet, livePrices]);

  return (
    <div className="ex-web3-page">
      <div className="ex-web3-phone">
        {showWelcome && (
          <div className="ex-welcome-overlay">
            <img src={exchangeLogo} alt="Exalt Exchange" className="welcome-logo" />
            <h3>Welcome To</h3>
            <h1>Exalt Web3 Wallet</h1>
            <p>Secure • Fast • Decentralized</p>
          </div>
        )}

        <div className="ex-web3-topbar">
          <button className="ex-icon-btn">☰</button>
          <button
            className="ex-icon-btn"
            onClick={() => (setPage ? setPage("support") : alert("Support"))}
          >
            🎧
          </button>

          <div className="ex-main-tabs">
            <button
              className={mainTab === "exchange" ? "active" : ""}
              onClick={() => setMainTab("exchange")}
            >
              Exchange
            </button>
            <button
              className={mainTab === "wallet" ? "active" : ""}
              onClick={() => setMainTab("wallet")}
            >
              Wallet
            </button>
          </div>

          <button
            className="ex-icon-btn"
            onClick={() => alert("Scan / WalletConnect coming soon")}
          >
            ⌗
          </button>
          <button
            className="ex-icon-btn"
            onClick={() => (setPage ? setPage("support") : alert("Support"))}
          >
            💬
          </button>
        </div>

        <div className="ex-search">
          <span>Hot Perps: BTCUSDT</span>
          <button>⌕</button>
        </div>

        {mainTab === "exchange" && (
          <div className="ex-exchange-box">
            <h3>Welcome to Exalt Exchange</h3>
            <h1>${Number(totalAssets || 0).toLocaleString()}</h1>
            <p>Portfolio Value (USDT)</p>
            <button onClick={() => (setPage ? setPage("markets") : alert("Markets"))}>
              Open Markets
            </button>
          </div>
        )}

        {mainTab === "wallet" &&
          (!wallet ? (
            <div className="ex-welcome-card">
              <img src={exchangeLogo} alt="Exalt Exchange" />
              <p>Welcome to</p>
              <h1>
                Exalt Exchange <span>Web3 Wallet</span>
              </h1>
              <button onClick={connectWeb3}>Connect Web3 Wallet</button>
            </div>
          ) : (
            <>
              <div className="ex-wallet-head">
                <div>
                  <div className="ex-wallet-name">
                    <span>💼</span>
                    <select
                      value={wallet}
                      onChange={(e) => switchWallet(e.target.value)}
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.address}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                    <button onClick={connectWeb3}>＋</button>
                  </div>

                  <p className="ex-active-wallet-name">{activeWalletName}</p>

                  <button className="ex-address-btn" onClick={copyAddress}>
                    {shortAddress(wallet)} 📋
                  </button>
                </div>

                <button
                  className="ex-receive-btn"
                  onClick={() => setBottomTab("assets")}
                >
                  Receive
                </button>
              </div>

              <div className="ex-balance-card">
                <h1>${Number(totalAssets || 0).toLocaleString()}</h1>
                <p>BNB Balance: {bnbBalance}</p>
              </div>
            </>
          ))}

        <div className="ex-action-row">
          {[
            ["Alpha", "🗓️"],
            ["Securities", "📈"],
            ["DeFi", "🔒"],
            ["Referral", "👥"],
            ["More", "🔳"],
          ].map(([label, icon]) => (
            <button key={label}>
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="ex-promo-card">
          <div>
            <h3>Make your first trade on Exalt Web3</h3>
            <p>Explore BSC assets, DeFi and EXALT ecosystem.</p>
            <span>Register Now ›</span>
          </div>
          <img src={exaltLogo} alt="EXALT" />
        </div>

        <div className="ex-mini-cards">
          <div>
            <h3>Meme Rush</h3>
            <strong>315</strong>
            <p>↗️ 10x in 24h</p>
          </div>
          <div>
            <h3>EXALT Cup</h3>
            <strong>BNB</strong>
            <p>Live on BSC</p>
          </div>
        </div>

        {wallet && wallets.length > 0 && (
          <div className="ex-wallet-manage">
            {wallets.map((w) => (
              <div className="ex-wallet-manage-row" key={w.id}>
                <span>{w.name}</span>
                <small>{shortAddress(w.address)}</small>
                <button onClick={() => renameWallet(w.address)}>Rename</button>
                <button onClick={() => removeWallet(w.address)}>Remove</button>
              </div>
            ))}
          </div>
        )}

        <div className="ex-asset-tabs">
          {["holdings", "trending", "perps", "securities"].map((tab) => (
            <button
              key={tab}
              className={assetTab === tab ? "active" : ""}
              onClick={() => setAssetTab(tab)}
            >
              {tab === "holdings"
                ? "★ Holdings"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="ex-chain-tabs">
          {["All", "BSC", "Solana", "Ethereum", "Base", "1h"].map((x) => (
            <button key={x}>{x}</button>
          ))}
        </div>

        <input
          className="ex-web3-search-input"
          placeholder="Search coins"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="ex-coin-list">
          {visibleCoins.slice(0, 25).map((coin, index) => {
            const symbol = String(coin.symbol || "COIN").toUpperCase();
            const balance = balances[symbol] || "0.0000";
            const price = Number(coin.priceUsd || getTokenPrice(symbol) || 0);

            return (
              <div className="ex-coin-item" key={`${symbol}-${index}`}>
                <img
                  src={getCoinLogo(coin)}
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
                  <strong>
                    {assetTab === "holdings"
                      ? balance
                      : `$${price.toFixed(price > 1 ? 2 : 6)}`}
                  </strong>
                  <p>BSC</p>
                </div>
              </div>
            );
          })}
        </div>

        {bottomTab === "assets" && wallet && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setBottomTab("home")}>
              ×
            </button>
            <h3>Receive {receiveCoin}</h3>
            <select
              value={receiveCoin}
              onChange={(e) => setReceiveCoin(e.target.value)}
            >
              {DEFAULT_TOKENS.map((x) => (
                <option key={x.symbol}>{x.symbol}</option>
              ))}
            </select>
            <div className="ex-qr">
              <QRCode value={wallet} size={170} />
            </div>
            <p>{wallet}</p>
            <button onClick={copyAddress}>Copy Address</button>
          </div>
        )}

        {bottomTab === "trade" && wallet && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setBottomTab("home")}>
              ×
            </button>
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
            <button onClick={executeSwap}>Swap Now</button>
          </div>
        )}

        {bottomTab === "discover" && wallet && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setBottomTab("home")}>
              ×
            </button>
            <h3>Send Crypto</h3>
            <select value={sendCoin} onChange={(e) => setSendCoin(e.target.value)}>
              <option>BNB</option>
              <option>EXALT</option>
              <option>USDT</option>
            </select>
            <input
              placeholder="Receiver address"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
            />
            <input
              placeholder={`Amount ${sendCoin}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={sendCoin === "BNB" ? sendBNB : () => sendToken(sendCoin)}>
              Send Now
            </button>
          </div>
        )}

        {bottomTab === "market" && (
          <div className="ex-modal-panel">
            <button className="ex-close" onClick={() => setBottomTab("home")}>
              ×
            </button>
            <h3>Transaction History</h3>
            {txHistory.length === 0 ? (
              <p>No transactions yet.</p>
            ) : (
              txHistory.map((tx, i) => (
                <div className="ex-history-item" key={`${tx.hash || i}`}>
                  <strong>
                    {tx.type} {tx.coin}
                  </strong>
                  <span>{tx.amount}</span>
                  {tx.hash && (
                    <a
                      href={`https://bscscan.com/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      BscScan
                    </a>
                  )}
                </div>
              ))
            )}
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
              onClick={() => setBottomTab(key)}
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