import React, { useEffect, useState } from "react";

function Wallets() {
  const API =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [balance, setBalance] = useState(0);
  const [wallets, setWallets] = useState({
    USDT: 0,
    EXALT: 0,
    BNB: 0,
  });

  const [userId, setUserId] = useState("");

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setBalance(0);
          return;
        }

        const meRes = await fetch(`${API}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const meData = await meRes.json();

        if (meData.success && meData.user?._id) {
          setBalance(meData.user.balance || 0);

          setWallets({
            USDT: meData.user.wallets?.USDT || 0,
            EXALT: meData.user.wallets?.EXALT || 0,
            BNB: meData.user.wallets?.BNB || 0,
          });

          setUserId(meData.user._id);
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.log(error);
        setBalance(0);
      }
    };

    loadBalance();

    const interval = setInterval(() => {
      loadBalance();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const submitDeposit = async () => {
    try {
      const inputs = document.querySelectorAll(".deposit-input");

      const response = await fetch(
        `${API}/api/deposit-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId,
            name: inputs[0].value,
            wallet: inputs[1].value,
            amount: inputs[2].value,
            paymentMethod: inputs[3].value,
            transactionId: inputs[4].value,
            status: "pending",
            createdAt: new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Deposit request submitted successfully");

        inputs.forEach((input) => {
          input.value = "";
        });
      } else {
        alert(data.message || "Deposit failed");
      }
    } catch (err) {
      console.log(err);
      alert("Server error");
    }
  };

  const submitWithdrawal = async () => {
    try {
      const inputs = document.querySelectorAll(".withdraw-input");

      const response = await fetch(
        `${API}/api/withdrawals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId,
            amount: inputs[0].value,
            walletAddress: inputs[1].value,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Withdrawal request submitted successfully");

        inputs.forEach((input) => {
          input.value = "";
        });
      } else {
        alert(data.message || "Withdrawal failed");
      }
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  return (
    <>
      <div className="panel">
        <h2>WALLETS</h2>

        <p>
          Manage crypto wallet, deposits, withdrawals and
          payment requests.
        </p>

        <div className="stats-grid">
          <div className="stat-card glow-yellow">
            <h3>Connected Wallets</h3>

            <h1>MetaMask / Trust Wallet</h1>

            <p>BNB Smart Chain supported</p>
          </div>

          <div className="stat-card glow-green">
            <h3>EXALT Wallet</h3>

            <h1>{balance} EXALT</h1>

            <p>Live Balance</p>
          </div>

          <div className="stat-card glow-blue">
            <h3>Bank / Card Deposit</h3>

            <h1>Secure Request</h1>

            <p>
              Bank, Easypaisa, JazzCash ready for
              integration
            </p>
          </div>
        </div>

        <div
          className="panel"
          style={{ marginTop: "25px" }}
        >
          <h2>Wallet Balances</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>USDT</h3>
              <h1>{wallets.USDT}</h1>
            </div>

            <div className="stat-card">
              <h3>EXALT</h3>
              <h1>{wallets.EXALT}</h1>
            </div>

            <div className="stat-card">
              <h3>BNB</h3>
              <h1>{wallets.BNB}</h1>
            </div>
          </div>
        </div>

        <div
          className="panel"
          style={{ marginTop: "25px" }}
        >
          <h2>Deposit Options</h2>

          <div className="listing-form">
            <input
              className="deposit-input"
              placeholder="Your Name"
            />

            <input
              className="deposit-input"
              placeholder="Wallet Address"
            />

            <input
              className="deposit-input"
              placeholder="Amount in USD / PKR / KWD"
            />

            <input
              className="deposit-input"
              placeholder="Payment Method"
            />

            <input
              className="deposit-input"
              placeholder="Transaction ID / Receipt Number"
            />

            <button
              className="buy-btn"
              onClick={submitDeposit}
            >
              Submit Deposit Request
            </button>
          </div>
        </div>

        <div
          className="panel"
          style={{ marginTop: "25px" }}
        >
          <h2>Withdrawal Request</h2>

          <div className="listing-form">
            <input
              className="withdraw-input"
              placeholder="Amount to Withdraw"
            />

            <input
              className="withdraw-input"
              placeholder="Your BEP20 Wallet Address"
            />

            <button
              className="buy-btn"
              onClick={submitWithdrawal}
            >
              Submit Withdrawal Request
            </button>
          </div>
        </div>

        <div
          className="panel"
          style={{ marginTop: "25px" }}
        >
          <h2>Security System</h2>

          <p>✅ Admin approval required before wallet credit</p>

          <p>
            ✅ No automatic token release without
            verification
          </p>

          <p>
            ✅ Bank/card payments connected only through
            licensed gateways
          </p>

          <p>
            ✅ User wallet address verification required
          </p>

          <p>
            ✅ Deposit history and withdrawal security can
            be added next
          </p>
        </div>
      </div>
    </>
  );
}

export default Wallets;