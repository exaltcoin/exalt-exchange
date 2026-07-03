import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./SocialTrading.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

export default function SocialTrading() {
  const { t } = useI18n();

  const [posts, setPosts] = useState([]);
  const [topTraders, setTopTraders] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [content, setContent] = useState("");
  const [pair, setPair] = useState("BTC/USDT");
  const [tradeType, setTradeType] = useState("General");
  const [sentiment, setSentiment] = useState("Neutral");
  const [commentText, setCommentText] = useState({});
  const [activeTab, setActiveTab] = useState("feed");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    }),
    [token]
  );

  const fetchSocialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [postsRes, tradersRes, profileRes] = await Promise.all([
        axios.get(`${API_BASE}/api/social/posts`, authHeaders),
        axios.get(`${API_BASE}/api/social/top-traders`, authHeaders),
        axios.get(`${API_BASE}/api/social/profile/me`, authHeaders),
      ]);

      setPosts(postsRes.data?.posts || []);
      setTopTraders(tradersRes.data?.traders || []);
      setMyProfile(profileRes.data?.profile || null);
    } catch (err) {
      setError(err.response?.data?.message || t("failedLoadSocialTrading"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialData();
  }, []);

  const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

  const createPost = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert(t("writeBeforePosting"));
      return;
    }

    try {
      setPosting(true);

      const res = await axios.post(
        `${API_BASE}/api/social/posts`,
        { content, pair, tradeType, sentiment },
        authHeaders
      );

      setPosts((prev) => [res.data.post, ...prev]);
      setContent("");
      setPair("BTC/USDT");
      setTradeType("General");
      setSentiment("Neutral");
    } catch (err) {
      alert(err.response?.data?.message || t("failedCreatePost"));
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId) => {
    try {
      await axios.put(`${API_BASE}/api/social/posts/${postId}/like`, {}, authHeaders);
      fetchSocialData();
    } catch (err) {
      alert(err.response?.data?.message || t("likeFailed"));
    }
  };

  const addComment = async (postId) => {
    const text = commentText[postId];
    if (!text?.trim()) return;

    try {
      await axios.post(
        `${API_BASE}/api/social/posts/${postId}/comments`,
        { text },
        authHeaders
      );

      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      fetchSocialData();
    } catch (err) {
      alert(err.response?.data?.message || t("commentFailed"));
    }
  };

  const followTrader = async (userId) => {
    try {
      await axios.put(`${API_BASE}/api/social/follow/${userId}`, {}, authHeaders);
      fetchSocialData();
    } catch (err) {
      alert(err.response?.data?.message || t("followFailed"));
    }
  };

  if (loading) {
    return (
      <PageShell titleKey="socialTrading" subtitleKey="socialTradingSubtitle">
        <div className="social-page">
          <div className="social-loading">{t("loadingSocialTrading")}</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell titleKey="socialTrading" subtitleKey="socialTradingSubtitle">
      <div className="social-page">
        <div className="social-top-action">
          <button className="refresh-social-btn" onClick={fetchSocialData}>
            {t("refresh")}
          </button>
        </div>

        {error && <div className="social-error">{error}</div>}

        <div className="social-stats">
          <div><span>{t("totalTraders")}</span><h2>{topTraders.length}</h2></div>
          <div><span>{t("communityPosts")}</span><h2>{posts.length}</h2></div>
          <div><span>{t("totalLikes")}</span><h2>{totalLikes}</h2></div>
          <div><span>{t("totalComments")}</span><h2>{totalComments}</h2></div>
        </div>

        <div className="social-tabs">
          <button className={activeTab === "feed" ? "active" : ""} onClick={() => setActiveTab("feed")}>
            {t("communityFeed")}
          </button>
          <button className={activeTab === "leaders" ? "active" : ""} onClick={() => setActiveTab("leaders")}>
            {t("topTraders")}
          </button>
          <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>
            {t("myTraderProfile")}
          </button>
        </div>

        <div className="social-layout">
          <div className="feed">
            {activeTab === "feed" && (
              <>
                <div className="create-post-card">
                  <h2>{t("createSignalPost")}</h2>

                  <form onSubmit={createPost}>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={t("shareMarketViewPlaceholder")}
                    />

                    <div className="post-input-grid">
                      <select value={pair} onChange={(e) => setPair(e.target.value)}>
                        <option>BTC/USDT</option>
                        <option>ETH/USDT</option>
                        <option>BNB/USDT</option>
                        <option>EXALT/USDT</option>
                        <option>SOL/USDT</option>
                      </select>

                      <select value={tradeType} onChange={(e) => setTradeType(e.target.value)}>
                        <option>General</option>
                        <option>Spot</option>
                        <option>Futures</option>
                        <option>P2P</option>
                      </select>

                      <select value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
                        <option>Neutral</option>
                        <option>Bullish</option>
                        <option>Bearish</option>
                      </select>
                    </div>

                    <button type="submit" disabled={posting}>
                      {posting ? t("posting") : t("publishPost")}
                    </button>
                  </form>
                </div>

                <h2>{t("communityFeed")}</h2>

                {posts.length === 0 ? (
                  <div className="empty-social">{t("noPostsYet")}</div>
                ) : (
                  posts.map((post) => (
                    <div className="feed-card" key={post._id}>
                      <div className="feed-head">
                        <div className="avatar">
                          {post.trader?.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>

                        <div>
                          <h3>{post.trader?.name || t("trader")}</h3>
                          <p>{post.trader?.email || t("exaltTrader")}</p>
                        </div>
                      </div>

                      <div className="signal-box-social">
                        <span>{post.tradeType || "General"} • {post.pair || "BTC/USDT"}</span>
                        <strong>{post.content}</strong>
                        <small className={`sentiment-tag ${String(post.sentiment || "neutral").toLowerCase()}`}>
                          {post.sentiment || t("neutral")}
                        </small>
                      </div>

                      <div className="feed-metrics">
                        <span>❤️ {post.likes?.length || 0}</span>
                        <span>💬 {post.comments?.length || 0}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="feed-actions">
                        <button onClick={() => toggleLike(post._id)}>{t("like")}</button>
                        <button onClick={() => followTrader(post.trader?._id)}>{t("follow")}</button>
                      </div>

                      <div className="comment-box">
                        <input
                          value={commentText[post._id] || ""}
                          onChange={(e) =>
                            setCommentText((prev) => ({
                              ...prev,
                              [post._id]: e.target.value,
                            }))
                          }
                          placeholder={t("writeComment")}
                        />

                        <button onClick={() => addComment(post._id)}>{t("send")}</button>
                      </div>

                      {post.comments?.length > 0 && (
                        <div className="comments-list">
                          {post.comments.slice(-3).map((comment) => (
                            <p key={comment._id}>
                              <b>{comment.user?.name || t("user")}:</b> {comment.text}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "leaders" && (
              <div className="leaderboard full">
                <h2>{t("topTradersLeaderboard")}</h2>

                {topTraders.length === 0 ? (
                  <div className="empty-social">{t("noTradersFound")}</div>
                ) : (
                  topTraders.map((trader, index) => (
                    <div className="leader-row" key={trader._id}>
                      <span>#{index + 1}</span>
                      <strong>
                        {trader.displayName || trader.user?.name || t("trader")}
                        {trader.verifiedTrader && <em> {t("verified")}</em>}
                      </strong>
                      <b>{trader.roi || 0}% ROI</b>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="profile-card-social">
                <h2>{t("myTraderProfile")}</h2>

                <div className="profile-grid-social">
                  <div>
                    <span>{t("displayName")}</span>
                    <strong>{myProfile?.displayName || myProfile?.user?.name || t("exaltTrader")}</strong>
                  </div>

                  <div><span>ROI</span><strong>{myProfile?.roi || 0}%</strong></div>
                  <div><span>{t("winRate")}</span><strong>{myProfile?.winRate || 0}%</strong></div>
                  <div><span>{t("followers")}</span><strong>{myProfile?.followers?.length || 0}</strong></div>
                  <div><span>{t("riskLevel")}</span><strong>{myProfile?.riskLevel || t("low")}</strong></div>
                  <div><span>{t("status")}</span><strong>{myProfile?.verifiedTrader ? t("verified") : t("pending")}</strong></div>
                </div>
              </div>
            )}
          </div>

          <div className="leaderboard">
            <h2>{t("topTraders")}</h2>

            {topTraders.length === 0 ? (
              <div className="empty-social small">{t("noTraders")}</div>
            ) : (
              topTraders.slice(0, 8).map((trader, index) => (
                <div className="leader-row" key={trader._id}>
                  <span>#{index + 1}</span>
                  <strong>{trader.displayName || trader.user?.name || t("trader")}</strong>
                  <b>{trader.roi || 0}%</b>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}