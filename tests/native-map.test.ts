import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Evaluate the actual native entry point with a simulated native registry.
// Importing MapLibre itself when a module is absent reproduces the startup crash.
const source = readFileSync(new URL("../src/components/IslandMap.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function loadMap(modules: string[], expoGo = false, nativeEntryCrashes = false) {
  let nativeImports = 0;
  const nativeMap = () => null;
  const embeddedMap = () => null;
  const exports: { default?: (props: unknown) => { type: unknown; props: unknown } } = {};
  runInNewContext(compiled, {
    exports,
    require(name: string) {
      if (name === "expo") return { isRunningInExpoGo: () => expoGo };
      if (name === "react-native") return { TurboModuleRegistry: { get: (id: string) => modules.includes(id) ? {} : null } };
      if (name === "./EmbeddedIslandMap") return { default: embeddedMap };
      if (name === "react/jsx-runtime") return { jsx: (type: unknown, props: unknown) => ({ type, props }) };
      if (name === "./IslandMapNative") {
        nativeImports++;
        if (nativeEntryCrashes)
          throw new Error(
            "[Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'MLRNCameraModule' could not be found. Verify that a module by this name is registered in the native binary.]",
          );
        assert.ok(modules.includes("MLRNCameraModule"), "Missing native camera would crash MapLibre import");
        return { default: nativeMap };
      }
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return { render: exports.default!, nativeMap, embeddedMap, imports: () => nativeImports };
}

test("Expo Go uses the interactive WebView map without importing native MapLibre", () => {
  for (const modules of [[], ["MLRNCameraModule"], ["MLRNMapViewModule"]]) {
    const map = loadMap(modules);
    const props = { centers: [{ id: 1 }], selectedCenterId: 1, compact: true, onSelectCenter: () => {} };
    const rendered = map.render(props);
    assert.equal(rendered.type, map.embeddedMap);
    assert.equal((rendered.props as typeof props).onSelectCenter, props.onSelectCenter);
    assert.equal((rendered.props as typeof props).compact, true);
    assert.equal(map.imports(), 0);
  }
});

test("supported native builds load the map and preserve center selection props", () => {
  const map = loadMap(["MLRNCameraModule", "MLRNMapViewModule"]);
  const props = { centers: [{ id: 1 }], selectedCenterId: 1, onSelectCenter: () => {} };
  const rendered = map.render(props);
  assert.equal(rendered.type, map.nativeMap);
  assert.equal((rendered.props as typeof props).centers, props.centers);
  assert.equal((rendered.props as typeof props).onSelectCenter, props.onSelectCenter);
  assert.equal(map.imports(), 1);
});

test("Expo Go never imports native MapLibre even if native registry probes return modules", () => {
  const map = loadMap(["MLRNCameraModule", "MLRNMapViewModule"], true);
  assert.equal(map.render({ centers: [] }).type, map.embeddedMap);
  assert.equal(map.imports(), 0);
});

test("a native entry that enforces a missing MapLibre module falls back instead of crashing", () => {
  const map = loadMap(["MLRNCameraModule", "MLRNMapViewModule"], false, true);
  const props = { centers: [{ id: 1 }], selectedCenterId: 1, compact: true, onSelectCenter: () => {} };
  const rendered = map.render(props);
  assert.equal(rendered.type, map.embeddedMap);
  assert.equal((rendered.props as typeof props).onSelectCenter, props.onSelectCenter);
  assert.equal((rendered.props as typeof props).compact, true);
  assert.equal(map.imports(), 1);
});
