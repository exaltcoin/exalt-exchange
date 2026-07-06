export async function submitWeb3SupportTicket({
  API,
  token = "",
  subject = "Web3 Wallet Support",
  message = "",
  wallet = "",
  category = "WEB3",
  priority = "normal",
}) {
  if (!API) {
    throw new Error("API base URL is required.");
  }

  if (!message || !message.trim()) {
    throw new Error("Please write your issue.");
  }

  const res = await fetch(`${API}/api/support-ticket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({
      subject,
      message,
      wallet,
      category,
      priority,
      source: "web3-wallet",
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok && !data.success) {
    throw new Error(data.message || "Support request failed.");
  }

  return {
    success: true,
    ticket: data.ticket || data.data || null,
    message: data.message || "Support request submitted.",
  };
}

export async function loadMySupportTickets({ API, token = "" }) {
  try {
    if (!API || !token) return [];

    const res = await fetch(`${API}/api/support-ticket`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    return data.tickets || data.data || data.requests || [];
  } catch (error) {
    console.log("Load support tickets error:", error);
    return [];
  }
}

export function buildSupportMessageTemplate({ wallet = "", issue = "" }) {
  return [
    "Web3 Wallet Support Request",
    wallet ? `Wallet: ${wallet}` : "",
    issue ? `Issue: ${issue}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}