import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;
export default function AuthPanel({ setPage }) {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    wallet: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token && setPage) {
      setPage("dashboard");
    }
  }, [setPage]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const signup = async () => {
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
       const safeUser = {
  _id: data.user._id,
  name: data.user.name,
  email: data.user.email,
  role: data.user.role || "user",
};

localStorage.setItem("user", JSON.stringify(safeUser));

        alert("Signup successful");

        if (setPage) {
          setPage("dashboard");
        }
        window.location.reload();
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.log(err);
      alert("Server Error");
    }
  };

  const login = async () => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        credentials: "include",
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
  localStorage.setItem("tempUserId", data.userId);
  alert("Google Authenticator code required");
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
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.log(err);
      alert("Server Error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-left">
          <h1>EXALT EXCHANGE</h1>

          <p>
            Secure crypto market board with wallet login,
            trading dashboard, referral rewards and admin approval system.
          </p>

          <div className="qr-box">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://exaltexchange.io"
              alt="QR"
            />

            <span>Scan QR To Open Exalt Exchange</span>
          </div>
        </div>

        <div className="auth-right">

          <h2>
            {mode === "login"
              ? "Welcome Back"
              : "Create Account"}
          </h2>

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

          <button
            className="auth-submit"
            onClick={mode === "signup" ? signup : login}
          >
            {mode === "signup"
              ? "Create Account"
              : "Login"}
          </button>
<p
className="forgot-password"
onClick={async () => {
  const email = prompt("Enter your email");

  if (!email) return;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

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