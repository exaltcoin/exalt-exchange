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
const filteredListings = listings.filter((item) => {
  if (listingFilter === "all") return true;
  return item.status === listingFilter;
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
 <div style={{ marginBottom: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>

  <button className="action-btn" onClick={() => setListingFilter("all")}>
    All
  </button>

  <button className="action-btn" onClick={() => setListingFilter("pending")}>
    Pending
  </button>

  <button className="action-btn" onClick={() => setListingFilter("approved")}>
    Approved
  </button>

  <button className="action-btn" onClick={() => setListingFilter("rejected")}>
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
                <p>Chain: {item.chain}</p>      
 <p>
  Contract:
  <code>{item.contractAddress || item.contract}</code>
</p>
<button
  className="action-btn"
  onClick={() =>
    navigator.clipboard.writeText(
      item.contractAddress || item.contract
    )
  }
>
  Copy Contract
</button>
 <p>             
  Logo:
  {item.logo && (
    <img
      src={item.logo}
      alt="logo"
      style={{
        width: "50px",
        height: "50px",
        marginLeft: "10px",
        borderRadius: "50%",
        objectFit: "cover"
      }}
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
<p>Owner Name: {safeText(item.ownerName)}</p>
<p>Owner Email: {safeText(item.ownerEmail)}</p>
<p>Owner Wallet: {safeText(item.ownerWallet)}</p>
<p>Project Category: {safeText(item.projectCategory)}</p>
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
</div>
 </p>
                {item.status !== "approved" && item.status !== "rejected" ? (
                  <>
                    <button className="action-btn approve-btn" onClick={() => updateListing(item._id, "approved")}>Approve</button>
                    <button className="action-btn reject-btn" onClick={() => updateListing(item._id, "rejected")}>Reject</button>
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
          {withdrawals.length === 0 ? (
            <p>No withdrawal requests found.</p>
          ) : (
            withdrawals.map((item) => (
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
          {deposits.length === 0 ? (
            <p>No deposit requests found.</p>
          ) : (
            deposits.map((item) => (
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
          {kycRequests.length === 0 ? (
            <p>No KYC requests found.</p>
          ) : (
            kycRequests.map((kyc) => (
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
          {tickets.length === 0 ? (
            <p>No support tickets found.</p>
          ) : (
            tickets.map((item) => (
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
          {transactions.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
            transactions.map((item) => (
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