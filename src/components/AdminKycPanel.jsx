import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ||"https://exalt-exchange-backend.onrender.com";

function AdminKycPanel() {
  const [kycList, setKycList] = useState([]);
  const [filter, setFilter] = useState("all");
const [stats, setStats] = useState({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
});
  const loadKyc = async () => {
    try {
      const res = await fetch(`${API}/api/kyc/admin/all`);
      const data = await res.json();
      console.log("KYC API Response:", data);
   const list = data.kycList || data.kyc || data.requests || [];
const totalKyc = list.length;

const pendingKyc = list.filter(
  item => item.status === "pending"
).length;

const approvedKyc = list.filter(
  item => item.status === "approved"
).length;

const rejectedKyc = list.filter(
  item => item.status === "rejected"
).length;
console.log("KYC LOAD RESPONSE:", data);
console.log("KYC LIST:", list);
setStats({
  total: list.length,
  pending: pendingKyc,
  approved: approvedKyc,
  rejected: rejectedKyc,
});
setKycList(list);
    } catch (err) {
      console.log(err);
    }
  };

  const updateKyc = async (id, status) => {
    try {
      const actionText = status === "approved" ? "approve" : "reject";

const confirmAction = window.confirm(
  `Are you sure you want to ${actionText} this KYC request?`
);

if (!confirmAction) return;
    const res = await fetch(`${API}/api/kyc/admin/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
      }),
    });

    const data = await res.json();
    if (status === "approved") {
  alert("✅ KYC Approved Successfully.\n\nThe user has been verified and notified.");
} else {
  alert("❌ KYC Rejected.\n\nThe verification request has been declined.");
}
    loadKyc();
  } catch (err) {
    alert("KYC update failed");
  }
};

  useEffect(() => {
    loadKyc();
  }, []);
const filteredKyc =
  filter === "all"
    ? kycList
    : kycList.filter(item => item.status === filter);
  return (
    <div className="panel">
      <h2>KYC Requests</h2>
<div className="kyc-stats">
  <div onClick={() => setFilter("all")}>Total: {stats.total}</div>
  <div onClick={() => setFilter("pending")}>Pending: {stats.pending}</div>
  <div onClick={() => setFilter("approved")}>Approved: {stats.approved}</div>
  <div onClick={() => setFilter("rejected")}>Rejected: {stats.rejected}</div>
</div>
      {kycList.length === 0 ? (
        <p>No KYC requests found.</p>
      ) : (
        filteredKyc.map((kyc) => (
          <div className="admin-card" key={kyc._id}>
         <h3>{kyc.fullName || kyc.name || "Unknown User"}</h3>
            <p><b>Email:</b> {kyc.email}</p>
            <p><b>User ID:</b> {kyc.userId}</p>
<p><b>Submitted:</b> {kyc.createdAt ? new Date(kyc.createdAt).toLocaleString() : "N/A"}</p>
            <p><b>Phone:</b> {kyc.phone}</p>
            <p><b>Country:</b> {kyc.country}</p>
            <p><b>ID Type:</b> {kyc.idType}</p>
            <p><b>ID Number:</b> {kyc.idNumber}</p>
           <p>
  <b>Status:</b>
  <span className={`kyc-status-badge ${kyc.status}`}>
    {kyc.status === "approved"
      ? "🟢 Approved"
      : kyc.status === "rejected"
      ? "🔴 Rejected"
      : "🟡 Pending"}
  </span>
</p>
{kyc.status === "pending" && (
  <>
    <button
      onClick={() => updateKyc(kyc._id, "approved")}
    >
      Approve
    </button>

    <button
      onClick={() => updateKyc(kyc._id, "rejected")}
    >
      Reject
    </button>
  </>
)}
       {kyc.cnicFront && (
  <p>
    <a href={kyc.cnicFront} target="_blank" rel="noreferrer">
      View CNIC Front
    </a>
  </p>
)}    

  {kyc.selfieImage && (
  <p>
    <a href={kyc.selfieImage} target="_blank" rel="noreferrer">
      View Selfie
    </a>
  </p>
)}
       {kyc.cnicBack && (
  <p>
    <a href={kyc.cnicBack} target="_blank" rel="noreferrer">
      View CNIC Back
    </a>
  </p>
)}

{kyc.passportImage && (
  <p>
    <a href={kyc.passportImage} target="_blank" rel="noreferrer">
      View Passport / National ID
    </a>
  </p>
)}   
           <div className="kyc-actions">
  {kyc.status === "pending" ? (
    <>
     <button
className="kyc-approve-btn"
title="Approve this KYC request"
onClick={() => updateKyc(kyc._id, "approved")}
>
✅ Approve KYC
</button>

<button
className="kyc-reject-btn"
title="Reject this KYC request"
onClick={() => updateKyc(kyc._id, "rejected")}
>
❌ Reject KYC
</button>
    </>
  ) : (
    <span className={`kyc-status-badge ${kyc.status}`}>
      {kyc.status === "approved" ? "Approved" : "Rejected"}
    </span>
  )}
</div>
          </div>
        ))
      )}
    </div>
  );
}

export default AdminKycPanel;