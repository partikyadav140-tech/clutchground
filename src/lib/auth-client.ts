import { useState, useEffect, useCallback, useRef } from "react";
import { getUserFromSession, logoutUser } from "../api";
import { useRouter } from "@tanstack/react-router";

export function getSessionId(): string | null {
  return getCookieClient("sessionId");
}

export function getCookieClient(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(";").shift() || "");
  }
  return null;
}

export function setSessionId(id: string) {
  if (typeof document !== "undefined") {
    const isSecure = window.location.protocol === "https:";
    document.cookie = `sessionId=${encodeURIComponent(id)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict${isSecure ? "; Secure" : ""}`;
  }
}

export function clearSessionId() {
  if (typeof document !== "undefined") {
    const isSecure = window.location.protocol === "https:";
    document.cookie = `sessionId=; path=/; max-age=0; SameSite=Strict${isSecure ? "; Secure" : ""}`;
  }
}

// ── Global state for live updates across components ──────────────────────
let globalUser: any = null;
const listeners = new Set<(u: any) => void>();

function notifyListeners() {
  listeners.forEach((l) => l(globalUser));
}

// ── Shared polling state (singleton across all useAuth instances) ─────────
// With WebSocket, this is just a fallback for balance sync (5 min instead of 30s)
const AUTH_POLL_INTERVAL = 300_000; // 5 min fallback (WebSocket handles real-time updates)
let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let pollRefCount = 0;
let consecutiveErrors = 0;

function startAuthPolling() {
  if (pollIntervalId) return; // Already running
  pollIntervalId = setInterval(fetchAndNotify, AUTH_POLL_INTERVAL);
  setupBalanceListener(); // Also set up WebSocket balance listener
}

function stopAuthPolling() {
  if (pollRefCount > 0) return; // Still in use
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
}

async function fetchAndNotify() {
  const sessionId = getSessionId();
  if (!sessionId) {
    if (globalUser) {
      globalUser = null;
      notifyListeners();
    }
    return;
  }
  try {
    const userData = await (getUserFromSession as any)({ data: sessionId });
    if (userData === null) {
      clearSessionId();
      if (globalUser) {
        globalUser = null;
        notifyListeners();
      }
    } else if (JSON.stringify(userData) !== JSON.stringify(globalUser)) {
      globalUser = userData;
      notifyListeners();
    }
    consecutiveErrors = 0;
  } catch {
    consecutiveErrors++;
    // Back off on repeated errors
    if (consecutiveErrors >= 3 && pollIntervalId) {
      clearInterval(pollIntervalId);
      const backoffMs = Math.min(AUTH_POLL_INTERVAL * Math.pow(2, consecutiveErrors - 2), 600_000);
      pollIntervalId = setInterval(fetchAndNotify, backoffMs);
    }
  }
}

// ── WebSocket balance listener (updates balance in real-time) ──────────
let balanceListenerSetup = false;
function setupBalanceListener() {
  if (balanceListenerSetup || typeof window === "undefined") return;
  balanceListenerSetup = true;
  // Lazy import to avoid SSR issues
  import("./socket-client").then(({ getSocket }) => {
    const checkSocket = () => {
      const socket = getSocket();
      if (socket) {
        socket.on("balance-update", (data: { deposit: number; winning: number }) => {
          if (globalUser) {
            globalUser = { ...globalUser, deposit_balance: data.deposit, winning_balance: data.winning };
            notifyListeners();
          }
        });
      } else {
        setTimeout(checkSocket, 2000);
      }
    };
    checkSocket();
  }).catch(() => {});
}

export function useAuth() {
  const [user, setUserState] = useState<any>(globalUser);
  const [loading, setLoading] = useState(!globalUser);
  const router = useRouter();
  const mountedRef = useRef(true);

  const setUser = useCallback((newUser: any) => {
    globalUser = newUser;
    notifyListeners();
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const listener = (u: any) => {
      if (mountedRef.current) {
        setUserState(u);
        setLoading(false);
      }
    };
    listeners.add(listener);

    async function initialFetch() {
      const sessionId = getSessionId();
      if (!sessionId) {
        if (globalUser) {
          globalUser = null;
          notifyListeners();
        }
        if (mountedRef.current) setLoading(false);
        return;
      }
      try {
        const userData = await (getUserFromSession as any)({ data: sessionId });
        if (!mountedRef.current) return;
        if (userData === null) {
          clearSessionId();
          if (globalUser) {
            globalUser = null;
            notifyListeners();
          }
        } else if (JSON.stringify(userData) !== JSON.stringify(globalUser)) {
          globalUser = userData;
          notifyListeners();
        }
      } catch {
        // Keep existing state on network errors
      }
      if (mountedRef.current) setLoading(false);
    }

    if (!globalUser) {
      initialFetch();
    } else {
      setLoading(false);
    }

    // Shared polling — start only once, ref-count across components
    pollRefCount++;
    startAuthPolling();

    return () => {
      mountedRef.current = false;
      listeners.delete(listener);
      pollRefCount--;
      stopAuthPolling();
    };
  }, []);

  const logout = useCallback(async () => {
    const sessionId = getSessionId();
    if (sessionId) {
      (logoutUser as any)({ data: sessionId }).catch(() => {});
    }
    clearSessionId();
    globalUser = null;
    notifyListeners();
    router.navigate({ to: "/login" });
  }, [router]);

  return { user, loading, logout, setUser };
}
