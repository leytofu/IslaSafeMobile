# Expo Router SDK 57 initial-link lifecycle patch

`expo-router+57.0.28.patch` fixes the error captured in
`.expo/dev/logs/start.log`: **Can't perform a React state update on a component
that hasn't mounted yet**, from `url.then` in `useLinking.native.js` and
`ContextNavigator` in `ExpoRoot.js`.

Upstream report: https://github.com/expo/expo/issues/49378

The SDK 57 `NavigationContainer` passes its state setter to the async initial-link
callback. The initial URL can resolve before React commits that container.
Queue this notification until the first effect instead. Keep initial navigation
state resolution and later deep links intact. A link already handled by the
mounted current route is not left flagged as unhandled. No warnings are hidden.

`npm install`/`npm ci` reapplies this patch through `postinstall`. Patch failure
stops installation rather than silently losing the workaround. When updating
Expo Router, review the upstream fix and remove the patch once the installed
version includes a verified equivalent. Do not upgrade Expo SDK solely to hide
this warning.

The patch was reapplied to Router 57.0.28 after checking that its upstream
navigation container still has the same initial-link lifecycle behavior.

`tests/router-initial-link.test.ts` runs the installed container against a
controlled React lifecycle to verify the before-commit race, normal deep links,
already handled links, discarded renders, and callbacks after unmount.

After applying or changing this dependency patch, restart Metro with
`npm start -- --clear` and reload the project in Expo Go.
