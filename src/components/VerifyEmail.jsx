import { useEffect, useState } from "react";
import exchangeLogo from "../assets/exalt-exchange-logo.png";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const API = API_BASE.endsWith("/api") ? API_BASE.replace("/api", "") : API_BASE;

function VerifyEmail() {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Please wait while we verify your email.");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = window.location.pathname.split("/verify-email/")[1];

        if (!token) {
          setStatus("error");
          setMessage("Verification token is missing.");
          return;
        }

        const res = await fetch(`${API}/api/auth/verify-email/${token}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully.");
        } else {
          setStatus("error");
          setMessage(data.message || "Invalid or expired verification link.");
        }
      } catch (error) {
        console.log(error);
        setStatus("error");
        setMessage("Server error. Please try again.");
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <img src={exchangeLogo} alt="Exalt Exchange" style={{ width: 90 }} />
          <h1>Email Security</h1>
          <p>
            Exalt Exchange verifies every account email to keep your account safe
            and protect your digital assets.
          </p>
        </div>

        <div className="auth-right">
          <h2>
            {status === "verifying"
              ? "Verifying Email"
              : status === "success"
              ? "Email Verified"
              : "Verification Failed"}
          </h2>

          <p className="auth-subtitle">{message}</p>

          <div
            style={{
              margin: "25px auto",
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "42px",
              background:
                status === "success"
                  ? "rgba(34,197,94,0.15)"
                  : status === "error"
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(240,196,25,0.15)",
              color:
                status === "success"
                  ? "#22c55e"
                  : status === "error"
                  ? "#ef4444"
                  : "#f0c419",
            }}
          >
            {status === "success" ? "✓" : status === "error" ? "!" : "…"}
          </div>

          {status === "verifying" && (
            <button className="auth-submit" disabled>
              Verifying...
            </button>
          )}

          {status !== "verifying" && (
            <button
              className="auth-submit"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Go to Login
            </button>
          )}

          <p className="security-text">
            🛡️ Secure • Fast • Global Digital Asset Exchange
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;