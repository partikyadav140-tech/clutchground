import { useState, useEffect } from "react";
import { getUserFromSession, logoutUser } from "../api";
import { useRouter } from "@tanstack/react-router";

export function getSessionId() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sessionId");
  }
  return null;
}

export function setSessionId(id: string) {
  localStorage.setItem("sessionId", id);
}

export function clearSessionId() {
  localStorage.removeItem("sessionId");
}

// Global state for live updates across components
let globalUser: any = null;
const listeners = new Set<Function>();

function notifyListeners() {
  listeners.forEach((l) => l(globalUser));
}

let polling = false;

export function useAuth() {
  const [user, setUserState] = useState<any>(globalUser);
  const [loading, setLoading] = useState(!globalUser);
  const router = useRouter();

  const setUser = (newUser: any) => {
    globalUser = newUser;
    notifyListeners();
  };

  useEffect(() => {
    const listener = (u: any) => {
      setUserState(u);
      setLoading(false);
    };
    listeners.add(listener);

    async function fetchUser() {
      const sessionId = getSessionId();
      if (!sessionId) {
        if (globalUser) {
          globalUser = null;
          notifyListeners();
        }
        setLoading(false);
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
      } catch (e) {
        console.warn("Failed to fetch user session, keeping existing state");
      }
      setLoading(false);
    }

    if (!globalUser) {
      fetchUser();
    } else {
      setLoading(false);
    }

    if (!polling) {
      polling = true;
      setInterval(fetchUser, 5000); // Poll every 5s for live coin updates
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const logout = async () => {
    const sessionId = getSessionId();
    if (sessionId) {
      (logoutUser as any)({ data: sessionId });
    }
    localStorage.removeItem("sessionId");
    globalUser = null;
    notifyListeners();
    router.navigate({ to: "/login" });
  };

  return { user, loading, logout, setUser };
}
