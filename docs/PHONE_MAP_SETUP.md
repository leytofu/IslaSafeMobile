# Phone maps in Expo Go

Home and Hazard Map now work through **MapLibre GL JS 6.10.0 inside React Native WebView 13.16.1**, which is included in Expo Go for Expo SDK 57. Leaflet is not used. No custom APK is required for this map path.

## Open on your phone

1. Keep your phone and computer on the same Wi-Fi network.
2. From `mobile`, run `npm start -- --lan --clear`. The default start command now selects Expo Go. Scan the Expo Go QR code, or reopen the existing project and choose Reload.
3. From `backend`, run `composer serve:lan`. Keep `EXPO_PUBLIC_API_BASE_URL` in `mobile/.env` pointed at the computer’s current LAN IP plus `:8000/api`.
4. Open Home or Hazard Map. Pan and pinch to zoom, switch Map/Satellite, tap a center for details, or choose Locate me. The app requests foreground location permission automatically on launch when needed; denial does not block the app. GPS coordinates are read only when you choose Locate me or explicitly capture GPS for an SOS.

MapLibre JavaScript, its worker, CSS, and license are bundled locally. Map tiles need internet access; evacuation-center locations and occupancy need the Laravel server. No Google Maps API key is required. The app does not load scripts from a CDN, put authentication tokens into the map, or inject center names as HTML. GPS permissions are handled through Expo Location rather than WebView geolocation.

Both light and dark app themes are supported. Updates to centers preserve the map viewport. Existing hazard reference images remain separate because their geographic alignment has not been verified; no evacuation routing is claimed.

## Optional native development app

A custom IslaSafe app that already contains MapLibre React Native continues to use its native map. Start its server with `npm run start:dev-client -- --lan`. This is optional; Expo Go uses GL JS automatically whenever the native MapLibre modules are absent. The previous ARM64 APK is not required for Expo Go.

## Maintain the local map assets

After changing the pinned MapLibre GL JS version, run `node scripts/update-map-assets.mjs` and retain `src/lib/maplibre.LICENSE.txt`. The script bundles the main module and worker into browser-compatible local assets; it does not import the browser library into the React Native runtime.

## Verification

The map document and its actual WebView bridge messages have been checked in a browser with real satellite tiles, center selection, center updates, GPS messaging and theme changes. Native-module routing tests confirm that Expo Go chooses this document without importing native MapLibre. Physical-phone rendering and permissions still require confirmation on the phone; browser checks are not a claim of end-to-end phone verification.

## Location privacy

The startup prompt only requests foreground permission. It does not obtain, store, or upload coordinates. Home/Hazard Map GPS markers stay in component memory and the local map document; the app does not post them to Laravel, update a resident location field, or stream them to Admin. Existing SOS requests are a separate explicit submission flow and currently include their entered/captured coordinates for responders. No background location permission or tracking was added.
