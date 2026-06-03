import React, { useState } from "react";
import VerifiedBadge from "./verifiedBadge";

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
    walletAddress: "",
    projectName: "Exalt Coin",
  });

  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
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
    if (data.verified) setEmailVerified(true);
    alert(data.message);
  };

  const sendPhoneOtp = async () => {
    if (!form.phone) return alert("Enter phone first");
    const res = await fetch(`${API}/api/otp/send-phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone }),
    });
    const data = await res.json();
    alert(data.message || "Phone OTP sent");
  };

  const verifyPhoneOtp = async () => {
    const res = await fetch(`${API}/api/otp/verify-phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone, otp: phoneOtp }),
    });
    const data = await res.json();
    if (data.verified) setPhoneVerified(true);
    alert(data.message);
  };

  const startFaceVerification = () => {
    alert("Face verification placeholder completed. Later connect Sumsub / Stripe Identity.");
    setFaceVerified(true);
  };

  const submitKyc = async () => {
    if (!emailVerified) return alert("Please verify email first");
    if (!phoneVerified) return alert("Please verify phone first");
    if (!faceVerified) return alert("Please complete face verification first");

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/kyc/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          ...form,
          emailVerified,
          phoneVerified,
          faceVerified,
          status: "pending",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "KYC submit failed");
        return;
      }

      setKycStatus("pending");
      alert("KYC submitted successfully. Admin review required.");
    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ padding: "22px" }}>
      <h2 style={{ color: "#f7b733" }}>KYC Verification</h2>
      <p>Complete email, phone and face verification before submitting KYC.</p>

      <VerifiedBadge status={kycStatus} />

      <div className="kyc-grid">
        <input name="fullName" placeholder="Full Legal Name" value={form.fullName} onChange={update} />
        <input name="email" placeholder="Email Address" value={form.email} onChange={update} />
        <input name="phone" placeholder="Mobile Number with country code" value={form.phone} onChange={update} />
        <input name="country" placeholder="Country" value={form.country} onChange={update} />
        <select name="idType" value={form.idType} onChange={update}>
          <option>CNIC</option>
          <option>Passport</option>
          <option>National ID</option>
          <option>Driving License</option>
        </select>
        <input name="idNumber" placeholder="ID Number" value={form.idNumber} onChange={update} />
        <input name="walletAddress" placeholder="Wallet Address" value={form.walletAddress} onChange={update} />
        <input name="projectName" placeholder="Project Name" value={form.projectName} onChange={update} />
      </div>

      <div className="verify-box">
        <h3>Email Verification {emailVerified ? "✅" : "❌"}</h3>
        <button onClick={sendEmailOtp}>Send Email OTP</button>
        <input placeholder="Enter Email OTP" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} />
        <button onClick={verifyEmailOtp}>Verify Email</button>
      </div>

      <div className="verify-box">
        <h3>Phone Verification {phoneVerified ? "✅" : "❌"}</h3>
        <button onClick={sendPhoneOtp}>Send Phone OTP</button>
        <input placeholder="Enter Phone OTP" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
        <button onClick={verifyPhoneOtp}>Verify Phone</button>
      </div>

      <div className="verify-box">
        <h3>Face Verification {faceVerified ? "✅" : "❌"}</h3>
        <button onClick={startFaceVerification}>Start Face Verification</button>
      </div>

      <button
        onClick={submitKyc}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          background: "#4ade80",
          border: "none",
          fontWeight: "bold",
          marginTop: "18px",
        }}
      >
        {loading ? "Submitting..." : "Submit KYC"}
      </button>
    </div>
  );
}

export default KycVerification;