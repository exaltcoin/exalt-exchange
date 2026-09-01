import { STORAGE_KEYS } from "./web3Config";
import { safeJsonParse } from "./walletStore";
import { buildExplorerTx } from "./transactionService";

const MAX_HISTORY = 500;

export function getLocalHistory() {
  const history = safeJsonParse(localStorage.getItem(STORAGE_KEYS.TX_HISTORY), []);
  return Array.isArray(history) ? history : [];
}

export function saveLocalHistory(history = []) {
  const cleanHistory = Array.isArray(history) ? history : [];
  localStorage.setItem(STORAGE_KEYS.TX_HISTORY, JSON.stringify(cleanHistory));
  return cleanHistory;
}

export function normalizeTx(tx = {}) {
  const hash = tx.hash || tx.txHash || "";

  return {
    id: tx.id || tx._id || hash || `${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    type: tx.type || "Transaction",
    hash,
    amount: tx.amount || 0,
    coin: tx.coin || "BNB",
    status: tx.status || "pending",
    wallet: String(tx.wallet || "").toLowerCase(),
    chain: tx.chain || "BSC",
    chainKey: tx.chainKey || tx.chain_key || "bsc",
    note: tx.note || tx.notes || "",
    source: tx.source || "exalt-wallet",
    explorer: hash ? buildExplorerTx(hash) : "",
    createdAt: tx.createdAt || new Date().toISOString(),
    updatedAt: tx.updatedAt || "",
  };
}

export function addLocalTx(tx) {
  const history = getLocalHistory();
  const item = normalizeTx(tx);

  const withoutDuplicate = history.filter(
    (oldTx) => !item.hash || oldTx.hash !== item.hash
  );

  const updated = [item, ...withoutDuplicate].slice(0, MAX_HISTORY);
  saveLocalHistory(updated);

  return updated;
}

export function updateLocalTxStatus(hash, status = "success") {
  if (!hash) return getLocalHistory();

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
  return { success: true, serverManaged: true, transaction: normalizeTx(tx) };
}

export async function loadWeb3HistoryFromBackend(API, walletAddress) {
  try {
    if (!API) return [];

    const token = localStorage.getItem("token");
    if (!token) return [];
    const res = await fetch(`${API}/api/web3-wallet/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    console.log("Web3 history backend response:", data);

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data.transactions)
      ? data.transactions
      : Array.isArray(data.data)
      ? data.data
      : [];

    return list
      .map((tx) =>
        normalizeTx({
          id: tx._id || tx.id,
          type: tx.type,
          hash: tx.hash || tx.txHash,
          amount: tx.amount,
          coin: tx.coin,
          status: tx.status || "success",
          wallet: tx.wallet || walletAddress,
          chain: tx.chain || "BSC",
          chainKey: tx.chainKey || tx.chain_key || "bsc",
          note: tx.notes || tx.note || "",
          source: tx.source || "exalt-wallet",
          createdAt: tx.createdAt || new Date().toISOString(),
          updatedAt: tx.updatedAt || "",
        })
      )
      .slice(0, MAX_HISTORY);
  } catch (error) {
    console.log("Load Exalt Wallet history backend error:", error);
    return [];
  }
}

export function filterHistory(history = [], filters = {}) {
  const { coin = "ALL", type = "ALL", status = "ALL", search = "" } = filters;
  const q = String(search || "").toLowerCase();

  return history.filter((tx) => {
    const matchCoin =
      coin === "ALL" || String(tx.coin || "").toUpperCase() === coin.toUpperCase();

    const matchType =
      type === "ALL" || String(tx.type || "").toUpperCase().includes(type.toUpperCase());

    const matchStatus =
      status === "ALL" || String(tx.status || "").toUpperCase().includes(status.toUpperCase());

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
