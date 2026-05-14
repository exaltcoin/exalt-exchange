import { useState } from "react";

const API = "https://exalt-exchange-backend.onrender.com";

export default function AuthPanel() {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    wallet: "",
  });

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
      } else {
        alert(data.message);
      }
    } catch (err) {
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
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Server Error");
    }
  };

  return (
    <div
      style={{
        background: "#111827",
        padding: 20,
        borderRadius: 14,
        marginTop: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => setMode("login")}
          style={{
            background: mode === "login" ? "#22c55e" : "#1f2937",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 8,
          }}
        >
          Login
        </button>

        <button
          onClick={() => setMode("signup")}
          style={{
            background: mode === "signup" ? "#22c55e" : "#1f2937",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 8,
          }}
        >
          Signup
        </button>
      </div>

      {mode === "signup" && (
        <>
          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            style={input}
          />

          <input
            name="wallet"
            placeholder="Wallet Address"
            onChange={handleChange}
            style={input}
          />
        </>
      )}

      <input
        name="email"
        placeholder="Email"
        onChange={handleChange}
        style={input}
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
        style={input}
      />

      <button
        onClick={mode === "login" ? login : signup}
        style={{
          width: "100%",
          background: "#22c55e",
          color: "#fff",
          border: "none",
          padding: 14,
          borderRadius: 10,
          fontWeight: "bold",
          marginTop: 10,
        }}
      >
        {mode === "login" ? "Login" : "Create Account"}
      </button>
    </div>
  );
}

const input = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#0f172a",
  color: "#fff",
};