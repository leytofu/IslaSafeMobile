import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { chromium } = await import(
  pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
);
const browser = await chromium.launch({
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
const results = [];
const sosBodies = [];
page.on("pageerror", (e) => errors.push(e.message));
let role = "residents";
let mode = "confirmed";
const account = () => ({
  id: 90001,
  name: "Browser Test Account",
  email: "preview@example.test",
  role,
  contact_number: "00000000000",
  office: "",
  jurisdiction: "",
});
await page.route("**/api/**", async (route) => {
  const url = new URL(route.request().url());
  const json = (value) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(value),
    });
  if (url.pathname.endsWith("/auth/login"))
    return json({ token: "browser-test-token", user: account() });
  if (url.pathname.endsWith("/auth/me")) return json({ user: account() });
  if (url.pathname.endsWith("/auth/logout"))
    return json({ message: "Signed out." });
  if (url.pathname.endsWith("/auth/profile"))
    return json({ user: { ...account(), ...route.request().postDataJSON() } });
  if (url.pathname.endsWith("/sos-requests")) {
    if (route.request().method() === "GET") return json({ data: [] });
    const body = route.request().postDataJSON();
    sosBodies.push(body);
    if (mode === "uncertain") return route.abort("failed");
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          ...body,
          id: "BROWSER-TEST-RECEIPT",
          status: "Pending",
          received_at: new Date().toISOString(),
        },
      }),
    });
  }
  return route.fulfill({
    status: 404,
    contentType: "application/json",
    body: '{"message":"Unavailable in browser test"}',
  });
});
await fs.mkdir("artifacts/browser", { recursive: true });
await page.goto("http://localhost:8082", { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
await page.screenshot({
  path: "artifacts/browser/app-auth-phone.png",
  fullPage: true,
});
async function login(nextRole) {
  role = nextRole;
  await page.getByLabel("Email", { exact: true }).fill("preview@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
await login("admin");
await page
  .getByText("Only Resident and Camp Manager accounts can sign in to mobile.", {
    exact: true,
  })
  .waitFor();
results.push("Unsupported admin role rejected");
await login("residents");
await page
  .getByText("Your safety starts with preparedness", { exact: true })
  .waitFor();
await page.screenshot({
  path: "artifacts/browser/app-home-phone.png",
  fullPage: true,
});
results.push("Resident authentication and dashboard navigation");
await page
  .getByRole("button", { name: "Offline preparedness guides", exact: true })
  .click();
await page.getByText("Flood preparedness", { exact: true }).waitFor();
await page.getByRole("button", { name: "Back", exact: true }).click();
await page
  .getByRole("button", { name: "Offline hazard reference maps", exact: true })
  .click();
assert.equal(
  await page
    .getByRole("img", { name: /exposure map with original legend/ })
    .count(),
  6,
);
await page
  .getByRole("button", { name: "Open Tsunami map & legend", exact: true })
  .click();
await page
  .getByRole("button", { name: "Close reference", exact: true })
  .click();
await page.getByRole("button", { name: "Back", exact: true }).click();
results.push("Offline guide content and six hazard reference images");
await page
  .getByRole("button", { name: "Explore the island map", exact: true })
  .click();
await page.getByText("Native MapLibre map", { exact: true }).waitFor();
results.push("Browser map correctly reports native-only requirement");
await page.getByRole("tab", { name: /Profile/ }).click();
await page.getByRole("radio", { name: "light", exact: true }).click();
await page.waitForFunction(() =>
  document.body.textContent.includes("Appearance"),
);
await page.screenshot({
  path: "artifacts/browser/app-profile-light.png",
  fullPage: true,
});
await page.getByRole("button", { name: "Save profile", exact: true }).click();
await page
  .getByText("Profile updated successfully.", { exact: true })
  .waitFor();
results.push("Profile editing and light theme");
await page.getByRole("tab", { name: /SOS/ }).click();
async function fillSos() {
  await page
    .getByLabel("Location / landmark / barangay", { exact: true })
    .fill("BROWSER DEMO ONLY");
  await page.getByLabel("Latitude (−90 to 90)", { exact: true }).fill("10.109");
  await page
    .getByLabel("Longitude (−180 to 180)", { exact: true })
    .fill("124.562");
  await page
    .getByLabel("Emergency type (e.g. injury, trapped by flood)", {
      exact: true,
    })
    .fill("DEMO ONLY");
  await page
    .getByLabel("Describe the emergency and assistance needed", { exact: true })
    .fill("Browser test. No real emergency. Mock endpoint only.");
  await page
    .getByRole("button", {
      name: "Save details & review before sending",
      exact: true,
    })
    .click();
}
await fillSos();
await page
  .getByRole("button", { name: "Send this SOS now", exact: true })
  .click();
await page
  .getByText("Received • BROWSER-TEST-RECEIPT", { exact: true })
  .waitFor();
assert.equal(sosBodies.length, 1);
assert.equal("status" in sosBodies[0], false);
results.push(
  "Manual SOS review, backend-confirmed mock receipt, status omitted",
);
await fillSos();
mode = "uncertain";
await page
  .getByRole("button", { name: "Send this SOS now", exact: true })
  .click();
await page
  .getByText("Uncertain • Check with responders", { exact: true })
  .waitFor();
assert.equal(sosBodies.length, 2);
await page.screenshot({
  path: "artifacts/browser/app-sos-uncertain.png",
  fullPage: true,
});
results.push("Interrupted SOS remains uncertain with no automatic retry");
await page.getByRole("tab", { name: /Profile/ }).click();
await page.getByRole("button", { name: "Sign out", exact: true }).click();
await page
  .getByRole("button", { name: "Sign out of this device", exact: true })
  .click();
await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
await login("campmanager");
await page.getByText("Assigned center unavailable", { exact: true }).waitFor();
await page
  .getByRole("button", { name: "Open assigned center", exact: true })
  .click();
assert.ok(
  await page
    .getByRole("button", { name: "Update center occupancy", exact: true })
    .isDisabled(),
);
await page.getByRole("tab", { name: /Evacuees/ }).click();
assert.ok(
  await page
    .getByRole("button", { name: "Register evacuee", exact: true })
    .isDisabled(),
);
await page.getByRole("tab", { name: /Alerts/ }).click();
await page
  .getByText("No SOS requests returned by the backend.", { exact: true })
  .waitFor();
results.push(
  "Camp Manager tabs and unavailable backend actions; actual empty SOS state",
);
await page.setViewportSize({ width: 360, height: 800 });
const dimensions = await page.evaluate(() => ({
  width: innerWidth,
  content: document.documentElement.scrollWidth,
}));
assert.ok(dimensions.content <= dimensions.width);
await page.screenshot({
  path: "artifacts/browser/app-camp-alerts-360.png",
  fullPage: true,
});
assert.deepEqual(errors, []);
await fs.writeFile(
  "artifacts/browser/app-report.json",
  JSON.stringify(
    {
      results,
      errors,
      dimensions,
      api: "Mocked with Playwright; not a native or live-backend test.",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ results, errors, dimensions }));
await browser.close();
