import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

type Surface = {
  mode: string; registrationStep: number; busy: boolean; error: string;
  name: { value: string; onChangeText(value: string): void };
  email: { value: string; onChangeText(value: string): void };
  password: { value: string; onChangeText(value: string): void };
  confirmation: { value: string; onChangeText(value: string): void };
  onModeChange(mode: string): void; onSubmit(): void; onBack(): void;
  onRememberMeChange(value: boolean): void;
};
const compiled = ts.transpileModule(readFileSync(new URL("../src/app/auth.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
function screen(authenticate: (...args: unknown[]) => Promise<void> = async () => {}) {
  const slots: unknown[] = []; let cursor = 0;
  const exports: { default?: () => { props: Surface } } = {};
  runInNewContext(compiled, { exports, require(id: string) {
    if (id === "react") return {
      useState(initial: unknown) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], (value: unknown) => { slots[index] = value; }]; },
      useRef(initial: unknown) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    };
    if (id === "react/jsx-runtime") return { jsx: (type: unknown, props: unknown) => ({ type, props }) };
    if (id === "react-native") return { Keyboard: { dismiss() {} } };
    if (id === "expo-router") return { Redirect: "Redirect", useLocalSearchParams: () => ({ role: "residents" }), router: { replace() {} } };
    if (id === "axios") return { isAxiosError: (error: { isAxiosError?: boolean }) => error?.isAxiosError === true };
    if (id === "../lib/contracts") return { supportedRole: () => true };
    if (id === "../lib/session") return { dashboardFor: () => "/resident/home" };
    if (id === "../components/SessionLoading") return { SessionLoading: "Loading" };
    if (id === "../components/AuthSurface") return { AuthSurface: "Surface" };
    if (id === "../state/AppState") return { useApp: () => ({ ready: true, user: null, verified: false, introPending: false, authenticate }) };
    if (id === "../lib/api") return { errorMessage: (error: Error) => error.message };
    throw new Error(`Unexpected auth dependency: ${id}`);
  } });
  function render() { cursor = 0; return exports.default!().props; }
  async function next() { render().onSubmit(); await tick(); return render(); }
  async function passwordStage() {
    render().onModeChange("register");
    render().name.onChangeText("Test Resident"); await next();
    render().email.onChangeText("resident@example.test"); await next();
    assert.equal(render().registrationStep, 2);
  }
  return { render, next, passwordStage };
}

test("registration validates name, email and matching passwords without calling the API early", async () => {
  let calls = 0; const app = screen(async () => { calls++; });
  app.render().onModeChange("register");
  assert.match((await app.next()).error, /full name/);
  app.render().name.onChangeText("Test Resident"); await app.next();
  app.render().email.onChangeText("invalid");
  assert.equal((await app.next()).registrationStep, 1);
  app.render().email.onChangeText("resident@example.test"); await app.next();
  app.render().password.onChangeText("password123"); app.render().confirmation.onChangeText("different");
  assert.match((await app.next()).error, /match/); assert.equal(calls, 0);
});

test("final password action submits directly and blocks duplicate taps during and after success", async () => {
  let resolve: () => void = () => {}; const pending = new Promise<void>(done => { resolve = done; });
  const calls: unknown[][] = []; const app = screen(async (...args) => { calls.push(args); await pending; });
  await app.passwordStage();
  app.render().password.onChangeText("password123"); app.render().confirmation.onChangeText("password123");
  const staleSubmit = app.render().onSubmit;
  staleSubmit(); staleSubmit();
  assert.equal(app.render().busy, true); assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "/auth/register");
  assert.equal(app.render().registrationStep, 2, "There is no review stage");
  resolve(); await tick(); staleSubmit(); await tick(); assert.equal(calls.length, 1);
});

test("failed registration preserves every input and allows one explicit retry", async () => {
  const calls: unknown[][] = []; const app = screen(async (...args) => { calls.push(args); if (calls.length === 1) throw new Error("Server unavailable"); });
  await app.passwordStage(); app.render().password.onChangeText("password123"); app.render().confirmation.onChangeText("password123");
  const failed = await app.next();
  assert.equal(failed.error, "Server unavailable"); assert.equal(failed.busy, false);
  assert.equal(failed.name.value, "Test Resident"); assert.equal(failed.email.value, "resident@example.test");
  assert.equal(failed.password.value, "password123"); assert.equal(failed.confirmation.value, "password123");
  await app.next(); assert.equal(calls.length, 2); assert.deepEqual(calls[0], calls[1]);
});

test("server field errors return to the invalid stage while preserving password details", async () => {
  const app = screen(async () => { throw { isAxiosError: true, message: "Email is already registered", response: { status: 422, data: { errors: { email: ["Already registered"] } } } }; });
  await app.passwordStage(); app.render().password.onChangeText("password123"); app.render().confirmation.onChangeText("password123");
  const failed = await app.next(); assert.equal(failed.registrationStep, 1); assert.equal(failed.password.value, "password123");
  assert.equal("onRegistrationStepChange" in failed, false);
});

test("password-stage back goes to sign in instead of editing completed stages", async () => {
  const app = screen(); await app.passwordStage(); app.render().onBack(); assert.equal(app.render().mode, "login");
});

test("login passes Remember Me preference to existing authentication", async () => {
  const calls: unknown[][] = []; const app = screen(async (...args) => { calls.push(args); });
  app.render().email.onChangeText("resident@example.test"); app.render().password.onChangeText("password123"); app.render().onRememberMeChange(false);
  await app.next(); assert.equal(calls[0][0], "/auth/login"); assert.equal(calls[0][3], false);
});
