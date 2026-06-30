import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminAINews.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

const formatDate = (date) => {
  if (!date) return "No date";
  return new Date(date).toLocaleString();
};

export default function AdminAINews() {
  const [stats, setStats] = useState({});
  const [news, setNews] = useState([]);
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const [selectedNews, setSelectedNews] = useState(null);
  const [status, setStatus] = useState("Reviewed");
  const [adminNote, setAdminNote] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchAdminNews = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, newsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/ai-news/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/ai-news/admin/news`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setNews(newsRes.data?.news || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load AI News Admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminNews();
  }, []);

  const filteredNews = news.filter((item) => {
    const keyword = search.toLowerCase();
    const title = item.title?.toLowerCase() || "";
    const summary = item.summary?.toLowerCase() || "";
    const source = item.source?.toLowerCase() || "";
    const sentiment = item.sentiment?.toLowerCase() || "";
    const impact = item.marketImpact?.toLowerCase() || "";

    const matchesSearch =
      title.includes(keyword) ||
      summary.includes(keyword) ||
      source.includes(keyword);

    const matchesSentiment =
      sentimentFilter === "all" ||
      sentiment === sentimentFilter.toLowerCase();

    const matchesImpact =
      impactFilter === "all" || impact === impactFilter.toLowerCase();

    return matchesSearch && matchesSentiment && matchesImpact;
  });

  const openReview = (item) => {
    setSelectedNews(item);
    setStatus(item.status || "Reviewed");
    setAdminNote(item.adminNote || "");
    setIsPinned(Boolean(item.isPinned));
    setIsBreaking(Boolean(item.isBreaking));
  };

  const closeReview = () => {
    setSelectedNews(null);
    setStatus("Reviewed");
    setAdminNote("");
    setIsPinned(false);
    setIsBreaking(false);
  };

  const reviewNews = async () => {
    if (!selectedNews?._id) return;

    try {
      setActionLoading(selectedNews._id);

      await axios.put(
        `${API_BASE}/api/ai-news/admin/news/${selectedNews._id}/review`,
        {
          status,
          adminNote,
          isPinned,
          isBreaking,
        },
        authHeaders
      );

      closeReview();
      fetchAdminNews();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to review AI news");
    } finally {
      setActionLoading("");
    }
  };

  const deleteNews = async (id) => {
    const confirmDelete = window.confirm("Delete this AI news?");
    if (!confirmDelete) return;

    try {
      setActionLoading(id);

      await axios.delete(`${API_BASE}/api/ai-news/admin/news/${id}`, authHeaders);

      setNews((prev) => prev.filter((item) => item._id !== id));
      fetchAdminNews();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete AI news");
    } finally {
      setActionLoading("");
    }
  };

  const exportCSV = () => {
    const rows = [
      [
        "Title",
        "Source",
        "Category",
        "Sentiment",
        "Impact",
        "AI Confidence",
        "Status",
        "Pinned",
        "Breaking",
        "Created",
      ],
      ...filteredNews.map((item) => [
        item.title || "",
        item.source || "",
        item.category || "",
        item.sentiment || "",
        item.marketImpact || "",
        item.aiConfidence || 0,
        item.status || "",
        item.isPinned ? "Yes" : "No",
        item.isBreaking ? "Yes" : "No",
        formatDate(item.createdAt),
      ]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-news.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="admin-news-page">Loading AI News Admin...</div>;
  }

  return (
    <div className="admin-news-page">
      <div className="admin-news-header">
        <div>
          <h2>AI News Admin</h2>
          <p>Review AI news, sentiment, market impact, pinned and breaking updates.</p>
        </div>

        <div className="admin-news-header-actions">
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={fetchAdminNews}>Refresh</button>
        </div>
      </div>

      {error && <div className="admin-news-error">{error}</div>}

      <div className="admin-news-cards">
        <div><span>Total News</span><strong>{stats.total || 0}</strong></div>
        <div><span>Bullish</span><strong>{stats.bullish || 0}</strong></div>
        <div><span>Bearish</span><strong>{stats.bearish || 0}</strong></div>
        <div><span>Neutral</span><strong>{stats.neutral || 0}</strong></div>
        <div><span>High Impact</span><strong>{stats.highImpact || 0}</strong></div>
        <div><span>Breaking</span><strong>{stats.breaking || 0}</strong></div>
        <div><span>Pinned</span><strong>{stats.pinned || 0}</strong></div>
        <div><span>Reviewed</span><strong>{stats.reviewed || 0}</strong></div>
      </div>

      <div className="admin-news-toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, summary or source..."
        />

        <select
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
        >
          <option value="all">All Sentiments</option>
          <option value="bullish">Bullish</option>
          <option value="bearish">Bearish</option>
          <option value="neutral">Neutral</option>
        </select>

        <select
          value={impactFilter}
          onChange={(e) => setImpactFilter(e.target.value)}
        >
          <option value="all">All Impacts</option>
          <option value="low">Low Impact</option>
          <option value="medium">Medium Impact</option>
          <option value="high">High Impact</option>
        </select>
      </div>

      <div className="admin-news-table-box">
        <div className="admin-news-table-head">
          <h3>AI News Records</h3>
          <span>{filteredNews.length} records</span>
        </div>

        <table className="admin-news-table">
          <thead>
            <tr>
              <th>News</th>
              <th>Source</th>
              <th>Category</th>
              <th>Sentiment</th>
              <th>Impact</th>
              <th>AI Confidence</th>
              <th>Engagement</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredNews.length === 0 ? (
              <tr>
                <td colSpan="11" className="empty-news-row">
                  No AI news found
                </td>
              </tr>
            ) : (
              filteredNews.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.title}</strong>
                    <small>{item.summary}</small>
                  </td>

                  <td>{item.source}</td>
                  <td>{item.category}</td>

                  <td>
                    <span className={`news-sentiment ${item.sentiment?.toLowerCase()}`}>
                      {item.sentiment}
                    </span>
                  </td>

                  <td>
                    <span className={`news-impact ${item.marketImpact?.toLowerCase()}`}>
                      {item.marketImpact}
                    </span>
                  </td>

                  <td>{item.aiConfidence}%</td>

                  <td>
                    <div className="news-mini">
                      <span>👍 {item.likes?.length || 0}</span>
                      <span>👎 {item.dislikes?.length || 0}</span>
                      <span>🔖 {item.bookmarks?.length || 0}</span>
                    </div>
                  </td>

                  <td>
                    <span className={`news-status ${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>

                  <td>
                    <div className="news-flags">
                      {item.isPinned && <span>Pinned</span>}
                      {item.isBreaking && <span>Breaking</span>}
                      {!item.isPinned && !item.isBreaking && <small>No flags</small>}
                    </div>
                  </td>

                  <td>{formatDate(item.createdAt)}</td>

                  <td>
                    <div className="admin-news-actions">
                      <button onClick={() => openReview(item)}>Review</button>
                      <button
                        className="danger"
                        onClick={() => deleteNews(item._id)}
                        disabled={actionLoading === item._id}
                      >
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

      {selectedNews && (
        <div className="news-modal-backdrop">
          <div className="news-modal">
            <h3>Review AI News</h3>

            <p>
              Title: <strong>{selectedNews.title}</strong>
            </p>

            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Reviewed</option>
              <option>Published</option>
              <option>Flagged</option>
              <option>Draft</option>
            </select>

            <div className="news-modal-flags">
              <label>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
                Pinned
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                />
                Breaking News
              </label>
            </div>

            <label>Admin Note</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Write admin review note..."
            />

            <div className="news-modal-actions">
              <button onClick={closeReview}>Cancel</button>
              <button onClick={reviewNews} disabled={actionLoading === selectedNews._id}>
                {actionLoading === selectedNews._id ? "Saving..." : "Save Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}