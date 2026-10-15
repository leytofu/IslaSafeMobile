import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  // Isolate API latency from development-server font delivery. Use the real
  // installed icon font rather than replacing icons or ignoring runtime errors.
  const feather = await readFile(new URL('../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf', import.meta.url));
  await page.route(/Feather.*ttf/i, (route) => route.fulfill({ status: 200, contentType: 'font/ttf', body: feather }));
  const user = { id: 990001, name: 'Map sync fixture', email: 'map-sync@example.test', role: 'residents' };
  const center = { id: 990001, name: 'Slow-link center', place: { id: 1, barangay: 'Pitogo', municipality: 'President Carlos P. Garcia' }, capacity: 150, current: 4, available: 146, latitude: 10.12, longitude: 124.56, status: 'Operational' };
  let reads = 0;
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data = { data: [] };
    if (path.endsWith('/auth/login')) data = { token: 'map-sync-fixture-token', user };
    if (path.endsWith('/auth/me')) data = { user };
    if (path.endsWith('/evacuation-centers')) {
      reads++;
      // Longer than the 15-second polling interval, shorter than API timeout.
      if (reads === 1) await new Promise(resolve => setTimeout(resolve, 16000));
      data = { data: [center] };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
  await page.goto(process.env.MOBILE_WEB_URL || 'http://localhost:8082', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('button', { name: /^Resident\. Stay informed/ }).click();
  await page.getByLabel('Email address', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('browser-test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Explore the island map', exact: true }).click();
  const facility = page.getByRole('button', { name: 'Slow-link center - Pitogo', exact: true });
  await facility.waitFor({ timeout: 28000 });
  assert.equal(reads, 1, 'Polling must not abort/restart the slow initial request.');
  await facility.click();
  await page.getByText('Current occupancy: 4', { exact: true }).waitFor();
  await page.getByText('Maximum capacity: 150', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: Resident map data finishes a response slower than the polling interval and shows confirmed facility/occupancy details without duplicate requests. Native marker rendering is not tested by this browser fixture.');
} catch (error) {
  const page = browser.contexts()[0]?.pages()[0];
  if (page) console.error(await page.locator('body').ariaSnapshot());
  throw error;
} finally { await browser.close(); }
