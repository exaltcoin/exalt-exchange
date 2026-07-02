import { useMemo, useState } from "react";
import "./Support.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://api.exaltexchange.io";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;

function Support() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [category, setCategory] = useState("Wallet / Deposit");
  const [priority, setPriority] = useState("Medium");
  const [wallet, setWallet] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState(
    user.name || user.fullName || user.email || ""
  );
  const [userEmail, setUserEmail] = useState(user.email || "");
  const [loading, setLoading] = useState(false);
  const [aiReply, setAiReply] = useState("");

  const aiSuggestion = useMemo(() => {
    const text = `${category} ${subject} ${message}`.toLowerCase();

    if (text.includes("withdraw")) {
      return "AI Support: Please confirm coin, network, withdrawal address, amount and transaction ID. If your withdrawal is pending, support will review it from the admin panel.";
    }

    if (text.includes("deposit")) {
      return "AI Support: Please share coin, network, deposit address, amount and transaction hash. Support will verify blockchain confirmation.";
    }

    if (text.includes("kyc")) {
      return "AI Support: Please upload a clear ID/passport and selfie. If rejected, check document clarity, expiry date and name match.";
    }

    if (text.includes("login") || text.includes("password")) {
      return "AI Support: Try forgot password first. If 2FA is locked, submit a security reset request with account ownership proof.";
    }

    if (text.includes("p2p")) {
      return "AI Support: Do not release funds until payment is confirmed. Share order ID, payment proof and chat screenshot.";
    }

    return "AI Support: Please provide full details, screenshots, wallet address, order ID or transaction hash so support can resolve your issue faster.";
  }, [category, subject, message]);

  const submitTicket = async () => {
    if (!userEmail || !subject || !message) {
      alert("Please fill email, subject and message");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        userName,
        userEmail,
        email: userEmail,
        wallet,
        category,
        priority,
        subject,
        message,
        aiSuggestion,
        status: "open",
      };

      const endpoints = [
        `${API}/api/support-ticket`,
        `${API}/api/support/tickets`,
      ];

      let data = null;
      let ok = false;

      for (const url of endpoints) {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        data = await res.json().catch(() => ({}));

        if (res.ok && (data.success || data.message)) {
          ok = true;
          break;
        }
      }

      if (!ok) {
        alert(data?.message || "Failed to submit ticket");
        return;
      }

      alert(data?.message || "Support ticket submitted successfully");

      setWallet("");
      setSubject("");
      setMessage("");
      setAiReply("");
    } catch (error) {
      console.log(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-center-page">
      <div className="support-hero">
        <div>
          <h1>Exalt Customer Support Center</h1>
          <p>
            Professional support for wallet, deposits, withdrawals, KYC, P2P,
            trading, security and account issues.
          </p>
        </div>

        <div className="support-badge">24/7 AI + Human Support</div>
      </div>

      <div className="support-grid">
        <div className="support-card ai-card">
          <h2>AI Support Assistant</h2>
          <p>
            If our team is not immediately available, AI will guide you first.
            You can still submit a ticket for human review.
          </p>

          <button className="support-btn green" onClick={() => setAiReply(aiSuggestion)}>
            Ask AI Support
          </button>

          {aiReply && <div className="ai-answer">{aiReply}</div>}

          <div className="official-links">
            <a href="https://t.me/ExaltExchangeOfficial" target="_blank" rel="noreferrer">
              Telegram Community
            </a>
            <a href="https://t.me/Exaltexchange" target="_blank" rel="noreferrer">
              Support Admin
            </a>
            <a href="https://x.com/ExaltExchange" target="_blank" rel="noreferrer">
              X Official
            </a>
          </div>
        </div>

        <div className="support-card">
          <h2>Create Support Ticket</h2>

          <div className="support-row">
            <input
              placeholder="Full name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />

            <input
              placeholder="Email address"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>

          <div className="support-row">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Wallet / Deposit</option>
              <option>Withdrawal</option>
              <option>KYC Verification</option>
              <option>P2P Order</option>
              <option>Trading Issue</option>
              <option>Account Security</option>
              <option>Listing / Partnership</option>
              <option>Other</option>
            </select>

            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>

          <input
            placeholder="Wallet address / Order ID / TX Hash optional"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
          />

          <input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <textarea
            placeholder="Describe your issue in detail..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button className="support-btn" onClick={submitTicket} disabled={loading}>
            {loading ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Support;