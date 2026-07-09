import { useState } from "react";
import exchangeLogo from "../assets/exalt-exchange-logo.png";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const API = API_BASE.endsWith("/api") ? API_BASE.replace("/api", "") : API_BASE;

function ForgotPassword({ setPage }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!email) return alert("Please enter your email.");

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("resetEmail", email);
        alert("Reset code sent to your email.");
        setPage("verify-reset-code");
      } else {
        alert(data.message || "Failed to send reset code.");
      }
    } catch (error) {
      console.log(error);
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <img src={exchangeLogo} alt="Exalt Exchange" style={{ width: 90 }} />
          <h1>Password Recovery</h1>
          <p>Securely reset your Exalt Exchange password using a 6-digit email verification code.</p>
        </div>

        <div className="auth-right">
          <h2>Forgot Password</h2>
          <p className="auth-subtitle">Enter your registered email address.</p>

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="auth-submit" onClick={sendCode} disabled={loading}>
            {loading ? "Sending Code..." : "Send Reset Code"}
          </button>

          <p
            className="forgot-password"
            onClick={() => setPage("auth")}
            style={{
              marginTop: "14px",
              color: "#f0c419",
              cursor: "pointer",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Back to Login
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;