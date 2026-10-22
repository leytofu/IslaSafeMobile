import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import type { DeviceLocationState } from "../src/lib/foreground-location";

const code = ts.transpileModule(readFileSync(new URL("../src/hooks/useMapLocation.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const fix = (age = 0) => ({ coords: { latitude: 10.12, longitude: 124.57, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() - age });
function fixture(initial: DeviceLocationState) {
  let state = initial;
  const slots: { current?: unknown; value?: unknown; deps?: unknown[] }[] = [];
  let index = 0;
  let effects: (() => void)[] = [];
  let refreshes = 0;
  const moves: number[][] = [];
  const exports: { useMapLocation?: (ready: boolean, locate: (lat: number, lng: number) => void) => { recenter: () => Promise<void>; busy: boolean } } = {};
  runInNewContext(code, { exports, Date, require(id: string) {
    if (id === "react") return {
      useRef(current: unknown) { const i = index++; return slots[i] ??= { current }; },
      useState(value: unknown) { const i = index++; slots[i] ??= { value }; return [slots[i].value, (next: unknown) => { slots[i].value = next; }]; },
      useEffect(effect: () => void, deps: unknown[]) { const i = index++; if (!slots[i]?.deps || deps.some((d, j) => !Object.is(d, slots[i].deps![j]))) effects.push(effect); slots[i] = { deps }; },
    };
    if (id === "../state/DeviceLocation") return { useDeviceLocation: () => ({ ...state, refresh: async () => { refreshes++; }, openSettings() {} }) };
    throw new Error(id);
  } });
  return {
    set: (next: DeviceLocationState) => { state = next; }, moves, refreshes: () => refreshes,
    render(ready = true) { index = 0; effects = []; const result = exports.useMapLocation!(ready, (lat, lng) => moves.push([lat, lng])); effects.forEach(effect => effect()); return result; },
  };
}

test("current location reuses a recent GPS fix and later fixes do not hijack panning", () => {
  const app = fixture({ status: "ready", position: fix(), error: "" });
  app.render(); assert.equal(app.moves.length, 1);
  app.set({ status: "ready", position: fix(), error: "" });
  app.render().recenter(); assert.equal(app.moves.length, 2);
  assert.deepEqual(app.moves[1], [10.12, 124.57]); assert.equal(app.refreshes(), 0);
  app.set({ status: "ready", position: fix(), error: "" }); app.render();
  assert.equal(app.moves.length, 2);
});

test("stale GPS requests one refresh despite repeated taps and centers on the new fix", () => {
  const app = fixture({ status: "ready", position: fix(60000), error: "" });
  const control = app.render(); control.recenter(); control.recenter();
  assert.equal(app.refreshes(), 1);
  app.set({ status: "locating", position: null, error: "" });
  const waiting = app.render(); assert(waiting.busy); waiting.recenter();
  assert.equal(app.refreshes(), 1);
  app.set({ status: "ready", position: fix(), error: "" }); app.render();
  assert.equal(app.moves.length, 2);
});

test("denied, disabled and failed GPS can recover without refresh loops", async () => {
  for (const status of ["denied", "disabled", "error"] as const) {
    const app = fixture({ status, position: null, error: "Location unavailable" });
    app.render(); assert.equal(app.refreshes(), 0);
    await app.render().recenter(); assert.equal(app.refreshes(), 1);
    // A rejected request may end in the same status after React batches updates.
    app.render(); await app.render().recenter(); assert.equal(app.refreshes(), 2);
    app.set({ status: "ready", position: fix(), error: "" }); app.render();
    assert.deepEqual(app.moves.at(-1), [10.12, 124.57]);
  }
});

test("map readiness gates GPS work and reloaded maps center once", () => {
  const app = fixture({ status: "ready", position: fix(), error: "" });
  app.render(false).recenter(); assert.equal(app.refreshes(), 0); assert.equal(app.moves.length, 0);
  app.render(); app.render(false); app.render(); assert.equal(app.moves.length, 2);
});
