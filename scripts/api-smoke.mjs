import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.API_BASE_URL || 'http://127.0.0.1:8000/api';
const results = [];
for (const [email, expected] of [['resident@islasafe.test', 'residents'], ['camp@islasafe.test', 'campmanager']]) {
  const response = await fetch(base + '/auth/login', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: process.env.DEMO_PASSWORD || 'password' }), signal: AbortSignal.timeout(30000) });
  const data = await response.json(); assert.equal(response.status, 200, data.message); assert.equal(data.user.role, expected);
  try {
    const me = await fetch(base + '/auth/me', { headers: { Accept: 'application/json', Authorization: `Bearer ${data.token}` }, signal: AbortSignal.timeout(10000) });
    assert.equal(me.status, 200); assert.equal((await me.json()).user.role, expected);
    if (expected === 'campmanager') {
      const sos = await fetch(base + '/sos-requests', { headers: { Accept: 'application/json', Authorization: `Bearer ${data.token}` }, signal: AbortSignal.timeout(10000) });
      assert.equal(sos.status, 200); assert.ok(Array.isArray((await sos.json()).data));
    }
    results.push(`${expected}: live login, role, /auth/me verified`);
  } finally {
    const logout = await fetch(base + '/auth/logout', { method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${data.token}` }, signal: AbortSignal.timeout(10000) });
    assert.equal(logout.status, 200);
  }
}
await fs.mkdir('artifacts', { recursive: true });
await fs.writeFile('artifacts/api-report.json', JSON.stringify({ base, results }, null, 2));
console.log(JSON.stringify({ results }));
