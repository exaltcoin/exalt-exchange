import { useEffect, useState } from "react";
import API_BASE_URL, { socket } from "../api";
import "./NotificationBell.css";

function NotificationBell({ setPage }) {
  const API_BASE = API_BASE_URL || "https://api.exaltexchange.io";
  const API = API_BASE.endsWith("/api") ? API_BASE.replace("/api", "") : API_BASE;

  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadNotifications = async () => {
    if (!token) return;

    const res = await fetch(`${API}/api/notifications/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (data.success) {
      setUnreadCount(data.unreadCount || 0);
      setNotifications(data.notifications || []);
    }
  };

  useEffect(() => {
    loadNotifications();

    if (token && user?.id) {
      socket.emit("notification:join", {
        userId: user.id,
        role: user.role,
      });
    }

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:admin", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:admin", handleNewNotification);
    };
  }, []);

  const markAllRead = async () => {
    if (!token) return;

    await fetch(`${API}/api/notifications/read/all`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="notification-bell-wrap">
      <button className="notification-bell-btn" onClick={() => setOpen(!open)}>
        🔔
        {unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-bell-panel">
          <div className="notification-bell-head">
            <strong>Notifications</strong>
            <button onClick={markAllRead}>Mark all read</button>
          </div>

          {notifications.length === 0 ? (
            <p className="notification-bell-empty">No notifications yet.</p>
          ) : (
            notifications.slice(0, 6).map((item) => (
              <div
                className={`notification-mini-card ${item.isRead ? "read" : "unread"}`}
                key={item._id || item.createdAt}
              >
                <b>{item.title}</b>
                <p>{item.message}</p>
                <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small>
              </div>
            ))
          )}

          <button
            className="notification-view-all"
            onClick={() => {
              setOpen(false);
             if (setPage) setPage("notification-center");
            }}
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;