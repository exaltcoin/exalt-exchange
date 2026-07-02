import React, { useEffect, useState } from "react";
import { useI18n, LanguageSwitcher } from "../i18n";
function Settings() {
  const { lang, languages } = useI18n();
  const API_BASE =
    import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const API = API_BASE.endsWith("/api")
    ? API_BASE.replace("/api", "")
    : API_BASE;
  const [qrCode, setQrCode] = useState("");
  const [twoFaToken, setTwoFaToken] = useState("");
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setTwoFaEnabled(!!user.twoFactorEnabled);
  }, []);

  const getToken = () => localStorage.getItem("token");

  const submitKYC = async () => {
    try {
      const token = getToken();

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
      const token = getToken();

      if (!token) {
        alert("Please login first");
        return;
      }

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
        setBackupCodes([]);
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
      const token = getToken();

      if (!twoFaToken) {
        alert("Enter Google Authenticator code");
        return;
      }

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
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.twoFactorEnabled = true;
        localStorage.setItem("user", JSON.stringify(user));

        setTwoFaEnabled(true);
        setQrCode("");
        setTwoFaToken("");
        setBackupCodes(data.backupCodes || []);

        alert("Google Authenticator enabled. Save your backup codes.");
      } else {
        alert(data.message || "Invalid code");
      }
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  const regenerateBackupCodes = async () => {
    try {
      const token = getToken();

      if (!twoFaToken) {
        alert("Enter Google Authenticator code first");
        return;
      }

      const response = await fetch(
        `${API}/api/auth/2fa/regenerate-backup-codes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: twoFaToken }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setBackupCodes(data.backupCodes || []);
        setTwoFaToken("");
        alert("New backup codes generated. Save them safely.");
      } else {
        alert(data.message || "Failed to regenerate backup codes");
      }
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  const disable2FA = async () => {
    try {
      const token = getToken();

      if (!twoFaToken) {
        alert("Enter Google Authenticator code");
        return;
      }

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
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.twoFactorEnabled = false;
        localStorage.setItem("user", JSON.stringify(user));

        setTwoFaEnabled(false);
        setTwoFaToken("");
        setBackupCodes([]);
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
<div className="panel" style={{ marginTop: "20px" }}>
  <h2>🌍 Language Preferences</h2>
  <p>
    Choose your preferred language for Exalt Exchange. Your selection will be
    saved automatically on this device.
  </p>

  <div style={{ marginTop: "15px", maxWidth: "320px" }}>
    <LanguageSwitcher />
  </div>

  <p style={{ marginTop: "12px", color: "#f0c419" }}>
    Active Language:{" "}
    {languages.find((item) => item.code === lang)?.native || "English"}
  </p>
</div>
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
            <button className="buy-btn" onClick={setup2FA}>
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
            <h3 style={{ color: "#00ff88" }}>Google Authenticator Enabled</h3>

            <input
              type="text"
              placeholder="Enter 6-digit Google Authenticator code"
              value={twoFaToken}
              onChange={(e) => setTwoFaToken(e.target.value)}
              className="kyc-input"
            />

            <button
              className="buy-btn"
              onClick={regenerateBackupCodes}
              style={{ marginTop: "10px", marginRight: "10px" }}
            >
              Regenerate Backup Codes
            </button>

            <button
              className="sell-btn"
              onClick={disable2FA}
              style={{ marginTop: "10px" }}
            >
              Disable 2FA
            </button>
          </>
        )}

        {backupCodes.length > 0 && (
          <div
            className="panel"
            style={{
              marginTop: "20px",
              border: "1px solid #f0c419",
            }}
          >
            <h3 style={{ color: "#f0c419" }}>Save Your Backup Codes</h3>
            <p>
              These codes are shown only once. Save them safely. Each code can
              be used one time if you lose Google Authenticator.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  style={{
                    padding: "10px",
                    background: "#111",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "700",
                    letterSpacing: "1px",
                  }}
                >
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="panel" style={{ marginTop: "25px" }}>
        <h2>KYC Verification Form</h2>

        <div className="listing-form">
          <input className="kyc-input" placeholder="Full Legal Name" />
          <input className="kyc-input" placeholder="Email Address" />
          <input className="kyc-input" placeholder="Country" />
          <input className="kyc-input" placeholder="Wallet Address" />
          <input
            className="kyc-input"
            placeholder="ID Type: Passport / CNIC / National ID"
          />
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