import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AINews.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatDate = (date) => {
  if (!date) return "No date";
  return new Date(date).toLocaleString();
};

export default function AINews() {
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
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
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
      setError(err.response?.data?.message || "Failed to load AI News");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitNews = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.summary.trim()) {
      alert("Title and summary are required.");
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
      alert(err.response?.data?.message || "Failed to submit news");
    } finally {
      setPosting(false);
    }
  };

  const toggleAction = async (id, action) => {
    try {
      await axios.put(`${API_BASE}/api/ai-news/${id}/${action}`, {}, authHeaders);
      fetchNews();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} news`);
    }
  };

  const pinnedNews = news.filter((item) => item.isPinned);
  const breakingNews = news.filter((item) => item.isBreaking);

  if (loading) {
    return <div className="ai-news-page">Loading AI News...</div>;
  }

  return (
    <div className="ai-news-page">
      <div className="ai-news-header">
        <div>
          <h1>AI News</h1>
          <p>
            AI-powered crypto news with sentiment, market impact, confidence and
            community reactions.
          </p>
        </div>

        <button onClick={fetchNews}>Refresh</button>
      </div>

      {error && <div className="ai-news-error">{error}</div>}

      {breakingNews.length > 0 && (
        <div className="breaking-news-box">
          <span>Breaking</span>
          <strong>{breakingNews[0].title}</strong>
        </div>
      )}

      <div className="ai-news-stats">
        <div>
          <span>Total News</span>
          <strong>{news.length}</strong>
        </div>

        <div>
          <span>Pinned</span>
          <strong>{pinnedNews.length}</strong>
        </div>

        <div>
          <span>Breaking</span>
          <strong>{breakingNews.length}</strong>
        </div>

        <div>
          <span>Bullish</span>
          <strong>{news.filter((item) => item.sentiment === "Bullish").length}</strong>
        </div>
      </div>

      <div className="ai-news-tabs">
        <button
          className={activeTab === "feed" ? "active" : ""}
          onClick={() => setActiveTab("feed")}
        >
          News Feed
        </button>

        <button
          className={activeTab === "submit" ? "active" : ""}
          onClick={() => setActiveTab("submit")}
        >
          Submit News
        </button>
      </div>

      {activeTab === "feed" && (
        <>
          <div className="ai-news-toolbar">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search AI news..."
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
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

            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
            >
              <option value="all">All Sentiments</option>
              <option value="Bullish">Bullish</option>
              <option value="Bearish">Bearish</option>
              <option value="Neutral">Neutral</option>
            </select>

            <select
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value)}
            >
              <option value="all">All Impacts</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <button onClick={fetchNews}>Apply</button>
          </div>

          <div className="ai-news-layout">
            <div className="news-feed">
              {news.length === 0 ? (
                <div className="empty-news">No AI news found.</div>
              ) : (
                news.map((item) => (
                  <div className="news-card" key={item._id}>
                    <div className="news-card-top">
                      <div>
                        <h2>{item.title}</h2>
                        <p>{item.summary}</p>
                      </div>

                      <div className="news-badges">
                        {item.isBreaking && <span>Breaking</span>}
                        {item.isPinned && <span>Pinned</span>}
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
                        {item.marketImpact} Impact
                      </span>

                      <span>AI Confidence: {item.aiConfidence}%</span>
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
              <h2>Pinned News</h2>

              {pinnedNews.length === 0 ? (
                <p>No pinned news.</p>
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
          <h2>Submit News for AI Analysis</h2>

          <label>
            Title
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter news title..."
            />
          </label>

          <label>
            Summary
            <textarea
              name="summary"
              value={form.summary}
              onChange={handleChange}
              placeholder="Write news summary..."
            />
          </label>

          <div className="submit-news-grid">
            <label>
              Source
              <input
                name="source"
                value={form.source}
                onChange={handleChange}
              />
            </label>

            <label>
              Source URL
              <input
                name="sourceUrl"
                value={form.sourceUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </label>

            <label>
              Category
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
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
              Affected Coins
              <input
                name="affectedCoins"
                value={form.affectedCoins}
                onChange={handleChange}
                placeholder="BTC, ETH, EXALT"
              />
            </label>
          </div>

          <button type="submit" disabled={posting}>
            {posting ? "Submitting..." : "Submit AI News"}
          </button>
        </form>
      )}
    </div>
  );
}