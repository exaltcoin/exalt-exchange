function safeValue(value = "") {
  return String(value ?? "")
    .replaceAll('"', '""')
    .replaceAll("\n", " ");
}

export function txToCsvRow(tx = {}) {
  return [
    tx.createdAt || tx.date || new Date().toISOString(),
    tx.type || "",
    tx.coin || "",
    tx.amount || "",
    tx.status || "",
    tx.chain || tx.chainKey || "",
    tx.hash || "",
    tx.wallet || "",
  ]
    .map((value) => `"${safeValue(value)}"`)
    .join(",");
}

export function exportHistoryToCsv(history = [], filename = "exalt-wallet-history.csv") {
  const headers = [
    "Date",
    "Type",
    "Coin",
    "Amount",
    "Status",
    "Network",
    "Hash",
    "Wallet",
  ];

  const rows = Array.isArray(history) ? history.map(txToCsvRow) : [];

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);

  return true;
}

export function filterHistory(history = [], filters = {}) {
  const {
    type = "all",
    status = "all",
    chainKey = "all",
    coin = "",
    query = "",
  } = filters;

  const q = String(query || "").toLowerCase();
  const c = String(coin || "").toUpperCase();

  return (Array.isArray(history) ? history : []).filter((tx) => {
    const matchType =
      type === "all" || String(tx.type || "").toLowerCase() === type.toLowerCase();

    const matchStatus =
      status === "all" ||
      String(tx.status || "").toLowerCase() === status.toLowerCase();

    const matchChain =
      chainKey === "all" ||
      String(tx.chainKey || tx.chain || "").toLowerCase() === chainKey.toLowerCase();

    const matchCoin =
      !c || String(tx.coin || "").toUpperCase().includes(c);

    const text = `${tx.type || ""} ${tx.coin || ""} ${tx.hash || ""} ${tx.status || ""} ${
      tx.chain || ""
    }`.toLowerCase();

    const matchQuery = !q || text.includes(q);

    return matchType && matchStatus && matchChain && matchCoin && matchQuery;
  });
}

export function getHistoryStats(history = []) {
  const list = Array.isArray(history) ? history : [];

  return {
    total: list.length,
    sent: list.filter((tx) => String(tx.type || "").toLowerCase() === "send").length,
    swap: list.filter((tx) => String(tx.type || "").toLowerCase() === "swap").length,
    success: list.filter((tx) => String(tx.status || "").toLowerCase() === "success").length,
    pending: list.filter((tx) => String(tx.status || "").toLowerCase() === "pending").length,
    failed: list.filter((tx) => String(tx.status || "").toLowerCase() === "failed").length,
  };
}

export default {
  exportHistoryToCsv,
  filterHistory,
  getHistoryStats,
};