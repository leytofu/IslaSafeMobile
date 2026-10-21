import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let role = "residents";
const account = () => ({ id: 90011, name: "Gate Test", email: "gate@example.test", role, contact_number: "", office: "", jurisdiction: "", barangay: "Aguining", address: "Purok 1" });
await page.route("**/api/**", async (route) => {
  const url = new URL(route.request().url());
  const json = (value, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(value) });
  if (url.pathname.endsWith("/auth/login")) return json({ token: "gate-token", user: account() });
  if (url.pathname.endsWith("/auth/me")) return json({ user: account() });
  if (url.pathname.endsWith("/auth/logout")) return json({ message: "Signed out." });
  if (url.pathname.endsWith("/auth/profile")) return json({ user: { ...account(), ...route.request().postDataJSON() } });
  if (url.pathname.endsWith("/evacuation-centers")) return json({ data: [] });
  return json({ message: "Unavailable in gate test" }, 404);
});
const counts = async (name) => page.getByRole("button", { name, exact: true }).count();
async function signIn(expectedPath) {
  await page.goto("http://localhost:8081", { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByRole("button", { name: role === "residents" ? "Resident. Sign in or create an account" : "Camp Manager. Sign in with your assigned account", exact: true }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).waitFor({ timeout: 30000 });
  await page.getByPlaceholder("you@example.com").fill("gate@example.test");
  await page.getByPlaceholder("Enter your password").fill("gate-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(`**${expectedPath}**`, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const tab = page.getByRole("tab", { name: /profile/i });
  if (await tab.count()) await tab.first().click();
  else {
    const candidates = page.getByRole("button", { name: /profile/i });
    if (!(await candidates.count())) {
      console.log("NO PROFILE CONTROL. url:", page.url());
      console.log("BUTTONS:", JSON.stringify(await page.getByRole("button").allInnerTexts()));
    }
    await candidates.first().click();
  }
}
try {
  await signIn("/resident/home");
  await page.getByRole("button", { name: "Edit Profile", exact: true }).waitFor({ timeout: 30000 });
  assert.equal(await counts("Add image"), 0, "resident view must not offer image editing");
  assert.equal(await counts("Save profile"), 0, "resident view must not offer editable fields");
  await page.getByRole("button", { name: "Edit Profile", exact: true }).click();
  await page.getByRole("button", { name: "Save profile", exact: true }).waitFor({ timeout: 30000 });
  assert.equal(await counts("Add image"), 1, "resident edit mode offers image editing");
  await page.getByLabel("Full name", { exact: true }).fill("Resident Web Edited");
  await page.getByLabel("Email", { exact: true }).fill("resident-edited@example.test");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await page.getByText("Profile updated successfully.", { exact: true }).waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "Back to settings", exact: true }).click();
  await page.getByRole("button", { name: "Edit Profile", exact: true }).waitFor({ timeout: 30000 });
  assert.equal(await counts("Save profile"), 0, "resident view is read-only after leaving edit");
  assert.equal(await counts("Add image"), 0, "resident image editing returns after leaving edit");
  console.log("PASS resident: image, name and email are editable only after Edit Profile");

  role = "campmanager";
  await signIn("/camp/");
  await page.getByRole("button", { name: "Edit profile", exact: true }).waitFor({ timeout: 30000 });
  assert.equal(await counts("Add image"), 0, "camp view must not offer image editing");
  assert.equal(await counts("Save profile"), 0, "camp view must not offer editable fields");
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await page.getByRole("button", { name: "Save profile", exact: true }).waitFor({ timeout: 30000 });
  assert.equal(await counts("Add image"), 1, "camp edit mode offers image editing");
  await page.getByRole("button", { name: "Back to profile", exact: true }).click();
  await page.getByRole("button", { name: "Edit profile", exact: true }).waitFor({ timeout: 30000 });
  assert.equal(await counts("Save profile"), 0, "camp view is read-only after leaving edit");
  console.log("PASS camp manager: image, name and email are editable only after Edit profile");
  assert.deepEqual(errors, [], "no page errors");
  console.log("PASS no page errors");
} finally {
  await browser.close();
}
