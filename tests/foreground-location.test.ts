import { test } from "node:test";
import assert from "node:assert/strict";
import type { LocationObject, LocationPermissionResponse, LocationSubscription } from "expo-location";
import { createForegroundLocation, type DeviceLocationState } from "../src/lib/foreground-location";

function position(latitude = 10.109, longitude = 124.562): LocationObject {
  return { coords: { latitude, longitude, accuracy: 12, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() };
}
function fixture() {
  const states: DeviceLocationState[] = [];
  const prompts: boolean[] = [];
  let allowed = true; let enabled = true; let acceptServices = true;
  let servicesPrompts = 0; let watches = 0; let removed = 0;
  let next: (position: LocationObject) => void = () => {};
  let fail: (reason: string) => void = () => {};
  const controller = createForegroundLocation({
    permission: async prompt => { prompts.push(prompt); return { granted: allowed } as LocationPermissionResponse; },
    servicesEnabled: async () => enabled,
    enableServices: async () => { servicesPrompts++; enabled = acceptServices; },
    watch: async (callback, error) => { watches++; next = callback; fail = error; return { remove: () => { removed++; } }; },
    publish: state => states.push(state),
  });
  return {
    controller, states, prompts, next: (value: LocationObject) => next(value), fail: (reason: string) => fail(reason),
    setPermission: (value: boolean) => { allowed = value; }, setServices: (value: boolean, accept = true) => { enabled = value; acceptServices = accept; },
    watches: () => watches, removed: () => removed, servicePrompts: () => servicesPrompts,
    state: () => states.at(-1)!,
  };
}

test("startup approval automatically obtains and updates the current GIS position", async () => {
  const app = fixture();
  try {
    await app.controller.start(true);
    assert.deepEqual(app.prompts, [true]);
    assert.equal(app.watches(), 1);
    assert.equal(app.state().status, "locating");
    app.next(position());
    assert.equal(app.state().status, "ready");
    assert.equal(app.state().position?.coords.latitude, 10.109);
    app.next(position(10.12, 124.57));
    assert.equal(app.state().position?.coords.longitude, 124.57);
  } finally { app.controller.dispose(); }
});

test("disabled Android services prompt once and approval automatically starts GIS", async () => {
  const app = fixture(); app.setServices(false);
  try {
    await app.controller.start(true);
    assert.equal(app.servicePrompts(), 1);
    assert.equal(app.watches(), 1);
    app.next(position());
    assert.equal(app.state().status, "ready");
  } finally { app.controller.dispose(); }
});

test("declined permission or services never starts GPS or repeatedly prompts on resume", async () => {
  const app = fixture(); app.setPermission(false);
  try {
    await app.controller.start(true);
    assert.equal(app.state().status, "denied");
    assert.equal(app.watches(), 0);
    assert.equal(app.servicePrompts(), 0);
    await app.controller.start(false);
    assert.deepEqual(app.prompts, [true, false]);
    app.setPermission(true); app.setServices(false, false);
    await app.controller.start(true);
    assert.equal(app.state().status, "disabled");
    await app.controller.start(false);
    assert.equal(app.servicePrompts(), 1);
    assert.equal(app.watches(), 0);
    app.setServices(true);
    await app.controller.start(false);
    assert.equal(app.watches(), 1);
  } finally { app.controller.dispose(); }
});

test("backgrounding stops GPS, discards late updates and resumes with a fresh fix", async () => {
  const app = fixture();
  try {
    await app.controller.start(true); app.next(position());
    app.controller.pause();
    assert.equal(app.removed(), 1);
    assert.equal(app.state().position, null);
    app.next(position(11, 125));
    assert.equal(app.state().status, "paused");
    await app.controller.start(false); app.next(position(10.2, 124.6));
    assert.equal(app.state().status, "ready");
    assert.equal(app.state().position?.coords.latitude, 10.2);
  } finally { app.controller.dispose(); }
});

test("a watch that registers after cleanup is removed immediately without publishing", async () => {
  let resolveWatch: (subscription: LocationSubscription) => void = () => {};
  let started: () => void = () => {};
  const ready = new Promise<void>(resolve => { started = resolve; });
  const states: DeviceLocationState[] = [];
  let removed = false;
  const app = createForegroundLocation({
    permission: async () => ({ granted: true }) as LocationPermissionResponse,
    servicesEnabled: async () => true, enableServices: async () => {},
    watch: async () => { started(); return new Promise(resolve => { resolveWatch = resolve; }); },
    publish: state => states.push(state),
  });
  const pending = app.start(true); await ready;
  app.dispose(); const count = states.length;
  resolveWatch({ remove: () => { removed = true; } }); await pending;
  assert.equal(removed, true); assert.equal(states.length, count);
});

test("invalid fixes are ignored and a provider error can recover on the next valid fix", async () => {
  const app = fixture();
  try {
    await app.controller.start(true);
    for (const pair of [[NaN, 124], [91, 124], [10, Infinity], [10, 181]]) app.next(position(...pair));
    assert.equal(app.state().position, null);
    app.fail("GPS disabled"); assert.equal(app.state().status, "error");
    app.next(position()); assert.equal(app.state().status, "ready"); assert.equal(app.state().error, "");
  } finally { app.controller.dispose(); }
});

test("returning from the system location dialog waits for approval without opening a second dialog", async () => {
  let enabled = false; let prompts = 0; let watches = 0;
  let accept: () => void = () => {};
  let opened: () => void = () => {};
  const dialog = new Promise<void>(resolve => { accept = () => { enabled = true; resolve(); }; });
  const opening = new Promise<void>(resolve => { opened = resolve; });
  const app = createForegroundLocation({
    permission: async () => ({ granted: true }) as LocationPermissionResponse,
    servicesEnabled: async () => enabled,
    enableServices: async () => { prompts++; opened(); await dialog; },
    watch: async () => { watches++; return { remove: () => {} }; }, publish: () => {},
  });
  try {
    const first = app.start(true); await opening;
    app.pause(); const resumed = app.start(false);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(prompts, 1); assert.equal(watches, 0);
    accept(); await Promise.all([first, resumed]);
    assert.equal(prompts, 1); assert.equal(watches, 1);
  } finally { app.dispose(); }
});
