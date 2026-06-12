import { getCookie, getCookies, getRequestHeaders } from "@tanstack/react-start/server";
import { db } from "./db";

export async function getCurrentUser(requiredRole?: "admin" | "user", dataSessionId?: string) {
  let sessionId = dataSessionId;

  if (!sessionId) {
    try {
      sessionId = getCookie("sessionId");
      console.log("[getCurrentUser] sessionId from getCookie:", sessionId);
    } catch (e: any) {
      console.error("[getCurrentUser] getCookie threw error:", e.message);
    }
  }

  // Fallback to manual parsing from request headers
  if (!sessionId) {
    try {
      const headers = getRequestHeaders();
      const cookieHeader = headers.get("cookie") || headers.get("Cookie");
      if (cookieHeader) {
        const nameEQ = "sessionId=";
        const ca = cookieHeader.split(";");
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i].trim();
          if (c.indexOf(nameEQ) === 0) {
            sessionId = decodeURIComponent(c.substring(nameEQ.length, c.length));
            console.log("[getCurrentUser] sessionId parsed manually from headers:", sessionId);
            break;
          }
        }
      }
    } catch (e: any) {
      console.error("[getCurrentUser] getRequestHeaders fallback error:", e.message);
    }
  }

  if (!sessionId) {
    try {
      const allCookies = getCookies();
      console.log("[getCurrentUser] Available cookies:", allCookies);
    } catch (e: any) {
      console.error("[getCurrentUser] getCookies threw error:", e.message);
    }
    throw new Error("Authentication required: No session ID provided");
  }

  const stmt = db.prepare(`
    SELECT users.id, users.username, users.role, users.deposit_balance, users.winning_balance, users.banned
    FROM sessions 
    JOIN users ON sessions.user_id = users.id 
    WHERE sessions.id = ? AND sessions.expires_at > ?
  `);
  const user = (await stmt.get(sessionId, new Date().toISOString())) as any;
  if (!user) {
    throw new Error("Session expired or invalid");
  }
  if (user.banned) {
    throw new Error("This account is banned by the administrator.");
  }
  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    throw new Error("Unauthorized: Admin privilege required");
  }
  return user;
}

// Attach to globalThis for server-side access without client-bundle static import chains
(globalThis as any).getCurrentUser = getCurrentUser;
