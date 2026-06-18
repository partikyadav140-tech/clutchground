/**
 * Node.js HTTP server wrapper for Render deployment.
 * Serves static files from dist/client, then falls back to SSR handler.
 */
import { createServer } from "node:http";
import { createReadStream, promises as fs } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { Server as SocketIOServer } from "socket.io";
import app from "./dist/server/server.js";

const port = parseInt(process.env.PORT || "3000", 10);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const clientDir = join(__dirname, "dist/client");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

// ── Security Headers ──────────────────────────────────────────────────────
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws: https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

SECURITY_HEADERS["Content-Security-Policy"] = CSP_DIRECTIVES;

// ── Rate Limiting (in-memory, per-IP) ────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 200; // Increased from 120 — 5s auth poll + 20s notif poll + page loads need headroom
const rateLimitMap = new Map();
let lastCleanup = Date.now();

function checkRateLimit(ip) {
  const now = Date.now();
  // Cleanup old entries every 60s
  if (now - lastCleanup > RATE_LIMIT_WINDOW_MS) {
    for (const [key, entry] of rateLimitMap) {
      if (now - entry.start > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key);
    }
    lastCleanup = now;
  }
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// ── Block suspicious paths ────────────────────────────────────────────────
const BLOCKED_PATHS = [
  "/wp-admin", "/wp-login", "/wp-content", "/xmlrpc.php",
  "/.env", "/.git", "/.htaccess", "/.htpasswd",
  "/phpmyadmin", "/adminer", "/server-status",
  "/config.json", "/config.yml", "/package.json",
  "/.DS_Store", "/Thumbs.db",
];

createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host || "localhost"}`;
    const url = new URL(req.url, origin);
    const pathname = url.pathname;

    // ── Block suspicious paths ────────────────────────────────────────────
    const lowerPath = pathname.toLowerCase();
    for (const blocked of BLOCKED_PATHS) {
      if (lowerPath === blocked || lowerPath.startsWith(blocked + "/")) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
    }

    // ── Block directory traversal attempts ────────────────────────────────
    if (lowerPath.includes("..") || lowerPath.includes("%2e%2e")) {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }

    // ── Rate limit by IP ──────────────────────────────────────────────────
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
      || req.headers["x-real-ip"]
      || req.socket?.remoteAddress
      || "unknown";

    if (!checkRateLimit(clientIp)) {
      res.writeHead(429, {
        "Retry-After": "30",
        "Content-Type": "application/json",
        ...SECURITY_HEADERS,
      });
      res.end(JSON.stringify({
        error: "Too Many Requests",
        message: "You're making requests too quickly. Please slow down.",
        retryAfter: 30,
      }));
      return;
    }

    // ── 1. Try to serve static file from dist/client ──────────────────────
    const filePath = join(clientDir, pathname);
    try {
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        const ext = extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        // Hashed assets get long cache; everything else no-cache
        const isHashed = /\.[a-f0-9]{8,}\.[a-z]+$/.test(pathname);
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": isHashed
            ? "public, max-age=31536000, immutable"
            : "no-cache, must-revalidate",
          ...SECURITY_HEADERS,
        });
        createReadStream(filePath).pipe(res);
        return;
      }
    } catch {
      // File does not exist, fall through to TanStack Start SSR handler
    }

    // ── 2. Fall through to TanStack Start SSR handler ─────────────────────
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else if (value != null) {
        headers.set(key, value);
      }
    }

    const method = req.method || "GET";
    const init = { method, headers };

    if (method !== "GET" && method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      if (chunks.length > 0) init.body = Buffer.concat(chunks);
    }

    const request = new Request(url, init);
    const response = await app.fetch(request);

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      const existing = responseHeaders[key];
      if (existing) {
        responseHeaders[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        responseHeaders[key] = value;
      }
    });

    // Inject security headers into SSR response
    Object.assign(responseHeaders, SECURITY_HEADERS);

    res.writeHead(response.status, responseHeaders);
    if (response.body) {
      for await (const chunk of response.body) res.write(chunk);
    }
    res.end();
  } catch (err) {
    console.error("Server error:", err);
    if (!res.headersSent) res.writeHead(500);
    res.end("Internal Server Error");
  }
}).listen(port, () => {
  console.log(`✓ Server running on port ${port}`);

  // ── Socket.io WebSocket Server ────────────────────────────────────────
  const io = new SocketIOServer(globalThis.__server || process, {
    path: "/ws",
    cors: {
      origin: ["https://clutchground.games", "http://localhost:8080"],
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Store for emit helpers
  globalThis.__socketIO = io;

  // ── Session-based authentication middleware ────────────────────────────
  io.use(async (socket, next) => {
    try {
      const sessionId =
        socket.handshake.auth?.sessionId ||
        socket.handshake.headers?.cookie?.split("sessionId=")[1]?.split(";")[0];

      if (!sessionId) {
        return next(new Error("Authentication required"));
      }

      // Look up session in database
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });

      try {
        const result = await pool.query(
          `SELECT s.user_id, u.username, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = $1 AND s.expires_at > NOW()`,
          [sessionId],
        );
        if (result.rows.length === 0) {
          return next(new Error("Session expired"));
        }
        const user = result.rows[0];
        socket.data.userId = user.user_id;
        socket.data.username = user.username;
        socket.data.role = user.role;
        next();
      } finally {
        await pool.end();
      }
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`[WS] User ${userId} connected (${socket.id})`);

    // ── Join personal room ──────────────────────────────────────────────
    socket.join(`user:${userId}`);

    // ── Join team rooms ─────────────────────────────────────────────────
    socket.on("join-team", async (teamId) => {
      try {
        const { Pool } = await import("pg");
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
          max: 1,
        });
        try {
          const result = await pool.query(
            "SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1",
            [teamId, userId],
          );
          if (result.rows.length > 0 || socket.data.role === "admin") {
            socket.join(`team:${teamId}`);
          }
        } finally {
          await pool.end();
        }
      } catch {}
    });

    // ── Leave team room ─────────────────────────────────────────────────
    socket.on("leave-team", (teamId) => {
      socket.leave(`team:${teamId}`);
    });

    // ── Join ticket room ────────────────────────────────────────────────
    socket.on("join-ticket", (ticketId) => {
      socket.join(`ticket:${ticketId}`);
    });

    socket.on("leave-ticket", (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WS] User ${userId} disconnected (${socket.id})`);
    });
  });

  console.log(`✓ WebSocket server ready on /ws`);
});
