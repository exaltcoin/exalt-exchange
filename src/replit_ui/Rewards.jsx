import "./replit.css";

export default function Rewards() {
  return (
    <div className="glass-panel" style={{ maxWidth: "900px", margin: "40px auto" }}>
      <h2 style={{ color: "#f0c419", fontSize: "28px", marginBottom: "25px" }}>
        Rewards & Referrals
      </h2>

      <div className="glass-panel" style={{ marginBottom: "24px" }}>
        <h3>EXLT Mining</h3>
        <p>Mining Rate: <b>2.4 EXLT/day</b></p>
        <p>Accumulated: <b style={{ color: "#f0c419" }}>142.80 EXLT</b></p>
        <button className="gold-btn">Claim Rewards</button>
      </div>

      <div className="glass-panel">
        <h3>Referral Rewards</h3>
        <p>Your Referral Link:</p>
        <p style={{ color: "#f0c419" }}>https://exalt.exchange/ref/your-id</p>
        <p>Active Referrals: <b>23</b></p>
        <p>Total Earned: <b>847.50 EXLT</b></p>
      </div>
    </div>
  );
}