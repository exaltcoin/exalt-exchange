import React from "react";

function Settings() {
  const API = import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

  const submitKYC = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    const inputs = document.querySelectorAll(".kyc-input");
const user = JSON.parse(localStorage.getItem("user") || "{}");
  const payload = {
    userId: user._id || user.id || "guest",
  fullName: inputs[0].value,
  email: inputs[1].value,
  country: inputs[2].value,
  walletAddress: inputs[3].value,
  idType: inputs[4].value,
  idNumber: inputs[5].value,
  telegramUsername: inputs[6].value,
  projectName: inputs[7].value,
};

    const response = await fetch(`${API}/api/kyc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
console.log("KYC API URL:", `${API}/api/kyc`);
console.log("KYC PAYLOAD:", payload);
    const data = await response.json();

    if (data.success) {
      alert("KYC submitted successfully");

      inputs.forEach((input) => {
        input.value = "";
      });
    } else {
      alert(data.message || "KYC failed");
    }
  } catch (error) {
    console.log(error);
    alert("Server error");
  }
};

  return (
    <div className="panel">
      <h2>SETTINGS & SECURITY</h2>
      <p>Manage account security, KYC verification and exchange permissions.</p>

      <div className="stats-grid">
        <div className="stat-card glow-green">
          <h3>KYC Status</h3>
          <h1>Required</h1>
          <p>Users must complete KYC before coin listing approval.</p>
        </div>

        <div className="stat-card glow-blue">
          <h3>Listing Security</h3>
          <h1>Admin Review</h1>
          <p>Every coin listing is checked manually before going live.</p>
        </div>

        <div className="stat-card glow-red">
          <h3>Bot Protection</h3>
          <h1>Enabled</h1>
          <p>Wallet verification and manual approval reduce fake listings.</p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "25px" }}>
        <h2>KYC Verification Form</h2>

        <div className="listing-form">
          <input className="kyc-input" placeholder="Full Legal Name" />
          <input className="kyc-input" placeholder="Email Address" />
          <input className="kyc-input" placeholder="Country" />
          <input className="kyc-input" placeholder="Wallet Address" />
          <input className="kyc-input" placeholder="ID Type: Passport / CNIC / National ID" />
          <input className="kyc-input" placeholder="ID Number" />
          <input className="kyc-input" placeholder="Telegram Username" />
          <input className="kyc-input" placeholder="Project / Coin Name" />

          <button className="buy-btn" onClick={submitKYC}>
            Submit KYC
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "25px" }}>
        <h2>Security Rules</h2>
        <p>✅ KYC required before coin listing approval</p>
        <p>✅ Admin manually approves or rejects every listing</p>
        <p>✅ Wallet address must match submitted project owner</p>
        <p>✅ Fake/bot submissions can be rejected</p>
        <p>✅ Bank/card deposit requests require manual verification</p>
      </div>
    </div>
  );
}

export default Settings;