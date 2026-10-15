import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/location.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
type Permission = { granted: boolean; canAskAgain: boolean };
function load(current: Permission, request: () => Promise<Permission>) {
  let reads = 0;
  const exports: { requestLocationPermission?: () => Promise<Permission> } = {};
  runInNewContext(compiled, { exports, require: (name: string) => {
    assert.equal(name, "expo-location");
    return { getForegroundPermissionsAsync: async () => current, requestForegroundPermissionsAsync: request,
      getCurrentPositionAsync: () => { reads++; throw new Error("Startup must never read GPS"); } };
  } });
  return { request: exports.requestLocationPermission!, reads: () => reads };
}
test("startup requests permission without obtaining or sharing GPS coordinates", async () => {
  let prompts = 0;
  const permission = load({ granted: false, canAskAgain: true }, async () => { prompts++; return { granted: true, canAskAgain: true }; });
  const first = permission.request();
  assert.equal(first, permission.request(), "startup and Locate me share one in-flight prompt");
  assert.equal((await first).granted, true);
  assert.equal(prompts, 1);
  assert.equal(permission.reads(), 0);
});
test("already granted and permanently denied permissions do not prompt again", async () => {
  for (const current of [{ granted: true, canAskAgain: true }, { granted: false, canAskAgain: false }]) {
    const permission = load(current, async () => { throw new Error("Must not prompt"); });
    assert.equal((await permission.request()).granted, current.granted);
    assert.equal(permission.reads(), 0);
  }
});
test("denial is a normal result and a failed OS request can be retried later", async () => {
  let attempts = 0;
  const permission = load({ granted: false, canAskAgain: true }, async () => {
    if (++attempts === 1) throw new Error("OS request unavailable");
    return { granted: false, canAskAgain: true };
  });
  await assert.rejects(permission.request(), /OS request unavailable/);
  assert.equal((await permission.request()).granted, false);
  assert.equal(attempts, 2);
});
