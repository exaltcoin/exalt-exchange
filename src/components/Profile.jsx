import React, { useEffect, useState } from "react";
import "./Profile.css";

function Profile() {
  const [user, setUser] = useState({});
  const [kycStatus, setKycStatus] = useState("Not Verified");

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(savedUser);
    setKycStatus(savedUser.kycStatus || "Not Verified");
  }, []);

  const shortWallet = user.wallet
    ? `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`
    : "Not connected";

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

        <span className={kycStatus === "approved" ? "profile-badge verified" : "profile-badge pending"}>
          {kycStatus === "approved" ? "✅ Verified" : "⚠️ Not Verified"}
        </span>
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
          <p><b>Status:</b> {user.wallet ? "Connected" : "Not connected"}</p>
          <p><b>Address:</b> {shortWallet}</p>
          <p><b>Network:</b> BNB Smart Chain</p>
        </div>

        <div className="profile-card">
          <h3>KYC Status</h3>
          <p><b>Status:</b> {kycStatus}</p>
          <p><b>Email Verification:</b> Pending</p>
          <p><b>Phone Verification:</b> Pending</p>
          <p><b>Face Verification:</b> Pending</p>
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