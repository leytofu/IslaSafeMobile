import { test } from "node:test";
import assert from "node:assert/strict";
import { canEnterDashboard, dashboardFor, restoreSession, signOutSession } from "../src/lib/session";
import type { User } from "../src/lib/contracts";

const resident: User = { id: 1, name: "Session test", email: "session@example.test", role: "residents" };

function harness(validate: () => Promise<User>, token: string | null = "test-token") {
  const activated: (string | null)[] = [];
  let clears = 0;
  let validations = 0;
  const unauthorized = new Error("Unauthorized");
  const ports = {
    readToken: async () => token,
    activate: (value: string | null) => { activated.push(value); },
    validate: async () => { validations++; return validate(); },
    clear: async () => { clears++; },
    invalid: (error: unknown) => error === unauthorized,
  };
  return { ports, activated, unauthorized, counts: () => ({ clears, validations }) };
}

test("a fresh install does not make a protected authentication request", async () => {
  const session = harness(async () => resident, null);
  assert.deepEqual(await restoreSession(session.ports), { status: "signed-out", user: null });
  assert.deepEqual(session.counts(), { clears: 0, validations: 0 });
  assert.deepEqual(session.activated, []);
});

test("restoration waits for backend verification before making an account available", async () => {
  let finish!: (user: User) => void;
  const request = new Promise<User>((resolve) => { finish = resolve; });
  const session = harness(() => request);
  let settled = false;
  const restoring = restoreSession(session.ports).then((result) => { settled = true; return result; });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(settled, false);
  assert.equal(canEnterDashboard(resident, false), false);
  finish(resident);
  assert.deepEqual(await restoring, { status: "verified", user: resident });
  assert.deepEqual(session.activated, ["test-token"]);
});

test("verified residents and managers route to their own dashboards", async () => {
  for (const role of ["residents", "campmanager"] as const) {
    const user = { ...resident, role };
    const session = harness(async () => user);
    const result = await restoreSession(session.ports);
    assert.equal(result.status, "verified");
    assert.equal(canEnterDashboard(result.user, true), true);
    assert.equal(dashboardFor(role), role === "residents" ? "/resident/home" : "/camp/overview");
  }
});

test("expired tokens are deactivated and securely cleared", async () => {
  const session = harness(async () => { throw session.unauthorized; });
  assert.deepEqual(await restoreSession(session.ports), { status: "expired", user: null });
  assert.deepEqual(session.activated, ["test-token", null]);
  assert.equal(session.counts().clears, 1);
});

test("unsupported backend roles never unlock mobile and their tokens are cleared", async () => {
  const session = harness(async () => ({ ...resident, role: "admin" } as unknown as User));
  assert.deepEqual(await restoreSession(session.ports), { status: "expired", user: null });
  assert.equal(session.counts().clears, 1);
  assert.equal(canEnterDashboard({ ...resident, role: "admin" } as unknown as User, true), false);
});

test("offline and server failures retain credentials but never expose a cached dashboard", async () => {
  for (const message of ["Network offline", "Verification timed out", "Server 503"]) {
    const session = harness(async () => { throw new Error(message); });
    const result = await restoreSession(session.ports);
    assert.deepEqual(result, { status: "unavailable", user: null });
    assert.equal(canEnterDashboard(result.user, false), false);
    assert.equal(session.counts().clears, 0);
    assert.deepEqual(session.activated, ["test-token"]);
  }
});

test("secure-storage failures do not silently report a successful restore or cleanup", async () => {
  const session = harness(async () => { throw session.unauthorized; });
  session.ports.clear = async () => { throw new Error("Secure delete failed"); };
  await assert.rejects(restoreSession(session.ports), /Secure delete failed/);
  session.ports.readToken = async () => { throw new Error("Secure read failed"); };
  await assert.rejects(restoreSession(session.ports), /Secure read failed/);
  const unsupported = harness(async () => ({ ...resident, role: "admin" } as unknown as User));
  unsupported.ports.clear = async () => { throw new Error("Unsupported token delete failed"); };
  await assert.rejects(restoreSession(unsupported.ports), /Unsupported token delete failed/);
});

test("logout clears local credentials and queues the cinematic replay without waiting on revocation", async () => {
  const events: string[] = [];
  let rejectRevoke!: (error: Error) => void;
  const revoke = new Promise<void>((_, reject) => { rejectRevoke = reject; });
  await signOutSession({
    readToken: async () => "logout-token",
    invalidate: () => { events.push("invalidate"); },
    clearToken: async () => { events.push("clear-token"); },
    clearAccount: async () => { events.push("clear-account"); },
    queueIntro: async () => { events.push("queue-intro"); },
    complete: () => { events.push("show-onboarding"); },
    revoke: (token) => { assert.equal(token, "logout-token"); events.push("revoke"); return revoke; },
    revokeFailed: () => { events.push("revocation-unavailable"); },
  });
  assert.deepEqual(events, ["invalidate", "clear-token", "clear-account", "queue-intro", "show-onboarding", "revoke"]);
  rejectRevoke(new Error("Offline"));
  await Promise.resolve();
  assert.equal(events.at(-1), "revocation-unavailable");
});

test("logout never reports completion when secure credential deletion fails", async () => {
  let completed = false;
  let revoked = false;
  await assert.rejects(signOutSession({
    readToken: async () => "logout-token",
    invalidate: () => {},
    clearToken: async () => { throw new Error("Cannot clear secure token"); },
    clearAccount: async () => {},
    queueIntro: async () => {},
    complete: () => { completed = true; },
    revoke: async () => { revoked = true; },
    revokeFailed: () => {},
  }), /Cannot clear secure token/);
  assert.equal(completed, false);
  assert.equal(revoked, false);
});
