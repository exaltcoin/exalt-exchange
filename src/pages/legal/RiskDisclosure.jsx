import LegalLayout from "./LegalLayout";

function RiskDisclosure() {
  return (
    <LegalLayout title="Risk Disclosure">
      <p><strong>Last Updated:</strong> July 10, 2026</p>

      <p>
        Digital asset trading involves significant risk. By using Exalt Exchange,
        you acknowledge that crypto prices are volatile and losses may occur.
      </p>

      <h2>1. Market Risk</h2>
      <p>
        Cryptocurrency prices may rise or fall rapidly due to market conditions,
        liquidity, regulation, technology, and global events.
      </p>

      <h2>2. No Profit Guarantee</h2>
      <p>
        Exalt Exchange does not guarantee profits, returns, or investment
        performance.
      </p>

      <h2>3. Blockchain Risk</h2>
      <p>
        Blockchain transactions may be delayed, irreversible, or affected by
        network congestion, wrong addresses, or third-party failures.
      </p>

      <h2>4. User Responsibility</h2>
      <p>
        Users are responsible for their trading decisions, account security,
        wallet addresses, and compliance with local laws.
      </p>

      <h2>5. High-Risk Products</h2>
      <p>
        Futures, leveraged products, staking, P2P, and other advanced features
        may involve additional risks.
      </p>
    </LegalLayout>
  );
}

export default RiskDisclosure;