import { useEffect, useState } from "react";

function ListingForm() {
  const API =
    import.meta.env.VITE_API_URL ||
    "https://exalt-exchange-backend.onrender.com";

  const emptyForm = {
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
  };

  const [form, setForm] = useState(emptyForm);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingListings, setLoadingListings] = useState(true);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const safe = (value) => value || "N/A";

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase();

    if (s === "approved") return "status-approved";
    if (s === "rejected") return "status-rejected";
    return "status-pending";
  };

  const loadMyListings = async () => {
    try {
      setLoadingListings(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setMyListings([]);
        return;
      }

      const response = await fetch(`${API}/api/listings/my-listings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMyListings(Array.isArray(data.listings) ? data.listings : []);
      } else {
        setMyListings([]);
      }
    } catch (error) {
      console.log("My listings load error:", error);
      setMyListings([]);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    loadMyListings();
  }, []);

  const validateForm = () => {
    if (!form.name.trim()) return "Coin name is required";
    if (!form.symbol.trim()) return "Symbol is required";
    if (!form.chain.trim()) return "Chain is required";
    if (!form.contract.trim()) return "Contract address is required";
    if (!form.website.trim()) return "Website URL is required";

    return "";
  };

  const submitListing = async (e) => {
    e.preventDefault();

    const errorMessage = validateForm();

    if (errorMessage) {
      alert(errorMessage);
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first");
        return;
      }

      const response = await fetch(`${API}/api/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coinName: form.name.trim(),
          symbol: form.symbol.trim().toUpperCase(),
          network: form.chain,
          chain: form.chain,
          contractAddress: form.contract.trim(),
          website: form.website.trim(),
          logo: form.logo.trim(),
          telegram: form.telegram.trim(),
          twitter: form.twitter.trim(),
          discord: form.discord.trim(),
          chart: form.chart.trim(),
          buy: form.buy.trim(),
          price: form.price,
          marketCap: form.marketCap,
          liquidity: form.liquidity,
          ownerName: form.ownerName.trim(),
          ownerEmail: form.ownerEmail.trim(),
          ownerWallet: form.ownerWallet.trim(),
          projectCategory: form.projectCategory.trim(),
          whitepaper: form.whitepaper.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        alert("Listing submitted successfully ✅");
        setForm(emptyForm);
        loadMyListings();
      } else {
        alert(data.message || "Submission failed");
      }
    } catch (error) {
      console.log(error);
      alert("Backend not connected");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel listing-page">
      <div className="listing-header">
        <div>
          <h2>Submit Coin Listing</h2>
          <p>Submit your token for Exalt Exchange review and approval.</p>
        </div>

        <button className="action-btn yellow-btn" onClick={loadMyListings}>
          Refresh Listings
        </button>
      </div>

      <form className="listing-form-pro" onSubmit={submitListing}>
        <div className="listing-section-title">Project Information</div>

        <input
          name="name"
          placeholder="Coin Name *"
          value={form.name}
          onChange={update}
        />

        <input
          name="symbol"
          placeholder="Symbol *"
          value={form.symbol}
          onChange={update}
        />

        <select name="chain" value={form.chain} onChange={update}>
          <option>BNB Smart Chain</option>
          <option>Ethereum</option>
          <option>Polygon</option>
          <option>Solana</option>
          <option>Base</option>
          <option>Arbitrum</option>
          <option>Other</option>
        </select>

        <input
          name="contract"
          placeholder="Contract Address *"
          value={form.contract}
          onChange={update}
        />

        <input
          name="website"
          placeholder="Website URL *"
          value={form.website}
          onChange={update}
        />

        <input
          name="logo"
          placeholder="Logo URL"
          value={form.logo}
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

        <div className="listing-section-title">Community Links</div>

        <input
          name="telegram"
          placeholder="Telegram Link"
          value={form.telegram}
          onChange={update}
        />

        <input
          name="twitter"
          placeholder="X / Twitter Link"
          value={form.twitter}
          onChange={update}
        />

        <input
          name="discord"
          placeholder="Discord Link"
          value={form.discord}
          onChange={update}
        />

        <input
          name="chart"
          placeholder="Chart Link / DexScreener"
          value={form.chart}
          onChange={update}
        />

        <input
          name="buy"
          placeholder="Buy Link / PancakeSwap"
          value={form.buy}
          onChange={update}
        />

        <div className="listing-section-title">Market Details</div>

        <input
          name="price"
          placeholder="Live Price"
          value={form.price}
          onChange={update}
        />

        <input
          name="marketCap"
          placeholder="Market Cap"
          value={form.marketCap}
          onChange={update}
        />

        <input
          name="liquidity"
          placeholder="Liquidity"
          value={form.liquidity}
          onChange={update}
        />

        <div className="listing-section-title">Owner Details</div>

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

        <button type="submit" className="deposit-btn" disabled={loading}>
          {loading ? "Submitting..." : "Submit Listing"}
        </button>
      </form>

      <div className="my-listings-header">
        <h2>My Listings</h2>
        <p>Your submitted listings and review status.</p>
      </div>

      {loadingListings ? (
        <p>Loading listings...</p>
      ) : myListings.length === 0 ? (
        <p style={{ color: "#aaa" }}>No listings submitted yet.</p>
      ) : (
        <div className="my-listings-grid">
          {myListings.map((item) => (
            <div className="listing-card-pro" key={item._id}>
              <div className="listing-card-top">
                {item.logo ? (
                  <img
                    src={item.logo}
                    alt={item.symbol}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="coin-logo-fallback">
                    {String(item.symbol || "C").charAt(0)}
                  </div>
                )}

                <div>
                  <h3>
                    {safe(item.coinName)} ({safe(item.symbol)})
                  </h3>
                  <p>{safe(item.network || item.chain)}</p>
                </div>
              </div>

              <div className="listing-info-box">
                <div className="info-row">
                  <span className="info-label">Status</span>
                  <span className={getStatusClass(item.status)}>
                    {safe(item.status).toUpperCase()}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Risk Level</span>
                  <span className="info-value">{safe(item.riskLevel)}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Price</span>
                  <span className="info-value">${safe(item.price)}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Market Cap</span>
                  <span className="info-value">${safe(item.marketCap)}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Liquidity</span>
                  <span className="info-value">${safe(item.liquidity)}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Contract</span>
                  <span className="info-value break-text">
                    {safe(item.contractAddress)}
                  </span>
                </div>
              </div>

              <div className="listing-links">
                {item.website && (
                  <a href={item.website} target="_blank" rel="noreferrer">
                    Website
                  </a>
                )}

                {item.telegram && (
                  <a href={item.telegram} target="_blank" rel="noreferrer">
                    Telegram
                  </a>
                )}

                {item.twitter && (
                  <a href={item.twitter} target="_blank" rel="noreferrer">
                    X
                  </a>
                )}

                {item.chart && (
                  <a href={item.chart} target="_blank" rel="noreferrer">
                    Chart
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ListingForm;