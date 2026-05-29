import { useEffect, useState } from "react";

export default function WalletPanel() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("user"));
    setUser(saved);
  }, []);

  if (!user) return null;

  return (
    <div className="panel">
      <h2>My Wallets</h2>

      <div className="wallet-box">
        <h3>USDT Deposit Address</h3>
        <p>{user.wallet || "No Address"}</p>
      </div>

      <div className="wallet-box">
        <h3>EXALT Deposit Address</h3>
        <p>{user.wallet || "No Address"}</p>
      </div>

      <div className="wallet-box">
        <h3>BNB Deposit Address</h3>
        <p>{user.wallet || "No Address"}</p>
      </div>
    </div>
  );
}