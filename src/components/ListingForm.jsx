import { useEffect, useState } from "react";

function ListingForm() {
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    chain: "BNB Smart Chain",
    contract: "",
    website: "",
    telegram: "",
    twitter: "",
    discord: "",
    chart: "",
    buy: "",
    price: "",
marketCap: "",
liquidity: "",
logo: "",
  });
const [myListings, setMyListings] = useState([]);
useEffect(() => {
  const loadMyListings = async () => {
    try {
      const API = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem("token");

      const response = await fetch(`${API}/api/listings/my-listings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMyListings(data.listings);
      }
    } catch (error) {
      console.log(error);
    }
  };

  loadMyListings();
}, []);
  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitListing = async (e) => {
  e.preventDefault();
console.log(form);
  try {
   const API = import.meta.env.VITE_API_URL;

const response = await fetch(`${API}/api/listings`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    coinName: form.name,
    symbol: form.symbol,
    network: form.chain,
    contractAddress: form.contract,
    website: form.website,
    telegram: form.telegram,
    twitter: form.twitter,
    chart: form.chart,
    buy: form.buy,
    price: form.price,
    marketCap: form.marketCap,
    liquidity: form.liquidity,
    ownerName: form.ownerName,
    ownerEmail: form.ownerEmail,
    ownerWallet: form.ownerWallet,
    projectCategory: form.projectCategory,
    whitepaper: form.whitepaper,
  }),
});

    const data = await response.json();

    if (response.ok) {
      alert("Listing Submitted Successfully ✅");

      setForm({
        name: "",
        symbol: "",
        chain: "BNB Smart Chain",
        contract: "",
        website: "",
        telegram: "",
        twitter: "",
        discord: "",
        chart: "",
        buy: "",
        price: "",
marketCap: "",
liquidity: "",
logo: "",
ownerName: "",
ownerEmail: "",
ownerWallet: "",
projectCategory: "",
whitepaper: "",
      });
    } else {
      alert(data.message || "Submission failed");
    }
  } catch (error) {
    console.log(error);
    alert("Backend not connected");
  }
};

  return (
    <div className="panel">
      <h2>Submit Coin Listing</h2>

      <form className="listing-form" onSubmit={submitListing}>
        <input name="name" placeholder="Coin Name" value={form.name} onChange={update} />
        <input name="symbol" placeholder="Symbol" value={form.symbol} onChange={update} />
        <input name="chain" placeholder="Chain" value={form.chain} onChange={update} />
        <input name="contract" placeholder="Contract Address" value={form.contract} onChange={update} />
        <input name="website" placeholder="Website URL" value={form.website} onChange={update} />
        <input name="logo" placeholder="Logo URL" value={form.logo} onChange={update} />
        <input name="telegram" placeholder="Telegram Link" value={form.telegram} onChange={update} />
        <input name="twitter" placeholder="X / Twitter Link" value={form.twitter} onChange={update} />
        <input name="discord" placeholder="Discord Link" value={form.discord} onChange={update} />
        <input name="chart" placeholder="Chart Link / DexScreener" value={form.chart} onChange={update} />
        <input name="buy" placeholder="Buy Link / PancakeSwap" value={form.buy} onChange={update} />
        <input name="price" placeholder="Live Price" value={form.price} onChange={update} />
<input name="marketCap" placeholder="Market Cap" value={form.marketCap} onChange={update} />
<input name="liquidity" placeholder="Liquidity" value={form.liquidity} onChange={update} />
<input
  name="ownerName"
  placeholder="Owner Name"
  value={form.ownerName}
  onChange={update}
/>

<input
  name="ownerEmail"
  placeholder="Owner Email"
  value={form.ownerEmail}
  onChange={update}
/>

<input
  name="ownerWallet"
  placeholder="Owner Wallet Address"
  value={form.ownerWallet}
  onChange={update}
/>

<input
  name="projectCategory"
  placeholder="Project Category"
  value={form.projectCategory}
  onChange={update}
/>

<input
  name="whitepaper"
  placeholder="Whitepaper URL"
  value={form.whitepaper}
  onChange={update}
/>

        <button type="submit" className="buy-btn">
          Submit Listing
        </button>
      </form>
      <h2 style={{ marginTop: "40px", color: "#f7a600" }}>
  My Listings
</h2>

{myListings.length === 0 ? (
  <p style={{ color: "#aaa" }}>No listings submitted yet.</p>
) : (
  myListings.map((item) => (
    <div className="admin-card" key={item._id}>
      <h3>
        {item.coinName} ({item.symbol})
      </h3>

      <p><strong>Chain:</strong> {item.network}</p>

      <p>
        <strong>Status:</strong>
        <span
          style={{
            color:
              item.status === "approved"
                ? "#00ff88"
                : item.status === "rejected"
                ? "#ff4444"
                : "#ffb300",
            fontWeight: "bold",
            marginLeft: "8px",
          }}
        >
          {item.status?.toUpperCase()}
        </span>
      </p>

      <p><strong>Contract:</strong> {item.contractAddress}</p>

      <p><strong>Price:</strong> ${item.price}</p>

      <p><strong>Market Cap:</strong> ${item.marketCap}</p>

      <p><strong>Liquidity:</strong> ${item.liquidity}</p>

      <p>
        <strong>Risk Level:</strong>
        <span
          style={{
            color:
              item.riskLevel === "Low Risk"
                ? "#00ff88"
                : item.riskLevel === "Medium Risk"
                ? "#ffb300"
                : "#ff4444",
            marginLeft: "8px",
            fontWeight: "bold",
          }}
        >
          {item.riskLevel}
        </span>
      </p>

      {item.website && (
        <a href={item.website} target="_blank" rel="noreferrer">
          Website
        </a>
      )}

      {" | "}

      {item.telegram && (
        <a href={item.telegram} target="_blank" rel="noreferrer">
          Telegram
        </a>
      )}

      {" | "}

      {item.twitter && (
        <a href={item.twitter} target="_blank" rel="noreferrer">
          X
        </a>
      )}
    </div>
  ))
)}
    </div>
  );
}

export default ListingForm;