# IslaSafe verification — 14 October 2026

All work is local. No publishing, production deployment, cloud build, app-store signing, paid API, or live push configuration was performed. Backend source, migrations, and the admin frontend were not edited.

## Verified checks

| Check | Actual result |
| --- | --- |
| Existing Laravel regression suite | **45 passed, 164 assertions** (`php artisan test`, SQLite in-memory test configuration) |
| TypeScript | Passed (`npm run typecheck`) |
| ESLint | Passed after correcting JSX and replacing stale lint-cache behavior (`npm run lint`) |
| Mobile contract/reliability tests | **9 passed**: exact roles, field whitelist, coordinate validation, uncertainty classification, pre-send durability, storage failure, crash/restart retry refusal, double-send blocking, failed receipt persistence |
| Expo Doctor | **21/21 checks passed** |
| Expo dependency compatibility | `npx expo install --check`: dependencies up to date |
| Android JavaScript/assets export | Passed; includes all six supplied hazard references |
| Live Laravel API smoke | Resident and Camp Manager login, exact role values, `/auth/me`, Camp Manager SOS read access, and token revocation/logout passed against existing local accounts |
| HTML reference inspection | Playwright library with installed Edge: desktop and 390px screenshots, palette inspection, no page errors, no horizontal overflow |
| Browser app smoke | **8 scenarios passed**, no page errors, no horizontal overflow at 360px; mocked API responses explicitly identified as test data |
| Local Android build | Debug APK compiled and installed on **Pixel_6**, x86_64. Android build tools/platform 36, bundled Android Studio JDK. No EAS build used |
| Native Resident authentication | Passed against actual Laravel API; encrypted account/token persistence worked |
| Native process restart | Resident session restored after force-stop and relaunch; native encrypted account record decoded correctly |
| Native MapLibre | Pitogo basemap rendered. Screenshot shows actual OpenStreetMap island/roads, not a placeholder |
| Native GPS permission | Denial message, retry, foreground permission approval, simulated coordinate capture, recenter, and visible location marker verified |
| Native SOS receipt | Captured device UI and encrypted local record confirmed real backend receipt **SOS-2026-0548**, submission-time status Pending; test description explicitly says no real emergency |
| Native storage inspection | Captured account and SOS `.bin` files in application-private storage contained encrypted bytes; the test SOS plaintext marker was absent from the file bytes |
| Native offline hazard reference | First opened flooding reference and full original legend **with Metro stopped**; native resource rendering verified by screenshot |
| Native unavailable API | Resident account retained while port 8000 was unreachable; native Profile and SOS showed session-verification-unavailable state instead of logging out |
| Native theme control | Light-theme control exercised on Android; restart/persistence verification is limited by concurrent emulator input and is not claimed as a complete native test |

Browser tests do not prove native functionality. GPS coordinates were injected through the emulator's `geo fix` command; no physical GPS accuracy is claimed. The debug client needs Metro to load/reload JavaScript, independently of API/Internet access. Embedded image viewing was tested in the already-running application.

## Issues found and addressed

1. Playwright MCP could not initialize because its configured Chrome executable is absent. The suggested Chrome installation failed. Testing used the installed Edge browser with the Playwright library through CLI, not successful Playwright MCP execution.
2. Secure file replacement in SDK 57 is asynchronous and requires explicit overwrite. The implementation awaits replacement and authenticates the written ciphertext; failed pre-send persistence prevents transmission.
3. Windows Ninja rejected a generated C++ filename longer than 260 characters. A checked-in Expo config plugin shortens CMake staging to `mobile/.c/`; a subsequent debug build succeeded. Generated native sources were not edited by hand.
4. Development-only `require()` assets can depend on Metro. All six PNGs are embedded through `expo-asset` and Android uses local drawable names, preserving original images/legends.
5. A missing native `SplashScreenManager` class was discovered in development-client startup logs. SDK-compatible `expo-splash-screen` and `expo-system-ui` are installed and configured. Incremental SDK 57 prebuild uses `--no-clean`; the corrected build succeeded in 1m 49s with cached native outputs.
6. A native Fabric SIGSEGV was captured in `MountingCoordinator::pullTransaction`. Its signature matches an [upstream native-screen lifecycle report](https://github.com/software-mansion/react-native-screens/issues/4654), which is a lead rather than proof of causation. The documented JavaScript-view navigation fallback cold-launched successfully and supported subsequent offline reference viewing. Native stack navigation remains disabled.
7. adb transport stalled during testing, including its basic health command. Restarting adb restored the connection. Accessibility snapshots were not treated as successful when their calls timed out.
8. The SOS review dialog is scrollable for long descriptions. Button actions dismiss the keyboard through React Native rather than sending Android Back navigation events.
9. UIAutomation may return without writing a fresh hierarchy when Android cannot reach idle. Test helpers now use unique dump filenames and require a successful dump before acting; failed/stale actions are not counted as passes. Emulator input changed outside scripted test values, so current form contents were preserved during final verification.

## MCP usage

| Server | Execution and limitation |
| --- | --- |
| Context7 | `resolve_library_id` and `query_docs` executed for Expo, MapLibre, Axios, React Native, and React Native Screens. Verified installation/configuration, secure storage constraints, native asset embedding, location/forms, and navigation fallback. Registry metadata and installed version/type definitions supplemented official documentation |
| Playwright MCP | `browser_navigate` and `browser_run_code_unsafe` attempted; initialization failed due to missing Chrome. No successful MCP browser test is claimed |
| JEV | Tool definitions inspected; `jev_audit` attempted on extracted backend contracts. It returned missing provider credentials. No audit verdict or project/test execution is claimed |

## Remaining limitations and coverage

- Full offline interactive basemap, georeferenced overlays, evacuation routes, official alerts, center assignments/occupancy/facilities, and evacuee APIs are unavailable. See [BACKEND_DEPENDENCIES.md](BACKEND_DEPENDENCIES.md).
- Push notifications are inactive; FCM configuration and backend support are absent.
- OTP recovery is implemented and covered by existing backend tests; native delivery to a real mailbox was not tested and depends on local mail configuration.
- A live native profile update, physical-device GPS, extended performance/soak testing, and all Android screen-size/font-scale combinations are not established by the above results.
- Native Camp Manager tab-by-tab testing and a complete native offline-SOS uncertainty/reconnection cycle remain unverified. Camp Manager API authentication and browser navigation passed; offline SOS state/durability/retry behavior passed the 9-test mobile suite and mocked browser scenarios. No browser result is promoted to a native result.
- The latest dependency installation reported **30 audit findings (19 high, 11 moderate)**, including framework dependency chains. No unsafe forced audit downgrade or upgrade was applied; these findings remain open for review within the SDK-compatible dependency set.
- The native test SOS remains in the local backend as a clearly labeled capstone test record. Local deletion does not cancel server records. No test center occupancy, evacuee records, or official warnings were inserted.

Local screenshots/reports are under ignored `artifacts/browser/` and `artifacts/native/`. The emulator debug APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`; it targets the emulator architecture. Rebuild locally for a physical device rather than assuming that APK is universal.
