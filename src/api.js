import { io } from "socket.io-client";

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isLocal
    ? "http://localhost:5000/api"
    : "https://exalt-real-backend-6b6v.onrender.com/api");

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (isLocal
    ? "http://localhost:5000"
    : "https://exalt-real-backend-6b6v.onrender.com");

export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  timeout: 10000,
});

async function apiRequest(path, options = {}) {
  if (!path || !path.startsWith("/")) {
    throw new Error("Invalid API path");
  }

  const token = localStorage.getItem("token");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Authorization: token ? `Bearer ${token}` : "",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
      return null;
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