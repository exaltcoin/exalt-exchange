import { useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;

function ForgotPassword({ setPage, setResetEmail }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    try {
      if (!email) {
        alert("Please enter your email.");
        return;
      }

      setLoading(true);

      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("resetEmail", email);
        if (setResetEmail) setResetEmail(email);
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
    <div className="auth-card">
      <h2>Forgot Password</h2>
      <p>Enter your email and we will send you a 6 digit reset code.</p>

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={sendCode} disabled={loading}>
        {loading ? "Sending..." : "Send Code"}
      </button>

      <button type="button" onClick={() => setPage("auth")}>
        Back to Login
      </button>
    </div>
  );
}

export default ForgotPassword;