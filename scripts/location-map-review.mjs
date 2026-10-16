import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createMapDocument } from '../src/lib/mapDocument.ts';

// Run with: npx tsx scripts/location-map-review.mjs
// The actual Expo Go map document receives simulated GPS bridge updates.
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 400 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route(/https:\/\/(tile\.openstreetmap\.org|server\.arcgisonline\.com)\//, route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII=', 'base64') }));
  await page.setContent(createMapDocument('dark'));
  await page.waitForFunction(() => !!window.IslaSafeMap?.dispatch);
  const update = coordinate => page.evaluate(coordinate => window.IslaSafeMap.dispatch({ type: 'update', state: { centers: [], selectedCenterId: null, theme: 'dark', coordinate, locating: false } }), coordinate);
  await update([10.109, 124.562]);
  await page.evaluate(() => window.IslaSafeMap.dispatch({ type: 'locate', latitude: 10.109, longitude: 124.562 }));
  await page.getByLabel('Your current location', { exact: true }).waitFor();
  await page.waitForFunction(() => {
    const rect = document.querySelector('.location-pin').getBoundingClientRect();
    return Math.abs(rect.x + rect.width / 2 - innerWidth / 2) < 2 && Math.abs(rect.y + rect.height / 2 - innerHeight / 2) < 2;
  });
  await update([10.1093, 124.5623]);
  assert.equal(await page.locator('.location-pin').count(), 1, 'Movement updates the existing marker');
  await update(null);
  assert.equal(await page.locator('.location-pin').count(), 0, 'Paused/denied location removes the old marker');
  await update([10.109, 124.562]);
  assert.equal(await page.locator('.location-pin').count(), 1);
  assert.deepEqual(errors, []);
  console.log('PASS: current-position marker, automatic centering, movement updates and removal on pause in the Expo Go map document.');
} finally { await browser.close(); }
