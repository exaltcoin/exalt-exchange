import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../api";
import "./AdminWallets.css";

function AdminWallets() {
  const API_BASE = API_BASE_URL || "https://api.exaltexchange.io";
  const API = API_BASE.endsWith("/api") ? API_BASE.replace("/api", "") : API_BASE;

  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const [wallets, setWallets] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [search, setSearch] = useState("");
  const [coin, setCoin] = useState("USDT");
  const [walletType, setWalletType] = useState("spot");
  const [action, setAction] = useState("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const loadWallets = async () => {
    const res = await fetch(`${API}/api/wallets/admin/all`, { headers });
    const data = await res.json();
    setWallets(data.wallets || []);
  };

  useEffect(() => {
    loadWallets();
    const interval = setInterval(loadWallets, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredWallets = useMemo(() => {
    const q = search.toLowerCase();
    return wallets.filter((w) => {
      const user = w.userId || {};
      return (
        !q ||
        user.email?.toLowerCase().includes(q) ||
        user.name?.toLowerCase().includes(q) ||
        String(w._id).toLowerCase().includes(q)
      );
    });
  }, [wallets, search]);

  const loadLedger = async (userId) => {
    const res = await fetch(`${API}/api/wallets/admin/ledger/${userId}`, { headers });
    const data = await res.json();
    setLedger(data.ledger || []);
  };

  const adjustWallet = async () => {
    if (!selectedWallet) return alert("Select wallet first.");
    if (!amount || Number(amount) <= 0) return alert("Enter valid amount.");

    const res = await fetch(`${API}/api/wallets/admin/adjust`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId: selectedWallet.userId?._id || selectedWallet.userId,
        coin,
        amount: Number(amount),
        walletType,
        action,
        note,
      }),
    });

    const data = await res.json();
    if (!data.success) return alert(data.message || "Adjustment failed.");

    alert("Wallet adjusted.");
    setAmount("");
    setNote("");
    loadWallets();
    loadLedger(selectedWallet.userId?._id || selectedWallet.userId);
  };

  const freezeWallet = async (wallet, freeze = true) => {
    const userId = wallet.userId?._id || wallet.userId;
    const reason = freeze ? prompt("Freeze reason?", "Suspicious activity") : "";

    const res = await fetch(
      `${API}/api/wallets/admin/${freeze ? "freeze" : "unfreeze"}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, reason }),
      }
    );

    const data = await res.json();
    if (!data.success) return alert(data.message || "Action failed.");

    alert(freeze ? "Wallet frozen." : "Wallet unfrozen.");
    loadWallets();
  };

  const exportCsv = () => {
    const rows = [
      ["User", "Email", "USDT", "BNB", "EXALT", "Locked USDT", "Futures USDT", "Frozen"],
      ...filteredWallets.map((w) => [
        w.userId?.name || "",
        w.userId?.email || "",
        w.balances?.USDT || 0,
        w.balances?.BNB || 0,
        w.balances?.EXALT || 0,
        w.locked?.USDT || 0,
        w.futuresBalance?.USDT || 0,
        w.isFrozen ? "YES" : "NO",
      ]),
    ];

    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-wallets-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-wallets-page">
      <h3>Wallet Admin</h3>

      <div className="admin-wallet-toolbar">
        <input
          placeholder="Search user, email, wallet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={loadWallets}>Refresh</button>
        <button onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="admin-wallet-grid">
        {filteredWallets.map((wallet) => (
          <div className="admin-wallet-card" key={wallet._id}>
            <h4>
              {wallet.userId?.email || wallet.userId?.name || "Unknown User"}
              <span className={wallet.isFrozen ? "wallet-frozen" : "wallet-active"}>
                {wallet.isFrozen ? "Frozen" : "Active"}
              </span>
            </h4>

            <p><b>USDT:</b> {wallet.balances?.USDT || 0}</p>
            <p><b>BNB:</b> {wallet.balances?.BNB || 0}</p>
            <p><b>EXALT:</b> {wallet.balances?.EXALT || 0}</p>
            <p><b>Locked USDT:</b> {wallet.locked?.USDT || 0}</p>
            <p><b>Futures USDT:</b> {wallet.futuresBalance?.USDT || 0}</p>

            <button onClick={() => {
              setSelectedWallet(wallet);
              loadLedger(wallet.userId?._id || wallet.userId);
            }}>
              Manage
            </button>

            {wallet.isFrozen ? (
              <button onClick={() => freezeWallet(wallet, false)}>Unfreeze</button>
            ) : (
              <button className="danger" onClick={() => freezeWallet(wallet, true)}>Freeze</button>
            )}
          </div>
        ))}
      </div>

      {selectedWallet && (
        <div className="admin-wallet-manage">
          <h3>Manage Wallet</h3>
          <p>{selectedWallet.userId?.email || selectedWallet.userId?.name}</p>

          <select value={walletType} onChange={(e) => setWalletType(e.target.value)}>
            <option value="spot">Spot Wallet</option>
            <option value="futures">Futures Wallet</option>
          </select>

          <select value={coin} onChange={(e) => setCoin(e.target.value)}>
            <option value="USDT">USDT</option>
            <option value="BNB">BNB</option>
            <option value="EXALT">EXALT</option>
          </select>

          <select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>

          <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input placeholder="Admin note" value={note} onChange={(e) => setNote(e.target.value)} />

          <button onClick={adjustWallet}>Apply Adjustment</button>
          <button onClick={() => setSelectedWallet(null)}>Close</button>

          <h3>Wallet Ledger</h3>

          {ledger.length === 0 ? (
            <p>No ledger records.</p>
          ) : (
            ledger.map((item) => (
              <div className="ledger-row" key={item._id}>
                <strong>{item.type} • {item.coin}</strong>
                <p>{item.amount} | {item.balanceBefore} → {item.balanceAfter}</p>
                <small>{item.note}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminWallets;