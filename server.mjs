/**
 * Node.js HTTP server wrapper for Render deployment.
 * Serves static files from dist/client, then falls back to SSR handler.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import app from "./dist/server/server.js";

const port = parseInt(process.env.PORT || "3000", 10);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const clientDir = join(__dirname, "dist/client");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
  ".txt":  "text/plain",
  ".xml":  "application/xml",
};

createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host || "localhost"}`;
    const url = new URL(req.url, origin);
    const pathname = url.pathname;

    // ── 1. Try to serve static file from dist/client ──────────────────────
    const filePath = join(clientDir, pathname);
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      // Hashed assets get long cache; everything else no-cache
      const isHashed = /\.[a-f0-9]{8,}\.[a-z]+$/.test(pathname);
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": isHashed
          ? "public, max-age=31536000, immutable"
          : "no-cache, must-revalidate",
      });
      createReadStream(filePath).pipe(res);
      return;
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
        responseHeaders[key] = Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
      } else {
        responseHeaders[key] = value;
      }
    });

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
});
