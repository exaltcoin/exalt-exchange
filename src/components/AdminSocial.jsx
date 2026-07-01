import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminSocial.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const AdminSocial = () => {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalTraders: 0,
    verifiedTraders: 0,
    totalLikes: 0,
    totalComments: 0,
  });

  const [posts, setPosts] = useState([]);
  const [traders, setTraders] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const fetchAdminSocialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, postsRes, tradersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/social/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/social/posts`, authHeaders),
        axios.get(`${API_BASE}/api/social/top-traders`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setPosts(postsRes.data?.posts || []);
      setTraders(tradersRes.data?.traders || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load Social Trading admin data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminSocialData();
  }, []);

  const handleDeletePost = async (postId) => {
    const confirmDelete = window.confirm("Delete this social post?");
    if (!confirmDelete) return;

    try {
      setActionLoading(postId);
      await axios.delete(`${API_BASE}/api/social/posts/${postId}`, authHeaders);
      setPosts((prev) => prev.filter((post) => post._id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete post");
    } finally {
      setActionLoading("");
    }
  };

  const handleVerifyTrader = async (profileId) => {
    try {
      setActionLoading(profileId);
      const res = await axios.put(
        `${API_BASE}/api/social/admin/traders/${profileId}/verify`,
        {},
        authHeaders
      );

      setTraders((prev) =>
        prev.map((trader) =>
          trader._id === profileId ? res.data.profile : trader
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify trader");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="admin-social-page">
        <div className="admin-social-loading">Loading Social Trading Admin...</div>
      </div>
    );
  }

  return (
    <div className="admin-social-page">
      <div className="admin-social-header">
        <div>
          <h2>Social Trading Admin</h2>
          <p>Manage posts, traders, verification, engagement and statistics.</p>
        </div>

        <button onClick={fetchAdminSocialData} className="refresh-btn">
          Refresh
        </button>
      </div>

      {error && <div className="admin-social-error">{error}</div>}

      <div className="admin-social-cards">
        <div className="social-card">
          <span>Total Posts</span>
          <strong>{stats.totalPosts || 0}</strong>
        </div>

        <div className="social-card">
          <span>Total Traders</span>
          <strong>{stats.totalTraders || 0}</strong>
        </div>

        <div className="social-card">
          <span>Verified Traders</span>
          <strong>{stats.verifiedTraders || 0}</strong>
        </div>

        <div className="social-card">
          <span>Total Likes</span>
          <strong>{stats.totalLikes || 0}</strong>
        </div>

        <div className="social-card">
          <span>Total Comments</span>
          <strong>{stats.totalComments || 0}</strong>
        </div>
      </div>

      <div className="admin-social-tabs">
        <button
          className={activeTab === "posts" ? "active" : ""}
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>

        <button
          className={activeTab === "traders" ? "active" : ""}
          onClick={() => setActiveTab("traders")}
        >
          Traders
        </button>
      </div>

      {activeTab === "posts" && (
        <div className="admin-social-panel">
          <div className="panel-title">
            <h3>All Social Posts</h3>
            <span>{posts.length} posts</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-social-table">
              <thead>
                <tr>
                  <th>Trader</th>
                  <th>Pair</th>
                  <th>Type</th>
                  <th>Sentiment</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th>Post</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      No social posts found
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post._id}>
                      <td>
                        <div className="trader-cell">
                          <span className="avatar">
                            {post.trader?.name?.charAt(0)?.toUpperCase() || "T"}
                          </span>
                          <div>
                            <strong>{post.trader?.name || "Trader"}</strong>
                            <small>{post.trader?.email || "No email"}</small>
                          </div>
                        </div>
                      </td>

                      <td>{post.pair || "BTC/USDT"}</td>
                      <td>{post.tradeType || "General"}</td>

                      <td>
                        <span
                          className={`sentiment ${String(
                            post.sentiment || "neutral"
                          ).toLowerCase()}`}
                        >
                          {post.sentiment || "Neutral"}
                        </span>
                      </td>

                      <td>{post.likes?.length || 0}</td>
                      <td>{post.comments?.length || 0}</td>

                      <td className="post-content">
                        {post.content?.slice(0, 80)}
                        {post.content?.length > 80 ? "..." : ""}
                      </td>

                      <td>
                        <button
                          className="danger-btn"
                          onClick={() => handleDeletePost(post._id)}
                          disabled={actionLoading === post._id}
                        >
                          {actionLoading === post._id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "traders" && (
        <div className="admin-social-panel">
          <div className="panel-title">
            <h3>Trader Profiles</h3>
            <span>{traders.length} traders</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-social-table">
              <thead>
                <tr>
                  <th>Trader</th>
                  <th>ROI</th>
                  <th>Win Rate</th>
                  <th>Profit</th>
                  <th>Risk</th>
                  <th>Followers</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {traders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      No trader profiles found
                    </td>
                  </tr>
                ) : (
                  traders.map((trader) => (
                    <tr key={trader._id}>
                      <td>
                        <div className="trader-cell">
                          <span className="avatar">
                            {trader.user?.name?.charAt(0)?.toUpperCase() || "T"}
                          </span>
                          <div>
                            <strong>
                              {trader.displayName ||
                                trader.user?.name ||
                                "Trader"}
                            </strong>
                            <small>{trader.user?.email || "No email"}</small>
                          </div>
                        </div>
                      </td>

                      <td className="positive">{trader.roi || 0}%</td>
                      <td>{trader.winRate || 0}%</td>
                      <td>${trader.profit || 0}</td>

                      <td>
                        <span
                          className={`risk ${String(
                            trader.riskLevel || "low"
                          ).toLowerCase()}`}
                        >
                          {trader.riskLevel || "Low"}
                        </span>
                      </td>

                      <td>{trader.followers?.length || 0}</td>

                      <td>
                        {trader.verifiedTrader ? (
                          <span className="verified">Verified</span>
                        ) : (
                          <span className="pending">Pending</span>
                        )}
                      </td>

                      <td>
                        {!trader.verifiedTrader ? (
                          <button
                            className="verify-btn"
                            onClick={() => handleVerifyTrader(trader._id)}
                            disabled={actionLoading === trader._id}
                          >
                            {actionLoading === trader._id
                              ? "Verifying..."
                              : "Verify"}
                          </button>
                        ) : (
                          <span className="done-text">Done</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSocial;