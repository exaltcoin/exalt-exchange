import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AILaunchpad.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function AILaunchpad() {
  const { t } = useI18n();

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
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
    [token]
  );

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-launchpad`, authHeaders);
      setProjects(res.data?.projects || []);
    } catch (err) {
      setError(err.response?.data?.message || t("failedLoadLaunchpad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      alert(err.response?.data?.message || t("failedCreateLaunchpadProject"));
    } finally {
      setCreating(false);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/ai-launchpad/favorite/${id}`, {}, authHeaders);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || t("failedUpdateFavorite"));
    }
  };

  if (loading) {
    return (
      <PageShell titleKey="aiLaunchpad" subtitleKey="aiLaunchpadSubtitle">
        <div className="launch-page">{t("loadingLaunchpad")}</div>
      </PageShell>
    );
  }

  const featured = projects.find((item) => item.featured) || projects[0];

  return (
    <PageShell titleKey="aiLaunchpad" subtitleKey="aiLaunchpadSubtitle">
      <div className="launch-page">
        <div className="launch-top-action">
          <button onClick={fetchProjects}>{t("refresh")}</button>
        </div>

        {error && <div className="launch-error">{error}</div>}

        {featured && (
          <div className="launch-featured">
            <div>
              <span>{t("featuredLaunch")}</span>
              <h2>{featured.projectName}</h2>
              <p>{featured.description}</p>

              <div className="launch-tags">
                <b>{featured.symbol}</b>
                <b>{featured.chain}</b>
                <b>{featured.category}</b>
                {featured.verified && <b>{t("verified")}</b>}
              </div>
            </div>

            <div className="launch-score">
              <span>{t("aiScore")}</span>
              <strong>{featured.aiScore}%</strong>
              <small>{featured.riskLevel} {t("risk")}</small>
            </div>
          </div>
        )}

        <div className="launch-layout">
          <form className="launch-form-card" onSubmit={createProject}>
            <h2>{t("createLaunchpadProject")}</h2>

            <div className="launch-input-grid">
              <label>
                {t("projectName")}
                <input name="projectName" value={form.projectName} onChange={handleChange} />
              </label>

              <label>
                {t("symbol")}
                <input name="symbol" value={form.symbol} onChange={handleChange} />
              </label>

              <label>
                {t("chain")}
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
                {t("category")}
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
                {t("tokenPrice")}
                <input name="tokenPrice" type="number" value={form.tokenPrice} onChange={handleChange} />
              </label>

              <label>
                {t("hardCap")}
                <input name="hardCap" type="number" value={form.hardCap} onChange={handleChange} />
              </label>

              <label>
                {t("softCap")}
                <input name="softCap" type="number" value={form.softCap} onChange={handleChange} />
              </label>

              <label>
                {t("raisedAmount")}
                <input name="raisedAmount" type="number" value={form.raisedAmount} onChange={handleChange} />
              </label>

              <label>
                {t("minBuy")}
                <input name="minBuy" type="number" value={form.minBuy} onChange={handleChange} />
              </label>

              <label>
                {t("maxBuy")}
                <input name="maxBuy" type="number" value={form.maxBuy} onChange={handleChange} />
              </label>
            </div>

            <label className="launch-full-label">
              {t("description")}
              <textarea name="description" value={form.description} onChange={handleChange} />
            </label>

            <button type="submit" disabled={creating}>
              {creating ? t("creating") : t("createLaunchpadProject")}
            </button>
          </form>

          <div className="launch-list-card">
            <div className="launch-list-head">
              <h2>{t("launchpadProjects")}</h2>
              <span>{projects.length} {t("records")}</span>
            </div>

            <div className="launch-list">
              {projects.length === 0 ? (
                <div className="empty-launch">{t("noLaunchpadProjectsFound")}</div>
              ) : (
                projects.map((item) => {
                  const progress =
                    item.hardCap > 0
                      ? Math.min(100, (item.raisedAmount / item.hardCap) * 100)
                      : 0;

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
                        <span>{t("raised")}: <b>{formatMoney(item.raisedAmount)}</b></span>
                        <span>{t("hardCap")}: <b>{formatMoney(item.hardCap)}</b></span>
                        <span>{t("tokenPrice")}: <b>{formatMoney(item.tokenPrice)}</b></span>
                        <span>{t("aiScore")}: <b>{item.aiScore}%</b></span>
                        <span>{t("risk")}: <b className={`risk-${item.riskLevel?.toLowerCase()}`}>{item.riskLevel}</b></span>
                        <span>{t("audit")}: <b>{item.auditStatus}</b></span>
                        <span>KYC: <b>{item.kycStatus}</b></span>
                        <span>{t("verified")}: <b>{item.verified ? t("yes") : t("no")}</b></span>
                      </div>

                      <div className="launch-actions">
                        <button onClick={() => toggleFavorite(item._id)}>
                          {item.isFavorite ? t("favorite") : t("addFavorite")}
                        </button>

                        {item.website && (
                          <a href={item.website} target="_blank" rel="noreferrer">{t("website")}</a>
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
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}