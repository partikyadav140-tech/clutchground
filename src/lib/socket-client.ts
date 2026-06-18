/**
 * Client-side Socket.io singleton.
 * Manages connection, reconnection, and provides the socket instance.
 */
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;

function getSessionIdFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; sessionId=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }
  return null;
}

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const sessionId = getSessionIdFromCookie();
  if (!sessionId) {
    // Not logged in — don't connect
    return null as any;
  }

  if (!socket) {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    socket = io(url, {
      path: "/ws",
      auth: { sessionId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      autoConnect: false,
    });

    socket.on("connect", () => {
      reconnectAttempts = 0;
      console.log("[WS] Connected");
    });

    socket.on("disconnect", (reason) => {
      console.log("[WS] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      reconnectAttempts++;
      console.warn("[WS] Connection error:", err.message);
      // If auth failed, don't retry
      if (err.message.includes("Session expired") || err.message.includes("Authentication")) {
        socket?.disconnect();
      }
    });
  }

  // Update auth with fresh sessionId
  socket.auth = { sessionId };
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
