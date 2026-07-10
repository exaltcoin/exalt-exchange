import { useEffect, useState } from "react";
import AdminLearnEarn from "./components/AdminLearnEarn";
import AdminStaking from "./components/AdminStaking";
import AdminCopyTrading from "./components/AdminCopyTrading";
import AdminAIPortfolio from "./components/AdminAIPortfolio";
import AdminSocial from "./components/AdminSocial";
import AdminAIRisk from "./components/AdminAIRisk";
import AdminAIProfit from "./components/AdminAIProfit";
import AdminAIMarketScanner from "./components/AdminMarketScanner";
import AdminAINews from "./components/AdminAINews";
import AdminAIWhaleTracker from "./components/AdminAIWhaleTracker";
import AdminAIArbitrage from "./components/AdminAIArbitrage";
import AdminAIGridTrading from "./components/AdminAIGridTrading";
import AdminAISmartAlerts from "./components/AISmartAlerts";
import AdminAILaunchpad from "./components/AdminAILaunchpad";
import AdminAIWhaleHeatmap from "./components/AdminAIWhaleHeatmap";
import AdminAITrustScore from "./components/AdminAITrustScore";
import AdminAIWhaleAlert from "./components/AdminAIWhaleAlert";
import AdminExaltUtility from "./components/AdminExaltUtility";
import AdminReputation from "./components/AdminReputation";
import AdminAchievement from "./components/AdminAchievement";
import AdminSpotTrading from "./components/AdminSpotTrading";
import AdminFutures from "./components/AdminFutures";
import AdminWallets from "./components/AdminWallets";
import AdminAuditLogs from "./components/AdminAuditLogs";
import AdminLoginHistory from "./components/AdminLoginHistory";
import AdminNotifications from "./components/AdminNotifications";
import AdminAccountDeletion from "./components/AdminAccountDeletion";
function AdminPanel() {
 const API_BASE =
  import.meta.env.VITE_API_URL || "https://api.exaltexchange.io";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;
  const token = localStorage.getItem("token");
 const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [listings, setListings] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [web3Transactions, setWeb3Transactions] = useState([]);
  const [web3Search, setWeb3Search] = useState("");
  const [webSearch, setWebSearch] = useState("");
  const [web3Filter, setWeb3Filter] = useState("ALL");
  const [web3CoinFilter, setWeb3CoinFilter] = useState("ALL");
const [web3StatusFilter, setWeb3StatusFilter] = useState("ALL");
const [web3DateFilter, setWeb3DateFilter] = useState("ALL");
const [web3Page, setWeb3Page] = useState(1);
const WEB3_PAGE_SIZE = 20;
  const [adminTab, setAdminTab] = useState("overview");
  const [learnEarnRecords, setLearnEarnRecords] = useState([]);
  const [listingFilter, setListingFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [stakingSearch, setStakingSearch] = useState("");
const [selectedListing, setSelectedListing] = useState(null);
  const totalListings = listings.length;
const pendingListings = listings.filter(
  (item) => item.status?.toLowerCase() === "pending"
).length;

const approvedListings = listings.filter(
  (item) => item.status?.toLowerCase() === "approved"
).length;

const rejectedListings = listings.filter(
  (item) => item.status?.toLowerCase() === "rejected"
).length;
const filteredListings = listings.filter((item) => {
  if (listingFilter === "all") return true;

  return (
    item.status &&
    item.status.toLowerCase() === listingFilter.toLowerCase()
  );
});
const [depositFilter, setDepositFilter] = useState("all");

const totalDeposits = deposits.length;

const pendingDeposits = deposits.filter(
  (d) => d.status?.toLowerCase() === "pending"
).length;

const approvedDeposits = deposits.filter(
  (d) => d.status?.toLowerCase() === "approved"
).length;

const rejectedDeposits = deposits.filter(
  (d) => d.status?.toLowerCase() === "rejected"
).length;

const filteredDeposits = deposits.filter((item) => {
  if (depositFilter === "all") return true;
  return item.status?.toLowerCase() === depositFilter;
});
const [withdrawalFilter, setWithdrawalFilter] = useState("all");

const totalWithdrawals = withdrawals.length;

const pendingWithdrawals = withdrawals.filter(
  (w) => w.status?.toLowerCase() === "pending"
).length;

const approvedWithdrawals = withdrawals.filter(
  (w) => w.status?.toLowerCase() === "approved"
).length;

const rejectedWithdrawals = withdrawals.filter(
  (w) => w.status?.toLowerCase() === "rejected"
).length;

const filteredWithdrawals = withdrawals.filter((item) => {
  if (withdrawalFilter === "all") return true;
  return item.status?.toLowerCase() === withdrawalFilter;
});
const [kycFilter, setKycFilter] = useState("all");

const totalKyc = kycRequests.length;

const pendingKyc = kycRequests.filter(
  (k) => k.status?.toLowerCase() === "pending"
).length;

const approvedKyc = kycRequests.filter(
  (k) => k.status?.toLowerCase() === "approved"
).length;

const rejectedKyc = kycRequests.filter(
  (k) => k.status?.toLowerCase() === "rejected"
).length;

const filteredKyc = kycRequests.filter((item) => {
  if (kycFilter === "all") return true;
  return item.status?.toLowerCase() === kycFilter;
});
const [supportFilter, setSupportFilter] = useState("all");

const totalTickets = tickets.length;

const openTickets = tickets.filter(
  (t) => String(t.status).toLowerCase() === "open"
).length;

const resolvedTickets = tickets.filter(
  (t) => String(t.status).toLowerCase() === "resolved"
).length;

const closedTickets = tickets.filter(
  (t) => String(t.status).toLowerCase() === "closed"
).length;

const filteredTickets = tickets.filter((item) => {
  if (supportFilter === "all") return true;
  return String(item.status).toLowerCase() === supportFilter;
});
const [transactionFilter, setTransactionFilter] = useState("all");

const totalAdminTransactions = transactions.length;

const depositTransactions = transactions.filter(
  (t) => String(t.type).toLowerCase() === "deposit"
).length;

const withdrawalTransactions = transactions.filter(
  (t) => String(t.type).toLowerCase() === "withdrawal"
).length;

const tradeTransactions = transactions.filter(
  (t) => String(t.type).toLowerCase() === "trade"
).length;

const filteredAdminTransactions = transactions.filter((item) => {
  if (transactionFilter === "all") return true;
  return String(item.type).toLowerCase() === transactionFilter;
});
const web3SendCount = web3Transactions.filter((tx) => tx.type === "Send").length;
const web3ReceiveCount = web3Transactions.filter((tx) => tx.type === "Receive").length;
const web3SwapCount = web3Transactions.filter((tx) => tx.type === "Swap").length;
const web3SuccessCount = web3Transactions.filter((tx) => tx.status === "success").length;
const web3PendingCount = web3Transactions.filter((tx) => tx.status === "pending").length;
const web3FailedCount = web3Transactions.filter((tx) => tx.status === "failed").length;

const shortText = (value = "") => {
  const text = String(value || "");
  if (!text) return "N/A";
  return text.length > 22 ? `${text.slice(0, 12)}...${text.slice(-8)}` : text;
};

const copyAdminText = async (text, label = "Copied") => {
  await navigator.clipboard.writeText(String(text || ""));
  alert(`${label} copied`);
};

const openWeb3Explorer = (tx) => {
  if (!tx.hash || !String(tx.hash).startsWith("0x")) {
    alert("Test transaction hash. Explorer not available.");
    return;
  }

  window.open(`https://bscscan.com/tx/${tx.hash}`, "_blank");
};

const uniqueWeb3Coins = [
  "ALL",
  ...new Set(web3Transactions.map((tx) => String(tx.coin || "").toUpperCase()).filter(Boolean)),
];

const isWeb3DateMatch = (tx) => {
  if (web3DateFilter === "ALL") return true;
  if (!tx.createdAt) return false;

  const txDate = new Date(tx.createdAt);
  const now = new Date();
  const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);

  if (web3DateFilter === "TODAY") {
    return txDate.toDateString() === now.toDateString();
  }

  if (web3DateFilter === "7D") return diffDays <= 7;
  if (web3DateFilter === "30D") return diffDays <= 30;

  return true;
};

const filteredWeb3Transactions = web3Transactions.filter((tx) => {
  const search = web3Search.toLowerCase();

  const matchSearch =
    !search ||
    tx.wallet?.toLowerCase().includes(search) ||
    tx.hash?.toLowerCase().includes(search) ||
    tx.coin?.toLowerCase().includes(search) ||
    tx.chain?.toLowerCase().includes(search);

  const matchType = web3Filter === "ALL" || tx.type === web3Filter;
  const matchCoin = web3CoinFilter === "ALL" || String(tx.coin).toUpperCase() === web3CoinFilter;
  const matchStatus =
    web3StatusFilter === "ALL" ||
    String(tx.status || "success").toLowerCase() === web3StatusFilter.toLowerCase();

  return matchSearch && matchType && matchCoin && matchStatus && isWeb3DateMatch(tx);
});

const totalWeb3Pages = Math.max(1, Math.ceil(filteredWeb3Transactions.length / WEB3_PAGE_SIZE));

const paginatedWeb3Transactions = filteredWeb3Transactions.slice(
  (web3Page - 1) * WEB3_PAGE_SIZE,
  web3Page * WEB3_PAGE_SIZE
);

const exportWeb3Csv = () => {
  const rows = [
    ["Wallet", "Type", "Coin", "Amount", "Status", "Chain", "Hash", "Time"],
    ...filteredWeb3Transactions.map((tx) => [
      tx.wallet || "",
      tx.type || "",
      tx.coin || "",
      tx.amount || "",
      tx.status || "",
      tx.chain || "",
      tx.hash || "",
      tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "",
    ]),
  ];

  const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `web3-transactions-${Date.now()}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const safeText = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "object") {
      return value.name || value.email || value._id || JSON.stringify(value);
    }
    return value;
  };
 
  if (!user || user.role !== "admin") {
    return (
      <div className="panel">
        <h2>ADMIN</h2>
        <p>Access Denied</p>
        <p>Only admin can access this panel.</p>
      </div>
    );
  }

  const loadAdminData = async () => {
    try {
      const listingsRes = await fetch(`${API}/api/listings`, { headers });
      const listingsData = await listingsRes.json();
      setListings(listingsData.listings || listingsData.requests || listingsData || []);

      const depositsRes = await fetch(`${API}/api/deposit-request`, { headers });
      const depositsData = await depositsRes.json();
     setDeposits(
  Array.isArray(depositsData.requests) ? depositsData.requests :
  Array.isArray(depositsData.deposits) ? depositsData.deposits :
  Array.isArray(depositsData.data) ? depositsData.data :
  Array.isArray(depositsData) ? depositsData : []
);
      const withdrawalsRes = await fetch(`${API}/api/withdrawals`, { headers });
      const withdrawalsData = await withdrawalsRes.json();
     setWithdrawals(
  Array.isArray(withdrawalsData.withdrawals) ? withdrawalsData.withdrawals :
  Array.isArray(withdrawalsData.requests) ? withdrawalsData.requests :
  Array.isArray(withdrawalsData.data) ? withdrawalsData.data :
  Array.isArray(withdrawalsData) ? withdrawalsData : []
);

      const ticketsRes = await fetch(`${API}/api/support-ticket`, { headers });
      const ticketsData = await ticketsRes.json();
    setTickets(
  Array.isArray(ticketsData.tickets) ? ticketsData.tickets :
  Array.isArray(ticketsData.requests) ? ticketsData.requests :
  Array.isArray(ticketsData.data) ? ticketsData.data :
  Array.isArray(ticketsData) ? ticketsData : []
);
      const transactionsRes = await fetch(`${API}/api/transactions/admin`, { headers });
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.transactions || transactionsData.requests || transactionsData.data || transactionsData || []);
const kycRes = await fetch(`${API}/api/kyc/admin/all`, { headers });
const kycData = await kycRes.json();
setKycRequests(
  Array.isArray(kycData.kycList)
    ? kycData.kycList
    : Array.isArray(kycData.kycRequests)
    ? kycData.kycRequests
    : Array.isArray(kycData.requests)
    ? kycData.requests
    : Array.isArray(kycData.data)
    ? kycData.data
    : []
);
      const web3Res = await fetch(`${API}/api/web3-transactions`, { headers });
      const web3Data = await web3Res.json();
     setWeb3Transactions(
  Array.isArray(web3Data.transactions) ? web3Data.transactions :
  Array.isArray(web3Data.data) ? web3Data.data :
  Array.isArray(web3Data) ? web3Data : []
);
    } catch (error) {
      console.log(error);
      alert("Admin data load failed");
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateListing = async (id, status) => {
    try {
      await fetch(`${API}/api/listings/${id}/approve`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status }),
      });
      alert(`Listing ${status} successfully`);
      loadAdminData();
    } catch (error) {
      console.log(error);
      alert("Listing update failed");
    }
  };

  const updateDeposit = async (id, status) => {
    try {
      await fetch(`${API}/api/deposit-request/status`, {
        method: "POST",
        headers,
        body: JSON.stringify({ id, status }),
      });
      alert(`Deposit ${status} successfully`);
      loadAdminData();
    } catch (error) {
      console.log(error);
      alert("Deposit update failed");
    }
  };

  const updateWithdrawal = async (id, status) => {
    try {
      await fetch(`${API}/api/withdrawals/status`, {
        method: "POST",
        headers,
        body: JSON.stringify({ id, status }),
      });
      alert(`Withdrawal ${status} successfully`);
      loadAdminData();
    } catch (error) {
      console.log(error);
      alert("Withdrawal update failed");
    }
  };

  const updateTicket = async (id, status) => {
    try {
      await fetch(`${API}/api/support-ticket/status`, {
        method: "POST",
        headers,
        body: JSON.stringify({ id, status }),
      });
      alert(`Ticket ${status} successfully`);
      loadAdminData();
    } catch (error) {
      console.log(error);
      alert("Ticket update failed");
    }
  };

  return (
    <div className="panel">
      <h2>Admin Panel</h2>

      <div className="admin-tabs">
        <button className={adminTab === "overview" ? "tab active-tab" : "tab"} onClick={() => setAdminTab("overview")}>Overview</button>
        <button className={adminTab === "listings" ? "tab active-tab" : "tab"} onClick={() => setAdminTab("listings")}>Listings</button>
        <button className={adminTab === "deposits" ? "tab active-tab" : "tab"} onClick={() => setAdminTab("deposits")}>Deposits</button>
        <button className={adminTab === "withdrawals" ? "tab active-tab" : "tab"} onClick={() => setAdminTab("withdrawals")}>Withdrawals</button>
        <button className={adminTab === "web3" ? "tab active-tab" : "tab"} onClick={() => setAdminTab("web3")}>Web3</button>
        <button className={adminTab === "kyc" ? "tab active-tab" : "tab"} onClick={() => setAdminTab("kyc")}>KYC</button>
        <button className={adminTab === "support" ? "tab active-tab" : "tab"} onClick={() => setAdminTab("support")}>Support</button>
        <button
className={adminTab === "staking" ? "tab active-tab" : "tab"}
onClick={() => setAdminTab("staking")}
>
Staking
</button>
<button
  className={adminTab === "learn-earn" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("learn-earn")}
>
  Learn & Earn
</button>
<button
  className={adminTab === "copy-trading" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("copy-trading")}
>
  Copy Trading
</button>
<button
  className={adminTab === "ai-portfolio" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-portfolio")}
>
  AI Portfolio
</button>
<button
  className={adminTab === "social-trading" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("social-trading")}
>
  Social Trading
</button>
<button
  className={adminTab === "ai-risk" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-risk")}
>
  AI Risk Manager
</button>
<button
  className={adminTab === "ai-profit" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-profit")}
>
  AI Profit Calculator
</button>
<button
  className={adminTab === "ai-market-scanner" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-market-scanner")}
>
  AI Market Scanner
</button>
<button
  className={adminTab === "ai-news" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-news")}
>
  AI News
</button>
<button
  className={adminTab === "ai-whale-tracker" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-whale-tracker")}
>
  AI Whale Tracker
</button>
<button
  className={adminTab === "ai-arbitrage" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-arbitrage")}
>
  AI Arbitrage Scanner
</button>
<button
  className={adminTab === "ai-grid-trading" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-grid-trading")}
>
  AI Grid Trading
</button>
<button
  className={adminTab === "ai-smart-alerts" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-smart-alerts")}
>
  AI Smart Alerts
</button>
<button
  className={adminTab === "ai-launchpad" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-launchpad")}
>
  AI Launchpad
</button>
<button
  className={adminTab === "ai-whale-heatmap" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-whale-heatmap")}
>
  AI Whale Heatmap
</button>
<button
  className={adminTab === "ai-trust-score" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-trust-score")}
>
  AI Trust Score
</button>
<button
  className={adminTab === "ai-whale-alerts" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("ai-whale-alerts")}
>
  AI Whale Alerts
</button>

<button
  className={adminTab === "exalt-utility" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("exalt-utility")}
>
  Exalt Utility
</button>
<button
  className={adminTab === "reputation" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("reputation")}
>
  Reputation
</button>
<button
  className={adminTab === "achievements" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("achievements")}
>
  Achievements
</button>
<button
  className={adminTab === "notifications" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("notifications")}
>
  Notifications
</button>
<button
  className={adminTab === "spot-trading" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("spot-trading")}
>
  Spot Trading
</button>
<button
  className={adminTab === "futures-admin" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("futures-admin")}
>
  Futures Admin
</button>
<button
  className={adminTab === "wallet-admin" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("wallet-admin")}
>
  Wallet Admin
</button>
<button
  className={adminTab === "audit-logs" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("audit-logs")}
>
  Audit Logs
</button>
<button
  className={adminTab === "login-history" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("login-history")}
>
  Login History
</button>
<button
  className={adminTab === "account-deletion" ? "tab active-tab" : "tab"}
  onClick={() => setAdminTab("account-deletion")}
>
  Account Deletion
</button>

        <button className={adminTab === "transactions" ? "tab active-tab" : "tab"} onClick={() => setAdminTab("transactions")}>Transactions</button>
      </div>

      {adminTab === "overview" && (
        <>
          <div className="admin-stats">
            <div className="stat-card"><h3>{listings.length}</h3><p>Listings</p></div>
            <div className="stat-card"><h3>{deposits.filter((d) => d.status === "pending").length}</h3><p>Pending Deposits</p></div>
            <div className="stat-card"><h3>{withdrawals.filter((w) => w.status === "pending").length}</h3><p>Pending Withdrawals</p></div>
            <div className="stat-card"><h3>{kycRequests.filter((k) => k.status === "pending").length}</h3><p>Pending KYC</p></div>
            <div className="stat-card"><h3>{web3Transactions.length}</h3><p>Web3 Transactions</p></div>
            <div className="stat-card"><h3>{tickets.length}</h3><p>Support Tickets</p></div>
          </div>

          <div className="admin-content">
            <p>Manage listings, deposits, withdrawals, Web3, KYC, support tickets and transactions.</p>
          </div>
        </>
      )}

      {adminTab === "listings" && (
        <div className="admin-content">
          <h3>Coin Listing Requests</h3>
          <div style={{ marginBottom: "15px" }}>
  <input
    type="text"
    placeholder="Search by name or symbol..."
    value={webSearch}
    onChange={(e) => setWebSearch(e.target.value)}
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      background: "#1e2329",
      color: "#fff",
      border: "1px solid #f0b90b"
    }}
  />
</div>
          <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginBottom: "20px"
  }}
>
 
  <div className="admin-card">
    <h4>Total</h4>
    <h2>{totalListings}</h2>
  </div>

  <div className="admin-card">
    <h4>Pending</h4>
    <h2>{pendingListings}</h2>
  </div>

  <div className="admin-card">
    <h4>Approved</h4>
    <h2>{approvedListings}</h2>
  </div>

  <div className="admin-card">
    <h4>Rejected</h4>
    <h2>{rejectedListings}</h2>
  </div>
</div>
<div style={{ marginBottom: "15px" }}>
<div style={{ marginBottom: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>


  <button className="tab" onClick={() => setListingFilter("all")}>
    All
  </button>

  <button className="tab" onClick={() => setListingFilter("pending")}>
    Pending
  </button>

  <button className="tab" onClick={() => setListingFilter("approved")}>
    Approved
  </button>

  <button className="tab" onClick={() => setListingFilter("rejected")}>
    Rejected
  </button>
</div>

</div>
      
      {filteredListings.length === 0 ? (
  <p>No listing requests found.</p>
) : (
  filteredListings.map((item) => (
    <div className="admin-card" key={item._id}>
      <h4>{item.coinName || item.name} ({item.symbol})</h4>

    <button
  className="details-btn"
  onClick={() => {
    console.log("LISTING ITEM:", item);
    console.log("CHECKS:", item.checks);
    setSelectedListing(item);
  }}
>
  👁 View Details
</button> 
     <p>Chain: {item.chain || item.network || "N/A"}</p>

      <p>
        Safety Score:
        <span
          style={{
            color:
              (item.safetyScore || 0) >= 80
                ? "#00c853"
                : (item.safetyScore || 0) >= 50
                ? "#ff9800"
                : "#ff1744",
            fontWeight: "bold",
            marginLeft: "8px",
          }}
        >
          {item.safetyScore || 0}/100
        </span>
      </p>

      <p>
        Risk Level:
        <span
          style={{
            color:
              item.riskLevel === "Low Risk"
                ? "#00c853"
                : item.riskLevel === "Medium Risk"
                ? "#ff9800"
                : "#ff1744",
            fontWeight: "bold",
            marginLeft: "8px",
          }}
        >
          {item.riskLevel || "N/A"}
        </span>
      </p>

      <div className="contract-box">
        <span>Contract</span>
        <code>{item.contractAddress || item.contract || "N/A"}</code>

        <button
          className="copy-contract-btn"
          onClick={() =>
            navigator.clipboard.writeText(item.contractAddress || item.contract || "")
          }
        >
          📋 Copy Contract
        </button>
      </div>

      <p>
        Status:
        <span
          style={{
            color:
              item.status === "approved"
                ? "#00ff88"
                : item.status === "rejected"
                ? "#ff4444"
                : "#ffaa00",
            fontWeight: "bold",
            marginLeft: "8px",
          }}
        >
          {item.status?.toUpperCase() || "N/A"}
        </span>
      </p>
<div className="listing-info-box">

  <div className="info-row">
    <span className="info-label">👤 Owner</span>
    <span className="info-value">{safeText(item.ownerName)}</span>
  </div>

  <div className="info-row">
    <span className="info-label">📧 Email</span>
    <span className="info-value">{safeText(item.ownerEmail)}</span>
  </div>

  <div className="info-row">
    <span className="info-label">💼 Category</span>
    <span className="info-value">{safeText(item.projectCategory)}</span>
  </div>

  <div className="info-row">
    <span className="info-label">💰 Price</span>
    <span className="info-value-green">
      {safeText(item.price)}
    </span>
  </div>

  <div className="info-row">
    <span className="info-label">📊 Market Cap</span>
    <span className="info-value-green">
      {safeText(item.marketCap)}
    </span>
  </div>

  <div className="info-row">
    <span className="info-label">💧 Liquidity</span>
    <span className="info-value-green">
      {safeText(item.liquidity)}
    </span>
  </div>

</div>
      {item.status !== "approved" && item.status !== "rejected" ? (
        <div style={{ marginTop: "15px" }}>
          <button
            className="approve-btn"
            onClick={() => updateListing(item._id, "approved")}
          >
            ✅ Approve
          </button>

          <button
            className="reject-btn"
            onClick={() => updateListing(item._id, "rejected")}
            style={{ marginLeft: "10px" }}
          >
            ❌ Reject
          </button>
        </div>
      ) : (
        <p>Action completed</p>
       
      )}
    </div>
  ))
)}
</div>
      )}
      {adminTab === "withdrawals" && (
        <div className="admin-content">
          <h3>Withdrawal Requests</h3>
          <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginBottom: "20px"
  }}
>
  <div className="admin-card stat-total">
    <h4>Total</h4>
    <h2>{totalWithdrawals}</h2>
  </div>

  <div className="admin-card stat-pending">
    <h4>Pending</h4>
    <h2>{pendingWithdrawals}</h2>
  </div>

  <div className="admin-card stat-approved">
    <h4>Approved</h4>
    <h2>{approvedWithdrawals}</h2>
  </div>

  <div className="admin-card stat-rejected">
    <h4>Rejected</h4>
    <h2>{rejectedWithdrawals}</h2>
  </div>
</div>
<div style={{ marginBottom: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>

  <button className="tab" onClick={() => setWithdrawalFilter("all")}>
    All
  </button>

  <button className="tab" onClick={() => setWithdrawalFilter("pending")}>
    Pending
  </button>

  <button className="tab" onClick={() => setWithdrawalFilter("approved")}>
    Approved
  </button>

  <button className="tab" onClick={() => setWithdrawalFilter("rejected")}>
    Rejected
  </button>

</div>
          {filteredWithdrawals.length === 0 ? (
            <p>No withdrawal requests found.</p>
          ) : (
          filteredWithdrawals.map((item) =>(
              <div className="admin-card" key={item._id}>
                <p>User: {safeText(item.userId)}</p>
                <p>Amount: {safeText(item.amount)}</p>
                <p>Coin: {safeText(item.coin)}</p>
                <p>Status: {safeText(item.status)}</p>
                <p>Method: {safeText(item.method || item.withdrawMethod || item.paymentMethod)}</p>
                <p>Wallet: {safeText(item.walletAddress || item.accountNumber || item.accountDetails)}</p>

                {String(item.status).toLowerCase() === "pending" ? (
                  <>
                    <button className="action-btn approve-btn" onClick={() => updateWithdrawal(item._id, "approved")}>Approve</button>
                    <button className="action-btn reject-btn" onClick={() => updateWithdrawal(item._id, "rejected")}>Reject</button>
                  </>
                ) : (
                  <p>Action completed</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {adminTab === "deposits" && (
        <div className="admin-content">
          <h3>Deposit Requests</h3>
          <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginBottom: "20px"
  }}
>
  <div className="admin-card stat-total">
    <h4>Total</h4>
    <h2>{totalDeposits}</h2>
  </div>

  <div className="admin-card stat-pending">
    <h4>Pending</h4>
    <h2>{pendingDeposits}</h2>
  </div>

  <div className="admin-card stat-approved">
    <h4>Approved</h4>
    <h2>{approvedDeposits}</h2>
  </div>

  <div className="admin-card stat-rejected">
    <h4>Rejected</h4>
    <h2>{rejectedDeposits}</h2>
  </div>
</div>
<div
  style={{
    marginBottom: "15px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  }}
>
  <button className="tab" onClick={() => setDepositFilter("all")}>
    All
  </button>

  <button className="tab" onClick={() => setDepositFilter("pending")}>
    Pending
  </button>

  <button className="tab" onClick={() => setDepositFilter("approved")}>
    Approved
  </button>

  <button className="tab" onClick={() => setDepositFilter("rejected")}>
    Rejected
  </button>
</div>
          {filteredDeposits.length === 0 ? (
            <p>No deposit requests found.</p>
          ) : (
         filteredDeposits.map((item) => (
              <div className="admin-card" key={item._id}>
                <p>User: {safeText(item.userId?.name || item.userId?.email || item.email || "N/A")}</p>
                <p>Amount: {item.amount}</p>
                <p>Status: {item.status}</p>
                <p>Payment Method: {safeText(item.paymentMethod)}</p>
                <p>Sender Name: {safeText(item.senderName)}</p>
                <p>Sender Account: {safeText(item.senderAccount)}</p>
                <p>Transaction ID: {safeText(item.transactionId || item.txHash)}</p>
                <p>Network: {safeText(item.network)}</p>

                {item.status !== "approved" && item.status !== "rejected" ? (
                  <>
                    <button className="action-btn approve-btn" onClick={() => updateDeposit(item._id, "approved")}>Approve</button>
                    <button className="action-btn reject-btn" onClick={() => updateDeposit(item._id, "rejected")}>Reject</button>
                  </>
                ) : (
                  <p>Action completed</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
{adminTab === "web3" && (
  <div className="admin-content">
    <h3>Web3 Transactions</h3>

    <div className="admin-stats">
      <div className="stat-card"><h3>{web3Transactions.length}</h3><p>Total</p></div>
      <div className="stat-card"><h3>{web3SendCount}</h3><p>Send</p></div>
      <div className="stat-card"><h3>{web3ReceiveCount}</h3><p>Receive</p></div>
      <div className="stat-card"><h3>{web3SwapCount}</h3><p>Swap</p></div>
      <div className="stat-card"><h3>{web3SuccessCount}</h3><p>Success</p></div>
      <div className="stat-card"><h3>{web3PendingCount}</h3><p>Pending</p></div>
      <div className="stat-card"><h3>{web3FailedCount}</h3><p>Failed</p></div>
    </div>

    <div style={{ marginBottom: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <input
        type="text"
        placeholder="Search wallet, hash, coin, chain..."
        value={web3Search}
        onChange={(e) => {
          setWeb3Search(e.target.value);
          setWeb3Page(1);
        }}
        style={{
          flex: 1,
          minWidth: "240px",
          padding: "10px",
          borderRadius: "8px",
          background: "#1e2329",
          color: "#fff",
          border: "1px solid #f0b90b",
        }}
      />

      <select value={web3Filter} onChange={(e) => { setWeb3Filter(e.target.value); setWeb3Page(1); }}>
        <option value="ALL">All Types</option>
        <option value="Receive">Receive</option>
        <option value="Send">Send</option>
        <option value="Swap">Swap</option>
      </select>

      <select value={web3CoinFilter} onChange={(e) => { setWeb3CoinFilter(e.target.value); setWeb3Page(1); }}>
        {uniqueWeb3Coins.map((coin) => (
          <option key={coin} value={coin}>{coin === "ALL" ? "All Coins" : coin}</option>
        ))}
      </select>

      <select value={web3StatusFilter} onChange={(e) => { setWeb3StatusFilter(e.target.value); setWeb3Page(1); }}>
        <option value="ALL">All Status</option>
        <option value="success">Success</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
      </select>

      <select value={web3DateFilter} onChange={(e) => { setWeb3DateFilter(e.target.value); setWeb3Page(1); }}>
        <option value="ALL">All Time</option>
        <option value="TODAY">Today</option>
        <option value="7D">Last 7 Days</option>
        <option value="30D">Last 30 Days</option>
      </select>

      <button className="action-btn approve-btn" onClick={exportWeb3Csv}>
        Export CSV
      </button>
    </div>

    {filteredWeb3Transactions.length === 0 ? (
      <p>No Web3 transactions found.</p>
    ) : (
      <>
        {paginatedWeb3Transactions.map((tx) => (
          <div className="admin-card" key={tx._id || tx.hash}>
            <h4>
              {tx.type} {tx.coin}
              <span
                style={{
                  marginLeft: "10px",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  color:
                    tx.status === "success"
                      ? "#00ff88"
                      : tx.status === "pending"
                      ? "#ffaa00"
                      : "#ff4444",
                  background:
                    tx.status === "success"
                      ? "rgba(0,255,136,.12)"
                      : tx.status === "pending"
                      ? "rgba(255,170,0,.12)"
                      : "rgba(255,68,68,.12)",
                }}
              >
                {String(tx.status || "success").toUpperCase()}
              </span>
            </h4>

            <p><b>Wallet:</b> {shortText(tx.wallet)}</p>
            <p><b>Amount:</b> {tx.amount} {tx.coin}</p>
            <p><b>Chain:</b> {tx.chain || "BSC"}</p>
            <p><b>Hash:</b> {shortText(tx.hash)}</p>
            <p><b>Time:</b> {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "N/A"}</p>

            <button className="action-btn approve-btn" onClick={() => copyAdminText(tx.wallet, "Wallet")}>
              Copy Wallet
            </button>

            <button className="action-btn" onClick={() => copyAdminText(tx.hash, "Hash")} style={{ marginLeft: "8px" }}>
              Copy Hash
            </button>

            <button className="action-btn" onClick={() => openWeb3Explorer(tx)} style={{ marginLeft: "8px" }}>
              BscScan
            </button>
          </div>
        ))}

        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "15px" }}>
          <button
            className="tab"
            disabled={web3Page <= 1}
            onClick={() => setWeb3Page((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          <span>Page {web3Page} / {totalWeb3Pages}</span>

          <button
            className="tab"
            disabled={web3Page >= totalWeb3Pages}
            onClick={() => setWeb3Page((p) => Math.min(totalWeb3Pages, p + 1))}
          >
            Next
          </button>
        </div>
      </>
    )}
  </div>
)}
   

      {adminTab === "kyc" && (
        <div className="admin-content">
          <h3>User / Project KYC Requests</h3>
          <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginBottom: "20px"
  }}
>
  <div className="admin-card stat-total">
    <h4>Total</h4>
    <h2>{totalKyc}</h2>
  </div>

  <div className="admin-card stat-pending">
    <h4>Pending</h4>
    <h2>{pendingKyc}</h2>
  </div>

  <div className="admin-card stat-approved">
    <h4>Approved</h4>
    <h2>{approvedKyc}</h2>
  </div>

  <div className="admin-card stat-rejected">
    <h4>Rejected</h4>
    <h2>{rejectedKyc}</h2>
  </div>
</div>
<div style={{ marginBottom: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
  <button className="tab" onClick={() => setKycFilter("all")}>
    All
  </button>

  <button className="tab" onClick={() => setKycFilter("pending")}>
    Pending
  </button>

  <button className="tab" onClick={() => setKycFilter("approved")}>
    Approved
  </button>

  <button className="tab" onClick={() => setKycFilter("rejected")}>
    Rejected
  </button>
</div>
        {filteredKyc.length === 0 ? (
  <p>No KYC requests found.</p>
) : (
  filteredKyc.map((kyc) => (
              <div key={kyc._id} className="request-card">
                <p><b>Name:</b> {kyc.fullName}</p>
                <p><b>Email:</b> {kyc.email}</p>
                <p><b>Country:</b> {kyc.country}</p>
                <p><b>Wallet:</b> {kyc.walletAddress}</p>
                <p><b>ID Type:</b> {kyc.idType}</p>
                <p><b>ID Number:</b> {kyc.idNumber}</p>
                <p><b>Telegram:</b> {kyc.telegramUsername}</p>
                <p><b>Project:</b> {kyc.projectName}</p>
                <p><b>Status:</b> {kyc.status}</p>
              </div>
            ))
          )}
        </div>
      )}

      {adminTab === "support" && (
        <div className="admin-content">
          <h3>Support Tickets</h3>
          <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginBottom: "20px"
  }}
>
  <div className="admin-card stat-total">
    <h4>Total</h4>
    <h2>{totalTickets}</h2>
  </div>

  <div className="admin-card stat-pending">
    <h4>Open</h4>
    <h2>{openTickets}</h2>
  </div>

  <div className="admin-card stat-approved">
    <h4>Resolved</h4>
    <h2>{resolvedTickets}</h2>
  </div>

  <div className="admin-card stat-rejected">
    <h4>Closed</h4>
    <h2>{closedTickets}</h2>
  </div>
</div>
<div style={{
  marginBottom: "15px",
  display: "flex",
  gap: "10px",
  flexWrap: "wrap"
}}>
  <button className="tab" onClick={() => setSupportFilter("all")}>
    All
  </button>

  <button className="tab" onClick={() => setSupportFilter("open")}>
    Open
  </button>

  <button className="tab" onClick={() => setSupportFilter("resolved")}>
    Resolved
  </button>

  <button className="tab" onClick={() => setSupportFilter("closed")}>
    Closed
  </button>
</div>
          {tickets.length === 0 ? (
            <p>No support tickets found.</p>
          ) : (
            filteredTickets.map((item) => (
              <div className="admin-card" key={item._id}>
                <p>User: {item.userName || item.userEmail || item.email || item.user?.name || item.user?.email || item.user?._id || "N/A"}</p>
                <p>Message: {safeText(item.message)}</p>
                <p>Status: {safeText(item.status)}</p>

                <button className="action-btn resolve-btn" onClick={() => updateTicket(item._id, "resolved")}>Resolve</button>
                <button className="action-btn close-btn" onClick={() => updateTicket(item._id, "closed")}>Close</button>
              </div>
            ))
          )}
        </div>
      )}
{adminTab === "staking" && (
  <AdminStaking />
)}
{adminTab === "learn-earn" && (
  <AdminLearnEarn />
)}
{adminTab === "copy-trading" && (
  <AdminCopyTrading />
)}
{adminTab === "ai-portfolio" && (
  <AdminAIPortfolio />
)}
{adminTab === "social-trading" && (
  <AdminSocial />
)}

{adminTab === "ai-news" && <AdminAINews />}
{adminTab === "ai-market-scanner" && <AdminAIMarketScanner />}
{adminTab === "ai-profit" && <AdminAIProfit />}
{adminTab === "ai-risk" && <AdminAIRisk />}
{adminTab === "ai-whale-tracker" && <AdminAIWhaleTracker />}
{adminTab === "ai-arbitrage" && <AdminAIArbitrage />}
{adminTab === "ai-grid-trading" && <AdminAIGridTrading />}
{adminTab === "ai-smart-alerts" && <AdminAISmartAlerts />}
{adminTab === "ai-launchpad" && <AdminAILaunchpad />}
{adminTab === "ai-whale-heatmap" && <AdminAIWhaleHeatmap />}
{adminTab === "ai-trust-score" && <AdminAITrustScore />}
{adminTab === "ai-whale-alerts" && <AdminAIWhaleAlert />}
{adminTab === "exalt-utility" && <AdminExaltUtility />}
{adminTab === "reputation" && <AdminReputation />}
{adminTab === "achievements" && <AdminAchievement />}
{adminTab === "notifications" && <AdminNotifications />}
{adminTab === "spot-trading" && <AdminSpotTrading />}
{adminTab === "futures-admin" && <AdminFutures />}
{adminTab === "wallet-admin" && <AdminWallets />}
{adminTab === "audit-logs" && <AdminAuditLogs />}
{adminTab === "login-history" && <AdminLoginHistory />}
{adminTab === "account-deletion" && <AdminAccountDeletion />}
      {adminTab === "transactions" && (
        <div className="admin-content">
          <h3>Transaction History</h3>
          <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginBottom: "20px"
  }}
>
  <div className="admin-card stat-total">
    <h4>Total</h4>
    <h2>{totalAdminTransactions}</h2>
  </div>

  <div className="admin-card stat-pending">
    <h4>Deposits</h4>
    <h2>{depositTransactions}</h2>
  </div>

  <div className="admin-card stat-approved">
    <h4>Trades</h4>
    <h2>{tradeTransactions}</h2>
  </div>

  <div className="admin-card stat-rejected">
    <h4>Withdrawals</h4>
    <h2>{withdrawalTransactions}</h2>
  </div>
</div>

<div
  style={{
    marginBottom: "15px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  }}
>
  <button className="tab" onClick={() => setTransactionFilter("all")}>
    All
  </button>

  <button className="tab" onClick={() => setTransactionFilter("deposit")}>
    Deposits
  </button>

  <button className="tab" onClick={() => setTransactionFilter("trade")}>
    Trades
  </button>

  <button className="tab" onClick={() => setTransactionFilter("withdrawal")}>
    Withdrawals
  </button>
</div>
          {transactions.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
          filteredAdminTransactions.map((item) => (
              <div className="admin-card" key={item._id}>
                <p>Type: {safeText(item.type)}</p>
                <p>Amount: {safeText(item.amount)}</p>
                <p>Status: {safeText(item.status)}</p>
                <p>Note: {safeText(item.note)}</p>
                <p>Date: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}</p>
              </div>
            ))
          )}
        </div>
      )}
      {selectedListing && (
  <div className="modal-overlay">
    <div className="listing-modal">
      <button
        className="modal-close"
        onClick={() => setSelectedListing(null)}
      >
        ✕
      </button>

      <h2>{selectedListing.coinName || selectedListing.name || "Listing Details"}</h2>
      {selectedListing.logo && (
  <img
    src={selectedListing.logo}
    alt="logo"
    className="modal-logo"
  />
)}
      <p><strong>Symbol:</strong> {selectedListing.symbol || "N/A"}</p>
      <p><strong>Chain:</strong> {selectedListing.chain || "N/A"}</p>
      <p><strong>Contract:</strong> {selectedListing.contractAddress || selectedListing.contract || "N/A"}</p>
     <p>
  <strong>Status:</strong>{" "}
  <span className="status-badge">
    {selectedListing.status || "N/A"}
  </span>
</p>
      <p><strong>Risk Level:</strong> {selectedListing.riskLevel || "N/A"}</p>
     <p>
  <strong>Safety Score:</strong>{" "}
  <span
    style={{
      color:
        (selectedListing.safetyScore || 0) >= 80
          ? "#00ff88"
          : (selectedListing.safetyScore || 0) >= 50
          ? "#ffaa00"
          : "#ff4444",
      fontWeight: "bold"
    }}
  >

    {selectedListing.safetyScore || 0}/100
  </span>
</p>
      <p><strong>Owner:</strong> {selectedListing.ownerName || "N/A"}</p>
      <p><strong>Email:</strong> {selectedListing.ownerEmail || "N/A"}</p>
      <p><strong>Wallet:</strong> {selectedListing.ownerWallet || "N/A"}</p>
      <p><strong>Category:</strong> {selectedListing.projectCategory || "N/A"}</p>
      <p><strong>Price:</strong> {selectedListing.price || "N/A"}</p>
      <p><strong>Market Cap:</strong> {selectedListing.marketCap || "N/A"}</p>
      <p><strong>Liquidity:</strong> {selectedListing.liquidity || "N/A"}</p>
<div className="modal-badges">
  {selectedListing?.checks?.kycVerified && <span className="verify-badge">✅ KYC</span>}
  {selectedListing?.checks?.liquidityLocked && <span className="verify-badge">🔒 LP Locked</span>}
  {selectedListing?.checks?.auditAvailable && <span className="verify-badge">📄 Audit</span>}
  {selectedListing?.checks?.websiteVerified && <span className="verify-badge">🌐 Website</span>}
  {selectedListing?.checks?.telegramVerified && <span className="verify-badge">📢 Telegram</span>}
  {selectedListing?.checks?.xVerified && <span className="verify-badge">❎ X</span>}
  {selectedListing?.checks?.teamVerified && <span className="verify-badge">👥 Team</span>}
</div>
      <div className="modal-links">
        {selectedListing.website && <a href={selectedListing.website} target="_blank" rel="noreferrer">Website</a>}
        {selectedListing.telegram && <a href={selectedListing.telegram} target="_blank" rel="noreferrer">Telegram</a>}
        {selectedListing.twitter && <a href={selectedListing.twitter} target="_blank" rel="noreferrer">Twitter/X</a>}
        {selectedListing.whitepaper && <a href={selectedListing.whitepaper} target="_blank" rel="noreferrer">Whitepaper</a>}
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default AdminPanel;