import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveApiBaseUrl } from "../src/lib/api-address";

test("phone, emulator and custom Metro ports share the host serving the app", () => {
  for (const [host, expected] of [
    ["192.168.0.104:8081", "http://192.168.0.104:8081/api"],
    ["127.0.0.1:8081", "http://127.0.0.1:8081/api"],
    ["10.0.2.2:8083", "http://10.0.2.2:8083/api"],
    ["http://127.0.0.1:8081/entry.bundle?platform=android", "http://127.0.0.1:8081/api"],
    ["exp://192.168.0.104:8081", "http://192.168.0.104:8081/api"],
    ["https://example.expo.direct", "https://example.expo.direct/api"],
  ]) assert.equal(resolveApiBaseUrl("", host), expected);
});

test("an explicit hosted API takes precedence and does not inherit Metro's port", () => {
  assert.equal(resolveApiBaseUrl(" https://api.example.test/api/ ", "127.0.0.1:8081"), "https://api.example.test/api");
  assert.equal(resolveApiBaseUrl(undefined, undefined), "http://10.0.2.2:8000/api");
});
