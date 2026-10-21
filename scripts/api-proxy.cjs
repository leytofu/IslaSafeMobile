const http = require("node:http");
const https = require("node:https");

// A fixed local upstream, never a request-supplied destination. This middleware
// runs only in Metro's development server; exports contain no proxy server.
function createApiProxy(upstream = "http://127.0.0.1:8000", log = () => {}) {
  const target = new URL(upstream);
  const transport = target.protocol === "https:" ? https : http;
  return (req, res, next) => {
    const pathname = (req.url || "").split("?", 1)[0];
    if (!(pathname === "/api" || pathname.startsWith("/api/") || pathname.startsWith("/storage/"))) return next();
    res.on("finish", () => log(`[mobile-api] ${req.socket.remoteAddress} ${req.method} ${pathname} ${res.statusCode}`));
    const headers = { ...req.headers };
    // The mobile API uses bearer tokens. Browser session cookies and Origin
    // must not accidentally select Sanctum's web/CSRF authentication path.
    delete headers.cookie;
    delete headers.origin;
    delete headers.referer;
    delete headers.connection;
    const request = transport.request({
      hostname: target.hostname,
      port: target.port || (target.protocol === "https:" ? 443 : 80),
      method: req.method,
      path: req.url,
      headers,
    }, response => {
      const responseHeaders = { ...response.headers };
      delete responseHeaders["set-cookie"];
      res.writeHead(response.statusCode || 502, responseHeaders);
      response.pipe(res);
      response.on("error", () => res.destroy());
    });
    request.setTimeout(45000, () => request.destroy(new Error("Backend timed out")));
    request.on("error", () => {
      if (res.headersSent) { res.destroy(); return; }
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Laravel is unavailable. Start the backend with php artisan serve --host=127.0.0.1 --port=8000." }));
    });
    req.on("aborted", () => request.destroy());
    res.on("close", () => { if (!res.writableEnded) request.destroy(); });
    req.pipe(request);
  };
}

module.exports = { createApiProxy };
