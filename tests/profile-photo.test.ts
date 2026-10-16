import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(path: string, globals: Record<string, unknown>) {
  const exports: Record<string, (...args: any[]) => Promise<any>> = {};
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  runInNewContext(code, { exports, ...globals });
  return exports;
}

function picker({ canceled = false, granted = true, oversized = false } = {}) {
  const calls: string[] = [];
  const result = { canceled, assets: canceled ? null : [{ uri: "file:///picked.heic", width: 4000, height: 3000 }] };
  const context = {
    resize: (size: unknown) => { calls.push(`resize ${JSON.stringify(size)}`); return context; },
    renderAsync: async () => ({ saveAsync: async (options: unknown) => {
      calls.push(`save ${JSON.stringify(options)}`);
      return { uri: "file:///profile.jpg", width: 1024, height: 768, base64: oversized ? "A".repeat(3 * 1024 * 1024) : "YWJj" };
    } }),
  };
  const module = load("../src/lib/select-profile-photo.ts", { require(name: string) {
    if (name === "expo-image-picker") return {
      requestCameraPermissionsAsync: async () => { calls.push("camera permission"); return { granted }; },
      launchCameraAsync: async () => { calls.push("camera"); return result; },
      launchImageLibraryAsync: async () => { calls.push("library"); return result; },
    };
    if (name === "expo-image-manipulator") return { SaveFormat: { JPEG: "jpeg" }, ImageManipulator: { manipulate: () => context } };
    throw new Error(`Unexpected photo import: ${name}`);
  } });
  return { select: module.selectProfilePhoto, calls };
}

test("cancelling the gallery makes no upload or image conversion", async () => {
  const app = picker({ canceled: true });
  assert.equal(await app.select("library"), null);
  assert.deepEqual(app.calls, ["library"]);
});

test("an older native build can load the profile and gets an actionable error only when choosing a photo", async () => {
  const module = load("../src/lib/select-profile-photo.ts", { require: () => { throw new Error("Native image module is missing"); } });
  await assert.rejects(module.selectProfilePhoto("library"), /updated IslaSafe development build/);
});

test("denied camera permission never opens the camera", async () => {
  const app = picker({ granted: false });
  await assert.rejects(app.select("camera"), /Allow camera access/);
  assert.deepEqual(app.calls, ["camera permission"]);
});

test("a large HEIC selection is resized and converted to JPEG before preview", async () => {
  const app = picker();
  const photo = await app.select("library");
  assert.equal(photo.uri, "file:///profile.jpg");
  assert(app.calls.includes('resize {"width":1024}'));
  assert(app.calls.some(call => call.includes('"format":"jpeg"') && call.includes('"compress":0.75')));
});

test("prepared files over the backend limit cannot be uploaded", async () => {
  await assert.rejects(picker({ oversized: true }).select("library"), /larger than 2 MB/);
});

test("native photo form uses the PHP method override and only the account identity plus file", async () => {
  const parts: [string, unknown][] = [];
  class NativeFormData { append(key: string, value: unknown) { parts.push([key, value]); } }
  const module = load("../src/lib/profile-photo.ts", { FormData: NativeFormData });
  await module.avatarProfileForm({ name: "Resident", email: "resident@example.test", role: "admin" }, { uri: "file:///photo.jpg" }, "android");
  assert.deepEqual(parts.slice(0, 3), [["_method", "PATCH"], ["name", "Resident"], ["email", "resident@example.test"]]);
  assert.equal(parts.length, 4);
  assert.equal(parts[3][0], "avatar");
  assert.equal(JSON.stringify(parts[3][1]), JSON.stringify({ uri: "file:///photo.jpg", name: "profile.jpg", type: "image/jpeg" }));
});

test("web photo form sends a real JPEG file instead of its local URI", async () => {
  const module = load("../src/lib/profile-photo.ts", { FormData, fetch: async () => new Response(new Blob(["photo"], { type: "image/jpeg" })) });
  const body = await module.avatarProfileForm({ name: "Manager", email: "manager@example.test" }, { uri: "blob:preview" }, "web");
  const file = body.get("avatar") as File;
  assert.equal(file.name, "profile.jpg");
  assert.equal(file.type, "image/jpeg");
  assert.equal(await file.text(), "photo");
});
