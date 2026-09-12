import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./AINews.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

export default function AINews() {
  const { t } = useI18n();

  const formatDate = (date) => {
    if (!date) return t("noDate");
    return new Date(date).toLocaleString();
  };

  const [news, setNews] = useState([]);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    source: "Community News",
    sourceUrl: "",
    category: "Market",
    affectedCoins: "",
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("feed");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token || ""}` } }),
    [token]
  );

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/ai-news`, {
        ...authHeaders,
        params: {
          search,
          category: categoryFilter,
          sentiment: sentimentFilter,
          impact: impactFilter,
        },
      });

      setNews(res.data?.news || []);
    } catch (err) {
      setError(err.response?.data?.message || t("failedLoadAiNews"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitNews = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.summary.trim()) {
      alert(t("titleSummaryRequired"));
      return;
    }

    try {
      setPosting(true);

      await axios.post(
        `${API_BASE}/api/ai-news`,
        {
          ...form,
          affectedCoins: form.affectedCoins
            .split(",")
            .map((coin) => coin.trim().toUpperCase())
            .filter(Boolean),
        },
        authHeaders
      );

      setForm({
        title: "",
        summary: "",
        source: "Community News",
        sourceUrl: "",
        category: "Market",
        affectedCoins: "",
      });

      setActiveTab("feed");
      fetchNews();
    } catch (err) {
      alert(err.response?.data?.message || t("failedSubmitNews"));
    } finally {
      setPosting(false);
    }
  };

  const toggleAction = async (id, action) => {
    try {
      await axios.put(`${API_BASE}/api/ai-news/${id}/${action}`, {}, authHeaders);
      fetchNews();
    } catch (err) {
      alert(err.response?.data?.message || t("failedNewsAction"));
    }
  };

  const pinnedNews = news.filter((item) => item.isPinned);
  const breakingNews = news.filter((item) => item.isBreaking);

  if (loading) {
    return (
      <PageShell titleKey="aiNews" subtitleKey="aiNewsSubtitle">
        <div className="ai-news-page">{t("loadingAiNews")}</div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="aiNews" subtitleKey="aiNewsSubtitle">
      <div className="ai-news-page">
        <div className="ai-news-top-action">
          <button onClick={fetchNews}>{t("refresh")}</button>
        </div>

        {error && <div className="ai-news-error">{error}</div>}

        {breakingNews.length > 0 && (
          <div className="breaking-news-box">
            <span>{t("breaking")}</span>
            <strong>{breakingNews[0].title}</strong>
          </div>
        )}

        <div className="ai-news-stats">
          <div><span>{t("totalNews")}</span><strong>{news.length}</strong></div>
          <div><span>{t("pinned")}</span><strong>{pinnedNews.length}</strong></div>
          <div><span>{t("breaking")}</span><strong>{breakingNews.length}</strong></div>
          <div>
            <span>{t("bullish")}</span>
            <strong>{news.filter((item) => item.sentiment === "Bullish").length}</strong>
          </div>
        </div>

        <div className="ai-news-tabs">
          <button className={activeTab === "feed" ? "active" : ""} onClick={() => setActiveTab("feed")}>
            {t("newsFeed")}
          </button>

          <button className={activeTab === "submit" ? "active" : ""} onClick={() => setActiveTab("submit")}>
            {t("submitNews")}
          </button>
        </div>

        {activeTab === "feed" && (
          <>
            <div className="ai-news-toolbar">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchAiNews")}
              />

              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">{t("allCategories")}</option>
                <option value="Bitcoin">Bitcoin</option>
                <option value="Ethereum">Ethereum</option>
                <option value="Altcoins">Altcoins</option>
                <option value="DeFi">DeFi</option>
                <option value="Regulation">Regulation</option>
                <option value="Exchange">Exchange</option>
                <option value="Market">Market</option>
                <option value="Security">Security</option>
                <option value="EXALT">EXALT</option>
              </select>

              <select value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)}>
                <option value="all">{t("allSentiments")}</option>
                <option value="Bullish">{t("bullish")}</option>
                <option value="Bearish">{t("bearish")}</option>
                <option value="Neutral">{t("neutral")}</option>
              </select>

              <select value={impactFilter} onChange={(e) => setImpactFilter(e.target.value)}>
                <option value="all">{t("allImpacts")}</option>
                <option value="Low">{t("low")}</option>
                <option value="Medium">{t("medium")}</option>
                <option value="High">{t("high")}</option>
              </select>

              <button onClick={fetchNews}>{t("apply")}</button>
            </div>

            <div className="ai-news-layout">
              <div className="news-feed">
                {news.length === 0 ? (
                  <div className="empty-news">{t("noAiNewsFound")}</div>
                ) : (
                  news.map((item) => (
                    <div className="news-card" key={item._id}>
                      <div className="news-card-top">
                        <div>
                          <h2>{item.title}</h2>
                          <p>{item.summary}</p>
                        </div>

                        <div className="news-badges">
                          {item.isBreaking && <span>{t("breaking")}</span>}
                          {item.isPinned && <span>{t("pinned")}</span>}
                        </div>
                      </div>

                      <div className="news-meta">
                        <span>{item.source}</span>
                        <span>{item.category}</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>

                      <div className="news-ai-row">
                        <span className={`news-sentiment ${item.sentiment?.toLowerCase()}`}>
                          {item.sentiment}
                        </span>

                        <span className={`news-impact ${item.marketImpact?.toLowerCase()}`}>
                          {item.marketImpact} {t("impact")}
                        </span>

                        <span>{t("aiConfidence")}: {item.aiConfidence}%</span>
                      </div>

                      {item.affectedCoins?.length > 0 && (
                        <div className="news-coins">
                          {item.affectedCoins.map((coin, index) => (
                            <span key={index}>{coin}</span>
                          ))}
                        </div>
                      )}

                      <div className="news-actions">
                        <button onClick={() => toggleAction(item._id, "like")}>
                          👍 {item.likes?.length || 0}
                        </button>

                        <button onClick={() => toggleAction(item._id, "dislike")}>
                          👎 {item.dislikes?.length || 0}
                        </button>

                        <button onClick={() => toggleAction(item._id, "bookmark")}>
                          🔖 {item.bookmarks?.length || 0}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="news-side-panel">
                <h2>{t("pinnedNews")}</h2>

                {pinnedNews.length === 0 ? (
                  <p>{t("noPinnedNews")}</p>
                ) : (
                  pinnedNews.slice(0, 5).map((item) => (
                    <div className="pinned-news-item" key={item._id}>
                      <strong>{item.title}</strong>
                      <span>{item.sentiment} • {item.marketImpact}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "submit" && (
          <form className="submit-news-card" onSubmit={submitNews}>
            <h2>{t("submitNewsForAiAnalysis")}</h2>

            <label>
              {t("title")}
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={t("enterNewsTitle")}
              />
            </label>

            <label>
              {t("summary")}
              <textarea
                name="summary"
                value={form.summary}
                onChange={handleChange}
                placeholder={t("writeNewsSummary")}
              />
            </label>

            <div className="submit-news-grid">
              <label>
                {t("source")}
                <input name="source" value={form.source} onChange={handleChange} />
              </label>

              <label>
                {t("sourceUrl")}
                <input
                  name="sourceUrl"
                  value={form.sourceUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </label>

              <label>
                {t("category")}
                <select name="category" value={form.category} onChange={handleChange}>
                  <option>Bitcoin</option>
                  <option>Ethereum</option>
                  <option>Altcoins</option>
                  <option>DeFi</option>
                  <option>Regulation</option>
                  <option>Exchange</option>
                  <option>Market</option>
                  <option>Security</option>
                  <option>EXALT</option>
                </select>
              </label>

              <label>
                {t("affectedCoins")}
                <input
                  name="affectedCoins"
                  value={form.affectedCoins}
                  onChange={handleChange}
                  placeholder="BTC, ETH, EXALT"
                />
              </label>
            </div>

            <button type="submit" disabled={posting}>
              {posting ? t("submitting") : t("submitAiNews")}
            </button>
          </form>
        )}
      </div>
    </PageShell>
  );
}