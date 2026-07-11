import { useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./kycVerification.css";

const RAW_API =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

const API_BASE = RAW_API.endsWith("/api")
  ? RAW_API.replace("/api", "")
  : RAW_API;

export default function KycVerification() {
  const { t } = useI18n();
const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    console.error(error);
    return {};
  }
})();

const userUid = storedUser?.uid
  ? String(storedUser.uid)
  : "";

const token = localStorage.getItem("token");

const [loading, setLoading] = useState(false);
const [emailOtp, setEmailOtp] = useState("");
const [emailVerified, setEmailVerified] = useState(false);
const [faceVerified, setFaceVerified] = useState(false);

const [form, setForm] = useState({
  fullName: storedUser?.name || storedUser?.fullName || "",
  email: storedUser?.email || "",
  phone: storedUser?.phone || "",
  country: storedUser?.country || "",
  documentType: "CNIC",
  documentNumber: "",
});

const [files, setFiles] = useState({
  cnicFront: null,
  cnicBack: null,
  passport: null,
  selfie: null,
});

const handleChange = (e) => {
  setForm((prev) => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
};

const handleFile = (name, file) => {
  setFiles((prev) => ({
    ...prev,
    [name]: file || null,
  }));
};


  const sendEmailOtp = () => {
    alert(t("emailOtpSent"));
  };

  const verifyEmail = () => {
    if (!emailOtp) {
      alert(t("enterOtpFirst"));
      return;
    }

    setEmailVerified(true);
    alert(t("emailVerifiedSuccessfully"));
  };

  const startFaceVerification = () => {
    setFaceVerified(true);
    alert(t("faceVerificationCompleted"));
  };

  const submitKyc = async () => {
    try {
      if (!token) {
        alert(t("pleaseLoginFirst"));
        return;
      }

      if (
        !form.fullName ||
        !form.email ||
        !form.phone ||
        !form.country ||
        !form.documentNumber
      ) {
        alert(t("fillAllRequiredFields"));
        return;
      }

      if (!files.cnicFront && !files.passport) {
        alert(t("uploadIdDocument"));
        return;
      }

      if (!emailVerified) {
        alert(t("verifyEmailFirst"));
        return;
      }

      if (!faceVerified) {
        alert(t("completeFaceVerification"));
        return;
      }

      setLoading(true);

      const data = new FormData();
     data.append("fullName", form.fullName);
data.append("email", form.email);
data.append("uid", userUid);
data.append("userUid", userUid);
data.append("phone", form.phone);
data.append("country", form.country);
      data.append("idType", form.documentType);
      data.append("idNumber", form.documentNumber);

      if (files.cnicFront) data.append("cnicFront", files.cnicFront);
      if (files.cnicBack) data.append("cnicBack", files.cnicBack);
      if (files.passport) data.append("passportImage", files.passport);
      if (files.selfie) data.append("selfieImage", files.selfie);

      const res = await axios.post(`${API_BASE}/api/kyc/submit`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        alert(t("kycSubmittedSuccessfully"));
        setEmailOtp("");
        setEmailVerified(false);
        setFaceVerified(false);
      } else {
        alert(res.data.message || t("kycSubmissionFailed"));
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || t("serverError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell titleKey="kycVerification" subtitleKey="kycVerificationSubtitle">
      <div className="kyc-page">
        <div className="kyc-card">
          <div className="kyc-user-uid-box">
  <span>{t("userId")}</span>
  <strong>{userUid || t("notAvailable")}</strong>
</div>
          <div className="kyc-grid">
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder={t("fullLegalName")}
            />

            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("emailAddress")}
            />

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder={t("mobileNumberCountryCode")}
            />

            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder={t("country")}
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
              placeholder={t("idNumber")}
            />
          </div>

          <div className="kyc-upload-section">
            <div className="kyc-upload-box">
              <div className="upload-icon">⬆️</div>
              <label>{t("cnicFront")}</label>
              <span>{files.cnicFront ? files.cnicFront.name : t("uploadFrontSide")}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFile("cnicFront", e.target.files?.[0])}
              />
            </div>

            <div className="kyc-upload-box">
              <div className="upload-icon">⬆️</div>
              <label>{t("cnicBack")}</label>
              <span>{files.cnicBack ? files.cnicBack.name : t("uploadBackSide")}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFile("cnicBack", e.target.files?.[0])}
              />
            </div>

            <div className="kyc-upload-box">
              <div className="upload-icon">⬆️</div>
              <label>{t("passportNationalId")}</label>
              <span>{files.passport ? files.passport.name : t("uploadDocument")}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFile("passport", e.target.files?.[0])}
              />
            </div>

            <div className="kyc-upload-box">
              <div className="upload-icon">⬆️</div>
              <label>{t("selfieVerification")}</label>
              <span>{files.selfie ? files.selfie.name : t("uploadSelfie")}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile("selfie", e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="verify-box">
            <h3>
              {t("emailVerification")} {emailVerified ? "✅" : "❌"}
            </h3>

            <div className="verify-row">
              <button type="button" onClick={sendEmailOtp}>
                {t("sendEmailOtp")}
              </button>

              <input
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                placeholder={t("enterEmailOtp")}
              />

              <button type="button" onClick={verifyEmail}>
                {t("verifyEmail")}
              </button>
            </div>
          </div>

          <div className="verify-box">
            <h3>
              {t("faceVerification")} {faceVerified ? "✅" : "❌"}
            </h3>

            <button className="face-btn" type="button" onClick={startFaceVerification}>
              {t("startFaceVerification")}
            </button>
          </div>

          <button
            className="submit-kyc-btn"
            onClick={submitKyc}
            disabled={loading}
          >
            {loading ? t("submittingKyc") : t("submitKyc")}
          </button>
        </div>
      </div>
    </PageShell>
  );
}