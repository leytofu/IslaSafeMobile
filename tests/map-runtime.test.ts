import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("../src/components/MapDocumentView.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function load(available: boolean, expoGo: boolean, importFails = false) {
  let imports = 0;
  const native = () => null;
  type Element = { type: string | ((props: unknown, ref: unknown) => Element); props: Record<string, unknown> };
  const exports: { MapDocumentView?: (props: unknown, ref: unknown) => Element } = {};
  runInNewContext(code, { exports, require(id: string) {
    if (id === "react") return {
      forwardRef: (component: unknown) => component,
      useImperativeHandle: (ref: { current: unknown }, create: () => unknown) => { ref.current = create(); },
    };
    if (id === "react/jsx-runtime") return { jsx: (type: unknown, props: unknown) => ({ type, props }), jsxs: (type: unknown, props: unknown) => ({ type, props }) };
    if (id === "expo") return { isRunningInExpoGo: () => expoGo };
    if (id === "react-native") return { View: "View", Text: "Text", StyleSheet: { create: (styles: unknown) => styles }, TurboModuleRegistry: { get: () => available ? {} : null } };
    if (id === "./MapDocumentViewNative") {
      imports++;
      if (importFails) throw new Error("RNCWebViewModule could not be found");
      return { MapDocumentView: native };
    }
    throw new Error(`Unexpected import: ${id}`);
  } });
  return { render: exports.MapDocumentView!, native, imports: () => imports };
}

test("missing WebView never imports its enforcing entry and leaves routes usable in Go and development builds", () => {
  for (const expoGo of [true, false]) {
    const app = load(false, expoGo);
    const fallback = app.render({ html: "map" }, {});
    assert.equal(app.imports(), 0);
    assert.equal(typeof fallback.type, "function");
    const ref = { current: undefined as unknown };
    const screen = (fallback.type as (props: unknown, ref: unknown) => unknown)({}, ref);
    assert.match(JSON.stringify(screen), expoGo ? /Update Expo Go/ : /Rebuild and reinstall/);
    assert.doesNotThrow(() => {
      const handle = ref.current as { send: (command: unknown) => void; reload: () => void };
      handle.send({ type: "reload" }); handle.reload();
    });
  }
});

test("compatible WebView preserves the map HTML, bridge callbacks and ref", () => {
  const app = load(true, true);
  const props = { html: "interactive map", onMessage() {}, onError() {} };
  const ref = {};
  const result = app.render(props, ref);
  assert.equal(result.type, app.native);
  assert.equal(result.props.html, props.html);
  assert.equal(result.props.onMessage, props.onMessage);
  assert.equal(result.props.onError, props.onError);
  assert.equal(result.props.ref, ref);
});

test("a WebView import failure after a successful registry probe does not crash route loading", () => {
  const app = load(true, false, true);
  assert.doesNotThrow(() => app.render({}, {}));
  assert.notEqual(app.render({}, {}).type, app.native);
});
