import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAITrustScore.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://exalt-exchange-backend.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AdminAITrustScore() {
  const [trustScores, setTrustScores] = useState([]);
  const [form, setForm] = useState({
    symbol: "EXALT",
    tokenAddress: "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78",
    chain: "BNB Chain",
    price: 0.024,
    liquidityUSD: 15000,
    marketCapUSD: 27967,
    holders: 150,
    whaleRiskScore: 35,
    contractSafetyScore: 85,
    communityScore: 70,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchTrustScores = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/ai-trust-score`, authHeaders);
      setTrustScores(res.data?.trustScores || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrustScores();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveTrustScore = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
const res = await axios.post(
    
        `${API_BASE}/api/ai-trust-score/admin/update`,
        {
          ...form,
          price: Number(form.price),
          liquidityUSD: Number(form.liquidityUSD),
          marketCapUSD: Number(form.marketCapUSD),
          holders: Number(form.holders),
          whaleRiskScore: Number(form.whaleRiskScore),
          contractSafetyScore: Number(form.contractSafetyScore),
          communityScore: Number(form.communityScore),
        },
        authHeaders
      );
      console.log("SAVE TRUST RESPONSE:", res.data);

      fetchTrustScores();
    } finally {
      setSaving(false);
    }
  };

  const reviewTrustScore = async (id) => {
    await axios.put(
      `${API_BASE}/api/ai-trust-score/admin/${id}/review`,
      { adminNote: "Reviewed by admin" },
      authHeaders
    );

    fetchTrustScores();
  };

  const deleteTrustScore = async (id) => {
    const ok = window.confirm("Delete this trust score?");
    if (!ok) return;

    await axios.delete(`${API_BASE}/api/ai-trust-score/admin/${id}`, authHeaders);
    fetchTrustScores();
  };

  if (loading) {
    return <div className="admin-trust-page">Loading AI Trust Score Admin...</div>;
  }

  return (
    <div className="admin-trust-page">
      <div className="admin-trust-header">
        <div>
          <h2>AI Trust Score Admin</h2>
          <p>Manage token safety scores, liquidity, holders, whale risk and contract trust.</p>
        </div>

        <button onClick={fetchTrustScores}>Refresh</button>
      </div>

      <form className="admin-trust-form" onSubmit={saveTrustScore}>
        <h3>Create / Update Token Trust Score</h3>

        <div className="admin-trust-inputs">
          <label>
            Symbol
            <input name="symbol" value={form.symbol} onChange={handleChange} />
          </label>

          <label>
            Token Address
            <input name="tokenAddress" value={form.tokenAddress} onChange={handleChange} />
          </label>

          <label>
            Chain
            <select name="chain" value={form.chain} onChange={handleChange}>
              <option>BNB Chain</option>
              <option>Ethereum</option>
              <option>Polygon</option>
              <option>Solana</option>
              <option>Base</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Price
            <input name="price" type="number" value={form.price} onChange={handleChange} />
          </label>

          <label>
            Liquidity USD
            <input name="liquidityUSD" type="number" value={form.liquidityUSD} onChange={handleChange} />
          </label>

          <label>
            Market Cap USD
            <input name="marketCapUSD" type="number" value={form.marketCapUSD} onChange={handleChange} />
          </label>

          <label>
            Holders
            <input name="holders" type="number" value={form.holders} onChange={handleChange} />
          </label>

          <label>
            Whale Risk Score
            <input name="whaleRiskScore" type="number" min="0" max="100" value={form.whaleRiskScore} onChange={handleChange} />
          </label>

          <label>
            Contract Safety Score
            <input name="contractSafetyScore" type="number" min="0" max="100" value={form.contractSafetyScore} onChange={handleChange} />
          </label>

          <label>
            Community Score
            <input name="communityScore" type="number" min="0" max="100" value={form.communityScore} onChange={handleChange} />
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Trust Score"}
        </button>
      </form>

      <div className="admin-trust-table-box">
        <h3>Token Trust Scores</h3>

        <table className="admin-trust-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Price</th>
              <th>Liquidity</th>
              <th>Market Cap</th>
              <th>Holders</th>
              <th>Trust</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {trustScores.length === 0 ? (
              <tr>
                <td colSpan="10">No trust scores found</td>
              </tr>
            ) : (
              trustScores.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.symbol}</strong>
                    <small>{item.chain}</small>
                  </td>
                  <td>{formatMoney(item.price)}</td>
                  <td>{formatMoney(item.liquidityUSD)}</td>
                  <td>{formatMoney(item.marketCapUSD)}</td>
                  <td>{Number(item.holders || 0).toLocaleString()}</td>
                  <td>{item.trustScore}%</td>
                  <td>
                    <span className={`admin-trust-risk ${item.riskLevel?.toLowerCase()}`}>
                      {item.riskLevel}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-trust-status ${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-trust-flags">
                      {item.flags?.length ? (
                        item.flags.slice(0, 3).map((flag, index) => (
                          <span key={index}>{flag}</span>
                        ))
                      ) : (
                        <small>No flags</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="admin-trust-actions">
                      <button onClick={() => reviewTrustScore(item._id)}>Review</button>
                      <button className="danger" onClick={() => deleteTrustScore(item._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}