import { useState } from "react";

function Support() {
  const [wallet, setWallet] = useState("");
  const [message, setMessage] = useState("");
 const user = JSON.parse(localStorage.getItem("user") || "{}");
const [userName, setUserName] = useState(user.name || user.fullName || user.email || "");
const [userEmail, setUserEmail] = useState(user.email || "");
  const submitTicket = async () => {
    if (!wallet || !message) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
const token = localStorage.getItem("token");
      const response = await fetch("https://exalt-exchange-backend.onrender.com/api/support-ticket", {
        method: "POST",
       headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
        body: JSON.stringify({
          wallet,
          message,
          userName,
          userEmail,
          status: "pending",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to submit ticket");
        return;
      }

      alert(data.message || "Support ticket submitted successfully");

      setWallet("");
      setMessage("");
      setUserName("");
      setUserEmail("");
    } catch (error) {
      console.log(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h2>Support Center</h2>

      <div className="admin-card">
        <h3>Official EXALT Support</h3>

        <p>
          Welcome to EXALT Exchange official support center.
          For listing help, wallet issues, deposits, trading support,
          partnership requests and community updates, contact only
          official EXALT channels below.
        </p>

        <p>
          Telegram Community:
          <br />
       href="https://t.me/ExaltExchangeOfficial"
        </p>

        <p>
          Official Support Admin:
          <br />
       href="https://t.me/Exaltexchange"
        </p>

        <p>
          X Official:
          <br />
       href="https://x.com/ExaltExchange"
        </p>

        <p style={{ color: "#00ff99", marginTop: "10px" }}>
          Live support available for EXALT Exchange Admins.
        </p>

        <div className="link-row">
          <a
            href="https://t.me/ExaltExchangeOfficial"
            target="_blank"
            rel="noreferrer"
          >
            <button className="buy-btn">Telegram Community</button>
          </a>
          <a
            href="https://t.me/Exaltexchange"
            target="_blank"
            rel="noreferrer"
          >
            <button className="buy-btn">Support Admin</button>
          </a>

          <a
            href="https://x.com/ExaltExchange"
            target="_blank"
            rel="noreferrer"
          >
            <button className="buy-btn">X Official</button>
          </a>
        </div>
      </div>

      <div className="admin-card">
        <h3>Submit Support Request</h3>

        <input
          className="support-input"
          placeholder="Your wallet address"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
        />

        <input
          className="support-input"
          placeholder="Describe your issue"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          className="buy-btn"
          onClick={submitTicket}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Ticket"}
        </button>
      </div>
    </div>
  );
}

export default Support;