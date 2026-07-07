const PRICE_ALERTS_KEY = "exalt_price_alerts_v1";

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function makeId() {
  return `alert_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getPriceAlerts() {
  const list = safeJsonParse(localStorage.getItem(PRICE_ALERTS_KEY), []);
  return Array.isArray(list) ? list : [];
}

export function savePriceAlerts(list = []) {
  const clean = Array.isArray(list) ? list : [];
  localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(clean));
  return clean;
}

export function addPriceAlert({
  symbol = "",
  name = "",
  chainKey = "bsc",
  condition = "above",
  targetPrice = "",
  enabled = true,
}) {
  const cleanSymbol = String(symbol || "").trim().toUpperCase();
  const price = Number(targetPrice);

  if (!cleanSymbol) throw new Error("Token symbol is required.");
  if (!price || price <= 0) throw new Error("Valid target price is required.");

  const alert = {
    id: makeId(),
    symbol: cleanSymbol,
    name: name || cleanSymbol,
    chainKey,
    condition,
    targetPrice: price,
    enabled: Boolean(enabled),
    triggered: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [alert, ...getPriceAlerts()];
  savePriceAlerts(updated);
  return updated;
}

export function updatePriceAlert(id, updates = {}) {
  const updated = getPriceAlerts().map((item) =>
    item.id === id
      ? {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  savePriceAlerts(updated);
  return updated;
}

export function deletePriceAlert(id) {
  const updated = getPriceAlerts().filter((item) => item.id !== id);
  savePriceAlerts(updated);
  return updated;
}

export function togglePriceAlert(id) {
  const updated = getPriceAlerts().map((item) =>
    item.id === id
      ? {
          ...item,
          enabled: !item.enabled,
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  savePriceAlerts(updated);
  return updated;
}

export function checkPriceAlerts(prices = {}) {
  const alerts = getPriceAlerts();
  const triggered = [];

  const updated = alerts.map((alert) => {
    if (!alert.enabled || alert.triggered) return alert;

    const currentPrice = Number(
      prices[alert.symbol] ||
        prices[String(alert.symbol || "").toUpperCase()] ||
        0
    );

    if (!currentPrice) return alert;

    const hit =
      alert.condition === "above"
        ? currentPrice >= Number(alert.targetPrice)
        : currentPrice <= Number(alert.targetPrice);

    if (!hit) return alert;

    triggered.push({
      ...alert,
      currentPrice,
      triggeredAt: new Date().toISOString(),
    });

    return {
      ...alert,
      triggered: true,
      currentPrice,
      triggeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  savePriceAlerts(updated);

  return {
    alerts: updated,
    triggered,
  };
}

export default {
  getPriceAlerts,
  savePriceAlerts,
  addPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
  togglePriceAlert,
  checkPriceAlerts,
};