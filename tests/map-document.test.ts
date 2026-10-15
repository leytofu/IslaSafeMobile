import { test } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { mapCommandScript, mapCredit, validMapCoordinate, type MapDocumentState } from "../src/lib/mapDocument";

test("map bridge serializes hostile center names as data without executing code", () => {
  const state: MapDocumentState = {
    centers: [{ id: 1, name: '</script><script>hijacked=true</script>\u2028', latitude: 10.109, longitude: 124.562, place: { id: 1, barangay: "Pitogo", municipality: "CPG" }, current: 0, capacity: 10, available: 10, status: "operational" }],
    selectedCenterId: 1, theme: "light", coordinate: null, locating: false,
  };
  let received: unknown;
  const script = mapCommandScript({ type: "update", state });
  assert.ok(!script.includes("</script>"));
  runInNewContext(script, { window: { IslaSafeMap: { dispatch: (command: unknown) => { received = command; } } } });
  assert.equal(JSON.stringify(received), JSON.stringify({ type: "update", state }));
});

test("GPS accepts real coordinates and rejects nonfinite or out-of-range values", () => {
  assert.ok(validMapCoordinate(10.109, 124.562));
  for (const pair of [[NaN, 124], [10, Infinity], [91, 124], [10, 181]]) assert.equal(validMapCoordinate(pair[0], pair[1]), false);
});

test("map attribution only opens the configured provider URLs", () => {
  assert.equal(mapCredit("map"), "https://www.openstreetmap.org/copyright");
  assert.ok(mapCredit("satellite")?.startsWith("https://www.esri.com/"));
  for (const key of ["__proto__", "constructor", "javascript:alert(1)", {}, null]) assert.equal(mapCredit(key), null);
});
