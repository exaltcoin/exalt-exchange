import { useState } from "react";

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

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitListing = async (e) => {
  e.preventDefault();

  try {
   const API = import.meta.env.VITE_API_URL;

const response = await fetch(
  `${API}/api/listings`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  }
);

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
    </div>
  );
}

export default ListingForm;