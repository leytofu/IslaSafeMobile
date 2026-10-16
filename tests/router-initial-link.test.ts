import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

// Exercise the installed Router implementation: the initial URL can resolve
// before React commits, while later links must continue to work after mount.
function container() {
  const effects: (() => void | (() => void))[] = [];
  const updates: unknown[] = [];
  let linkingCallback: (path: string | undefined) => void = () => {};
  let currentPath = "/current";
  let mounted = false;
  const react = {
    useRef: (value: unknown) => ({ current: value }),
    useState: () => [undefined, (value: unknown) => { assert(mounted, "A link updated state before mount or after unmount"); updates.push(value); }],
    useEffect: (effect: () => void | (() => void)) => effects.push(effect),
    useCallback: (callback: unknown) => callback,
    useMemo: (callback: () => unknown) => callback(),
    useImperativeHandle: (ref: { current: unknown }, callback: () => unknown) => { ref.current = callback(); },
    forwardRef: (component: unknown) => component,
  };
  const exports: { NavigationContainer?: (props: unknown, ref: unknown) => unknown } = {};
  runInNewContext(readFileSync(new URL("../node_modules/expo-router/build/fork/NavigationContainer.js", import.meta.url), "utf8"), {
    exports, WeakMap,
    require(name: string) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx: (_type: unknown, props: unknown) => props };
      if (name === "react-native") return { I18nManager: { getConstants: () => ({ isRTL: false }) } };
      if (name === "./useBackButton") return { useBackButton: (ref: { current: unknown }) => { ref.current = { getCurrentRoute: () => ({ path: currentPath }) }; } };
      if (name === "./useDocumentTitle") return { useDocumentTitle: () => {} };
      if (name === "../imperative-api") return { useImperativeApiEmitter: () => {} };
      if (name === "../utils/useLatestCallback") return { __esModule: true, default: (callback: unknown) => callback };
      if (name === "./useLinking") return { useLinking: (_ref: unknown, _options: unknown, callback: typeof linkingCallback) => { linkingCallback = callback; return { getInitialState: () => ({ routes: [{ name: "deep" }] }) }; } };
      if (name === "./useThenable") return { useThenable: (getInitialState: () => unknown) => [true, getInitialState()] };
      if (name === "../react-navigation/native") return { DefaultTheme: {}, LocaleDirContext: {}, UNSTABLE_UnhandledLinkingContext: {}, LinkingContext: {} };
      throw new Error(`Unexpected Router dependency: ${name}`);
    },
  });
  const output = exports.NavigationContainer!({ linking: { enabled: true } }, {});
  return {
    output, updates,
    link: (path: string | undefined) => linkingCallback(path),
    setPath: (value: string) => { currentPath = value; },
    commit: () => { mounted = true; const cleanups = effects.map(effect => effect()); return () => { mounted = false; cleanups.forEach(cleanup => cleanup?.()); }; },
  };
}

test("an initial link resolved before commit waits for mount and preserves deep-link navigation", () => {
  const app = container();
  app.link("/deep");
  assert.deepEqual(app.updates, []);
  const unmount = app.commit();
  assert.deepEqual(app.updates, ["/deep"]);
  assert(JSON.stringify(app.output).includes('"name":"deep"'));
  app.link("/later");
  assert.deepEqual(app.updates, ["/deep", "/later"]);
  unmount();
  app.link("/late-result");
  assert.deepEqual(app.updates, ["/deep", "/later"]);
});

test("an already handled initial route does not remain flagged as unhandled", () => {
  const app = container();
  app.link("/deep");
  app.setPath("/deep");
  app.commit();
  assert.deepEqual(app.updates, [undefined]);
});

test("a discarded render never publishes its initial-link callback", () => {
  const discarded = container();
  discarded.link("/discarded");
  assert.deepEqual(discarded.updates, []);
  const committed = container();
  committed.commit();
  committed.link("/active");
  assert.deepEqual(committed.updates, ["/active"]);
  assert.deepEqual(discarded.updates, []);
});
