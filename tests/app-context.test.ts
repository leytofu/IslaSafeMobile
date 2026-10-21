import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function compile(path: string) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}

test("refreshing the provider and theme module keeps the context used by mounted consumers", () => {
  type Context = { value: unknown; Provider: Context };
  let contexts = 0;
  const react = {
    createContext(value: unknown) { contexts++; const context = { value } as Context; context.Provider = context; return context; },
    useContext: (context: Context) => context.value,
    useState: (value: unknown) => [value, () => {}],
    useRef: (current: unknown) => ({ current }),
    useCallback: (callback: unknown) => callback,
    useEffect() {},
  };
  const shared: { AppContext?: Context; useApp?: () => { colors: { bg: string } } } = {};
  const contextSandbox = { exports: shared, require(id: string) {
    assert.equal(id, "react", "The context must not import theme tokens or provider at runtime"); return react;
  } };
  const contextModule = `(function () { ${compile("../src/state/AppContext.ts")} })()`;
  runInNewContext(contextModule, contextSandbox);
  const mountedConsumer = shared.useApp!;
  const refreshedContext: typeof shared = {};
  contextSandbox.exports = refreshedContext;
  runInNewContext(contextModule, contextSandbox);
  assert.equal(refreshedContext.AppContext, shared.AppContext);
  function refreshProvider(background: string, systemTheme: "light" | "dark") {
    const exports: { AppProvider?: (props: unknown) => unknown; useApp?: typeof mountedConsumer } = {};
    runInNewContext(compile("../src/state/AppState.tsx"), { exports, require(id: string) {
      if (id === "react") return react;
      if (id === "react/jsx-runtime") return { jsx: (context: Context, props: { value: unknown }) => { context.value = props.value; return props; } };
      if (id === "./AppContext") return shared;
      if (id === "react-native") return { useColorScheme: () => systemTheme };
      if (id === "../theme/colors") return { palettes: { dark: { bg: "dark background" }, light: { bg: "light background" }, [systemTheme]: { bg: background } } };
      return {};
    } });
    exports.AppProvider!({ children: "mounted screen" });
    assert.equal(exports.useApp, mountedConsumer);
  }
  refreshProvider("before refresh", "dark"); assert.equal(mountedConsumer().colors.bg, "before refresh");
  refreshProvider("after refresh", "light"); assert.equal(mountedConsumer().colors.bg, "after refresh");
  assert.equal(contexts, 1);
});

test("a consumer actually outside AppProvider still receives the explicit error", () => {
  const exports: { useApp?: () => unknown } = {};
  runInNewContext(compile("../src/state/AppContext.ts"), { exports, require() { return { createContext: () => null, useContext: () => null }; } });
  assert.throws(() => exports.useApp!(), /AppProvider is missing/);
});
