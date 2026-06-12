import { getCookie } from "@tanstack/react-start/server";
import { db } from "./db";

export async function getCurrentUser(requiredRole?: "admin" | "user", dataSessionId?: string) {
  let sessionId = dataSessionId;

  if (!sessionId) {
    try {
      sessionId = getCookie("sessionId");
    } catch (e) {
      // getCookie might throw if called outside of request context
    }
  }

  if (!sessionId) {
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
