import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./NotificationCenter.css";

const RAW_API =
  import.meta.env.VITE_API_URL ||
  "https://api.exaltexchange.io";

const API_BASE = RAW_API.endsWith("/api")
  ? RAW_API.replace("/api", "")
  : RAW_API;

export default function NotificationCenter({ setPage }) {
  const { t } = useI18n();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState("");
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

  /*
    Batch 6 fix: only page keys individually verified this session
    to genuinely exist in app.jsx's routing table. A notification's
    actionUrl/deep-link target is never trusted directly - it's
    looked up against this whitelist, and an unrecognized value
    simply does nothing (the user stays on the Notification Center)
    rather than attempting arbitrary navigation from
    server-controlled (and, for admin-created notifications,
    admin-controlled) metadata.
  */
  const DEEP_LINK_WHITELIST = new Set([
    "dashboard",
    "assets",
    "wallets",
    "kyc-submit",
    "referral",
    "staking",
    "rewards",
    "futures",
    "tradfi",
    "p2p",
    "web3wallet",
    "trade",
    "services",
    "exalt-card",
    "settings",
    "support",
  ]);

  const navigateToTarget = (actionUrl) => {
    if (
      typeof actionUrl === "string" &&
      DEEP_LINK_WHITELIST.has(actionUrl) &&
      typeof setPage === "function"
    ) {
      setPage(actionUrl);
    }
  };

  const fetchNotifications = async (targetPage = 1, targetCategory = category) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(targetPage),
        limit: "20",
      });
      if (targetCategory) params.set("category", targetCategory);

      const res = await axios.get(
        `${API_BASE}/api/notifications/me?${params.toString()}`,
        authHeaders
      );

      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
      setPageNumber(res.data?.page || 1);
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

      fetchNotifications(page, category);
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

      fetchNotifications(page, category);
    } catch (err) {
      alert(err.response?.data?.message || t("failedMarkAllRead"));
    }
  };

  useEffect(() => {
    fetchNotifications(1, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  if (loading && notifications.length === 0) {
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
          <select
            className="notification-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label={t("category")}
          >
            <option value="">{t("allCategories")}</option>
            <option value="Deposit">{t("deposit")}</option>
            <option value="Withdrawal">{t("withdraw")}</option>
            <option value="Trade">{t("trade")}</option>
            <option value="Futures">{t("futures")}</option>
            <option value="P2P">{t("p2p")}</option>
            <option value="KYC">{t("kyc")}</option>
            <option value="Reward">{t("reward")}</option>
            <option value="Security">{t("security")}</option>
            <option value="System">{t("system")}</option>
          </select>

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
            <strong>{total}</strong>
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
                onClick={() => navigateToTarget(item.actionUrl)}
                role={
                  item.actionUrl && DEEP_LINK_WHITELIST.has(item.actionUrl)
                    ? "button"
                    : undefined
                }
              >
                <div className="notification-card__content">
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead(item._id);
                    }}
                  >
                    {t("read")}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {totalPages > 1 ? (
          <div className="notification-pagination">
            <button
              disabled={page <= 1}
              onClick={() => fetchNotifications(page - 1, category)}
            >
              {t("previous")}
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchNotifications(page + 1, category)}
            >
              {t("next")}
            </button>
          </div>
        ) : null}

      </div>
    </PageShell>
  );
}