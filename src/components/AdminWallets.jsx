import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../api";
import "./AdminWallets.css";
import OwnerStepUpDialog from "../features/earnedExalt/OwnerStepUpDialog.jsx";

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
  const [reconciliation, setReconciliation] = useState(null);
  const [pendingRepair, setPendingRepair] = useState(null);
  const [stepUpOpen, setStepUpOpen] = useState(false);

  const loadReconciliation = async () => {
    const res = await fetch(`${API}/api/admin/reconciliation/wallet-ledger-report`, { headers });
    const data = await res.json();
    if (!res.ok || !data.success) return alert(data.message || "Reconciliation report failed.");
    setReconciliation(data.report);
  };

  const requestRepair = (item) => {
    if (!window.confirm(`Append a ${item.delta > 0 ? "credit" : "debit"} ledger correction of ${Math.abs(item.delta)} ${item.coin}? Wallet balance will not be changed.`)) return;
    setPendingRepair(item);
    setStepUpOpen(true);
  };

  const repairWithGrant = async ({ token: stepUpToken }) => {
    setStepUpOpen(false);
    const res = await fetch(`${API}/api/admin/reconciliation/wallet-ledger-repair`, {
      method: "POST",
      headers: { ...headers, "X-Owner-Step-Up": stepUpToken },
      body: JSON.stringify({ fingerprint: pendingRepair?.fingerprint }),
    });
    const data = await res.json();
    setPendingRepair(null);
    if (!res.ok || !data.success) return alert(data.message || "Reconciliation repair failed.");
    await loadReconciliation();
    alert(data.replay ? "Correction was already recorded." : "Append-only correction recorded.");
  };

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
        <button onClick={loadReconciliation}>Run Ledger Reconciliation</button>
      </div>

      {reconciliation && (
        <section className="admin-wallet-manage">
          <h3>Wallet Ledger Reconciliation</h3>
          <p>{reconciliation.healthy ? "No mismatches found." : `${reconciliation.discrepancies.length} mismatch(es) require review.`}</p>
          {(reconciliation.discrepancies || []).map((item) => (
            <div className="ledger-row" key={item.fingerprint}>
              <strong>{item.userId} • {item.coin} • {item.bucket}</strong>
              <p>Wallet {item.walletBalance} | Ledger {item.ledgerBalance} | Difference {item.delta}</p>
              <button className="danger" onClick={() => requestRepair(item)}>Review and append correction</button>
            </div>
          ))}
          {(reconciliation.referenceDiscrepancies || []).map((item) => (
            <div className="ledger-row" key={`${item.kind}-${item.recordId}`}>
              <strong>{item.kind} • {item.coin} • {item.recordId}</strong>
              <p>Amount {item.amount} | {item.reason}</p>
              <small>Report only: source-record reference issues are never auto-repaired.</small>
            </div>
          ))}
        </section>
      )}

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
      <OwnerStepUpDialog
        open={stepUpOpen}
        scope="wallet_reconciliation"
        onCancel={() => { setStepUpOpen(false); setPendingRepair(null); }}
        onVerified={repairWithGrant}
      />
    </div>
  );
}

export default AdminWallets;
