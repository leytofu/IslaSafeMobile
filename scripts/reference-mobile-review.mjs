import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await fs.mkdir("artifacts/reference-mobile", { recursive: true });
await page.goto("http://localhost:8083/dashboard-preview", { waitUntil: "domcontentloaded", timeout: 120000 });
await page.getByRole("button", { name: "Open resident menu" }).waitFor({ timeout: 120000 });
const report = [];
for (const theme of ["dark", "light"]) {
  const opposite = theme === "dark" ? "light" : "dark";
  if (!await page.getByRole("button", { name: "Switch to " + opposite + " theme" }).count())
    await page.getByRole("button", { name: "Switch to " + theme + " theme" }).click();
  await page.getByRole("button", { name: "Open resident menu" }).click();
  await page.waitForTimeout(800);
  assert.equal(await page.getByText(/AWS/).count(), 0, "AWS is excluded from the resident menu");
  await page.screenshot({ path: "artifacts/reference-mobile/" + theme + "-menu.png" });
  await page.getByRole("button", { name: "Close resident menu" }).click({ position: { x: 380, y: 100 } });
  await page.waitForTimeout(800);
  for (const [label, id] of [["Emergency SOS", "sos"], ["Alerts & Advisories", "alerts"], ["Settings", "settings"], ["Hazard Map", "map"], ["My Household", "household"], ["Preparedness Guides", "guides"], ["Offline Hazard Maps", "hazards"]]) {
    await page.getByRole("button", { name: "Open resident menu" }).click();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "artifacts/reference-mobile/" + theme + "-" + id + ".png" });
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.equal(width, 390, "No overflow in " + id);
    if (id === "sos") {
      await page.getByRole("button", { name: "Prepare Emergency SOS" }).click();
      await page.getByLabel("Full name", { exact: true }).waitFor();
    }
    if (id === "alerts") {
      await page.getByRole("button", { name: "Warning", exact: true }).click();
      await page.getByText("Heavy rainfall preparedness reminder", { exact: true }).waitFor();
      assert.equal(await page.getByText("Typhoon advisory: prepare your household", { exact: true }).count(), 0);
    }
    if (id === "settings") {
      await page.getByRole("button", { name: /^Notification Settings/ }).click();
      await page.getByText("Critical Alerts", { exact: true }).waitFor();
      await page.screenshot({ path: "artifacts/reference-mobile/" + theme + "-notifications.png" });
      await page.getByRole("button", { name: "Close settings details", exact: true }).click();
    }
    if (id === "map") {
      await page.getByRole("button", { name: "Satellite", exact: true }).click();
      await page.screenshot({ path: "artifacts/reference-mobile/" + theme + "-satellite-controls.png" });
    }
    report.push({ theme, screen: id, width });
  }
}
assert.deepEqual(errors, []);
await fs.writeFile("artifacts/reference-mobile/report.json", JSON.stringify({ report, errors, awsExcluded: true }, null, 2));
console.log(JSON.stringify({ screens: report.length, errors, awsExcluded: true }));
await browser.close();
