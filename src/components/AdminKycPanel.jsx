import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ||"https://exalt-exchange-backend.onrender.com";

function AdminKycPanel() {
  const [kycList, setKycList] = useState([]);

  const loadKyc = async () => {
    try {
      const res = await fetch(`${API}/api/kyc/admin/all`);
      const data = await res.json();
    setKycList(
  (data.kycList || data.kyc || data.requests || [])
    .filter(item => item.status === "pending")
);
    } catch (err) {
      console.log(err);
    }
  };

  const updateKyc = async (id, status) => {
    try {
    const res = await fetch(`${API}/api/kyc/admin/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
      }),
    });

    const data = await res.json();
    if (status === "approved") {
  alert("✅ KYC request approved successfully.");
} else {
  alert("❌ KYC request rejected successfully.");
}
    loadKyc();
  } catch (err) {
    alert("KYC update failed");
  }
};

  useEffect(() => {
    loadKyc();
  }, []);

  return (
    <div className="panel">
      <h2>KYC Requests</h2>

      {kycList.length === 0 ? (
        <p>No KYC requests found.</p>
      ) : (
        kycList.map((kyc) => (
          <div className="admin-card" key={kyc._id}>
            <h3>{kyc.name || "User KYC"}</h3>
            <p><b>Email:</b> {kyc.email}</p>
            <p><b>Phone:</b> {kyc.phone}</p>
            <p><b>Country:</b> {kyc.country}</p>
            <p><b>ID Type:</b> {kyc.idType}</p>
            <p><b>ID Number:</b> {kyc.idNumber}</p>
            <p><b>Status:</b> {kyc.status}</p>

            {kyc.idFront && (
              <p>
                <a href={kyc.idFront} target="_blank">View ID Front</a>
              </p>
            )}

            {kyc.selfie && (
              <p>
                <a href={kyc.selfie} target="_blank">View Selfie</a>
              </p>
            )}

           <div className="kyc-actions">
  {kyc.status === "pending" ? (
    <>
      <button
        className="kyc-approve-btn"
        onClick={() => updateKyc(kyc._id, "approved")}
      >
        Approve KYC
      </button>

      <button
        className="kyc-reject-btn"
        onClick={() => updateKyc(kyc._id, "rejected")}
      >
        Reject KYC
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