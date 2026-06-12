import { db } from "./db";

export async function getCurrentUser(requiredRole?: "admin" | "user", dataSessionId?: string) {
  let sessionId = dataSessionId;

  if (!sessionId) {
    try {
      const storageKey = Symbol.for("tanstack-start:event-storage");
      const storage = (globalThis as any)[storageKey];
      if (storage) {
        const store = storage.getStore();
        const event = store?.h3Event;
        if (event) {
          let cookieHeader = "";
          if (event.node?.req) {
            cookieHeader = event.node.req.headers.cookie || event.node.req.headers.Cookie || "";
          }
          if (!cookieHeader && event.headers) {
            if (typeof event.headers.get === "function") {
              cookieHeader = event.headers.get("cookie") || "";
            } else {
              cookieHeader = event.headers.cookie || event.headers.Cookie || "";
            }
          }
          if (!cookieHeader && event.web?.request?.headers) {
            cookieHeader = event.web.request.headers.get("cookie") || "";
          }

          if (cookieHeader) {
            const nameEQ = "sessionId=";
            const ca = cookieHeader.split(";");
            for (let i = 0; i < ca.length; i++) {
              let c = ca[i].trim();
              if (c.indexOf(nameEQ) === 0) {
                sessionId = decodeURIComponent(c.substring(nameEQ.length, c.length));
                break;
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.error("[getCurrentUser] Error parsing cookies from global store:", e.message);
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
