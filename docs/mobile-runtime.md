# Running the mobile app

## Login from a phone or Android emulator

1. Connect the phone and development computer to the same Wi-Fi network.
2. In `backend`, run `php artisan serve --host=127.0.0.1 --port=8000`.
3. In `mobile/.env`, leave `EXPO_PUBLIC_API_BASE_URL=` blank and set
   `ISLASAFE_API_UPSTREAM=http://127.0.0.1:8000`.
4. In `mobile`, run `npm start`. Scan this server's QR code on the phone.
   Restart Metro after changing its proxy configuration or upstream address.
5. The app automatically uses its Metro host for `/api` requests. Metro forwards
   `/api` and `/storage` to Laravel. The same connection serves the app, bearer
   authentication and profile photos, without requiring inbound PHP access.
6. On an emulator using `exp://127.0.0.1:8081`, restore forwarding after each
   emulator restart: `adb reverse tcp:8081 tcp:8081`. Substitute the actual Metro
   port if different. A physical phone must use the QR code's LAN address.
7. To check phone connectivity, open
   `http://<computer-Wi-Fi-IPv4>:<Metro-port>/api/evacuation-centers` in its browser.
   JSON confirms the full path to Laravel. A JSON 502 means Laravel is stopped;
   a timeout means the phone cannot reach Metro (check Wi-Fi/firewall access).

An explicit `EXPO_PUBLIC_API_BASE_URL` overrides this development proxy. Use it
for a hosted API or a direct LAN listener; direct LAN access requires permitting
PHP through the firewall. Bundled apps without Metro still need a reachable API
URL. The proxy only runs in the development server.
Mobile accepts Resident and Camp Manager accounts; Admin accounts use the web
panel. Never share passwords to diagnose a connection problem.

## Expo Go and optional native maps

From `mobile`, run `npm start -- --clear` and open the project in Expo Go.
Maps use the bundled WebView renderer in Expo Go. Email/password authentication
does not require a custom development build.

If an older installed development app lacks `RNCWebViewModule`, the map shows an
availability message while the rest of the screen remains usable. Rebuild and
reinstall with `npm run android` to restore maps. For Expo Go, use the version
matching SDK 57. The WebView entry point is loaded only after its native module
is detected, preventing a missing-module exception during route discovery.

For native MapLibre, build the optional development app with `npm run android`
and start Metro with `npm run start:dev-client -- --lan --clear`.
Rebuild that app after changing native dependencies.

See [Expo Go checks](EXPO_GO_CHECK.md) and [phone maps](PHONE_MAP_SETUP.md).
