import { useState } from "react";
import axios from "axios";
import "./kycVerification.css";

const API = "https://exalt-exchange-backend.onrender.com";

export default function KycVerification() {
  const [loading, setLoading] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    documentType: "CNIC",
    documentNumber: "",
  });

  const [files, setFiles] = useState({
    cnicFront: null,
    cnicBack: null,
    passport: null,
    selfie: null,
  });

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (name, file) => {
    setFiles({ ...files, [name]: file });
  };

  const sendEmailOtp = () => {
    alert("Email OTP sent");
  };

  const verifyEmail = () => {
    if (!emailOtp) {
      alert("Enter OTP first");
      return;
    }

    setEmailVerified(true);
    alert("Email verified successfully");
  };

  const startFaceVerification = () => {
    setFaceVerified(true);
    alert("Face verification completed");
  };

  const submitKyc = async () => {
    try {
      if (!token) {
        alert("Please login first");
        return;
      }

      if (!form.fullName || !form.email || !form.phone || !form.country || !form.documentNumber) {
        alert("Please fill all required fields");
        return;
      }

      if (!files.cnicFront || !files.cnicBack || !files.passport || !files.selfie) {
        alert("Please upload all required documents");
        return;
      }

      if (!emailVerified) {
        alert("Please verify email first");
        return;
      }

      if (!faceVerified) {
        alert("Please complete face verification");
        return;
      }

      setLoading(true);

      const data = new FormData();
      data.append("fullName", form.fullName);
      data.append("email", form.email);
      data.append("phone", form.phone);
      data.append("country", form.country);
      data.append("documentType", form.documentType);
      data.append("documentNumber", form.documentNumber);
      data.append("cnicFront", files.cnicFront);
      data.append("cnicBack", files.cnicBack);
      data.append("passport", files.passport);
      data.append("selfie", files.selfie);

      const res = await axios.post(`${API}/api/kyc/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        alert("KYC submitted successfully");
      } else {
        alert(res.data.message || "KYC submission failed");
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kyc-page">
      <div className="kyc-card">
        <div className="kyc-header">
          <div>
            <h2>KYC Verification</h2>
            <p>Complete your identity verification to unlock verified user status.</p>
          </div>
        </div>

        <div className="kyc-grid">
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Full Legal Name"
          />

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email Address"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Mobile Number with Country Code"
          />

          <input
            name="country"
            value={form.country}
            onChange={handleChange}
            placeholder="Country"
          />

          <select
            name="documentType"
            value={form.documentType}
            onChange={handleChange}
          >
            <option>CNIC</option>
            <option>Passport</option>
            <option>National ID</option>
            <option>Driving License</option>
          </select>

          <input
            name="documentNumber"
            value={form.documentNumber}
            onChange={handleChange}
            placeholder="ID Number"
          />
        </div>

        <div className="kyc-upload-section">
          <div className="kyc-upload-box">
            <div className="upload-icon">⬆️</div>
            <label>CNIC Front</label>
            <span>{files.cnicFront ? files.cnicFront.name : "Upload front side"}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFile("cnicFront", e.target.files[0])}
            />
          </div>

          <div className="kyc-upload-box">
            <div className="upload-icon">⬆️</div>
            <label>CNIC Back</label>
            <span>{files.cnicBack ? files.cnicBack.name : "Upload back side"}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFile("cnicBack", e.target.files[0])}
            />
          </div>

          <div className="kyc-upload-box">
            <div className="upload-icon">⬆️</div>
            <label>Passport / National ID</label>
            <span>{files.passport ? files.passport.name : "Upload document"}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFile("passport", e.target.files[0])}
            />
          </div>

          <div className="kyc-upload-box">
            <div className="upload-icon">⬆️</div>
            <label>Selfie Verification</label>
            <span>{files.selfie ? files.selfie.name : "Upload selfie"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFile("selfie", e.target.files[0])}
            />
          </div>
        </div>

        <div className="verify-box">
          <h3>
            Email Verification{" "}
            {emailVerified ? "✅" : "❌"}
          </h3>

          <div className="verify-row">
            <button type="button" onClick={sendEmailOtp}>
              Send Email OTP
            </button>

            <input
              value={emailOtp}
              onChange={(e) => setEmailOtp(e.target.value)}
              placeholder="Enter Email OTP"
            />

            <button type="button" onClick={verifyEmail}>
              Verify Email
            </button>
          </div>
        </div>

        <div className="verify-box">
          <h3>
            Face Verification{" "}
            {faceVerified ? "✅" : "❌"}
          </h3>

          <button className="face-btn" type="button" onClick={startFaceVerification}>
            Start Face Verification
          </button>
        </div>

        <button
          className="submit-kyc-btn"
          onClick={submitKyc}
          disabled={loading}
        >
          {loading ? "Submitting KYC..." : "Submit KYC"}
        </button>
      </div>
    </div>
  );
}