import React from "react";

function VerifiedBadge({ status }) {
  if (status === "verified") {
    return (
      <div style={badgeStyle("#16a34a")}>
        ✅ Verified Badge
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div style={badgeStyle("#f59e0b")}>
        ⏳ KYC Pending Admin Review
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div style={badgeStyle("#dc2626")}>
        ❌ KYC Rejected
      </div>
    );
  }

  return (
    <div style={badgeStyle("#64748b")}>
      ⚠️ Not Verified
    </div>
  );
}

const badgeStyle = (bg) => ({
  display: "inline-block",
  background: bg,
  color: "#fff",
  padding: "8px 14px",
  borderRadius: "999px",
  fontWeight: "bold",
  margin: "10px 0",
});

export default VerifiedBadge;