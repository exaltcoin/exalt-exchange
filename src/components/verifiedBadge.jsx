import React from "react";

function VerifiedBadge({ status }) {
  const badges = {
    approved: {
      color: "#16a34a",
      text: "✅ KYC Verified",
    },
    pending: {
      color: "#f59e0b",
      text: "⏳ Under Review",
    },
    rejected: {
      color: "#dc2626",
      text: "❌ KYC Rejected",
    },
  };

  const current =
    badges[status] || {
      color: "#64748b",
      text: "⚠️ Not Verified",
    };

  return (
    <div style={badgeStyle(current.color)}>
      {current.text}
    </div>
  );
}
const badgeStyle = (bg) => ({
  display: "inline-block",
  background: bg,
  color: "#fff",
  padding: "10px 16px",
  borderRadius: "999px",
  fontWeight: "700",
  fontSize: "13px",
  margin: "10px 0",
  boxShadow: `0 4px 12px ${bg}55`,
});


export default VerifiedBadge;