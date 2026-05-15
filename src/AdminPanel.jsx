import { useEffect, useState } from "react";

function AdminPanel() {
  const API = "https://exalt-exchange-backend.onrender.com";
  const ADMIN_KEY = "exaltexchange786$$";

  const [listings, setListings] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [tickets, setTickets] = useState([]);

 const loadAdminData = async () => {
  try {
    const headers = {
      "x-admin-key": ADMIN_KEY,
    };

    const listingsRes = await fetch(`${API}/api/listings`, {
      headers,
    });

    const listingsData = await listingsRes.json();
    setListings(listingsData.listings || []);

    const depositsRes = await fetch(`${API}/api/deposit-request`, {
      headers,
    });

    const depositsData = await depositsRes.json();
    setDeposits(depositsData.requests || []);

    const ticketsRes = await fetch(`${API}/api/support-ticket`, {
      headers,
    });

    const ticketsData = await ticketsRes.json();
    setTickets(ticketsData.tickets || []);
  } catch (error) {
    console.log(error);
    alert("Admin data load failed");
  }
};

  useEffect(() => {
    loadAdminData();
  }, []);

  const updateListing = async (id, status) => {
    await fetch(`${API}/api/listings/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY,
      },
      body: JSON.stringify({ id, status }),
    });

    loadAdminData();
  };

  const updateDeposit = async (id, status) => {
    await fetch(`${API}/api/deposit-request/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY,
      },
      body: JSON.stringify({ id, status }),
    });

    loadAdminData();
  };

  const updateTicket = async (id, status) => {
    await fetch(`${API}/api/support-ticket/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY,
      },
      
      body: JSON.stringify({ id, status }),
    });

    loadAdminData();
  };

  return (
    <div className="panel">
      <h2>Real Admin Panel</h2>
      <p>Manage listings, deposits, support tickets and approvals.</p>

      <div className="admin-card">
        <h3>Coin Listing Requests</h3>

        {listings.length === 0 ? (
          <p>No listing requests found.</p>
        ) : (
          listings.map((coin) => (
            <div className="admin-card" key={coin.id || coin._id || coin.contract}>
              <h3>{coin.name} ({coin.symbol})</h3>
              <p>Chain: {coin.chain}</p>
              <p>Contract: {coin.contract}</p>
              <p>Website: {coin.website}</p>
              <p>Status: {coin.status}</p>

              <button
                className="buy-btn"
                onClick={() => updateListing(coin.id || coin._id, "approved")}
              >
                Approve
              </button>

              <button
                className="sell-btn"
                onClick={() => updateListing(coin.id || coin._id, "rejected")}
              >
                Reject
              </button>
            </div>
          ))
        )}
      </div>

      <div className="admin-card">
        <h3>Deposit Requests</h3>

        {deposits.length === 0 ? (
          <p>No deposit requests found.</p>
        ) : (
          deposits.map((item) => (
            <div className="admin-card" key={item.id}>
              <p>Name: {item.name}</p>
              <p>Wallet: {item.wallet}</p>
              <p>Amount: {item.amount}</p>
              <p>Payment Method: {item.paymentMethod}</p>
              <p>Transaction ID: {item.transactionId}</p>
              <p>Status: {item.status}</p>

              <button
                className="buy-btn"
                onClick={() => updateDeposit(item.id, "approved")}
              >
                Approve Deposit
              </button>

              <button
                className="sell-btn"
                onClick={() => updateDeposit(item.id, "rejected")}
              >
                Reject Deposit
              </button>
            </div>
          ))
        )}
      </div>

      <div className="admin-card">
        <h3>Support Tickets</h3>

        {tickets.length === 0 ? (
          <p>No support tickets found.</p>
        ) : (
          tickets.map((ticket) => (
            <div className="admin-card" key={ticket.id}>
              <p>Wallet: {ticket.wallet}</p>
              <p>Issue: {ticket.issue}</p>
              <p>Status: {ticket.status}</p>

              <button
                className="buy-btn"
                onClick={() => updateTicket(ticket.id, "resolved")}
              >
                Mark Resolved
              </button>

              <button
                className="sell-btn"
                onClick={() => updateTicket(ticket.id, "closed")}
              >
                Close Ticket
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminPanel;