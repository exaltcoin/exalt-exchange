import "./Staking.css";

export default function Staking() {
  return (
    <div className="staking-page">

      <div className="staking-header">
        <h1>EXALT Staking</h1>
        <p>Stake EXALT and earn passive rewards</p>
      </div>

      <div className="staking-cards">

        <div className="staking-card">
          <h2>Total Staked</h2>
          <h1>0 EXALT</h1>
        </div>

        <div className="staking-card">
          <h2>Estimated APR</h2>
          <h1>15%</h1>
        </div>

        <div className="staking-card">
          <h2>Rewards Earned</h2>
          <h1>0 EXALT</h1>
        </div>

      </div>

      <div className="stake-box">

        <h2>Stake EXALT</h2>

        <input
          type="number"
          placeholder="Enter EXALT amount"
        />

        <div className="stake-buttons">

          <button className="stake-btn">
            Stake
          </button>

          <button className="unstake-btn">
            Unstake
          </button>

          <button className="claim-btn">
            Claim Rewards
          </button>

        </div>

      </div>

    </div>
  );
}