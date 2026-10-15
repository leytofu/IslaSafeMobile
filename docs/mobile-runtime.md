# Running the mobile app

## Login from a physical phone

1. Connect the phone and development computer to the same Wi-Fi network.
2. In `backend`, run `composer serve:lan` (or
   `php artisan serve --host=0.0.0.0 --port=8000`). The default
   `php artisan serve` listens on the computer's loopback address, which a phone
   cannot reach.
3. In `mobile/.env`, set `EXPO_PUBLIC_API_BASE_URL` to
   `http://<computer-Wi-Fi-IPv4>:8000/api`. Use the computer's current Wi-Fi IPv4
   address; `127.0.0.1` and `localhost` refer to the phone itself, and `10.0.2.2`
   is for the Android emulator.
4. Fully reload the Expo app after changing the environment variable.
5. To check connectivity, open
   `http://<computer-Wi-Fi-IPv4>:8000/up` in the phone browser.
   The expected response is Laravel's application health page (HTTP 200).
   A connection timeout means the phone still cannot reach Laravel;
   check Wi-Fi isolation and the firewall's PHP/port 8000 access.

An Expo Metro tunnel exposes the JavaScript server, not the Laravel API.
Mobile accepts Resident and Camp Manager accounts; Admin accounts use the web
panel. Never share passwords to diagnose a connection problem.

## Native features

IslaSafe uses MapLibre and Google sign-in native modules. Open the IslaSafe
development app, rather than Expo Go, to use these features.

From the `mobile` folder, with an Android emulator or USB debugging device available:

```sh
npm run android
```

For later JavaScript-only changes, start Metro and open the installed IslaSafe app:

```sh
npm start -- --clear
```

Rebuild the development app after changing native dependencies. A Metro reload
cannot install missing native modules.

If the map displays "Map requires the IslaSafe development app", the running
binary does not include MapLibre's native camera or map module. Install the current
development build. The rest of the app remains available; this message does not
indicate that a native map has been rendered or verified.

Google OAuth configuration is documented in [resident-auth.md](resident-auth.md).
