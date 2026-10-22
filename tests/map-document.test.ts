import { test } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { createMapDocument, mapCommandScript, mapCredit, validMapCoordinate, type MapDocumentState } from "../src/lib/mapDocument";

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

test("WebView camera centers and zooms once; GPS movement reuses location and shelter markers", () => {
  const moves: Record<string, unknown>[] = [];
  const markers: { coordinate?: number[]; removed?: boolean; element?: { onclick?: () => void } }[] = [];
  const messages: { type: string; id?: number }[] = [];
  const elements = new Map<string, Record<string, unknown>>();
  const element = () => ({ className: "", setAttribute() {}, style: { setProperty() {} }, dataset: {} });
  const window: { IslaSafeMap?: { dispatch: (command: unknown) => void }; ReactNativeWebView: unknown; addEventListener: unknown } = {
    ReactNativeWebView: { postMessage: (json: string) => messages.push(JSON.parse(json)) }, addEventListener() {},
  };
  const html = createMapDocument("light");
  const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"));
  runInNewContext(script, {
    window, document: { documentElement: element(), addEventListener() {}, createElement: element, getElementById(id: string) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); } },
    URL: { createObjectURL: () => "blob:worker" }, Blob: class {},
    maplibregl: {
      setWorkerCount() {}, setWorkerUrl() {}, NavigationControl: class {}, AttributionControl: class {},
      Map: class { addControl() {} on() {} setStyle() {} easeTo(options: Record<string, unknown>) { moves.push(options); } },
      Marker: class {
        marker: typeof markers[number];
        constructor(options: { element: typeof markers[number]["element"] }) { this.marker = { element: options.element }; markers.push(this.marker); }
        setLngLat(coordinate: number[]) { this.marker.coordinate = coordinate; return this; }
        addTo() { return this; } remove() { this.marker.removed = true; }
      },
    },
  });
  const state: MapDocumentState = { centers: [{ id: 7, name: "Shelter", latitude: 10.1, longitude: 124.5, place: { id: 1, barangay: "Pitogo", municipality: "CPG" }, current: 1, capacity: 10, available: 9, status: "operational" }], selectedCenterId: null, theme: "light", coordinate: [10.12, 124.57], locating: false };
  const dispatch = window.IslaSafeMap!.dispatch;
  dispatch({ type: "update", state });
  dispatch({ type: "locate", latitude: 10.12, longitude: 124.57 });
  assert.deepEqual(JSON.parse(JSON.stringify(moves.at(-1))), { center: [124.57, 10.12], zoom: 16, duration: 650 });
  assert.equal(markers.length, 2);
  dispatch({ type: "update", state: { ...state, theme: "dark", coordinate: [10.13, 124.58] } });
  assert.equal(markers.length, 2, "GPS/theme changes must not recreate shelter markers");
  markers[0].element!.onclick!(); assert.deepEqual(messages.at(-1), { type: "center", id: 7 });
  dispatch({ type: "locate", latitude: NaN, longitude: 124.57 });
  assert.equal(moves.length, 1, "Invalid coordinates must not move the camera");
  dispatch({ type: "update", state: { ...state, coordinate: null } });
  assert(markers[1].removed, "Permission/pause clears the GPS marker");
});
