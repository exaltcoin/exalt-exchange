import React, { useEffect, useMemo, useState } from "react";

function Transactions() {
  const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const safeText = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    if (typeof value === "object") return JSON.stringify(value);
    return value;
  };

  const normalizeType = (tx) =>
    String(tx.type || tx.transactionType || tx.category || "Transaction");

  const normalizeStatus = (tx) =>
    String(tx.status || tx.state || "Pending");

  const normalizeAmount = (tx) =>
    Number(tx.amount || tx.value || tx.quantity || 0);

  const normalizeCoin = (tx) =>
    String(tx.coin || tx.symbol || tx.asset || "USDT").toUpperCase();

  const loadTransactions = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setTransactions([]);
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

  useEffect(() => {
    loadTransactions();
  }, [API, user?._id, user?.id]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const type = normalizeType(tx).toUpperCase();
      const status = normalizeStatus(tx).toUpperCase();
      const coin = normalizeCoin(tx);
      const amount = String(normalizeAmount(tx));
      const hash = String(tx.txHash || tx.transactionHash || tx.hash || "");
      const note = String(tx.note || tx.description || "");
      const q = search.toLowerCase();

      const matchType = filterType === "ALL" || type.includes(filterType);
      const matchStatus =
        filterStatus === "ALL" || status.includes(filterStatus);

      const matchSearch =
        !q ||
        type.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q) ||
        coin.toLowerCase().includes(q) ||
        amount.includes(q) ||
        hash.toLowerCase().includes(q) ||
        note.toLowerCase().includes(q);

      return matchType && matchStatus && matchSearch;
    });
  }, [transactions, filterType, filterStatus, search]);

  const exportCSV = () => {
    const rows = [
      ["Type", "Amount", "Coin", "Status", "Hash", "Note", "Date"],
      ...filteredTransactions.map((tx) => [
        normalizeType(tx),
        normalizeAmount(tx),
        normalizeCoin(tx),
        normalizeStatus(tx),
        tx.txHash || tx.transactionHash || tx.hash || "",
        tx.note || tx.description || "",
        tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "exalt-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel transactions-page">
      <div className="transactions-header">
        <div>
          <h2>Transaction History</h2>
          <p>Track deposits, withdrawals, trades and Web3 activity.</p>
        </div>

        <button className="action-btn yellow-btn" onClick={loadTransactions}>
          Refresh
        </button>
      </div>

      <div className="transactions-tools">
        <input
          className="web3-input"
          placeholder="Search by type, coin, status, hash..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="web3-input"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">All Types</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAW">Withdrawal</option>
          <option value="TRADE">Trade</option>
          <option value="REWARD">Reward</option>
          <option value="SEND">Send</option>
          <option value="RECEIVE">Receive</option>
          <option value="SWAP">Swap</option>
        </select>

        <select
          className="web3-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="SUCCESS">Success</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
          <option value="FAILED">Failed</option>
        </select>

        <button className="action-btn blue-btn" onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      <div className="transactions-summary">
        <div>
          <strong>{transactions.length}</strong>
          <span>Total</span>
        </div>

        <div>
          <strong>{filteredTransactions.length}</strong>
          <span>Filtered</span>
        </div>

        <div>
          <strong>
            {transactions.filter((tx) =>
              normalizeStatus(tx).toUpperCase().includes("PENDING")
            ).length}
          </strong>
          <span>Pending</span>
        </div>

        <div>
          <strong>
            {transactions.filter((tx) => {
              const s = normalizeStatus(tx).toUpperCase();
              return s.includes("SUCCESS") || s.includes("APPROVED") || s.includes("COMPLETED");
            }).length}
          </strong>
          <span>Success</span>
        </div>
      </div>

      {loading ? (
        <p>Loading transactions...</p>
      ) : filteredTransactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <div className="transactions-list">
          {filteredTransactions.map((tx, index) => {
            const type = normalizeType(tx);
            const status = normalizeStatus(tx);
            const coin = normalizeCoin(tx);
            const amount = normalizeAmount(tx);
            const hash = tx.txHash || tx.transactionHash || tx.hash || "";

            return (
              <div className="transaction-card-pro" key={tx._id || index}>
                <div className="transaction-main-row">
                  <div>
                    <h3>{safeText(type)}</h3>
                    <p>
                      {amount.toLocaleString()} {coin}
                    </p>
                  </div>

                  <span
                    className={`tx-status ${status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {safeText(status)}
                  </span>
                </div>

                <div className="transaction-info-grid">
                  <p>
                    <b>Coin:</b> {safeText(coin)}
                  </p>

                  <p>
                    <b>Note:</b> {safeText(tx.note || tx.description)}
                  </p>

                  <p>
                    <b>Date:</b>{" "}
                    {tx.createdAt
                      ? new Date(tx.createdAt).toLocaleString()
                      : "N/A"}
                  </p>

                  <p className="break-text">
                    <b>Hash:</b>{" "}
                    {hash ? (
                      <a
                        href={`https://bscscan.com/tx/${hash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {hash.slice(0, 10)}...{hash.slice(-8)}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Transactions;