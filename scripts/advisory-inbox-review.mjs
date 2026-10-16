import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// Run the actual inbox hook and React Native components in their web renderer.
// Only the signed-in app context and icon drawing are replaced for this fixture.
const bundle = await build({
  stdin: { contents: `
    import React, { useState } from 'react';
    import { createRoot } from 'react-dom/client';
    import { SafeAreaProvider } from 'react-native-safe-area-context';
    import { AppTestContext } from './state/AppState';
    import { api, setAccessToken } from './lib/api';
    import { AdvisoryFeed } from './components/AdvisoryInbox';
    import { ResidentUserBar } from './components/ResidentUserBar';
    import { useAdvisoryInbox } from './hooks/useAdvisoryInbox';
    api.defaults.baseURL = location.origin + '/api'; setAccessToken('inbox-fixture');
    function Inbox() {
      const inbox = useAdvisoryInbox();
      const [unreadOnly, setUnreadOnly] = useState(false);
      return <><ResidentUserBar theme={window.testTheme} user={{ name: 'Inbox resident' }} unread={inbox.unread} onNotifications={() => setUnreadOnly(value => !value)} /><AdvisoryFeed inbox={inbox} unreadOnly={unreadOnly} /></>;
    }
    function Harness() {
      const [theme, setTheme] = useState('dark');
      const [user, setUser] = useState({id: 1, role: 'residents'});
      window.testTheme = theme;
      return <AppTestContext.Provider value={{ theme, user, verified: !!user, online: true }}><SafeAreaProvider><button onClick={() => setTheme(value => value === 'dark' ? 'light' : 'dark')}>Toggle theme</button><button onClick={() => setUser(null)}>End fixture session</button><Inbox /></SafeAreaProvider></AppTestContext.Provider>;
    }
    createRoot(document.getElementById('root')).render(<Harness />);
  `, resolveDir: new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), loader: 'tsx' },
  bundle: true, write: false, platform: 'browser', jsx: 'automatic', alias: { 'react-native': 'react-native-web' },
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
  define: { 'process.env.NODE_ENV': '"development"', __DEV__: 'true', 'process.env.EXPO_PUBLIC_API_BASE_URL': '"/api"' },
  plugins: [{ name: 'fixture-context', setup(builder) {
    builder.onResolve({ filter: /state\/AppState$/ }, () => ({ path: 'context', namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: `import {createContext,useContext} from 'react'; export const AppTestContext=createContext(null); export const useApp=()=>useContext(AppTestContext);`, resolveDir: process.cwd() }));
    builder.onResolve({ filter: /^@expo\/vector-icons$/ }, () => ({ path: 'icons', namespace: 'fixture-icons' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture-icons' }, () => ({ contents: 'export const Feather=()=>null;' }));
  } }],
});
const items = [
  { id: 1, title: 'All-area bulletin', message: 'Instructions for every barangay.', target: 'All barangays', priority: 'Critical', published_at: '2026-10-15T09:00:00Z', version: 'a'.repeat(64), is_read: false },
  { id: 2, title: 'Lapinig bulletin', message: 'Instructions for Lapinig.', target: 'Lapinig', priority: 'Info', published_at: '2026-10-15T08:00:00Z', version: 'b'.repeat(64), is_read: false },
];
let fail = false;
const server = createServer(async (request, response) => {
  if (request.url === '/bundle.js') { response.setHeader('Content-Type', 'text/javascript'); return response.end(bundle.outputFiles[0].text); }
  if (request.url.startsWith('/api/')) {
    assert.equal(request.headers.authorization, 'Bearer inbox-fixture');
    response.setHeader('Content-Type', 'application/json');
    if (fail) { response.statusCode = 503; return response.end(JSON.stringify({ message: 'Inbox temporarily unavailable.' })); }
    if (request.method === 'POST') {
      const chunks = []; for await (const chunk of request) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const item = items.find(item => request.url === `/api/advisories/${item.id}/read`);
      assert(item); assert.equal(body.version, item.version); item.is_read = true;
      return response.end(JSON.stringify({ message: 'Read.' }));
    }
    return response.end(JSON.stringify({ data: items, unread_count: items.filter(item => !item.is_read).length }));
  }
  response.setHeader('Content-Type', 'text/html');
  response.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByText('All-area bulletin', { exact: true }).waitFor();
  await page.getByLabel('2 unread advisories', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Open notifications and advisories', exact: true }).click();
  await page.getByText('Unread notifications (2)', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Mark All-area bulletin as read', exact: true }).click();
  await page.getByText('Unread notifications (1)', { exact: true }).waitFor();
  assert.equal(await page.getByText('All-area bulletin', { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Open notifications and advisories', exact: true }).click();
  await page.getByText('All-area bulletin', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Info', exact: true }).click();
  assert.equal(await page.getByText('All-area bulletin', { exact: true }).count(), 0);
  await page.getByText('Lapinig bulletin', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await mkdir('../.verification/advisories', { recursive: true });
  await page.screenshot({ path: '../.verification/advisories/mobile-inbox-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Toggle theme', exact: true }).click();
  await page.screenshot({ path: '../.verification/advisories/mobile-inbox-light.png', fullPage: true });
  fail = true;
  await page.getByRole('button', { name: 'Refresh advisories', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Inbox temporarily unavailable.' }).waitFor();
  fail = false;
  await page.getByRole('button', { name: 'Refresh advisories', exact: true }).click();
  await page.getByRole('alert').waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'End fixture session', exact: true }).click();
  assert.equal(await page.getByText('All-area bulletin', { exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: mobile inbox, bearer requests, unread badge, persisted read, filters, themes, retry and session isolation.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
