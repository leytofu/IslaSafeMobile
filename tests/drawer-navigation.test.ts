import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { residentDestinations, campDestinations, drawerTarget } from "../src/lib/navigation";

// Exercise the installed SDK's actual routers so history and Android Back
// semantics remain covered when its navigation implementation changes.
const require = createRequire(import.meta.url);
const { DrawerRouter, DrawerActions } = require("expo-router/build/react-navigation/routers/DrawerRouter");
const { TabRouter } = require("expo-router/build/react-navigation/routers/TabRouter");
const { StackRouter } = require("expo-router/build/react-navigation/routers/StackRouter");
function options(routeNames: string[]) {
  return { routeNames, routeParamList: {}, routeGetIdList: {} };
}

test("repeated drawer section changes reuse routes and deduplicate visit history", () => {
  const router = DrawerRouter({ backBehavior: "history" });
  const config = options(["resident", "camp", "guides", "hazards"]);
  let state = router.getInitialState(config);
  const keys = state.routes.map((route: { key: string }) => route.key);
  for (const name of ["guides", "resident", "hazards", "resident", "guides", "guides", "resident"]) {
    state = router.getStateForAction(state, { type: "NAVIGATE", payload: { name } }, config);
    assert.deepEqual(state.routes.map((route: { key: string }) => route.key), keys);
    assert.equal(new Set(state.history.map((entry: { key: string }) => entry.key)).size, state.history.length);
  }
  state = router.getStateForAction(state, DrawerActions.openDrawer(), config);
  assert(state.history.some((entry: { type: string }) => entry.type === "drawer"));
  const current = state.index;
  state = router.getStateForAction(state, { type: "GO_BACK" }, config);
  assert.equal(state.index, current, "First Android Back closes the drawer");
  assert(!state.history.some((entry: { type: string }) => entry.type === "drawer"));
  state = router.getStateForAction(state, { type: "GO_BACK" }, config);
  assert.equal(state.routes[state.index].name, "guides", "Next Back returns to the previous main section");
});

test("resident and camp tab histories never grow duplicate screen instances", () => {
  for (const names of [["home", "map", "sos", "alerts", "profile"], ["overview", "center", "evacuees", "alerts", "profile"]]) {
    const router = TabRouter({ backBehavior: "history" });
    const config = options(names);
    let state = router.getInitialState(config);
    for (let cycle = 0; cycle < 5; cycle++) for (const name of names) {
      state = router.getStateForAction(state, { type: "NAVIGATE", payload: { name } }, config);
      assert.equal(state.routes.length, names.length);
      assert(state.history.length <= names.length);
    }
  }
});

test("camp registration stays on its detail stack and Back returns to its parent", () => {
  const router = StackRouter({ initialRouteName: "(sections)" });
  const config = options(["(sections)", "register"]);
  let state = router.getInitialState(config);
  state = router.getStateForAction(state, { type: "PUSH", payload: { name: "register" } }, config);
  assert.equal(state.routes[state.index].name, "register");
  state = router.getStateForAction(state, { type: "GO_BACK" }, config);
  assert.equal(state.routes[state.index].name, "(sections)");
});

test("menu targets use the actual nested navigators and NAVIGATE closes the drawer", () => {
  assert.deepEqual(drawerTarget("/resident/map"), { name: "resident", params: { screen: "map" } });
  assert.deepEqual(drawerTarget("/camp/evacuees"), { name: "camp", params: { screen: "(sections)", params: { screen: "evacuees" } } });
  assert.deepEqual(drawerTarget("/guides"), { name: "guides", params: undefined });
  const router = DrawerRouter({ backBehavior: "history" });
  const config = options(["resident", "camp", "guides", "hazards"]);
  let state = router.getInitialState(config);
  state = router.getStateForAction(state, DrawerActions.openDrawer(), config);
  const target = drawerTarget("/resident/map");
  state = router.getStateForAction(state, { type: "NAVIGATE", payload: target }, config);
  assert(!state.history.some((entry: { type: string }) => entry.type === "drawer"));
  assert.equal(state.routes[state.index].params.screen, "map");
});


test("menus retire household and offline maps while retaining settings", () => {
  for (const destinations of [residentDestinations, campDestinations]) {
    assert(!destinations.some(item => ["household", "hazards"].includes(item.key)));
    assert(!destinations.some(item => item.href === "/hazards"));
    assert(destinations.some(item => item.title === "Settings"));
  }
});
