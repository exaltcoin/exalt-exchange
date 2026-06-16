import React from "react";

function Settings() {
  const API = import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";
const [qrCode, setQrCode] = useState("");
const [twoFaToken, setTwoFaToken] = useState("");
const [twoFaEnabled, setTwoFaEnabled] = useState(false);
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
const setup2FA = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API}/api/auth/2fa/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      setQrCode(data.qrCode);
      alert("Scan QR code with Google Authenticator");
    } else {
      alert(data.message || "2FA setup failed");
    }
  } catch (error) {
    console.log(error);
    alert("Server error");
  }
};

const verify2FA = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API}/api/auth/2fa/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token: twoFaToken }),
    });

    const data = await response.json();

    if (data.success) {
      setTwoFaEnabled(true);
      setQrCode("");
      setTwoFaToken("");
      alert("Google Authenticator enabled successfully");
    } else {
      alert(data.message || "Invalid code");
    }
  } catch (error) {
    console.log(error);
    alert("Server error");
  }
};

const disable2FA = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API}/api/auth/2fa/disable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token: twoFaToken }),
    });

    const data = await response.json();

    if (data.success) {
      setTwoFaEnabled(false);
      setTwoFaToken("");
      alert("Google Authenticator disabled");
    } else {
      alert(data.message || "Invalid code");
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
  <h2>Google Authenticator (2FA)</h2>

  {!twoFaEnabled ? (
    <>
      <button
        className="buy-btn"
        onClick={setup2FA}
      >
        Setup Google Authenticator
      </button>

      {qrCode && (
        <div style={{ marginTop: "20px" }}>
          <img src={qrCode} alt="QR Code" />

          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={twoFaToken}
            onChange={(e) => setTwoFaToken(e.target.value)}
            className="kyc-input"
            style={{ marginTop: "10px" }}
          />

          <button
            className="buy-btn"
            onClick={verify2FA}
            style={{ marginTop: "10px" }}
          >
            Verify & Enable
          </button>
        </div>
      )}
    </>
  ) : (
    <>
      <h3 style={{ color: "#00ff88" }}>
        Google Authenticator Enabled
      </h3>

      <input
        type="text"
        placeholder="Enter 6-digit code"
        value={twoFaToken}
        onChange={(e) => setTwoFaToken(e.target.value)}
        className="kyc-input"
      />

      <button
        className="sell-btn"
        onClick={disable2FA}
        style={{ marginTop: "10px" }}
      >
        Disable 2FA
      </button>
    </>
  )}
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