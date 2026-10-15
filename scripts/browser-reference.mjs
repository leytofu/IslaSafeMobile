import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
);
const browser = await chromium.launch({
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await fs.mkdir("artifacts/browser", { recursive: true });
await page.goto(
  pathToFileURL(
    path.resolve("../resources/ui/IslaSafe_Resident_Mobile_App.html"),
  ).href,
);
await page.waitForTimeout(6500); // Reference has a timed splash animation.
await page.screenshot({
  path: "artifacts/browser/reference-desktop.png",
  fullPage: true,
});
const report = {
  title: await page.title(),
  errors,
  desktop: await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    colors: ["--bg-0", "--text-0", "--royal", "--red"].map((name) => [
      name,
      getComputedStyle(document.documentElement).getPropertyValue(name),
    ]),
    screens: [...document.querySelectorAll(".screen")].map((element) => ({
      id: element.id,
      active: element.classList.contains("active"),
    })),
  })),
};
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "artifacts/browser/reference-phone.png",
  fullPage: true,
});
report.phone = await page.evaluate(() => ({
  width: innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
}));
report.phone.controls = await page.locator("button:visible").allTextContents();
await fs.writeFile(
  "artifacts/browser/reference-report.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report));
await browser.close();
