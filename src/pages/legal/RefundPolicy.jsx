import LegalLayout from "./LegalLayout";

function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy">
      <p><strong>Last Updated:</strong> July 10, 2026</p>

      <p>
        Cryptocurrency transactions are generally irreversible once confirmed on
        a blockchain network. This Refund Policy explains how Exalt Exchange
        handles fees, deposits, withdrawals, and service-related refund requests.
      </p>

      <h2>1. Blockchain Transactions</h2>
      <p>
        Completed blockchain transactions cannot usually be reversed, cancelled,
        or refunded due to the nature of decentralized networks.
      </p>

      <h2>2. Trading Activity</h2>
      <p>
        Executed trades, market orders, completed swaps, and confirmed
        transactions are final and cannot be refunded.
      </p>

      <h2>3. Fees</h2>
      <p>
        Trading fees, withdrawal fees, network fees, listing fees, and service
        charges may be non-refundable unless Exalt Exchange determines that an
        internal error occurred.
      </p>

      <h2>4. Failed or Pending Transactions</h2>
      <p>
        If a transaction fails due to a platform-side issue, Exalt Exchange may
        review the case and apply a correction, refund, or account adjustment
        where appropriate.
      </p>

      <h2>5. User Error</h2>
      <p>
        Exalt Exchange is not responsible for losses caused by incorrect wallet
        addresses, wrong networks, user mistakes, phishing, or unauthorized
        access caused by user negligence.
      </p>
    </LegalLayout>
  );
}

export default RefundPolicy;