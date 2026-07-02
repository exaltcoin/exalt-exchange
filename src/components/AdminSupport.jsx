import { useEffect, useMemo, useState } from "react";
import "./AdminSupport.css";

export default function AdminSupport() {
  const API_BASE =
    import.meta.env.VITE_API_URL || "https://api.exaltexchange.io";
  const API = API_BASE.endsWith("/api") ? API_BASE.replace("/api", "") : API_BASE;

  const token = localStorage.getItem("token");

  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const quickReplies = [
    "Thank you for contacting Exalt Exchange Support. We are checking your issue now.",
    "Please share a screenshot or transaction ID so we can verify this faster.",
    "Your request has been forwarded to the technical team for review.",
    "Your ticket has been resolved. Please contact us again if you need more help.",
  ];

  const aiReply = (ticket) => {
    const text = `${ticket?.subject || ""} ${ticket?.message || ""}`.toLowerCase();

    if (text.includes("withdraw") || text.includes("withdrawal")) {
      return "AI Support: Your withdrawal request is being reviewed. Please confirm your wallet address, coin, network, and transaction ID. If the withdrawal is pending, our team will verify it from the admin panel and update your ticket.";
    }

    if (text.includes("deposit")) {
      return "AI Support: For deposit issues, please send the coin name, network, deposit address, amount, and transaction hash. Our support team will verify blockchain confirmation and update your account if everything is valid.";
    }

    if (text.includes("kyc")) {
      return "AI Support: Your KYC may be pending due to document clarity, selfie mismatch, or missing information. Please upload a clear ID/passport and a fresh selfie. Admin will review it shortly.";
    }

    if (text.includes("login") || text.includes("password")) {
      return "AI Support: For login issues, please try password reset first. If 2FA is enabled and you cannot access it, submit a security reset request with proof of account ownership.";
    }

    if (text.includes("p2p")) {
      return "AI Support: For P2P issues, please do not release funds until payment is fully confirmed. Share order ID, payment proof, and chat screenshot. Admin will review escrow status.";
    }

    return "AI Support: Thank you for contacting Exalt Exchange. Please share more details, screenshots, transaction ID, wallet address, or order ID so our support team can resolve your issue quickly.";
  };

  const loadTickets = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/support/admin/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setTickets(data.tickets || data.data || []);
      }
    } catch (err) {
      console.log("Admin support load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async (text = reply) => {
    if (!selected || !text.trim()) return;

    try {
      const res = await fetch(`${API}/api/support/admin/tickets/${selected._id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (data.success) {
        setReply("");
        await loadTickets();
        setSelected(data.ticket || selected);
      } else {
        alert(data.message || "Reply failed");
      }
    } catch (err) {
      console.log("Reply error:", err);
      alert("Reply failed");
    }
  };

  const sendAIReply = async () => {
    if (!selected) return;
    setAiLoading(true);
    const message = aiReply(selected);
    await sendReply(message);
    setAiLoading(false);
  };

  const updateStatus = async (status) => {
    if (!selected) return;

    try {
      const res = await fetch(`${API}/api/support/admin/tickets/${selected._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (data.success) {
        await loadTickets();
        setSelected({ ...selected, status });
      }
    } catch (err) {
      console.log("Status update error:", err);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesFilter = filter === "all" || t.status === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.subject?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.message?.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [tickets, filter, search]);

  return (
    <div className="admin-support-page">
      <div className="support-header">
        <div>
          <h1>Exalt Customer Support Center</h1>
          <p>Live tickets, AI replies, security review and admin support dashboard.</p>
        </div>

        <button onClick={loadTickets} className="refresh-btn">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="support-stats">
        <div><h3>{tickets.length}</h3><p>Total Tickets</p></div>
        <div><h3>{tickets.filter((t) => t.status === "open").length}</h3><p>Open</p></div>
        <div><h3>{tickets.filter((t) => t.status === "pending").length}</h3><p>Pending</p></div>
        <div><h3>{tickets.filter((t) => t.status === "closed").length}</h3><p>Closed</p></div>
      </div>

      <div className="support-layout">
        <div className="ticket-list-panel">
          <div className="ticket-tools">
            <input
              placeholder="Search ticket, email, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="ticket-list">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket._id}
                className={`ticket-item ${selected?._id === ticket._id ? "active" : ""}`}
                onClick={() => setSelected(ticket)}
              >
                <div>
                  <strong>{ticket.subject || "Support Request"}</strong>
                  <span>{ticket.email || ticket.userEmail || "User"}</span>
                </div>
                <small className={`status ${ticket.status || "open"}`}>
                  {ticket.status || "open"}
                </small>
              </button>
            ))}

            {!filteredTickets.length && (
              <p className="empty-text">No tickets found.</p>
            )}
          </div>
        </div>

        <div className="ticket-chat-panel">
          {!selected ? (
            <div className="no-ticket">
              <h2>Select a ticket</h2>
              <p>Choose any support ticket to reply, close, or use AI support.</p>
            </div>
          ) : (
            <>
              <div className="ticket-detail-header">
                <div>
                  <h2>{selected.subject || "Support Ticket"}</h2>
                  <p>{selected.email || selected.userEmail || "Unknown user"}</p>
                </div>

                <div className="status-actions">
                  <button onClick={() => updateStatus("open")}>Open</button>
                  <button onClick={() => updateStatus("pending")}>Pending</button>
                  <button onClick={() => updateStatus("closed")}>Close</button>
                </div>
              </div>

              <div className="user-security-box">
                <div><span>KYC</span><strong>{selected.kycStatus || "Unknown"}</strong></div>
                <div><span>Priority</span><strong>{selected.priority || "Normal"}</strong></div>
                <div><span>User ID</span><strong>{selected.userId || "N/A"}</strong></div>
                <div><span>Created</span><strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "N/A"}</strong></div>
              </div>

              <div className="chat-box">
                <div className="message user-msg">
                  <strong>User</strong>
                  <p>{selected.message || "No message"}</p>
                </div>

                {(selected.messages || []).map((m, i) => (
                  <div
                    key={i}
                    className={`message ${m.senderRole === "admin" ? "admin-msg" : "user-msg"}`}
                  >
                    <strong>{m.senderRole === "admin" ? "Support Agent" : "User"}</strong>
                    <p>{m.message}</p>
                  </div>
                ))}
              </div>

              <div className="quick-replies">
                {quickReplies.map((q) => (
                  <button key={q} onClick={() => setReply(q)}>
                    {q.slice(0, 35)}...
                  </button>
                ))}
              </div>

              <div className="reply-box">
                <textarea
                  placeholder="Write professional support reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />

                <div className="reply-actions">
                  <button className="ai-btn" onClick={sendAIReply} disabled={aiLoading}>
                    {aiLoading ? "AI Sending..." : "AI Auto Reply"}
                  </button>

                  <button className="send-btn" onClick={() => sendReply()}>
                    Send Reply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}