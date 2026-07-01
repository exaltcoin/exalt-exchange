
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./NotificationCenter.css";

const RAW_API =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const API_BASE = RAW_API.endsWith("/api")
  ? RAW_API.replace("/api", "")
  : RAW_API;
export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/notifications/me`, authHeaders);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    await axios.put(`${API_BASE}/api/notifications/${id}/read`, {}, authHeaders);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await axios.put(`${API_BASE}/api/notifications/read/all`, {}, authHeaders);
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return <div className="notification-page">Loading notifications...</div>;
  }

  return (
    <div className="notification-page">
      <div className="notification-header">
        <div>
          <h1>Notification Center</h1>
          <p>Deposits, withdrawals, KYC, P2P, rewards, security and system alerts.</p>
        </div>

        <button onClick={markAllRead}>Mark All Read</button>
      </div>

      <div className="notification-summary">
        <div>
          <span>Total Notifications</span>
          <strong>{notifications.length}</strong>
        </div>

        <div>
          <span>Unread</span>
          <strong>{unreadCount}</strong>
        </div>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">No notifications yet.</div>
        ) : (
          notifications.map((item) => (
            <div
              className={`notification-card ${item.isRead ? "read" : "unread"}`}
              key={item._id}
            >
              <div>
                <h3>{item.title}</h3>
                <p>{item.message}</p>

                <div className="notification-meta">
                  <span>{item.type}</span>
                  <span>{item.priority}</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {!item.isRead && (
                <button onClick={() => markRead(item._id)}>Read</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}