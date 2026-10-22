import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { campDestinations, residentDestinations, headerNavigation } from "../src/lib/navigation";

const code = ts.transpileModule(readFileSync(new URL("../src/components/NavigationHeader.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
type Element = { type: unknown; props: Record<string, unknown> };
function header(pathname: string, theme: "dark" | "light", role: string | null = "residents") {
  let hardwareBack: (() => boolean) | undefined;
  let removed = false;
  const effects: (() => (() => void) | undefined)[] = [];
  const exports: { NavigationHeader?: (props: unknown) => Element; useDetailBack?: (callback?: () => void, disabled?: boolean) => void } = {};
  const colors = { bg: `${theme} background`, text: `${theme} text`, muted: "muted", card: "card", tint: "tint", border: "border" };
  runInNewContext(code, { exports, require(id: string) {
    if (id === "react") return { useCallback: (callback: unknown) => callback };
    if (id === "react/jsx-runtime") return { jsx: (type: unknown, props: unknown) => ({ type, props }), jsxs: (type: unknown, props: unknown) => ({ type, props }) };
    if (id === "react-native") return { View: "View", Text: "Text", Pressable: "Pressable", StyleSheet: { create: (value: unknown) => value }, Keyboard: { dismiss() {} }, BackHandler: { addEventListener(_name: string, handler: () => boolean) { hardwareBack = handler; return { remove() { removed = true; } }; } } };
    if (id === "expo-router") return { usePathname: () => pathname, useFocusEffect: (effect: () => () => void) => effects.push(effect) };
    if (id === "@expo/vector-icons") return { Feather: "Feather" };
    if (id === "../state/AppState") return { useApp: () => ({ user: role ? { role } : null, verified: Boolean(role), theme, setTheme: async () => {} }) };
    if (id === "../theme/colors") return { dashboardPalettes: { dark: colors, light: colors } };
    if (id === "../lib/navigation") return { headerNavigation };
    if (id === "./BackButton") return { BackButton: "BackButton" };
    if (id === "./NotificationCenter") return { NotificationBell: "NotificationBell" };
    if (id === "./ResidentMenu") return { ResidentMenuButton: "MenuButton" };
    throw new Error(`Unexpected header dependency: ${id}`);
  } });
  return { render: exports.NavigationHeader!, useDetailBack: exports.useDetailBack!, commit: () => effects.shift()?.(), back: () => hardwareBack?.(), removed: () => removed };
}

test("every main destination immediately renders one left menu and no Back in both themes", () => {
  for (const theme of ["dark", "light"] as const) {
    for (const [role, destinations] of [["residents", residentDestinations], ["campmanager", campDestinations]] as const) {
      for (const destination of destinations) {
        if (!destination.href) continue;
        const app = header(String(destination.href), theme, role);
        const result = app.render({ title: destination.title, showBack: destination.key !== "overview" });
        const children = result.props.children as Element[];
        assert.equal(children[0].type, "MenuButton", `${destination.href} should start with its hamburger`);
        assert(!JSON.stringify(result).includes('"type":"BackButton"'));
        assert(JSON.stringify(result).includes(`${theme} background`));
        assert(JSON.stringify(result).includes('"type":"NotificationBell"'));
        assert(!JSON.stringify(result).includes("Switch to light theme"));
        assert(!JSON.stringify(result).includes("Switch to dark theme"));
      }
    }
  }
});

test("details and public guides keep Back; hidden-back onboarding forms remain unchanged", () => {
  for (const pathname of ["/camp/register", "/guest-sos"]) {
    assert(JSON.stringify(header(pathname, "light").render({ title: "Detail" })).includes('"type":"BackButton"'));
  }
  assert(JSON.stringify(header("/guides", "dark", null).render({ title: "Guides" })).includes('"type":"BackButton"'));
  assert(!JSON.stringify(header("/complete-profile", "dark").render({ title: "Complete profile", showBack: false })).includes('"type":"BackButton"'));
  for (const pathname of ["/resident/profile", "/resident/sos"]) {
    assert(JSON.stringify(header(pathname, "light").render({ title: "Inner step", onBack() {} })).includes('"type":"BackButton"'));
  }
});

test("Android Back handles inline details before section history and unregisters on blur", () => {
  const app = header("/resident/profile", "light");
  let returns = 0;
  app.useDetailBack(() => returns++);
  const blur = app.commit();
  assert.equal(app.back(), true);
  assert.equal(returns, 1);
  blur?.(); assert.equal(app.removed(), true);
  const busy = header("/resident/sos", "dark");
  busy.useDetailBack(() => returns++, true); busy.commit();
  assert.equal(busy.back(), true); assert.equal(returns, 1);
});
