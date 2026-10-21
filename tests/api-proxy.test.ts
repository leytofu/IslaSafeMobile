import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import type { AddressInfo } from "node:net";

const { createApiProxy } = createRequire(import.meta.url)("../scripts/api-proxy.cjs") as {
  createApiProxy: (upstream: string) => (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
};
async function listen(server: Server) {
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

test("development proxy preserves mobile auth, query strings and multipart bytes, and keeps Metro routes intact", async () => {
  const upstream = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    res.writeHead(422, { "Content-Type": "application/json", "Set-Cookie": "web-session=must-not-leak" });
    res.end(JSON.stringify({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString("base64") }));
  });
  const destination = await listen(upstream);
  const proxy = createApiProxy(destination);
  const metro = createServer((req, res) => proxy(req, res, () => { res.end("Metro bundle"); }));
  const base = await listen(metro);
  try {
    const body = Buffer.from("--photo\r\nContent-Disposition: form-data; name=avatar; filename=test.jpg\r\n\r\n\u0000image\r\n--photo--");
    const response = await fetch(`${base}/api/auth/profile?test=1`, {
      method: "POST", body,
      headers: { Authorization: "Bearer test-token", "Content-Type": "multipart/form-data; boundary=photo", Origin: base, Referer: base, Cookie: "web-session=must-not-forward" },
    });
    assert.equal(response.status, 422);
    assert.equal(response.headers.get("set-cookie"), null);
    const data = await response.json();
    assert.equal(data.method, "POST");
    assert.equal(data.url, "/api/auth/profile?test=1");
    assert.equal(data.body, body.toString("base64"));
    assert.equal(data.headers.authorization, "Bearer test-token");
    assert.equal(data.headers.host, new URL(base).host, "Avatar URLs should use the device-accessible Metro host");
    assert.equal(data.headers.origin, undefined);
    assert.equal(data.headers.referer, undefined);
    assert.equal(data.headers.cookie, undefined);
    assert.equal(await (await fetch(`${base}/entry.bundle`)).text(), "Metro bundle");
    const storage = await (await fetch(`${base}/storage/avatars/test.jpg`)).json();
    assert.equal(storage.url, "/storage/avatars/test.jpg");
  } finally { await close(metro); await close(upstream); }
});

test("a stopped Laravel server produces a clear JSON response instead of a hanging request", async () => {
  const stopped = createServer();
  const destination = await listen(stopped);
  await close(stopped);
  const proxy = createApiProxy(destination);
  const metro = createServer((req, res) => proxy(req, res, () => res.end("Metro")));
  const base = await listen(metro);
  try {
    const response = await fetch(`${base}/api/auth/login`, { method: "POST" });
    assert.equal(response.status, 502);
    assert.match((await response.json()).message, /Laravel is unavailable/);
  } finally { await close(metro); }
});
