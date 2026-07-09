import { useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;

function VerifyResetCode({ setPage }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const email = localStorage.getItem("resetEmail") || "";

  const verifyCode = async () => {
    try {
      if (!code) {
        return alert("Enter verification code.");
      }

      setLoading(true);

      const res = await fetch(`${API}/api/auth/verify-reset-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
        }),
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
    <div className="auth-card">
      <h2>Email Verification</h2>

      <p>
        Enter the 6 digit verification code sent to:
      </p>

      <strong>{email}</strong>

      <input
        type="text"
        maxLength={6}
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button onClick={verifyCode} disabled={loading}>
        {loading ? "Verifying..." : "Verify Code"}
      </button>

      <button onClick={() => setPage("forgot-password")}>
        Back
      </button>
    </div>
  );
}

export default VerifyResetCode;