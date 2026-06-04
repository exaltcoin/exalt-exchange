import React, { useState } from "react";
import VerifiedBadge from "./verifiedBadge";
import "./kycVerification.css";
  const API =
  import.meta.env.VITE_API_URL ||
  "https://exalt-exchange-backend.onrender.com";
function KycVerification() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    idType: "CNIC",
    idNumber: "",
  });

  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [kycStatus, setKycStatus] = useState("not_submitted");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token") || "";

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendEmailOtp = async () => {
    if (!form.email) return alert("Enter email first");

    const res = await fetch(`${API}/api/otp/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email }),
    });

    const data = await res.json();
    alert(data.message || "Email OTP sent");
  };

  const verifyEmailOtp = async () => {
    const res = await fetch(`${API}/api/otp/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, otp: emailOtp }),
    });

    const data = await res.json();

    if (data.success) {
      setEmailVerified(true);
      alert("Email verified successfully");
    } else {
      alert(data.message || "Invalid email OTP");
    }
  };
  const startFaceVerification = () => {
    alert("Face verification demo approved. Real camera verification can be connected later.");
    setFaceVerified(true);
  };

  const submitKyc = async () => {
    if (!emailVerified || !faceVerified) {
  return alert("Please complete email and face verification first.");
}
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/kyc/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          emailVerified,
          faceVerified,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setKycStatus("pending");
        alert("KYC submitted successfully. Waiting for admin approval.");
      } else {
        alert(data.message || "KYC submission failed");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="kyc-page">
      <div className="kyc-card">
        <div className="kyc-header">
          <div>
            <h2>KYC Verification</h2>
            <p>Complete your identity verification to unlock verified user status.</p>
          </div>

          <VerifiedBadge status={kycStatus} />
        </div>
<div id="recaptcha-container"></div>
        <div className="kyc-grid">
          <input name="fullName" placeholder="Full Legal Name" value={form.fullName} onChange={update} />
          <input name="email" placeholder="Email Address" value={form.email} onChange={update} />
          <input name="phone" placeholder="Mobile Number with Country Code" value={form.phone} onChange={update} />
          <input name="country" placeholder="Country" value={form.country} onChange={update} />

          <select name="idType" value={form.idType} onChange={update}>
            <option value="CNIC">CNIC</option>
            <option value="Passport">Passport</option>
            <option value="National ID">National ID</option>
            <option value="Driving License">Driving License</option>
          </select>

          <input name="idNumber" placeholder="ID Number" value={form.idNumber} onChange={update} />
        </div>

        <div className="verify-box">
          <h3>Email Verification {emailVerified ? "✅" : "❌"}</h3>
          <div className="verify-row">
            <button onClick={sendEmailOtp}>Send Email OTP</button>
            <input placeholder="Enter Email OTP" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} />
            <button onClick={verifyEmailOtp}>Verify Email</button>
          </div>
        </div>
        <div className="verify-box">
          <h3>Face Verification {faceVerified ? "✅" : "❌"}</h3>
          <button className="face-btn" onClick={startFaceVerification}>
            Start Face Verification
          </button>
        </div>

        <button className="submit-kyc-btn" onClick={submitKyc} disabled={loading}>
          {loading ? "Submitting..." : "Submit KYC"}
        </button>
      </div>
    </div>
  );
}

export default KycVerification;