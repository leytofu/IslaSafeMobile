import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Run the real root layout against a controlled native splash: location and
// animated onboarding must not mount behind Android's blocked pre-draw gate.
function boot() {
  const code = ts.transpileModule(readFileSync(new URL("../src/app/_layout.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  let released = false; let hides = 0;
  let resolve: () => void = () => {};
  const hidden = new Promise<void>(done => { resolve = done; });
  const effects: (() => (() => void))[] = [];
  const exports: { default?: () => { type: unknown; props: unknown } } = {};
  runInNewContext(code, { exports, require(name: string) {
    if (name === "react") return { useState: () => [released, (value: boolean) => { released = value; }], useEffect: (effect: () => () => void) => effects.push(effect) };
    if (name === "react/jsx-runtime") return { jsx: (type: unknown, props: unknown) => ({ type, props }), jsxs: (type: unknown, props: unknown) => ({ type, props }) };
    if (name === "expo-splash-screen") return { hideAsync: () => { hides++; return hidden; } };
    if (name === "react-native") return { View: "View", StyleSheet: { create: (styles: unknown) => styles } };
    if (name === "react-native-screens") return { enableScreens: () => {} };
    if (name === "react-native-safe-area-context") return { SafeAreaProvider: "SafeAreaProvider" };
    if (name === "expo-router") return { Slot: "Slot" };
    if (name === "expo-status-bar") return { StatusBar: "StatusBar" };
    if (name === "../state/AppState") return { AppProvider: "AppProvider" };
    if (name === "../state/DeviceLocation") return { DeviceLocationProvider: "DeviceLocationProvider" };
    throw new Error(`Unexpected startup import: ${name}`);
  } });
  return { render: exports.default!, commit: () => effects.shift()!(), resolve, hides: () => hides };
}

test("startup dismisses the native splash before mounting auth, GPS and onboarding", async () => {
  const app = boot();
  const initial = app.render();
  assert.equal(initial.type, "View");
  assert(!JSON.stringify(initial).includes("DeviceLocationProvider"));
  assert.equal(app.hides(), 0);
  app.commit();
  assert.equal(app.hides(), 1);
  app.resolve(); await Promise.resolve();
  const ready = app.render();
  assert.equal(ready.type, "SafeAreaProvider");
  assert(JSON.stringify(ready).includes("DeviceLocationProvider"));
});

test("a discarded startup cannot mount the app after its splash promise resolves", async () => {
  const app = boot(); app.render(); const cleanup = app.commit();
  cleanup(); app.resolve(); await Promise.resolve();
  assert.equal(app.render().type, "View");
});
