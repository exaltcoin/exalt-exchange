import { STORAGE_KEYS } from "./web3Config";
import { safeJsonParse } from "./walletStore";
import { buildExplorerTx } from "./transactionService";

export function getLocalHistory() {
  return safeJsonParse(localStorage.getItem(STORAGE_KEYS.TX_HISTORY), []);
}

export function saveLocalHistory(history = []) {
  const cleanHistory = Array.isArray(history) ? history : [];
  localStorage.setItem(STORAGE_KEYS.TX_HISTORY, JSON.stringify(cleanHistory));
  return cleanHistory;
}

export function addLocalTx(tx) {
  const history = getLocalHistory();

  const item = {
    id: tx.id || `${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    type: tx.type || "Transaction",
    hash: tx.hash || "",
    amount: tx.amount || 0,
    coin: tx.coin || "BNB",
    status: tx.status || "pending",
    wallet: tx.wallet || "",
    chain: tx.chain || "BSC",
    note: tx.note || "",
    explorer: tx.hash ? buildExplorerTx(tx.hash) : "",
    createdAt: tx.createdAt || new Date().toISOString(),
  };

  const updated = [item, ...history].slice(0, 300);
  saveLocalHistory(updated);

  return updated;
}

export function updateLocalTxStatus(hash, status = "success") {
  const history = getLocalHistory();

  const updated = history.map((tx) =>
    tx.hash === hash
      ? {
          ...tx,
          status,
          updatedAt: new Date().toISOString(),
        }
      : tx
  );

  saveLocalHistory(updated);
  return updated;
}

export async function saveWeb3TxToBackend(API, tx) {
  try {
    const res = await fetch(`${API}/api/web3-transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: String(tx.wallet || "").toLowerCase(),
        type: tx.type || "Send",
        coin: tx.coin || "BNB",
        amount: Number(tx.amount || 0),
        hash: tx.hash || "",
        status: tx.status || "success",
        chain: tx.chain || "BSC",
        source: "web3-wallet",
        notes: tx.note || "",
      }),
    });

    return await res.json();
  } catch (error) {
    console.log("Save Web3 tx backend error:", error);
    return { success: false, message: error.message };
  }
}

export async function loadWeb3HistoryFromBackend(API, walletAddress) {
  try {
    if (!walletAddress) return [];

    const res = await fetch(`${API}/api/web3-transactions/${walletAddress}`);
    const data = await res.json();

    if (!data.success || !Array.isArray(data.transactions)) {
      return getLocalHistory();
    }

    const formatted = data.transactions.map((tx) => ({
      id: tx._id || tx.hash,
      type: tx.type,
      hash: tx.hash,
      amount: tx.amount,
      coin: tx.coin,
      status: tx.status || "success",
      wallet: tx.wallet,
      chain: tx.chain || "BSC",
      note: tx.notes || "",
      explorer: tx.hash ? buildExplorerTx(tx.hash) : "",
      createdAt: tx.createdAt || new Date().toISOString(),
    }));

    saveLocalHistory(formatted);
    return formatted;
  } catch (error) {
    console.log("Load Web3 history backend error:", error);
    return getLocalHistory();
  }
}

export function filterHistory(history = [], filters = {}) {
  const {
    coin = "ALL",
    type = "ALL",
    status = "ALL",
    search = "",
  } = filters;

  const q = String(search || "").toLowerCase();

  return history.filter((tx) => {
    const matchCoin =
      coin === "ALL" || String(tx.coin || "").toUpperCase() === coin.toUpperCase();

    const matchType =
      type === "ALL" || String(tx.type || "").toUpperCase().includes(type.toUpperCase());

    const matchStatus =
      status === "ALL" ||
      String(tx.status || "").toUpperCase().includes(status.toUpperCase());

    const matchSearch =
      !q ||
      String(tx.hash || "").toLowerCase().includes(q) ||
      String(tx.coin || "").toLowerCase().includes(q) ||
      String(tx.type || "").toLowerCase().includes(q) ||
      String(tx.note || "").toLowerCase().includes(q);

    return matchCoin && matchType && matchStatus && matchSearch;
  });
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEYS.TX_HISTORY);
  return [];
}