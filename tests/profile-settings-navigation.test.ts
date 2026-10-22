import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

type Element = { type: string; props: Record<string, unknown> };
function harness(path: string, params: { edit?: string } = {}) {
  const slots: { value: unknown }[] = [];
  let cursor = 0;
  let focus: (() => void)[] = [];
  const routes: unknown[] = [];
  const exports: Record<string, () => Element> = {};
  const user = { id: 1, name: "Resident", email: "resident@example.test", role: "residents", barangay: "Aguining" };
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(code, { exports, require(id: string) {
    if (id === "react") return {
      useCallback: (callback: unknown) => callback,
      useState(value: unknown) { const i = cursor++; slots[i] ??= { value }; return [slots[i].value, (next: unknown) => { slots[i].value = next; }]; },
      useRef: (current: unknown) => ({ current }),
    };
    if (id === "react/jsx-runtime") return { jsx: (type: string, props: unknown) => ({ type, props }), jsxs: (type: string, props: unknown) => ({ type, props }), Fragment: "Fragment" };
    if (id === "expo-router") return { router: { navigate: (route: unknown) => routes.push(route), setParams: (next: unknown) => Object.assign(params, next) }, useLocalSearchParams: () => params, useFocusEffect: (callback: () => void) => focus.push(callback) };
    if (id === "react-native") return { ScrollView: "ScrollView", View: "View", Text: "Text", Pressable: "Pressable", StyleSheet: { create: (styles: unknown) => styles }, Platform: { OS: "android" } };
    if (id === "../state/AppState") return { useApp: () => ({ user, theme: "light", verified: true }) };
    if (id === "../theme/colors") return { dashboardPalettes: { light: {} } };
    if (id === "../hooks/useAdvisoryInbox") return { useAdvisoryInbox: () => ({ unread: 0 }) };
    if (id.endsWith("/ui")) return Object.fromEntries(["Screen", "Button", "Card", "Choices", "Copy", "Dialog", "Field", "Notice"].map(name => [name, name]));
    return new Proxy({}, { get: (_target, name) => String(name) });
  } });
  return { params, routes, render() { cursor = 0; focus = []; return Object.values(exports)[0](); }, commit() { focus.forEach(callback => callback()); } };
}
function find(tree: unknown, type: string): Element | undefined {
  if (Array.isArray(tree)) return tree.map(child => find(child, type)).find(Boolean);
  if (!tree || typeof tree !== "object" || !("props" in tree)) return;
  const element = tree as Element;
  return element.type === type ? element : find(element.props.children, type);
}

test("Settings consumes each edit request and Back returns to Settings without reopening the editor", () => {
  const app = harness("../src/screens/ProfileScreen.tsx", { edit: "1" });
  app.render(); app.commit();
  let screen = app.render();
  assert(find(screen, "ProfilePhotoEditor")); assert(find(screen, "Field"));
  assert.equal(app.params.edit, "0");
  (screen.props.onBack as () => void)();
  screen = app.render(); app.commit();
  assert(find(screen, "ReferenceSettings")); assert.equal(find(screen, "ProfilePhotoEditor"), undefined);
  app.params.edit = "1"; app.render(); app.commit();
  assert(find(app.render(), "ProfilePhotoEditor"), "Revisiting the mounted Settings tab must open editing again");
});
