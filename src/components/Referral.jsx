function Referral() {
  const referralCode = "EXALT-REF-2026";
  const referralLink = "https://exalttrader.com/ref/EXALT-REF-2026";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied");
  };

  return (
    <div className="panel">
      <h2>Referral Program</h2>

      <div className="admin-card">
        <h3>Your Referral Code</h3>
        <p>{referralCode}</p>
        <p>{referralLink}</p>

        <button className="buy-btn" onClick={copyLink}>
          Copy Referral Link
        </button>
      </div>

      <div className="admin-card">
        <h3>Referral Rewards</h3>
        <p>Total Referrals: 0</p>
        <p>Pending Rewards: 0 EXALT</p>
        <p>Approved Rewards: 0 EXALT</p>
      </div>
    </div>
  );
}

export default Referral;