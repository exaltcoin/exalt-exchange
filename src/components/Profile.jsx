import React, { useEffect, useState, useMemo } from "react";
import Select from "react-select";
import countryList from "react-select-country-list";
import "./Profile.css";
const API =
  import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";
function Profile() {
  const [user, setUser] = useState({});
  const [kycStatus, setKycStatus] = useState("Not Verified");
 const [phone, setPhone] = useState("");
const [country, setCountry] = useState("");
const [telegram, setTelegram] = useState("");
const [bio, setBio] = useState("");
const [profileImage, setProfileImage] = useState(""); 
const countryOptions = useMemo(() => countryList().getData(), []);
useEffect(() => {
  const loadProfile = async () => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setPhone(savedUser.phone || "");
setCountry(savedUser.country || "");
setTelegram(savedUser.telegram || "");
setBio(savedUser.bio || "");
setProfileImage(savedUser.profileImage || "");
    setUser(savedUser);

    if (!savedUser.email) {
      setKycStatus("not_submitted");
      return;
    }

    try {
      const res = await fetch(
        `${API}/api/kyc/user/${encodeURIComponent(savedUser.email)}`
      );
      const data = await res.json();
console.log("KYC DATA:", data);
    setKycStatus(data.kyc?.status || data.status || "not_submitted");
    } catch (err) {
      console.log(err);
      setKycStatus(savedUser.kycStatus || "not_submitted");
    }
  };

  loadProfile();
}, []);
const connectedWallet =
  localStorage.getItem("wallet") ||
  localStorage.getItem("walletAddress") ||
  user.wallet ||
  "";
 const shortWallet = connectedWallet
  ? `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}`
  : "Not connected";
  const updateProfile = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/api/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: user.name,
        phone,
        country,
        telegram,
        bio,
        profileImage,
      }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
      alert("Profile Updated Successfully");
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.log(err);
    alert("Update Failed");
  }
};
  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">
          {(user.name || user.email || "U").charAt(0).toUpperCase()}
        </div>

        <div>
          <h2>{user.name || "User Profile"}</h2>
          <p>{user.email || "No email connected"}</p>
        </div>
<span
 className={
    kycStatus === "approved"
      ? "profile-badge verified"
      : kycStatus === "rejected"
      ? "profile-badge rejected"
      : "profile-badge pending"
  }
>
        {kycStatus === "approved"
  ? "✅ Verified"
  : kycStatus === "rejected"
  ? "❌ Rejected"
  : kycStatus === "pending"
  ? "⏳ Pending"
  : "⚠️ Not Submitted"}
        </span>
      </div>
<div className="profile-card edit-profile-card">
  <div className="edit-profile-header">
    <h3>Edit Profile</h3>
    <p>Update your personal profile information</p>
  </div>

 <div className="profile-form-grid">
  <input className="profile-input" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />

  <Select
  className="profile-country-select"
  classNamePrefix="profile-select"
  options={countryOptions}
  placeholder="🌍 Select Country"
  value={countryOptions.find((option) => option.label === country) || null}
  onChange={(selected) => setCountry(selected ? selected.label : "")}
  formatOptionLabel={(option) => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span>{String.fromCodePoint(...[...option.value.toUpperCase()].map(c => 127397 + c.charCodeAt()))}</span>
      <span>{option.label}</span>
    </div>
  )}
/>

  <input className="profile-input" placeholder="@telegram_username" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
  <input className="profile-input" placeholder="Profile Image URL" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} />
</div>
  <textarea
    className="profile-input profile-bio"
    placeholder="Write a short bio about yourself"
    value={bio}
    onChange={(e) => setBio(e.target.value)}
  />

  <button className="save-profile-btn" onClick={updateProfile}>
    Save Profile
  </button>
</div>
      <div className="profile-grid">
        <div className="profile-card">
          <h3>Account Information</h3>
          <p><b>Name:</b> {user.name || "Not available"}</p>
          <p><b>Email:</b> {user.email || "Not available"}</p>
          <p><b>User ID:</b> {user._id || user.id || "Not available"}</p>
          <p><b>Role:</b> {user.role || "user"}</p>
        </div>

        <div className="profile-card">
          <h3>Wallet</h3>
         <p><b>Status:</b> {connectedWallet ? "Connected" : "Not connected"}</p>
         <p><b>Address:</b> {connectedWallet ? shortWallet : "Not connected"}</p>
          <p><b>Network:</b> BNB Smart Chain</p>
        </div>

        <div className="profile-card">
         <h3>KYC Status</h3>

<p>
  <b>Status:</b>{" "}
  {kycStatus === "approved"
    ? "✅ Verified"
    : kycStatus === "pending"
    ? "⏳ Under Review"
    : kycStatus === "rejected"
    ? "❌ Rejected"
    : "⚠️ Not Submitted"}
</p>

<p>
  <b>Email Verification:</b>{" "}
  {kycStatus === "approved" ? "✅ Verified" : "⏳ Pending"}
</p>

<p>
  <b>Face Verification:</b>{" "}
  {kycStatus === "approved" ? "✅ Verified" : "⏳ Pending"}
</p>
        </div>

        <div className="profile-card">
          <h3>Exchange Activity</h3>
          <p><b>Orders:</b> View from Orders panel</p>
          <p><b>P2P:</b> View from P2P panel</p>
          <p><b>Transactions:</b> View from Transactions panel</p>
          <p><b>Rewards:</b> View from Rewards panel</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;