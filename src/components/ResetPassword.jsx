import { useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;

function ResetPassword({ setPage }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const email = localStorage.getItem("resetEmail") || "";
  const code = localStorage.getItem("resetCode") || "";

  const resetPassword = async () => {
    try {
      if (!password || !confirmPassword) {
        return alert("Please enter password and confirm password.");
      }

      if (password !== confirmPassword) {
        return alert("Passwords do not match.");
      }

      if (password.length < 6) {
        return alert("Password must be at least 6 characters.");
      }

      setLoading(true);

      const res = await fetch(`${API}/api/auth/reset-password-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
          password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.removeItem("resetEmail");
        localStorage.removeItem("resetCode");

        alert("Password reset successful. Please login.");
        setPage("auth");
      } else {
        alert(data.message || "Password reset failed.");
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
      <h2>Reset Password</h2>
      <p>Create your new Exalt Exchange password.</p>

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button onClick={resetPassword} disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </button>

      <button type="button" onClick={() => setPage("auth")}>
        Back to Login
      </button>
    </div>
  );
}

export default ResetPassword;