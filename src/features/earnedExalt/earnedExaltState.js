export function newIdempotencyKey(prefix = "earned-exalt") {
  const operation = String(prefix || "earned-exalt").trim() || "earned-exalt";
  const requestId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${operation}:${requestId}`;
}

export function validateClaimAmount(value, claimable) {
  const amount =
    typeof value === "string" && value.trim() === "" ? NaN : Number(value);
  const available = Number(claimable);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      valid: false,
      amount: null,
      message: "Enter a positive claim amount.",
    };
  }

  if (!Number.isFinite(available) || available < 0 || amount > available) {
    return {
      valid: false,
      amount,
      message: "Amount exceeds the released EXALT available to claim.",
    };
  }

  return { valid: true, amount, message: "" };
}

export function isStepUpUsable(grant, now = Date.now()) {
  const expiresAt = new Date(grant?.expiresAt).getTime();
  const currentTime = new Date(now).getTime();

  return (
    Number.isFinite(expiresAt) &&
    Number.isFinite(currentTime) &&
    expiresAt > currentTime
  );
}
