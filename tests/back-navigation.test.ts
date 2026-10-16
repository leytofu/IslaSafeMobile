import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function button({ history = false, onPress, fallback = "/welcome", disabled = false }: { history?: boolean; onPress?: () => void; fallback?: string; disabled?: boolean } = {}) {
  const calls: string[] = [];
  const exports: { BackButton?: (props: unknown) => { props: { disabled: boolean; onPress: () => void } } } = {};
  const code = ts.transpileModule(readFileSync(new URL("../src/components/BackButton.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { exports, require(name: string) {
    if (name === "react/jsx-runtime") return { jsx: (type: unknown, props: unknown) => ({ type, props }), jsxs: (type: unknown, props: unknown) => ({ type, props }) };
    if (name === "react-native") return { Keyboard: { dismiss: () => calls.push("dismiss keyboard") }, Pressable: "Pressable", Text: "Text", StyleSheet: { create: (styles: unknown) => styles } };
    if (name === "@expo/vector-icons") return { Feather: "Feather" };
    if (name === "expo-router") return { router: { canGoBack: () => history, back: () => calls.push("back"), replace: (href: string) => calls.push(`replace ${href}`) } };
    if (name === "../theme/colors") return { palettes: { dark: {} } };
    throw new Error(`Unexpected navigation import: ${name}`);
  } });
  return { node: exports.BackButton!({ theme: "dark", onPress, fallback, disabled }), calls };
}

test("back dismisses the keyboard and returns through existing navigation history", () => {
  const app = button({ history: true });
  app.node.props.onPress();
  assert.deepEqual(app.calls, ["dismiss keyboard", "back"]);
});

test("a directly opened screen has a working guest, resident or manager fallback", () => {
  for (const fallback of ["/welcome", "/resident/home", "/camp/overview"]) {
    const app = button({ fallback }); app.node.props.onPress();
    assert.deepEqual(app.calls, ["dismiss keyboard", `replace ${fallback}`]);
  }
});

test("an inner SOS or settings step handles back without leaving its screen", () => {
  let steps = 0;
  const app = button({ history: true, onPress: () => steps++ });
  app.node.props.onPress();
  assert.equal(steps, 1);
  assert.deepEqual(app.calls, ["dismiss keyboard"]);
});

test("busy forms pass the disabled state to the native back control", () => {
  assert.equal(button({ disabled: true }).node.props.disabled, true);
});
