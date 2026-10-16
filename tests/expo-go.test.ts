import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function compile(path: string) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

test("Expo Go Android resolves all six hazard images as Metro assets, not missing native drawables", () => {
  for (const [platform, expoGo, nativeAssets] of [["android", true, false], ["android", false, true], ["ios", true, false], ["web", false, false]] as const) {
    const exports: { hazards?: { source: number | { uri: string } }[] } = {};
    let asset = 0;
    runInNewContext(compile("../src/data/hazards.ts"), {
      exports,
      require(name: string) {
        if (name === "react-native") return { Platform: { OS: platform } };
        if (name === "expo") return { isRunningInExpoGo: () => expoGo };
        if (name.endsWith(".png")) return ++asset;
        throw new Error(`Unexpected import: ${name}`);
      },
    });
    assert.equal(exports.hazards?.length, 6);
    for (const hazard of exports.hazards!) assert.equal(typeof hazard.source, nativeAssets ? "object" : "number");
  }
});

test("Google sign-in in Expo Go returns a useful error without importing unsupported native modules", async () => {
  const exports: { googleProof?: (purpose: string) => Promise<unknown> } = {};
  const imports: string[] = [];
  runInNewContext(compile("../src/lib/google.ts"), {
    exports, process: { env: { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: "configured-client" } },
    require(name: string) {
      imports.push(name);
      if (name === "react-native") return { Platform: { OS: "android" } };
      if (name === "expo") return { isRunningInExpoGo: () => true };
      if (name === "./api") return {};
      throw new Error(`Unsupported native import: ${name}`);
    },
  });
  await assert.rejects(exports.googleProof!("login"), /In Expo Go, sign in with your email/);
  assert.equal(imports.includes("react-native-nitro-google-signin"), false);
});
