import { useState } from "react";

function ResetPassword() {
  const API = import.meta.env.VITE_API_URL || "https://api.exaltexchange.io";
  const token = window.location.pathname.split("/reset-password/")[1];

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const resetPassword = async () => {
    const res = await fetch(`${API}/api/auth/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    setMessage(data.message || "Password reset request completed");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Reset Password</h2>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={resetPassword}>Reset Password</button>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default ResetPassword;