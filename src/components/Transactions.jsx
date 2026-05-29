import React, { useEffect, useState } from "react";

function Transactions() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const user = JSON.parse(localStorage.getItem("user"));
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const res = await fetch(`${API}/api/transactions`);
        const data = await res.json();

        const userTx = (data.transactions || []).filter(
          (tx) => String(tx.userId) === String(user?.id)
        );

        setTransactions(userTx);
      } catch (error) {
        console.log(error);
      }
    };

    loadTransactions();
  }, []);

useEffect(() => {
  const interval = setInterval(() => {
    window.location.reload();
  }, 10000);

  return () => clearInterval(interval);
}, []);
  return (
    <div className="panel">
      <h2>Transaction History</h2>

      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        transactions.map((tx) => (
          <div className="admin-card" key={tx._id}>
            <p>Type: {tx.type}</p>
            <p>Amount: {tx.amount}</p>
            <p>Status: {tx.status}</p>
            <p>Note: {tx.note}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Transactions;