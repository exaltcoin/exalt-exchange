const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://exalt-exchange-backend.onrender.com/api";

import { io } from "socket.io-client";

export const socket = io(
  import.meta.env.VITE_SOCKET_URL ||
    "https://exalt-exchange-backend.onrender.com",
  {
    transports: ["polling", "websocket"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 10000,
  }
);

async function apiRequest(path, options = {}) {
  if (!path || !path.startsWith("/")) {
    throw new Error("Invalid API path");
  }

  const token = localStorage.getItem("token");

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Authorization: token ? `Bearer ${token}` : "",
        ...(options.headers || {}),
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeout);

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      throw new Error("Request timeout. Please try again.");
    }

    throw error;
  }
}

export const openPosition = async (payload) => {
  return apiRequest("/futures/open", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getPositions = async () => {
  return apiRequest("/futures/positions");
};

export const closePosition = async (id) => {
  return apiRequest(`/futures/close/${id}`, {
    method: "PUT",
  });
};

export const getFuturesHistory = async () => {
  return apiRequest("/futures/history");
};

export default API_BASE_URL;