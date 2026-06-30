import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AILaunchpad.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AILaunchpad() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    projectName: "New Launchpad Project",
    symbol: "TOKEN",
    chain: "BNB Chain",
    category: "Utility",
    tokenPrice: 0.01,
    hardCap: 100000,
    softCap: 50000,
    raisedAmount: 0,
    minBuy: 10,
    maxBuy: 1000,
    website: "",
    telegram: "",
    twitter: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-launchpad`);
      setProjects(res.data?.projects || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI Launchpad");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createProject = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);

      await axios.post(
        `${API_BASE}/api/ai-launchpad`,
        {
          ...form,
          tokenPrice: Number(form.tokenPrice),
          hardCap: Number(form.hardCap),
          softCap: Number(form.softCap),
          raisedAmount: Number(form.raisedAmount),
          minBuy: Number(form.minBuy),
          maxBuy: Number(form.maxBuy),
        },
        authHeaders
      );

      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create launchpad project");
    } finally {
      setCreating(false);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-launchpad/favorite/${id}`, {}, authHeaders);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update favorite");
    }
  };

  if (loading) {
    return <div className="launch-page">Loading AI Launchpad...</div>;
  }

  const featured = projects.find((item) => item.featured) || projects[0];

  return (
    <div className="launch-page">
      <div className="launch-header">
        <div>
          <h1>AI Launchpad</h1>
          <p>
            Discover token launches with AI score, risk level, audit, KYC,
            raised amount and launch status.
          </p>
        </div>

        <button onClick={fetchProjects}>Refresh</button>
      </div>

      {error && <div className="launch-error">{error}</div>}

      {featured && (
        <div className="launch-featured">
          <div>
            <span>Featured Launch</span>
            <h2>{featured.projectName}</h2>
            <p>{featured.description}</p>

            <div className="launch-tags">
              <b>{featured.symbol}</b>
              <b>{featured.chain}</b>
              <b>{featured.category}</b>
              {featured.verified && <b>Verified</b>}
            </div>
          </div>

          <div className="launch-score">
            <span>AI Score</span>
            <strong>{featured.aiScore}%</strong>
            <small>{featured.riskLevel} Risk</small>
          </div>
        </div>
      )}

      <div className="launch-layout">
        <form className="launch-form-card" onSubmit={createProject}>
          <h2>Create Launchpad Project</h2>

          <div className="launch-input-grid">
            <label>
              Project Name
              <input name="projectName" value={form.projectName} onChange={handleChange} />
            </label>

            <label>
              Symbol
              <input name="symbol" value={form.symbol} onChange={handleChange} />
            </label>

            <label>
              Chain
              <select name="chain" value={form.chain} onChange={handleChange}>
                <option>BNB Chain</option>
                <option>Ethereum</option>
                <option>Polygon</option>
                <option>Solana</option>
                <option>Arbitrum</option>
                <option>Base</option>
              </select>
            </label>

            <label>
              Category
              <select name="category" value={form.category} onChange={handleChange}>
                <option>Meme</option>
                <option>DeFi</option>
                <option>GameFi</option>
                <option>AI</option>
                <option>RWA</option>
                <option>Exchange</option>
                <option>Utility</option>
              </select>
            </label>

            <label>
              Token Price
              <input name="tokenPrice" type="number" value={form.tokenPrice} onChange={handleChange} />
            </label>

            <label>
              Hard Cap
              <input name="hardCap" type="number" value={form.hardCap} onChange={handleChange} />
            </label>

            <label>
              Soft Cap
              <input name="softCap" type="number" value={form.softCap} onChange={handleChange} />
            </label>

            <label>
              Raised Amount
              <input name="raisedAmount" type="number" value={form.raisedAmount} onChange={handleChange} />
            </label>

            <label>
              Min Buy
              <input name="minBuy" type="number" value={form.minBuy} onChange={handleChange} />
            </label>

            <label>
              Max Buy
              <input name="maxBuy" type="number" value={form.maxBuy} onChange={handleChange} />
            </label>
          </div>

          <label className="launch-full-label">
            Description
            <textarea name="description" value={form.description} onChange={handleChange} />
          </label>

          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Launchpad Project"}
          </button>
        </form>

        <div className="launch-list-card">
          <div className="launch-list-head">
            <h2>Launchpad Projects</h2>
            <span>{projects.length} records</span>
          </div>

          <div className="launch-list">
            {projects.map((item) => {
              const progress =
                item.hardCap > 0 ? Math.min(100, (item.raisedAmount / item.hardCap) * 100) : 0;

              return (
                <div className="launch-card" key={item._id}>
                  <div className="launch-card-top">
                    <div>
                      <h3>{item.projectName}</h3>
                      <p>{item.symbol} • {item.chain} • {item.category}</p>
                    </div>

                    <span className={`launch-status ${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="launch-progress">
                    <div style={{ width: `${progress}%` }} />
                  </div>

                  <div className="launch-card-grid">
                    <span>Raised: <b>{formatMoney(item.raisedAmount)}</b></span>
                    <span>Hard Cap: <b>{formatMoney(item.hardCap)}</b></span>
                    <span>Token Price: <b>{formatMoney(item.tokenPrice)}</b></span>
                    <span>AI Score: <b>{item.aiScore}%</b></span>
                    <span>Risk: <b className={`risk-${item.riskLevel?.toLowerCase()}`}>{item.riskLevel}</b></span>
                    <span>Audit: <b>{item.auditStatus}</b></span>
                    <span>KYC: <b>{item.kycStatus}</b></span>
                    <span>Verified: <b>{item.verified ? "Yes" : "No"}</b></span>
                  </div>

                  <div className="launch-actions">
                    <button onClick={() => toggleFavorite(item._id)}>
                      {item.isFavorite ? "★ Favorite" : "☆ Favorite"}
                    </button>

                    {item.website && (
                      <a href={item.website} target="_blank" rel="noreferrer">Website</a>
                    )}

                    {item.telegram && (
                      <a href={item.telegram} target="_blank" rel="noreferrer">Telegram</a>
                    )}

                    {item.twitter && (
                      <a href={item.twitter} target="_blank" rel="noreferrer">X</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}