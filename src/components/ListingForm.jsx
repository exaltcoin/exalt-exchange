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
  });

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitListing = async (e) => {
    e.preventDefault();

    if (!form.name || !form.symbol || !form.contract || !form.website) {
      alert("Coin Name, Symbol, Contract, Website required");
      return;
    }

   try {
  const res = await fetch("https://exalt-exchange-backend.onrender.com/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
      const data = await res.json();

      alert(data.message || "Listing submitted");

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
      });
    } catch {
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
        <input name="telegram" placeholder="Telegram Link" value={form.telegram} onChange={update} />
        <input name="twitter" placeholder="X / Twitter Link" value={form.twitter} onChange={update} />
        <input name="discord" placeholder="Discord Link" value={form.discord} onChange={update} />
        <input name="chart" placeholder="Chart Link / DexScreener" value={form.chart} onChange={update} />
        <input name="buy" placeholder="Buy Link / PancakeSwap" value={form.buy} onChange={update} />

        <button type="submit" className="buy-btn">
          Submit Listing
        </button>
      </form>
    </div>
  );
}

export default ListingForm;