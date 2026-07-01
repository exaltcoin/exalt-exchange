import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;
export default function VerifyEmail() {
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = window.location.pathname.split("/verify-email/")[1];

        if (!token) {
          setStatus("Invalid verification link.");
          return;
        }

        const res = await fetch(`${API}/api/auth/verify-email/${token}`);
        const data = await res.json();

        if (data.success) {
          setStatus("✅ Email verified successfully. You can now login.");
        } else {
          setStatus(data.message || "Email verification failed.");
        }
      } catch (error) {
        console.log(error);
        setStatus("Server error. Please try again.");
      }
    };

    verifyEmail();
}, [API]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "520px", margin: "auto" }}>
        <div className="auth-right" style={{ width: "100%" }}>
          <h2>Email Verification</h2>

          <p
            style={{
              color: "#f0c419",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            {status}
          </p>

          <button
            className="auth-submit"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Go To Login
          </button>
        </div>
      </div>
    </div>
  );
}