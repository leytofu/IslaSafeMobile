import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { campDestinations, residentDestinations, drawerTarget } from "../src/lib/navigation";

type Element = { type: string; props: Record<string, unknown> };
const compile = (path: string) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
function find(tree: unknown, label: string): Element | undefined {
  if (Array.isArray(tree)) return tree.map(child => find(child, label)).find(Boolean);
  if (!tree || typeof tree !== "object" || !("props" in tree)) return;
  const element = tree as Element;
  return element.props.accessibilityLabel === label ? element : find(element.props.children, label);
}

test("sidebar groups real destinations and account access in both themes and roles", () => {
  for (const theme of ["light", "dark"]) for (const role of ["residents", "campmanager"]) {
    const actions: unknown[] = [];
    const exports: { AppDrawerContent?: (props: unknown) => Element } = {};
    runInNewContext(compile("../src/components/AppDrawer.tsx"), { exports, require(id: string) {
      if (id === "react") return { useState: (value: unknown) => [value, () => {}], useRef: (current: unknown) => ({ current }) };
      if (id === "react/jsx-runtime") return { jsx: (type: string, props: unknown) => ({ type, props }), jsxs: (type: string, props: unknown) => ({ type, props }), Fragment: "Fragment" };
      if (id === "react-native") return { Image: "Image", View: "View", Text: "Text", Pressable: "Pressable", StyleSheet: { create: (value: unknown) => value } };
      if (id === "expo-router") return { usePathname: () => role === "residents" ? "/resident/home" : "/camp/overview" };
      if (id === "expo-router/drawer") return { DrawerContentScrollView: "DrawerScroll" };
      if (id === "../state/AppState") return { useApp: () => ({ theme, verified: true, user: { role, name: "Resident", email: "user@example.test" } }) };
      if (id === "../lib/navigation") return { residentDestinations, campDestinations, drawerTarget };
      return new Proxy({}, { get: (_target, key) => String(key) });
    } });
    const tree = exports.AppDrawerContent!({ navigation: { navigate: (...args: unknown[]) => actions.push(args), closeDrawer() {} } });
    const snapshot = JSON.stringify(tree);
    assert(snapshot.includes("WORKSPACE") && snapshot.includes("ACCOUNT"));
    assert(!snapshot.includes("My Household") && !snapshot.includes("Offline Hazard Maps"));
    const selected = find(tree, role === "residents" ? "Dashboard" : "Camp dashboard")!;
    assert.equal((selected.props.accessibilityState as { selected: boolean }).selected, true);
    assert(find(tree, "About ISLA Safe") && find(tree, "Sign out"));
    (find(tree, "Open account settings")!.props.onPress as () => void)();
    assert.deepEqual(JSON.parse(JSON.stringify(actions)), role === "residents" ? [["resident", { screen: "profile" }]] : [["camp", { screen: "(sections)", params: { screen: "profile" } }]]);
  }
});

test("header bell reuses the provider inbox and opens unread notifications", () => {
  const exports: { NotificationProvider?: (props: unknown) => Element; NotificationBell?: () => Element } = {};
  const slots: unknown[] = []; let cursor = 0; let inboxCalls = 0; let refreshes = 0;
  const context = { value: null as unknown, Provider: "Provider" };
  runInNewContext(compile("../src/components/NotificationCenter.tsx"), { exports, require(id: string) {
    if (id === "react") return { createContext: () => context, useContext: () => context.value, useMemo: (create: () => unknown) => create(), useCallback: (callback: unknown) => callback, useState(value: unknown) { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], (next: unknown) => { slots[i] = next; }]; } };
    if (id === "react/jsx-runtime") { const jsx = (type: string, props: Record<string, unknown>) => { if (type === "Provider") context.value = props.value; return { type, props }; }; return { jsx, jsxs: jsx }; }
    if (id === "react-native") return { Pressable: "Pressable", ScrollView: "ScrollView", Text: "Text", View: "View", StyleSheet: { create: (value: unknown) => value } };
    if (id === "../state/AppState") return { useApp: () => ({ theme: "light", user: { id: 1 }, verified: true }) };
    if (id === "../theme/colors") return { dashboardPalettes: { light: {} } };
    if (id === "../hooks/useAdvisoryInbox") return { useAdvisoryInbox: () => { inboxCalls++; return { unread: 3, refresh: () => { refreshes++; } }; } };
    return new Proxy({}, { get: (_target, key) => String(key) });
  } });
  exports.NotificationProvider!({ children: "screens" });
  const bell = exports.NotificationBell!();
  assert.equal(inboxCalls, 1, "Rendering a bell must not start another polling hook");
  assert.equal(bell.props.accessibilityHint, "3 unread advisories");
  (bell.props.onPress as () => void)(); assert.equal(refreshes, 1);
  cursor = 0;
  const tree = exports.NotificationProvider!({ children: "screens" });
  assert(JSON.stringify(tree).includes("Notifications & advisories"));
  assert(JSON.stringify(tree).includes('"unreadOnly":true'));
});
