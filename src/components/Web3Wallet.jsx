import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import exaltLogo from "../assets/exalt-coin.png";
import exchangeLogo from "../assets/exalt-exchange.png";
import { ethers } from "ethers";

function Web3Wallet() {
  const API =
    import.meta.env.VITE_API_URL ||
    "https://exalt-exchange-backend.onrender.com";

  const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  const EXALT = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";
  const USDT = "0x55d398326f99059fF775485246999027B3197955";

  const ROUTER_ABI = [
    "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) external payable",
    "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external",
  ];

  const TOKEN_ABI = [
    "function approve(address spender,uint256 amount) external returns(bool)",
    "function decimals() view returns(uint8)",
    "function transfer(address to,uint256 amount) external returns(bool)",
    "function balanceOf(address account) view returns(uint256)",
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
  const [bnbBalance, setBnbBalance] = useState("0.0000");
  const [balances, setBalances] = useState({});
  const [totalAssets, setTotalAssets] = useState("0.00");

  const [activeTab, setActiveTab] = useState("assets");

  const [sendTo, setSendTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sendCoin, setSendCoin] = useState("BNB");

  const [receiveCoin, setReceiveCoin] = useState("BNB");

  const [fromCoin, setFromCoin] = useState("BNB");
  const [toCoin, setToCoin] = useState("EXALT");
  const [swapAmount, setSwapAmount] = useState("");

  const [txHistory, setTxHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [searchTx, setSearchTx] = useState("");

  const [coins, setCoins] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const shortAddress = (address) => {
    if (!address) return "Wallet not connected";
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

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

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (Number(network.chainId) !== 56) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
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

      setLivePrices((prev) => ({
        ...prev,
        ...prices,
      }));
    } catch (error) {
      console.log("Live Web3 coins loading error:", error);
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
      console.log("MongoDB history load failed:", error);
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

    const updatedHistory = [txItem, ...txHistory];
    setTxHistory(updatedHistory);
    localStorage.setItem("exalt_tx_history", JSON.stringify(updatedHistory));

    try {
      await fetch(`${API}/api/web3-transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: wallet?.toLowerCase(),
          type: type.includes("Receive")
            ? "Receive"
            : type.includes("Send")
            ? "Send"
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
      console.log("MongoDB Web3 tx save failed:", error);
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
            const bnbBal = await provider.getBalance(walletAddress);
            const value = Number(ethers.formatEther(bnbBal));

            newBalances.BNB = value.toFixed(4);
            setBnbBalance(value.toFixed(5));

            total += value * getTokenPrice("BNB");
            continue;
          }

          const contract = new ethers.Contract(
            token.address,
            TOKEN_ABI,
            provider
          );

          const raw = await contract.balanceOf(walletAddress);
          const decimals = await contract.decimals();
          const value = Number(ethers.formatUnits(raw, decimals));

          newBalances[token.symbol] =
            value > 0 && value < 0.0001
              ? value.toFixed(8)
              : value.toFixed(4);

          total += value * getTokenPrice(token.symbol);
        } catch (error) {
          newBalances[token.symbol] = "0.0000";
        }
      }

      setBalances(newBalances);
      setTotalAssets(total.toFixed(2));
    } catch (error) {
      console.log("Balance loading error:", error);
    }
  };

  const connectWeb3 = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask or Trust Wallet");
        return;
      }

      await switchToBSC();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (!accounts || !accounts.length) {
        alert("No wallet account found");
        return;
      }

      const address = accounts[0];

      setWallet(address);
      localStorage.setItem("web3_wallet", address);

      await loadCoins();
      await loadBalances(address);
      await loadMongoHistory(address);

      alert("Wallet connected successfully");
    } catch (error) {
      console.log(error);
      alert("Wallet connection failed");
    }
  };

  const disconnectWallet = () => {
    setWallet("");
    setBnbBalance("0.0000");
    setBalances({});
    setTotalAssets("0.00");
    localStorage.removeItem("web3_wallet");
    alert("Wallet disconnected");
  };

  const copyAddress = () => {
    if (!wallet) return alert("Wallet not connected");
    navigator.clipboard.writeText(wallet);
    alert("Wallet address copied");
  };

  const sendBNB = async () => {
    try {
      if (!wallet) return alert("Connect wallet first");
      if (!sendTo || !amount) return alert("Enter receiver address and amount");

      await switchToBSC();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const balance = await provider.getBalance(wallet);

      const gasReserve = ethers.parseEther("0.01");
      const sendAmount = ethers.parseEther(amount);

      if (balance < sendAmount + gasReserve) {
        return alert("Insufficient BNB. Keep at least 0.01 BNB for gas fees.");
      }

      setMessage("BNB transaction pending...");

      const tx = await signer.sendTransaction({
        to: sendTo,
        value: sendAmount,
      });

      await tx.wait();

      await saveTx("Send BNB", tx.hash, amount, "BNB");
      await loadBalances(wallet);

      setMessage(`✅ Transaction Confirmed: https://bscscan.com/tx/${tx.hash}`);
      alert("BNB sent successfully");
    } catch (error) {
      console.log(error);
      alert("BNB send failed");
    }
  };

  const sendToken = async (coin) => {
    try {
      if (!wallet) return alert("Connect wallet first");
      if (!sendTo || !amount) return alert("Enter receiver address and amount");

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

      setMessage(`✅ ${coin} Sent: https://bscscan.com/tx/${tx.hash}`);
      alert(`${coin} sent successfully`);
    } catch (error) {
      console.log(error);
      alert(`${coin} send failed`);
    }
  };

  const executeSwap = async () => {
    try {
      if (!wallet) return alert("Connect wallet first");
      if (!swapAmount) return alert("Enter swap amount");
      if (fromCoin === toCoin) return alert("Select different coins");

      await switchToBSC();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const router = new ethers.Contract(ROUTER, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      if (fromCoin === "BNB") {
        const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
          0,
          [WBNB, getTokenAddress(toCoin)],
          wallet,
          deadline,
          { value: ethers.parseEther(swapAmount) }
        );

        setMessage("Swap pending...");
        await tx.wait();

        await saveTx("SWAP", tx.hash, swapAmount, toCoin);
        await loadBalances(wallet);

        setMessage(`✅ Swap Completed: https://bscscan.com/tx/${tx.hash}`);
        alert("Swap completed");
        return;
      }

      if (toCoin === "BNB") {
        const tokenAddress = getTokenAddress(fromCoin);
        const token = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
        const decimals = await token.decimals();
        const amountIn = ethers.parseUnits(swapAmount, decimals);

        setMessage("Approval pending...");
        const approveTx = await token.approve(ROUTER, amountIn);
        await approveTx.wait();

        setMessage("Swap pending...");
        const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountIn,
          0,
          [tokenAddress, WBNB],
          wallet,
          deadline
        );

        await tx.wait();

        await saveTx("SWAP", tx.hash, swapAmount, toCoin);
        await loadBalances(wallet);

        setMessage(`✅ Swap Completed: https://bscscan.com/tx/${tx.hash}`);
        alert("Swap completed");
        return;
      }

      alert("Token-to-token swap will be added through BNB route.");
    } catch (error) {
      console.log(error);
      alert("Swap failed");
    }
  };

  const getLatestReceiveTx = async (walletAddress, coin) => {
    try {
      const res = await fetch(
        `${API}/api/web3/latest-receive?wallet=${walletAddress}&coin=${coin}`
      );

      const data = await res.json();
      if (!data.success) return null;

      return {
        hash: data.hash,
        amount: data.amount,
        type: data.type,
        coin: data.coin,
      };
    } catch (error) {
      console.log("Backend receive tx error:", error);
      return null;
    }
  };

  const syncReceiveHistory = async () => {
    if (!wallet) return alert("Connect wallet first");

    const latestTx = await getLatestReceiveTx(wallet, receiveCoin);

    if (latestTx?.hash) {
      const alreadySaved = txHistory.some(
        (tx) => tx.hash === latestTx.hash && tx.coin === receiveCoin
      );

      if (!alreadySaved) {
        await saveTx(
          latestTx.type || `Receive ${receiveCoin}`,
          latestTx.hash,
          latestTx.amount,
          latestTx.coin || receiveCoin
        );

        alert("Receive transaction synced");
        return;
      }
    }

    alert("No new receive transaction found");
  };

  const clearHistory = () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to clear all transaction history?"
    );

    if (!confirmDelete) return;

    localStorage.removeItem("exalt_tx_history");
    setTxHistory([]);
  };

  const filteredHistory = txHistory.filter((tx) => {
    const matchFilter =
      historyFilter === "ALL" ||
      tx.type?.toUpperCase().includes(historyFilter) ||
      tx.coin?.toUpperCase() === historyFilter;

    const matchSearch =
      !searchTx ||
      tx.type?.toLowerCase().includes(searchTx.toLowerCase()) ||
      tx.coin?.toLowerCase().includes(searchTx.toLowerCase()) ||
      tx.amount?.toString().includes(searchTx) ||
      tx.hash?.toLowerCase().includes(searchTx.toLowerCase());

    return matchFilter && matchSearch;
  });

  useEffect(() => {
    const saved = localStorage.getItem("exalt_tx_history");
    const savedWallet = localStorage.getItem("web3_wallet");

    if (saved) {
      try {
        setTxHistory(JSON.parse(saved));
      } catch {
        setTxHistory([]);
      }
    }

    if (savedWallet) {
      setWallet(savedWallet);
    }

    loadCoins();
  }, []);

  useEffect(() => {
    if (wallet) loadBalances(wallet);
  }, [wallet, livePrices]);

  return (
    <div className="wallet-page">
      <div className="panel">
        <div className="web3-hero">
          <img src={exchangeLogo} alt="Exalt Exchange" className="web3-logo" />
          <div>
            <h2>Exalt Exchange Web3 Wallet</h2>
            <p>Secure MetaMask / Trust Wallet • BNB Smart Chain • EXALT Wallet</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card glow-yellow">
            <h3>Total Assets</h3>
            <h1>${Number(totalAssets || 0).toLocaleString()}</h1>
            <button onClick={connectWeb3} className="action-btn yellow-btn">
              Connect Web3 Wallet
            </button>
            {wallet && (
              <button onClick={disconnectWallet} className="action-btn red-btn">
                Disconnect
              </button>
            )}
          </div>

          <div className="stat-card glow-blue">
            <h3>Wallet Address</h3>
            <p>{shortAddress(wallet)}</p>
            <button onClick={copyAddress} className="action-btn blue-btn">
              Copy Address / Receive
            </button>
          </div>

          <div className="stat-card glow-green">
            <h3>BNB Balance</h3>
            <h1>{bnbBalance} BNB</h1>
            <button
              onClick={() => wallet && loadBalances(wallet)}
              className="action-btn green-btn"
            >
              Refresh Balance
            </button>
          </div>
        </div>

        <div className="web3-tabs">
          {[
            { icon: "💼", label: "Assets", tab: "assets" },
            { icon: "📤", label: "Send", tab: "send" },
            { icon: "📥", label: "Receive", tab: "receive" },
            { icon: "🔁", label: "Swap", tab: "swap" },
            { icon: "📜", label: "History", tab: "history" },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={
                activeTab === item.tab
                  ? "action-btn yellow-btn"
                  : "action-btn blue-btn"
              }
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {message && <div className="web3-message">{message}</div>}

        {activeTab === "assets" && (
          <>
            <div className="stats-grid">
              {DEFAULT_TOKENS.map((token) => (
                <div className="stat-card glow-blue" key={token.symbol}>
              <img
  src={getCoinLogo(token)}
  alt={token.symbol}
  className="web3-coin-logo"
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.style.display = "none";
  }}
/>
                  <h3>{token.name}</h3>
                  <h1>{balances[token.symbol] || "0.0000"}</h1>
                  <p>{token.symbol}</p>
                </div>
              ))}
            </div>

            <div className="stat-card glow-yellow">
              <h3>All Web3 Coins</h3>

              <input
                type="text"
                placeholder="Search Coin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="web3-input"
              />

             {(coins || [])
 .filter((coin) => {
  const name = String(coin?.name || "");
  const symbol = String(coin?.symbol || "");
  const keyword = String(search || "").toLowerCase();

  return (
    name.toLowerCase().includes(keyword) ||
    symbol.toLowerCase().includes(keyword)
  );
})
.slice(0, 50)
.map((coin, index) => (
  <div
    className="web3-coin-row"
    key={index}
    onClick={() => {
      setFromCoin("BNB");
      setToCoin(coin.symbol);
      setActiveTab("swap");
    }}
  >
    <img
  src={getCoinLogo(coin)}
  alt={coin.symbol || "coin"}
  className="web3-coin-logo"
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.style.display = "none";
  }}
/>
                    <div>
                      <strong>{coin.symbol}</strong>
                      <p>{coin.name}</p>
                    </div>

                    <div>
                      <strong>
                        $
                        {Number(coin.priceUsd || 0).toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}
                      </strong>
                      <p>
                        Liq: ${Number(coin.liquidityUsd || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {activeTab === "receive" && (
          <div className="stat-card glow-blue">
            <h3>Receive Crypto</h3>

            <select
              className="web3-input"
              value={receiveCoin}
              onChange={(e) => setReceiveCoin(e.target.value)}
            >
              <option value="BNB">BNB</option>
              <option value="USDT">USDT</option>
              <option value="EXALT">EXALT</option>
              <option value="BTCB">BTCB</option>
              <option value="ETH">ETH</option>
            </select>

            <div className="web3-qr-box">
              <QRCode value={wallet || "Connect wallet first"} size={180} />
            </div>

            <p className="web3-address">{wallet || "Wallet not connected"}</p>

            <button onClick={copyAddress} className="action-btn blue-btn">
              Copy Address
            </button>
          </div>
        )}

        {activeTab === "send" && (
          <div className="stat-card glow-yellow">
            <h3>Send Crypto</h3>

            <select
              className="web3-input"
              value={sendCoin}
              onChange={(e) => setSendCoin(e.target.value)}
            >
              <option value="BNB">BNB</option>
              <option value="EXALT">EXALT</option>
              <option value="USDT">USDT</option>
            </select>

            <input
              className="web3-input"
              placeholder="Receiver Address"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
            />

            <input
              className="web3-input"
              placeholder={`Amount ${sendCoin}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <button
              onClick={
                sendCoin === "BNB" ? sendBNB : () => sendToken(sendCoin)
              }
              className="action-btn yellow-btn"
            >
              Send Now
            </button>
          </div>
        )}

        {activeTab === "swap" && (
          <div className="stat-card glow-yellow">
            <h3>Swap / Trade</h3>

            <label>From Coin</label>
            <select
              className="web3-input"
              value={fromCoin}
              onChange={(e) => setFromCoin(e.target.value)}
            >
              <option>BNB</option>
              <option>USDT</option>
              <option>EXALT</option>
            </select>

            <label>To Coin</label>
            <select
              className="web3-input"
              value={toCoin}
              onChange={(e) => setToCoin(e.target.value)}
            >
              <option>EXALT</option>
              <option>USDT</option>
              <option>BNB</option>
            </select>

            <input
              className="web3-input"
              placeholder="Enter Amount"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
            />

            <button className="action-btn yellow-btn" onClick={executeSwap}>
              Swap Now
            </button>
          </div>
        )}

        {activeTab === "history" && (
          <div className="stat-card glow-blue">
            <h3>Transaction History ({filteredHistory.length})</h3>

            <div className="web3-filter-row">
              {["ALL", "RECEIVE", "SEND", "SWAP", "BNB", "USDT", "EXALT"].map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setHistoryFilter(filter)}
                    className={
                      historyFilter === filter
                        ? "action-btn yellow-btn"
                        : "action-btn blue-btn"
                    }
                  >
                    {filter}
                  </button>
                )
              )}
            </div>

            <input
              type="text"
              placeholder="Search transaction..."
              value={searchTx}
              onChange={(e) => setSearchTx(e.target.value)}
              className="web3-input"
            />

            <button
              onClick={() => loadMongoHistory(wallet)}
              className="action-btn blue-btn"
            >
              Sync History
            </button>

            <button onClick={syncReceiveHistory} className="action-btn green-btn">
              Sync Receive
            </button>

            <button onClick={clearHistory} className="action-btn red-btn">
              Clear History
            </button>

            {filteredHistory.length === 0 ? (
              <p>No transactions yet</p>
            ) : (
              filteredHistory.map((tx, index) => (
                <div className="web3-history-row" key={index}>
                  <div>
                    <b>Type:</b> {tx.type}
                  </div>
                  <div>
                    <b>Amount:</b> {tx.amount} {tx.coin}
                  </div>
                  <div>
                    <b>Status:</b> {tx.status}
                  </div>
                  <div>
                    <b>Time:</b> {tx.time}
                  </div>

                  {tx.hash && (
                    <a
                      href={`https://bscscan.com/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on BscScan
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Web3Wallet;