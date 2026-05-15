import { useEffect, useState } from "react";

const API = "https://exalt-exchange-backend.onrender.com";

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
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Signup successful");

        if (setPage) setPage("dashboard");
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
      const res = await fetch(`${API}/api/login`, {
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
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Login successful");

        if (setPage) setPage("dashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.log(err);
      alert("Server Error");
    }
  };

  return (
    <div className="panel">
      <h2>AUTH</h2>
      <p>Login or create your Exalt Exchange account</p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button onClick={() => setMode("login")}>Login</button>
        <button onClick={() => setMode("signup")}>Signup</button>
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
        onChange={handleChange}     />

      <input
        name="password"        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
      />

      {mode === "signup" ? (
        <button className="submit-btn" onClick={signup}>
          Create Account
        </button>
      ) : (
        <button className="submit-btn" onClick={login}>
          Login
        </button>
      )}
    </div>
  );}