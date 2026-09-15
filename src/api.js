import { getSocket } from "./lib/apiClient.js";

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://api.exaltexchange.io/api";

/*
  Socket fix (external recovery repo, commit f78c11117): this file
  used to create its own, separate Socket.IO client via its own
  io(SOCKET_URL, {...}) call - a real duplicate of the canonical
  shared client in lib/apiClient.js, meaning the app briefly opened
  two independent socket connections to the backend (each with its
  own event listeners, reconnection state, and server-side
  connection slot) depending on which module a given file happened
  to import `socket` from. Now reuses the one canonical client -
  same exported name/shape (`socket`) so none of the ~11 existing
  `import { socket } from "../api"` call sites need to change.
*/
export const socket = getSocket();

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