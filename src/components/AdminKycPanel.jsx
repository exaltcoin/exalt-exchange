import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function AdminKycPanel() {
  const [kycList, setKycList] = useState([]);

  const loadKyc = async () => {
    try {
      const res = await fetch(`${API}/api/kyc/admin/all`);
      const data = await res.json();
      setKycList(data.kyc || data.requests || []);
    } catch (err) {
      console.log(err);
    }
  };

  const updateKyc = async (id, status) => {
    try {
      const res = await fetch(`${API}/api/kyc/admin/${id}/${status}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      alert(data.message || `KYC ${status}`);
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

            <button onClick={() => updateKyc(kyc._id, "approved")}>
              Approve
            </button>

            <button onClick={() => updateKyc(kyc._id, "rejected")}>
              Reject
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default AdminKycPanel;