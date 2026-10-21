# Mobile navigation

## Layout

`src/app/_layout.tsx` owns the root Stack. The URL-transparent `(main)` group
owns the Expo Router Drawer. Resident sections remain Tabs; camp sections use
Tabs inside a Stack so `/camp/register` is a genuine detail route. Existing
URLs, authentication routes and the welcome screen are preserved.

`AppDrawerContent` uses the drawer navigator's nested `navigate` action to
select existing routes and close the drawer together. Drawer and Tab history
use `backBehavior="history"`; switching sections does not push Stack entries.
The active destination follows `usePathname()`.

## Headers and Back

`NavigationHeader` supplies the shared themed header with 48-point touch
targets. Authenticated main destinations listed in `lib/navigation.ts` show
the hamburger immediately, independently of navigation history. An explicit
`onBack` marks an inline detail step and retains Back. Other detail routes and
public guides retain Back with the existing fallback behavior.

`useDetailBack` handles focused inline details on Android and unsubscribes on
blur. Navigator history handles section changes and closing the open drawer.
Existing preview navigation and household sheets are retained.

Android uses standard system Back (`predictiveBackGestureEnabled: false`). In
the installed development runtime, enabling predictive Back bypassed the
existing navigation handlers and exited from public Guides. Keep standard Back
for the current Drawer/Stack and inline detail flow.

## Dependencies and checks

Drawer imports use `expo-router/drawer`; navigation actions use Expo Router's
bundled React Navigation exports. `GestureHandlerRootView` wraps the app.
Gesture-handler is an explicit SDK-compatible `~2.32.0` dependency. The
installed Expo Go 57.0.9 APK exposes the matching native API (`install` and
`updateGestureHandler`); the previously transitive 3.3 dependency expects a
different API. Stop Metro, clear its cache, and fully restart Expo Go after
changing native dependency versions. Rebuild an existing custom Android app
if its native dependencies differ from the installed JavaScript packages.

Run `npm test`, `npm run lint`, `npm run typecheck`, and an Android export.
The navigation tests exercise all resident/camp header classifications in both
themes, actual installed Drawer/Tab/Stack routers, duplicate prevention, and
focused detail Back handlers. `scripts/navigation-review.py` performs a native
resident walkthrough, theme checks, drawer selection, Android Back, and a
narrow-screen check without submitting account changes.

Verified on the Pixel 6 emulator in Expo Go 57.0.9: 17 native checks passed
(all seven resident sections in light and dark, profile detail Back, SOS picker
Back, and 320 dp width). Backend session/data requests returned HTTP 200 after
a cold start. Camp header/history behavior is covered by automated tests;
the native walkthrough uses the existing resident session. A physical phone
was not attached for this navigation walkthrough.

The Android x86_64 development APK was rebuilt and installed successfully with
the corrected dependency. Native startup, the existing Welcome screen, public
Guides with Back (and no hamburger), and Android system Back returning to
Welcome also passed (`scripts/navigation-review.py --public`, two checks).
For local builds,
set `ANDROID_HOME` to the installed Android SDK
directory (normally `%LOCALAPPDATA%/Android/Sdk` on this computer).

Architecture exploration used a scoped Graphify graph of route files
(135 nodes, 197 edges, no LLM calls). It is partial: re-export-only routes have
no symbols and imports outside the route corpus leave unresolved endpoints
(146 raw endpoints and 3 collapsed directed edges). Source and runtime checks
remain authoritative. Generated graph artifacts live under ignored artifacts,
outside Expo Router's route directory.

References: [Expo Drawer](https://docs.expo.dev/router/advanced/drawer/),
[nested navigation](https://reactnavigation.org/docs/nesting-navigators/),
[Drawer Navigator](https://reactnavigation.org/docs/drawer-navigator/).
