# Expo Go on a phone

Use Expo Go compatible with this project's Expo SDK 57. Keep the phone and
computer on the same Wi-Fi.

From `backend`, run `composer serve:lan`. If another backend server already owns
port 8000, stop that server first so the LAN server uses the expected port.
The regular Laravel default `127.0.0.1` listener only serves the computer.

From `mobile`, set `EXPO_PUBLIC_API_BASE_URL` in `.env` to
`http://<computer-Wi-Fi-IPv4>:8000/api`. Then run:

```powershell
npm start -- --clear
```

The start script selects Expo Go and LAN mode explicitly. Scan the QR code
printed by that process. If port 8081 is occupied, use
`npm start -- --clear --port 8083` and scan that process's QR code.
Reopen the project after changing `.env` so the embedded API URL is refreshed.

To distinguish network problems, open
`http://<computer-Wi-Fi-IPv4>:8000/api/evacuation-centers` in the phone's browser.
It should return JSON. If it does not, check the backend listener, current Wi-Fi
address, Windows firewall rules for PHP/Node, and Wi-Fi client isolation.
An Expo tunnel only tunnels Metro; it does not expose the Laravel API.

## Expo Go behavior

The root layout releases the native splash before mounting the session, GPS and
animated onboarding providers. This avoids holding Android's pre-draw gate while
the UI-thread animation runtime is starting. Startup ordering is covered by
`tests/startup-splash.test.ts`. Do not make splash release depend on a GPS fix or
on the onboarding animation's completion callback.

Onboarding also has a JavaScript completion deadline and explicit final visible
styles. Role selection has a guarded navigation deadline, so a stalled native
animation cannot keep the welcome controls invisible or block sign-in.

## Android emulator recovery

For Expo Go on an attached Android emulator, use the port printed by Metro:

```powershell
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent
```

If Android itself hangs or reports System UI errors, cold boot the AVD without
loading its saved snapshot. Software graphics can help when hardware graphics
is unstable. This session recovered Pixel_6 with `-no-snapshot-load
-no-snapshot-save -gpu software`; installed apps and data were retained. These
were launch flags, not permanent AVD configuration changes. The older installed
custom development build still stalled; Expo Go reached the welcome and Resident
sign-in screens. A custom build needs its own native startup investigation.

## Supported features

- Residents and camp managers can choose a profile image from the gallery or
  camera, preview it, then explicitly save it. Images are resized to a maximum
  edge of 1024 px, converted to JPEG, and checked against the 2 MB backend limit.
  Upload uses authenticated multipart POST with Laravel's PATCH method override.
  The saved URL is restored with the account and displayed in profile summaries
  and the resident account bar. Loading the image bytes still needs connectivity.
  The picker and manipulator are included in Expo Go; older custom development
  builds need rebuilding after these native dependencies are added.
  `tests/profile-photo.test.ts` covers preparation and multipart data;
  `scripts/profile-photo-review.mjs` checks preview, discard, retry and themes.
  Test camera permission and the system picker on a physical phone as well.
  Choosing and previewing a local photo does not require internet access or a
  verified session. Saving requires verification; an inline verification action
  is available beside the pending photo. The device's external-internet probe
  must not disable the gallery when the Laravel API is reachable over local Wi-Fi.

- Secondary screens keep a labeled Back control above the scrolling content.
  It uses Expo Router history, or returns directly opened screens to the resident
  dashboard, camp dashboard, or public welcome screen. SOS and settings handle
  their inner steps first. The SOS picker keeps Back visible while scrolling.
  Navigation behavior is covered by `tests/back-navigation.test.ts`; the mobile
  layout check is `scripts/sos-picker-review.mjs`.

- Maps select the WebView fallback without importing unavailable native MapLibre.
- Hazard references resolve `require()` assets through Metro. The custom Android
  build retains embedded drawable names. Expo Go needs Metro connectivity to load
  uncached images; its offline cache is not guaranteed.
- Email/password sign-in, SecureStore token persistence and the mobile advisory
  inbox use the same Laravel API. Google sign-in needs a custom development build
  and returns a clear fallback message before any unsupported native import.
- In-app advisories work in Expo Go. Remote OS push notifications remain inactive.

Validation: `npm run doctor`, `npx expo install --check`, `npm run typecheck`,
`npm run lint`, `npm test`, and `npm run bundle:android`. A successful bundle
does not prove physical-phone rendering or Wi-Fi reachability from that phone.

References: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[Expo Go runtime detection](https://docs.expo.dev/versions/v57.0.0/sdk/expo/),
[Expo assets](https://docs.expo.dev/versions/v57.0.0/sdk/asset/).

Navigation reference (looked up through Context7):
[Expo Router navigation](https://docs.expo.dev/router/basics/navigation/).
