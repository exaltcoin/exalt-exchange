const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
import { io } from "socket.io-client";
export const socket = io(
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
  {
    transports: ["polling", "websocket"],
    withCredentials: true,
  }
);
async function apiRequest(
    path,
    options = {}
) {

    const token =
        localStorage.getItem(
            "token"
        );

    const response =
        await fetch(
            `${API_BASE_URL}${path}`,
            {
                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        token
                            ? `Bearer ${token}`
                            : "",
                },

                ...options,
            }
        );

    const data =
        await response
            .json()
            .catch(() => ({}));

    if (!response.ok) {

        throw new Error(
            data.message ||
            "API request failed"
        );
    }

    return data;
}

export const openPosition =
    async (payload) => {

    return apiRequest(
        "/futures/open",
        {
            method: "POST",

            body: JSON.stringify(
                payload
            ),
        }
    );
};

export const getPositions =
    async () => {

    return apiRequest(
        "/futures/positions"
    );
};

export const closePosition =
    async (id) => {

    return apiRequest(
        `/futures/close/${id}`,
        {
            method: "PUT",
        }
    );
};
export const getFuturesHistory = async () => {
  return apiRequest(
    "/futures/history"
  );
};
export default API_BASE_URL;