import { useEffect, useState } from "react";
const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

export default function AuthPanel({ setPage }) {
  const [mode, setMode] = useState("login");

 const [form, setForm] = useState({
  name: "",
  email: "",
  password: "",
  wallet: "",
  referralCode: "",
});

  const [show2FA, setShow2FA] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [tempUserId, setTempUserId] = useState("");

  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [message, setMessage] = useState("");

 useEffect(() => {
  const pendingReferralCode = localStorage.getItem("pendingReferralCode");

  if (pendingReferralCode) {
    setMode("signup");
    setForm((prev) => ({
      ...prev,
      referralCode: pendingReferralCode,
    }));
  }

  const token = localStorage.getItem("token");
  if (token && setPage) setPage("dashboard");
}, [setPage]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const signup = async () => {
    try {
      setMessage("");
      setEmailNotVerified(false);

      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
localStorage.removeItem("pendingReferralCode");
        setMode("login");
        setMessage("✅ Account created. Please verify your email before login.");
        alert("Account created. Please verify your email.");
      } else {
        alert(data.message || "Signup failed");
      }
   } catch (err) {
    console.error("LOGIN ERROR:", err);

    if (err instanceof TypeError) {
        alert("Cannot connect to server");
    } else {
        alert(err.message || "Server Error");
    }
}
  };

  const login = async () => {
  try {
    setMessage("");
    setEmailNotVerified(false);

    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });

    const data = await res.json();

    if (data.success) {
      if (data.require2FA) {
        setTempUserId(data.userId);
        setShow2FA(true);
        setTwoFaCode("");
        setBackupCode("");
        setUseBackupCode(false);
        alert("Enter Google Authenticator code");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Login successful");

      if (setPage) {
        setPage("dashboard");
      }

      window.location.reload();
    } else {
      if (data.emailNotVerified) {
        setEmailNotVerified(true);
        setMessage("⚠️ Please verify your email before login.");
        return;
      }

      alert(data.message || "Login failed");
    }
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    if (err instanceof TypeError) {
      alert("Cannot connect to server");
    } else {
      alert(err.message || "Server Error");
    }
  }
};

  const resendVerification = async () => {
    try {
      if (!form.email) {
        alert("Enter your email first");
        return;
      }

      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("✅ Verification email sent again. Check your inbox.");
        alert("Verification email sent.");
      } else {
        alert(data.message || "Failed to resend verification email");
      }
    } catch (err) {
      console.log(err);
      alert("Failed to resend verification email");
    }
  };

  const verifyLogin2FA = async () => {
    try {
      if (!useBackupCode && !twoFaCode) {
        alert("Enter Google Authenticator code");
        return;
      }

      if (useBackupCode && !backupCode) {
        alert("Enter backup recovery code");
        return;
      }

      const payload = useBackupCode
        ? { userId: tempUserId, backupCode }
        : { userId: tempUserId, token: twoFaCode };

      const res = await fetch(`${API}/api/auth/2fa/login-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Login successful");
        if (setPage) setPage("dashboard");
        window.location.reload();
      } else {
        alert(data.message || "Invalid 2FA or backup code");
      }
    } catch (err) {
      console.log(err);
      alert("2FA verification failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <h1>EXALT EXCHANGE</h1>

          <p>
            Secure crypto market board with wallet login, trading dashboard,
            referral rewards and admin approval system.
          </p>

          <div className="qr-box">
            <img
             src={`https://quickchart.io/qr?text=${encodeURIComponent("https://exaltexchange.io")}&size=160`}
              alt="QR"
            />
            <span>Scan QR To Open Exalt Exchange</span>
          </div>
        </div>

        <div className="auth-right">
          <h2>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>

          <p className="auth-subtitle">
            {mode === "login"
              ? "Login to continue"
              : "Create your secure account"}
          </p>

          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Login
            </button>

            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => setMode("signup")}
            >
              Signup
            </button>
          </div>

          {message && (
            <p
              style={{
                color: "#f0c419",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              {message}
            </p>
          )}

         {mode === "signup" && (
  <>
    <input
      name="name"
      placeholder="Full Name"
      value={form.name}
      onChange={handleChange}
    />

    <input
      name="wallet"
      placeholder="Wallet Address"
      value={form.wallet}
      onChange={handleChange}
    />

    <input
      name="referralCode"
      placeholder="Referral Code (Optional)"
      value={form.referralCode}
      onChange={handleChange}
    />
  </>
)}

          <input
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />

          {emailNotVerified && (
            <button
              type="button"
              onClick={resendVerification}
              style={{
                marginBottom: "12px",
                background: "#f0c419",
                color: "#111",
                fontWeight: "700",
              }}
            >
              Resend Verification Email
            </button>
          )}

          {show2FA && (
            <>
              {!useBackupCode ? (
                <input
                  type="text"
                  placeholder="Enter Google Authenticator Code"
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  placeholder="Enter Backup Recovery Code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                />
              )}

              <button onClick={verifyLogin2FA}>
                {useBackupCode ? "Login With Backup Code" : "Verify 2FA"}
              </button>

              <p
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setTwoFaCode("");
                  setBackupCode("");
                }}
                style={{
                  marginTop: "12px",
                  color: "#f0c419",
                  cursor: "pointer",
                  fontSize: "14px",
                  textAlign: "center",
                }}
              >
                {useBackupCode
                  ? "Use Google Authenticator Code"
                  : "Use Backup Recovery Code"}
              </p>
            </>
          )}

          <button
            className="auth-submit"
            onClick={mode === "signup" ? signup : login}
            disabled={show2FA}
            style={{
              opacity: show2FA ? 0.5 : 1,
              cursor: show2FA ? "not-allowed" : "pointer",
            }}
          >
            {mode === "signup" ? "Create Account" : "Login"}
          </button>

          <p
            className="forgot-password"
            onClick={async () => {
              const email = prompt("Enter your email");
              if (!email) return;

              try {
                const res = await fetch(`${API}/api/auth/forgot-password`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });

                const data = await res.json();

                if (data.success) {
                  alert("Password reset email sent. Check your inbox.");
                } else {
                  alert(data.message || "Failed to send reset email");
                }
              } catch (error) {
                console.log(error);
                alert("Failed to send reset email");
              }
            }}
            style={{
              marginTop: "14px",
              color: "#f0c419",
              cursor: "pointer",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Forgot Password?
          </p>

          <p className="security-text">
            🛡️ Exalt Exchange • Advanced Security • Google 2FA • Global Trading
          </p>
        </div>
      </div>
    </div>
  );
}