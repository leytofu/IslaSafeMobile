import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
await fs.mkdir("artifacts/dashboard", { recursive: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 980 } });
await page.goto(pathToFileURL(path.resolve("../resources/ui/IslaSafe_Resident_Mobile_App.html")).href);
await page.waitForTimeout(6500); // Let the reference's timed intro finish.
await page.evaluate(() => {
  document.getElementById("isaf-intro")?.remove();
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  document.getElementById("scr-dashboard").classList.add("active");
});
await page.locator(".phone-screen").first().screenshot({ path: "artifacts/dashboard/reference-dark.png" });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:8083/dashboard-preview", { waitUntil: "domcontentloaded", timeout: 120000 });
await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).waitFor({ timeout: 120000 });
const results = [];
for (const width of [390, 320, 768]) {
  await page.setViewportSize({ width, height: width === 768 ? 1024 : 844 });
  for (const theme of ["light", "dark"]) {
    const opposite = theme === "light" ? "dark" : "light";
    const toggle = page.getByRole("button", { name: "Switch to " + opposite + " theme" });
    if (!(await toggle.count())) await page.getByRole("button", { name: "Switch to " + theme + " theme" }).click();
    await page.getByTestId("resident-dashboard-scroll").evaluate((element) => { element.scrollTop = 0; });
    await page.waitForTimeout(200); // Let responsive layout and the scroll paint settle.
    await page.screenshot({ path: "artifacts/dashboard/" + theme + "-" + width + ".png" });
    const dimensions = await page.evaluate(() => ({
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(dimensions.scrollWidth <= width, "No horizontal overflow at " + width);
    await page.getByTestId("resident-dashboard-scroll").evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await page.waitForTimeout(200);
    await page.screenshot({ path: "artifacts/dashboard/" + theme + "-" + width + "-lower.png" });
    assert.equal(await page.getByText("Home", { exact: true }).isVisible(), true, "Navigation remains visible");
    results.push({ theme, ...dimensions });
  }
}
assert.deepEqual(errors, [], "No browser runtime errors");
await fs.writeFile("artifacts/dashboard/review.json", JSON.stringify({ results, errors }, null, 2));
console.log(JSON.stringify({ results, errors }));
await browser.close();
