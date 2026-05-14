import React from "react";

function Wallets() {
  return (
    <div className="panel">
      <h2>WALLETS</h2>
      <p>Manage crypto wallet, deposits, withdrawals and bank payment requests.</p>

      <div className="stats-grid">
        <div className="stat-card glow-yellow">
          <h3>Connected Wallet</h3>
          <h1>MetaMask / Trust Wallet</h1>
          <p>BNB Smart Chain supported</p>
        </div>

        <div className="stat-card glow-green">
          <h3>EXALT Balance</h3>
          <h1>Live Wallet</h1>
          <p>Balance loads after wallet connect</p>
        </div>

        <div className="stat-card glow-blue">
          <h3>Bank / Card Deposit</h3>
          <h1>Secure Request</h1>
          <p>Bank, Easypaisa, JazzCash, card gateway ready for integration</p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "25px" }}>
        <h2>Deposit Options</h2>

        <div className="listing-form">
          <input placeholder="Your Name" />
          <input placeholder="Wallet Address" />
          <input placeholder="Amount in USD / PKR / KWD" />
          <input placeholder="Payment Method: Bank / Card / Easypaisa / JazzCash" />
          <input placeholder="Transaction ID / Receipt Number" />

          <button
            className="buy-btn"
  onClick={async () => {
    try {
      const inputs = document.querySelectorAll("input");

      const response = await fetch(
        "https://exalt-exchange-backend.onrender.com/api/deposit-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: inputs[0]?.value || "",
            wallet: inputs[1]?.value || "",
            amount: inputs[2]?.value || "",
            paymentMethod: inputs[3]?.value || "",
            transactionId: inputs[4]?.value || "",
            status: "pending",
            createdAt: new Date().toISOString(),
          }),
        }
      );
if (!response.ok) {
  throw new Error("Request failed");
}
      const data = await response.json();

      if (data.success) {
        alert("Deposit request submitted successfully.");
      } else {
        alert("Submission failed.");
      }
    } catch (err) {
      console.log(err);
      alert("Server error.");
    }
  }}
>
  Submit Deposit Request
</button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "25px" }}>
        <h2>Security System</h2>
        <p>✅ Admin approval required before wallet credit</p>
        <p>✅ No automatic token release without verification</p>
        <p>✅ Bank/card payments should be connected only through licensed payment gateway</p>
        <p>✅ User wallet address verification required</p>
        <p>✅ Deposit history and withdrawal security can be added next</p>
      </div>
    </div>
  );
}

export default Wallets;