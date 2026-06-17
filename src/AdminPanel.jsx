import { useEffect, useState } from "react";

function AdminPanel() {
  const API = import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [listings, setListings] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [web3Transactions, setWeb3Transactions] = useState([]);
  const [web3Search, setWeb3Search] = useState("");
  const [web3Filter, setWeb3Filter] = useState("ALL");
  const [adminTab, setAdminTab] = useState("overview");
  const [listingFilter, setListingFilter] = useState("all");
  const [loading, setLoading] = useState(false);
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
const searchedListings = filteredListings.filter(
  (item) =>
    (item.coinName || item.name || "")
      .toLowerCase()
      .includes(webSearch.toLowerCase()) ||
    (item.symbol || "")
      .toLowerCase()
      .includes(webSearch.toLowerCase())
);
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
      setDeposits(depositsData.requests || depositsData.deposits || depositsData.data || depositsData || []);

      const withdrawalsRes = await fetch(`${API}/api/withdrawals`, { headers });
      const withdrawalsData = await withdrawalsRes.json();
      setWithdrawals(withdrawalsData.withdrawals || withdrawalsData.requests || withdrawalsData.data || withdrawalsData || []);

      const ticketsRes = await fetch(`${API}/api/support-ticket`, { headers });
      const ticketsData = await ticketsRes.json();
      setTickets(ticketsData.tickets || ticketsData.requests || ticketsData.data || ticketsData || []);

      const transactionsRes = await fetch(`${API}/api/transactions/admin`, { headers });
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.transactions || transactionsData.requests || transactionsData.data || transactionsData || []);

      const web3Res = await fetch(`${API}/api/web3-transactions`);
      const web3Data = await web3Res.json();
      setWeb3Transactions(web3Data.transactions || []);
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
        {searchedListings.length === 0 ? (
            <p>No listing requests found.</p>
          ) : (
        searchedListings.map((item) => (
              <div className="admin-card" key={item._id}>
                <h4>{item.coinName || item.name} ({item.symbol})</h4>
                <p>Chain: {item.chain}</p> 
    <p>
  Safety Score:
  <span
    style={{
      color:
        item.safetyScore >= 80
          ? "#00c853"
          : item.safetyScore >= 50
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
    {item.riskLevel}
  </span>
</p>                 
 <div className="contract-box">
  <span>Contract</span>

  <code>
    {item.contractAddress || item.contract}
  </code>

  <button
    className="action-btn"
    onClick={() =>
      navigator.clipboard.writeText(
        item.contractAddress || item.contract
      )
    }
  >
    📋 Copy Contract
  </button>
</div>
<div
  style={{
    marginTop: "10px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
  }}
>
 {item.checks?.kycVerified && (
  <span className="verify-badge">✅ KYC</span>
)}
 {item.checks?.liquidityLocked && (
  <span className="verify-badge">🔒 LP Locked</span>
)}
 {item.checks?.auditAvailable && (
  <span className="verify-badge">🛡 Audit</span>
)}
  {item.checks?.websiteVerified && (
  <span className="verify-badge">🌐 Website</span>
)}
 {item.checks?.telegramVerified && (
  <span className="verify-badge">📢 Telegram</span>
)}
  {item.checks?.xVerified && (
  <span className="verify-badge">❎ X</span>
)}
 {item.checks?.teamVerified && (
  <span className="verify-badge">👥 Team</span>
)}
</div>
 <p>             
  Logo:
 {item.logo && (
  <img
    src={item.logo}
    alt="logo"
    className="admin-coin-logo"
  />
)}
</p>
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
    {item.status?.toUpperCase()}
  </span>
</p>
<p><strong>Owner Name:</strong> {safeText(item.ownerName)}</p>
<p><strong>Owner Email:</strong> {safeText(item.ownerEmail)}</p>
<p><strong>Owner Wallet:</strong> {safeText(item.ownerWallet)}</p>
<p><strong>Project Category:</strong> {safeText(item.projectCategory)}</p>
<p><strong>Price:</strong> {safeText(item.price)}</p>
<p><strong>Market Cap:</strong> {safeText(item.marketCap)}</p>
<p><strong>Liquidity:</strong> {safeText(item.liquidity)}</p>
<p>
  <div style={{ marginTop: "10px" }}>
    {(item.contractAddress || item.contract) && (
  <a
    href={`https://bscscan.com/token/${item.contractAddress || item.contract}`}
    target="_blank"
    rel="noreferrer"
    className="action-btn"
  >
    View Contract
  </a>
)}
{item.twitter && (
  <a
    href={item.twitter}
    target="_blank"
    rel="noreferrer"
    className="action-btn"
  >
    Twitter
  </a>
)}
  {item.website && (
    <a
      href={item.website}
      target="_blank"
      rel="noreferrer"
      className="action-btn"
    >
      Website
    </a>
  )}

  {item.telegram && (
    <a
      href={item.telegram}
      target="_blank"
      rel="noreferrer"
      className="action-btn"
    >
      Telegram
    </a>
  )}

  {item.whitepaper && (
    <a
      href={item.whitepaper}
      target="_blank"
      rel="noreferrer"
      className="action-btn"
    >
      Whitepaper
    </a>
  )}
 <div style={{ marginTop: "15px" }}>
  <button
    className="approve-btn"
    onClick={() => updateListingStatus(item._id, "approved")}
  >
    ✅ Approve
  </button>

  <button
    className="reject-btn"
    onClick={() => updateListingStatus(item._id, "rejected")}
    style={{ marginLeft: "10px" }}
  >
    ❌ Reject
  </button>
</div> 
<div style={{ marginTop: "15px" }}>
  <p>
    ⭐ Safety Score:
    <span style={{ color: "#00ff88", fontWeight: "bold", marginLeft: "8px" }}>
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
        marginLeft: "8px"
      }}
    >
      {item.riskLevel}
    </span>
  </p>

  <div style={{ marginTop: "10px" }}>
    {item.checks?.kycVerified && <span>✅ KYC </span>}
    {item.checks?.liquidityLocked && <span>🔒 LP Locked </span>}
    {item.checks?.auditAvailable && <span>📋 Audit </span>}
    {item.checks?.websiteVerified && <span>🌐 Website </span>}
    {item.checks?.telegramVerified && <span>📢 Telegram </span>}
    {item.checks?.xVerified && <span>❌ X </span>}
    {item.checks?.teamVerified && <span>👥 Team </span>}
  </div>
</div>
</div>
 </p>
                {item.status !== "approved" && item.status !== "rejected" ? (
                  <>
                  </>
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

          <div style={{ marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="Search wallet or hash..."
              value={web3Search}
              onChange={(e) => setWeb3Search(e.target.value)}
              style={{ width: "60%", padding: "8px", marginRight: "10px" }}
            />

            <select value={web3Filter} onChange={(e) => setWeb3Filter(e.target.value)} style={{ padding: "8px" }}>
              <option value="ALL">All</option>
              <option value="Receive">Receive</option>
              <option value="Send">Send</option>
              <option value="Swap">Swap</option>
            </select>
          </div>

          {web3Transactions.length === 0 ? (
            <p>No Web3 transactions found.</p>
          ) : (
            web3Transactions
              .filter((tx) => {
                const matchFilter = web3Filter === "ALL" || tx.type === web3Filter;
                const search = web3Search.toLowerCase();
                const matchSearch =
                  !search ||
                  tx.wallet?.toLowerCase().includes(search) ||
                  tx.hash?.toLowerCase().includes(search) ||
                  tx.coin?.toLowerCase().includes(search);
                return matchFilter && matchSearch;
              })
              .map((tx) => (
                <div className="admin-card" key={tx._id}>
                  <p><b>Wallet:</b> {tx.wallet}</p>
                  <p><b>Type:</b> {tx.type}</p>
                  <p><b>Coin:</b> {tx.coin}</p>
                  <p><b>Amount:</b> {tx.amount}</p>
                  <p><b>Status:</b> {tx.status}</p>
                  <p><b>Chain:</b> {tx.chain}</p>
                  <p><b>Time:</b> {new Date(tx.createdAt).toLocaleString()}</p>
                  <p><b>Hash:</b> {tx.hash}</p>
                </div>
              ))
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
    </div>
  );
}

export default AdminPanel;