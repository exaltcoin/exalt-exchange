import { useState } from "react";
import exchangeLogo from "../assets/exalt-exchange-logo.png";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const API = API_BASE.endsWith("/api") ? API_BASE.replace("/api", "") : API_BASE;

function VerifyResetCode({ setPage }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const email = localStorage.getItem("resetEmail") || "";

  const verifyCode = async () => {
    if (!code) return alert("Enter verification code.");

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("resetCode", code);
        alert("Code verified successfully.");
        setPage("reset-password");
      } else {
        alert(data.message || "Invalid verification code.");
      }
    } catch (err) {
      console.log(err);
      alert("Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <img src={exchangeLogo} alt="Exalt Exchange" style={{ width: 90 }} />
          <h1>Email Verification</h1>
          <p>Enter the 6-digit code sent to your email to continue password recovery.</p>
        </div>

        <div className="auth-right">
          <h2>Verify Code</h2>
          <p className="auth-subtitle">Code sent to:</p>

          <p style={{ color: "#f0c419", fontWeight: "700", textAlign: "center" }}>
            {email}
          </p>

          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6 digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />

          <button className="auth-submit" onClick={verifyCode} disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </button>

          <p
            className="forgot-password"
            onClick={() => setPage("forgot-password")}
            style={{
              marginTop: "14px",
              color: "#f0c419",
              cursor: "pointer",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Back
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyResetCode;