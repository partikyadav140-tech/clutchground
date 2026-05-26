/**
 * Node.js HTTP server wrapper for Render deployment.
 * TanStack Start builds a web-standard fetch handler — this wraps it
 * in a Node.js HTTP server so Render can run it.
 */
import { createServer } from "node:http";
import app from "./dist/server/server.js";

const port = parseInt(process.env.PORT || "3000", 10);

createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host || "localhost"}`;
    const url = new URL(req.url, origin);

    // Convert Node.js headers to Web API Headers
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

    // Buffer request body for non-GET/HEAD requests
    if (method !== "GET" && method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      if (chunks.length > 0) init.body = Buffer.concat(chunks);
    }

    const request = new Request(url, init);
    const response = await app.fetch(request);

    // Convert Web API response headers to Node.js format
    // (supports multiple set-cookie headers)
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
      for await (const chunk of response.body) {
        res.write(chunk);
      }
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
