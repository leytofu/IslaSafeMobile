import { test } from "node:test";
import assert from "node:assert/strict";
import { createTokenStore } from "../src/lib/tokenStore";

function device(initial: string | null = null) {
  let saved = initial;
  const storage = {
    read: async () => saved,
    write: async (token: string) => { saved = token; },
    remove: async () => { saved = null; },
  };
  return { storage, launch: () => createTokenStore(storage) };
}

test("remembered token survives a new app process and logout removes it", async () => {
  const phone = device();
  await phone.launch().saveToken("remembered-token", true);
  const reopened = phone.launch();
  assert.equal(await reopened.readToken(), "remembered-token");
  await reopened.clearToken();
  assert.equal(await reopened.readToken(), null);
  assert.equal(await phone.launch().readToken(), null);
});

test("login persists its Sanctum token across app restarts by default", async () => {
  const phone = device();
  await phone.launch().saveToken("sanctum-token");
  assert.equal(await phone.launch().readToken(), "sanctum-token");
});

test("unchecked login clears an older remembered token and lasts only in memory", async () => {
  const phone = device("previous-token");
  const running = phone.launch();
  await running.saveToken("current-token", false);
  assert.equal(await running.readToken(), "current-token", "logout and API calls can still obtain the current token");
  assert.equal(await phone.launch().readToken(), null);
  await running.clearToken();
  assert.equal(await running.readToken(), null);
});

test("failed secure cleanup cannot activate an unchecked session", async () => {
  const phone = device();
  const running = createTokenStore({ ...phone.storage, remove: async () => { throw new Error("Storage unavailable"); } });
  await assert.rejects(running.saveToken("must-not-activate", false), /Storage unavailable/);
  assert.equal(await running.readToken(), null);
});

test("failed logout cleanup reports failure and retains the current token for retry", async () => {
  const phone = device();
  const running = createTokenStore({ ...phone.storage, remove: async () => { throw new Error("Storage unavailable"); } });
  await running.saveToken("active-token", true);
  await assert.rejects(running.clearToken(), /Storage unavailable/);
  assert.equal(await running.readToken(), "active-token");
});
