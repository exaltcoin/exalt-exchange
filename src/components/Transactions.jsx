import React, { useEffect, useState } from "react";

function Transactions() {
  const API =
    import.meta.env.VITE_API_URL || "https://exalt-exchange-backend.onrender.com";

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const safeText = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    if (typeof value === "object") return JSON.stringify(value);
    return value;
  };

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setTransactions([]);
          setLoading(false);
          return;
        }

        const res = await fetch(`${API}/api/transactions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        const allTransactions =
          data.transactions || data.data || data.requests || data || [];

        const userTx = Array.isArray(allTransactions)
          ? allTransactions.filter((tx) => {
              const txUserId =
                tx.userId?._id || tx.userId || tx.user?._id || tx.user;
              return String(txUserId) === String(user?._id || user?.id);
            })
          : [];

        setTransactions(userTx);
      } catch (error) {
        console.log("Transactions load error:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [API, user?._id, user?.id]);

  return (
    <div className="panel">
      <h2>Transaction History</h2>

      {loading ? (
        <p>Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        transactions.map((tx) => (
          <div className="admin-card" key={tx._id}>
            <p>Type: {safeText(tx.type)}</p>
            <p>Amount: {safeText(tx.amount)}</p>
            <p>Coin: {safeText(tx.coin || "USDT")}</p>
            <p>Status: {safeText(tx.status)}</p>
            <p>Note: {safeText(tx.note)}</p>
            <p>
              Date:{" "}
              {tx.createdAt
                ? new Date(tx.createdAt).toLocaleString()
                : "N/A"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default Transactions;