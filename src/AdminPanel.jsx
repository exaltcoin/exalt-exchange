import { useEffect, useState } from "react";

function AdminPanel() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY;
  const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));
  const [listings, setListings] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [transactions, setTransactions] = useState([]);
const [withdrawals, setWithdrawals] = useState([]);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-admin-key": ADMIN_KEY,
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

      setListings(
        listingsData.listings ||
          listingsData.requests ||
          listingsData ||
          []
      );

      const depositsRes = await fetch(`${API}/api/deposit-request`, { headers });
const depositsData = await depositsRes.json();

setDeposits(
  depositsData.requests ||
  depositsData.deposits ||
  depositsData.data ||
  depositsData ||
  []
);
const withdrawalsRes = await fetch(`${API}/api/withdrawals`, { headers });
const withdrawalsData = await withdrawalsRes.json();

setWithdrawals(
  withdrawalsData.withdrawals || []
);
const ticketsRes = await fetch(`${API}/api/support-ticket`, { headers });
const ticketsData = await ticketsRes.json();

setTickets(
  ticketsData.tickets ||
  ticketsData.requests ||
  ticketsData.data ||
  ticketsData ||
  []
);
const transactionsRes = await fetch(`${API}/api/transactions`, { headers });
const transactionsData = await transactionsRes.json();

setTransactions(
  transactionsData.transactions ||
  transactionsData.data ||
  []
);
} catch (error) {
    console.log(error);
    alert("Admin data load failed");
  }
};
 useEffect(() => {
  loadAdminData();

  const interval = setInterval(() => {
    loadAdminData();
  }, 5000);

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
      <p>Manage listings, deposits, support tickets and approvals.</p>

      <h3>Coin Listing Requests</h3>

      {listings.length === 0 ? (
        <p>No listing requests found.</p>
      ) : (
        listings.map((item) => (
          <div className="admin-card" key={item._id}>
            <h4>
              {item.coinName || item.name} ({item.symbol})
            </h4>

            <p>Chain: {item.chain}</p>
            <p>Contract: {item.contractAddress || item.contract}</p>
            <p>Website: {item.website}</p>
            <p>Status: {item.status}</p>

      {item.status !== "approved" && item.status !== "rejected" ? (
  <>
    <button onClick={() => updateListing(item._id, "approved")}>
      Approve
    </button>

    <button onClick={() => updateListing(item._id, "rejected")}>
      Reject
    </button>
  </>
) : (
  <p>Action completed</p>
)}
          </div>
        ))
      )}

      <h3>Deposit Requests</h3>

      {deposits.length === 0 ? (
        <p>No deposit requests found.</p>
      ) : (
        deposits.map((item) => (
          <div className="admin-card" key={item._id}>
            <p>User: {item.email || item.user}</p>
            <p>Amount: {item.amount}</p>
            <p>Status: {item.status}</p>

           {item.status !== "approved" && item.status !== "rejected" ? (
  <>
    <button onClick={() => updateDeposit(item._id, "approved")}>
      Approve
    </button>

    <button onClick={() => updateDeposit(item._id, "rejected")}>
      Reject
    </button>
  </>
) : (
  <p>Action completed</p>
)}
          </div>
        ))
      )}
<h3>Withdrawal Requests</h3>

{withdrawals.map((item) => (
  <div key={item._id} className="admin-card">
    <p>User: {item.userId}</p>
    <p>Amount: {item.amount}</p>
    <p>Status: {item.status}</p>
    <p>Wallet: {item.walletAddress}</p>

    {item.status === "pending" && (
      <>
        <button
          onClick={() => updateWithdrawal(item._id, "approved")}
        >
          Approve
        </button>

        <button
          onClick={() => updateWithdrawal(item._id, "rejected")}
        >
          Reject
        </button>
      </>
    )}
  </div>
))}
      <h3>Support Tickets</h3>

      {tickets.length === 0 ? (
        <p>No support tickets found.</p>
      ) : (
        tickets.map((item) => (
          <div className="admin-card" key={item._id}>
            <p>User: {item.email || item.user}</p>
            <p>Message: {item.message}</p>
            <p>Status: {item.status}</p>

            <button onClick={() => updateTicket(item._id, "resolved")}>
              Resolve
            </button>

            <button onClick={() => updateTicket(item._id, "closed")}>
              Close
            </button>
          </div>
        ))
      )}
      <h3>Transaction History</h3>

{transactions.length === 0 ? (
  <p>No transactions found.</p>
) : (
  transactions.map((item) => (
    <div className="admin-card" key={item._id}>
      <p>Type: {item.type}</p>
      <p>Amount: {item.amount}</p>
      <p>Status: {item.status}</p>
      <p>Note: {item.note}</p>
      <p>Date: {new Date(item.createdAt).toLocaleString()}</p>
    </div>
  ))
)}
    </div>
  );
}

export default AdminPanel;