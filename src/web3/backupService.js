const BACKUP_STATUS_KEY = "exalt_wallet_backup_status_v1";

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function getBackupStatus(address = "") {
  const all = safeJsonParse(localStorage.getItem(BACKUP_STATUS_KEY), {});
  const key = String(address || "").toLowerCase();

  return all[key] || {
    backedUp: false,
    verified: false,
    reminderDismissed: false,
    lastBackupAt: "",
    lastVerifiedAt: "",
  };
}

export function saveBackupStatus(address = "", status = {}) {
  const all = safeJsonParse(localStorage.getItem(BACKUP_STATUS_KEY), {});
  const key = String(address || "").toLowerCase();

  if (!key) return getBackupStatus("");

  all[key] = {
    ...getBackupStatus(address),
    ...status,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(BACKUP_STATUS_KEY, JSON.stringify(all));
  return all[key];
}

export function markWalletBackedUp(address = "") {
  return saveBackupStatus(address, {
    backedUp: true,
    lastBackupAt: new Date().toISOString(),
  });
}

export function markWalletVerified(address = "") {
  return saveBackupStatus(address, {
    backedUp: true,
    verified: true,
    reminderDismissed: true,
    lastVerifiedAt: new Date().toISOString(),
  });
}

export function dismissBackupReminder(address = "") {
  return saveBackupStatus(address, {
    reminderDismissed: true,
  });
}

export function shouldShowBackupReminder(address = "") {
  const status = getBackupStatus(address);

  if (!address) return false;
  if (status.verified) return false;
  if (status.reminderDismissed) return false;

  return true;
}

export function getBackupLabel(address = "") {
  const status = getBackupStatus(address);

  if (status.verified) return "Protected";
  if (status.backedUp) return "Backed Up";
  return "Not Backed Up";
}

export default {
  getBackupStatus,
  saveBackupStatus,
  markWalletBackedUp,
  markWalletVerified,
  dismissBackupReminder,
  shouldShowBackupReminder,
  getBackupLabel,
};