import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import countryList from "react-select-country-list";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./Profile.css";

const SafePhoneInput = PhoneInput.default || PhoneInput;

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";

function Profile() {
  const { t } = useI18n();

  const [user, setUser] = useState({});
  const [kycStatus, setKycStatus] = useState("Not Verified");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [telegram, setTelegram] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState("us");

  const countryOptions = useMemo(() => countryList().getData(), []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

        if (!token) {
          setUser(savedUser);
          setPhone(savedUser.phone || "");
          setCountry(savedUser.country || "");
          setTelegram(savedUser.telegram || "");
          setBio(savedUser.bio || "");
          setProfileImage(savedUser.profileImage || "");
          return;
        }

        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        const profileUser = data.user || savedUser;

        setTwoFactorEnabled(profileUser.twoFactorEnabled || false);
        localStorage.setItem("user", JSON.stringify(profileUser));

        setUser(profileUser);
        setPhone(profileUser.phone || "");
        setCountry(profileUser.country || "");
        setTelegram(profileUser.telegram || "");
        setBio(profileUser.bio || "");
        setProfileImage(profileUser.profileImage || "");

        try {
          const kycRes = await fetch(
            `${API_BASE}/api/kyc/user/${encodeURIComponent(profileUser.email)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const kycData = await kycRes.json();

          if (kycData.success) {
            setKycStatus(kycData.status || "not_submitted");
          }
        } catch (err) {
          console.log("KYC status load failed", err);
        }

        if (profileUser.country) {
          const found = countryOptions.find(
            (opt) => opt.label === profileUser.country
          );
          setPhoneCountry(found?.value?.toLowerCase() || "us");
        }

        if (profileUser.kycStatus) {
          setKycStatus(profileUser.kycStatus);
        }
      } catch (err) {
        console.log(err);
      }
    };

    loadProfile();
  }, [countryOptions]);

  const connectedWallet =
    localStorage.getItem("wallet") ||
    localStorage.getItem("walletAddress") ||
    user.wallet ||
    "";

  const shortWallet = connectedWallet
    ? `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}`
    : t("notConnected");

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert(t("pleaseLoginFirst"));
        return;
      }

      const formData = new FormData();

      formData.append("name", user.name || "");
      formData.append("phone", phone || "");
      formData.append("country", country || "");
      formData.append("telegram", telegram || "");
      formData.append("bio", bio || "");

      if (profileImage instanceof File) {
        formData.append("profileImage", profileImage);
      }

      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        alert(t("profileUpdatedSuccessfully"));
      } else {
        alert(data.message || t("profileUpdateFailed"));
      }
    } catch (err) {
      console.log(err);
      alert(t("updateFailed"));
    }
  };

  const kycLabel =
    kycStatus === "approved"
      ? t("verified")
      : kycStatus === "rejected"
      ? t("rejected")
      : kycStatus === "pending"
      ? t("pending")
      : t("notSubmitted");

  return (
    <PageShell titleKey="profile" subtitleKey="profileSubtitle">
      <div className="profile-page">
        <div className="profile-hero">
          <div className="profile-avatar">
            {profileImage && typeof profileImage === "string" ? (
              <img src={profileImage} alt="Profile" className="profile-avatar-img" />
            ) : (
              (user.name || user.email || "U").charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <h2>{user.name || t("userProfile")}</h2>
            <p>{user.email || t("noEmailConnected")}</p>
          </div>

          <span className={twoFactorEnabled ? "twofa-badge enabled" : "twofa-badge disabled"}>
            {twoFactorEnabled ? t("twoFaEnabled") : t("twoFaDisabled")}
          </span>

          <span
            className={
              kycStatus === "approved"
                ? "profile-badge verified"
                : kycStatus === "rejected"
                ? "profile-badge rejected"
                : "profile-badge pending"
            }
          >
            {kycLabel}
          </span>
        </div>

        <div className="profile-card edit-profile-card">
          <div className="edit-profile-header">
            <h3>{t("editProfile")}</h3>
            <p>{t("updateProfessionalInfo")}</p>
          </div>

          <div className="profile-form-grid">
            <div className="profile-field">
              <label>{t("phoneNumber")}</label>
              <SafePhoneInput
                country={phoneCountry}
                value={phone}
                onChange={(value) => setPhone(value)}
                inputClass="profile-phone-input"
                buttonClass="profile-phone-button"
                dropdownClass="profile-phone-dropdown"
                enableSearch
                placeholder={t("enterPhoneNumber")}
              />
            </div>

            <div className="profile-field">
              <label>{t("country")}</label>
              <Select
                className="profile-country-select"
                classNamePrefix="profile-select"
                options={countryOptions}
                placeholder={t("selectCountry")}
                value={countryOptions.find((option) => option.label === country) || null}
                onChange={(selected) => {
                  setCountry(selected ? selected.label : "");
                  setPhoneCountry(selected?.value ? selected.value.toLowerCase() : "us");
                }}
                isSearchable
                menuPortalTarget={document.body}
                formatOptionLabel={(option) => (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span>
                      {String.fromCodePoint(
                        ...option.value
                          .toUpperCase()
                          .split("")
                          .map((c) => 127397 + c.charCodeAt())
                      )}
                    </span>
                    <span>{option.label}</span>
                  </div>
                )}
              />
            </div>

            <div className="profile-field">
              <label>{t("telegramUsername")}</label>
              <input
                className="profile-input"
                placeholder="@telegram_username"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
              />
            </div>

            <div className="profile-field">
              <label>{t("profilePicture")}</label>
              <input
                type="file"
                accept="image/*"
                className="profile-input"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setProfileImage(file);
                }}
              />
            </div>
          </div>

          <div className="profile-field">
            <label>{t("professionalBio")}</label>
            <textarea
              className="profile-input profile-bio"
              placeholder={t("writeProfessionalBio")}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button className="save-profile-btn" onClick={updateProfile}>
            {t("saveProfile")}
          </button>
        </div>

        <div className="profile-grid">
          <div className="profile-card">
            <h3>{t("accountInformation")}</h3>
            <p><b>{t("name")}:</b> {user.name || t("notAvailable")}</p>
            <p><b>{t("email")}:</b> {user.email || t("notAvailable")}</p>
            <p><b>{t("userId")}:</b> {user._id || user.id || t("notAvailable")}</p>
            <p><b>{t("role")}:</b> {user.role || "user"}</p>
          </div>

          <div className="profile-card">
            <h3>{t("wallet")}</h3>
            <p><b>{t("status")}:</b> {connectedWallet ? t("connected") : t("notConnected")}</p>
            <p><b>{t("address")}:</b> {connectedWallet ? shortWallet : t("notConnected")}</p>
            <p><b>{t("network")}:</b> BNB Smart Chain</p>
          </div>

          <div className="profile-card">
            <h3>{t("kycStatus")}</h3>
            <p><b>{t("status")}:</b> {kycLabel}</p>
            <p><b>{t("emailVerification")}:</b> {kycStatus === "approved" ? t("verified") : t("pending")}</p>
            <p><b>{t("faceVerification")}:</b> {kycStatus === "approved" ? t("verified") : t("pending")}</p>
          </div>

          <div className="profile-card">
            <h3>{t("exchangeActivity")}</h3>
            <p><b>{t("orders")}:</b> {t("viewFromOrdersPanel")}</p>
            <p><b>{t("p2p")}:</b> {t("viewFromP2pPanel")}</p>
            <p><b>{t("transactions")}:</b> {t("viewFromTransactionsPanel")}</p>
            <p><b>{t("rewards")}:</b> {t("viewFromRewardsPanel")}</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default Profile;