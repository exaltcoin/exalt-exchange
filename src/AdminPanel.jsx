import { useEffect, useState } from "react";

function AdminPanel() {
  const [listings, setListings] = useState([]);

 const fetchListings = async () => {
  try {
    const res = await fetch(
      "https://exalt-exchange-backend.onrender.com/api/listings"
    );

    const data = await res.json();

    setListings(Array.isArray(data) ? data : data.listings || []);
  } catch (error) {
    console.log(error);
    alert("Failed to load listings");
  }
};
  useEffect(() => {
    fetchListings();
  }, []);

  const updateStatus = async (id, status) => {
  const res = await fetch("https://exalt-exchange-backend.onrender.com/api/listings/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": "exaltexchange789$$",
      },
      body: JSON.stringify({ id, status }),
    });

    const data = await res.json();
    alert(data.message || "Status updated");
    fetchListings();
  };

  return (
    <div className="panel">
      <h2>Admin Panel</h2>

      {listings.length === 0 ? (
        <p>No listings found</p>
      ) : (
        listings.map((coin) => (
          <div key={coin.id} className="admin-card">
            <h3>{coin.name} ({coin.symbol})</h3>
            <p>Chain: {coin.chain}</p>
            <p>Contract: {coin.contract}</p>
            <p>Status: {coin.status}</p>
            <p>Website: {coin.website}</p>
            <p>Telegram: {coin.telegram || "N/A"}</p>
            <p>X: {coin.twitter || "N/A"}</p>
            <p>Discord: {coin.discord || "N/A"}</p>

            <button className="buy-btn" onClick={() => updateStatus(coin.id, "approved")}>
              Approve
            </button>

            <br /><br />

            <button className="sell-btn" onClick={() => updateStatus(coin.id, "rejected")}>
              Reject
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default AdminPanel;