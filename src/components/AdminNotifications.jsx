import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminNotifications.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({
    title: "Exalt Exchange Update",
    message: "New platform update is now live.",
    type: "System",
    priority: "Normal",
    isGlobal: true,
    actionUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/api/notifications/admin/all`,
        authHeaders
      );
      setNotifications(res.data?.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const sendNotification = async (e) => {
    e.preventDefault();

    try {
      setSending(true);

      await axios.post(
        `${API_BASE}/api/notifications/admin/create`,
        form,
        authHeaders
      );

      fetchNotifications();
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (id) => {
    const ok = window.confirm("Delete this notification?");
    if (!ok) return;

    await axios.delete(
      `${API_BASE}/api/notifications/admin/${id}`,
      authHeaders
    );

    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return <div className="admin-notification-page">Loading Notifications Admin...</div>;
  }

  return (
    <div className="admin-notification-page">
      <div className="admin-notification-header">
        <div>
          <h2>Notifications Admin</h2>
          <p>Create global alerts, manage user notifications and system announcements.</p>
        </div>

        <button onClick={fetchNotifications}>Refresh</button>
      </div>

      <form className="admin-notification-form" onSubmit={sendNotification}>
        <h3>Create Notification</h3>

        <div className="admin-notification-inputs">
          <label>
            Title
            <input name="title" value={form.title} onChange={handleChange} />
          </label>

          <label>
            Type
            <select name="type" value={form.type} onChange={handleChange}>
              <option>Deposit</option>
              <option>Withdrawal</option>
              <option>P2P</option>
              <option>KYC</option>
              <option>Reward</option>
              <option>Security</option>
              <option>Achievement</option>
              <option>System</option>
            </select>
          </label>

          <label>
            Priority
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option>Low</option>
              <option>Normal</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </label>

          <label>
            Action URL
            <input name="actionUrl" value={form.actionUrl} onChange={handleChange} />
          </label>
        </div>

        <label className="admin-notification-message">
          Message
          <textarea name="message" value={form.message} onChange={handleChange} />
        </label>

        <label className="admin-notification-check">
          <input
            type="checkbox"
            name="isGlobal"
            checked={form.isGlobal}
            onChange={handleChange}
          />
          Send as Global Notification
        </label>

        <button type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send Notification"}
        </button>
      </form>

      <div className="admin-notification-table-box">
        <h3>All Notifications</h3>

        <table className="admin-notification-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Scope</th>
              <th>Read</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {notifications.length === 0 ? (
              <tr>
                <td colSpan="7">No notifications found</td>
              </tr>
            ) : (
              notifications.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.title}</strong>
                    <small>{item.message}</small>
                  </td>
                  <td>{item.type}</td>
                  <td>{item.priority}</td>
                  <td>{item.isGlobal ? "Global" : item.user?.email || "User"}</td>
                  <td>{item.isRead ? "Read" : "Unread"}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="danger"
                      onClick={() => deleteNotification(item._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}