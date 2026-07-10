import LegalLayout from "./LegalLayout";

function KYCPolicy() {
  return (
    <LegalLayout title="KYC Verification Policy">
      <p><strong>Last Updated:</strong> July 10, 2026</p>

      <p>
        Exalt Exchange may require Know Your Customer verification to protect
        users, prevent fraud, and comply with applicable compliance standards.
      </p>

      <h2>1. Information Required</h2>
      <ul>
        <li>Full name and contact details</li>
        <li>Country and identity information</li>
        <li>Government-issued identification where required</li>
        <li>Additional verification documents if needed</li>
      </ul>

      <h2>2. Why KYC Is Required</h2>
      <p>
        KYC helps prevent fraud, account abuse, money laundering, terrorist
        financing, and unauthorized financial activity.
      </p>

      <h2>3. Verification Review</h2>
      <p>
        Verification may be approved, rejected, or placed under manual review.
        Exalt Exchange may request additional information.
      </p>

      <h2>4. Account Restrictions</h2>
      <p>
        Certain services such as deposits, withdrawals, trading limits, or P2P
        access may be restricted until verification is completed.
      </p>

      <h2>5. Data Protection</h2>
      <p>
        KYC data is handled securely and retained only as necessary for legal,
        compliance, AML, fraud prevention, and security purposes.
      </p>
    </LegalLayout>
  );
}

export default KYCPolicy;