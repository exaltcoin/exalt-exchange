import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./NotificationCenter.css";

const RAW_API =
  import.meta.env.VITE_API_URL ||
  "https://exalt-real-backend-6b6v.onrender.com";

const API_BASE = RAW_API.endsWith("/api")
  ? RAW_API.replace("/api", "")
  : RAW_API;

export default function NotificationCenter() {
  const { t } = useI18n();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `${API_BASE}/api/notifications/me`,
        authHeaders
      );

      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      setError(
        err.response?.data?.message || t("failedLoadNotifications")
      );
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await axios.put(
        `${API_BASE}/api/notifications/${id}/read`,
        {},
        authHeaders
      );

      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || t("failedMarkRead"));
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(
        `${API_BASE}/api/notifications/read/all`,
        {},
        authHeaders
      );

      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || t("failedMarkAllRead"));
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <PageShell
        titleKey="notificationCenter"
        subtitleKey="notificationCenterSubtitle"
      >
        <div className="notification-page">
          {t("loadingNotifications")}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      titleKey="notificationCenter"
      subtitleKey="notificationCenterSubtitle"
    >
      <div className="notification-page">

        <div className="notification-top-action">
          <button onClick={markAllRead}>
            {t("markAllRead")}
          </button>
        </div>

        {error && (
          <div className="notification-error">
            {error}
          </div>
        )}

        <div className="notification-summary">
          <div>
            <span>{t("totalNotifications")}</span>
            <strong>{notifications.length}</strong>
          </div>

          <div>
            <span>{t("unread")}</span>
            <strong>{unreadCount}</strong>
          </div>
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="notification-empty">
              {t("noNotifications")}
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item._id}
                className={`notification-card ${
                  item.isRead ? "read" : "unread"
                }`}
              >
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.message}</p>

                  <div className="notification-meta">
                    <span>{item.type}</span>
                    <span>{item.priority}</span>
                    <span>
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!item.isRead && (
                  <button onClick={() => markRead(item._id)}>
                    {t("read")}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </PageShell>
  );
}