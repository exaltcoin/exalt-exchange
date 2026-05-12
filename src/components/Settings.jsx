import React from "react";

function Settings() {
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
          <p>Wallet verification and manual approval help reduce fake listings.</p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "25px" }}>
        <h2>KYC Verification Form</h2>

        <div className="listing-form">
          <input placeholder="Full Legal Name" />
          <input placeholder="Email Address" />
          <input placeholder="Country" />
          <input placeholder="Wallet Address" />
          <input placeholder="ID Type: Passport / CNIC / National ID" />
          <input placeholder="ID Number" />
          <input placeholder="Telegram Username" />
          <input placeholder="Project / Coin Name" />

          <button
            className="buy-btn"
            onClick={() =>
              alert("KYC request submitted. Admin will review and approve.")
            }
          >
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