# Resident mobile design

Visual source: resources/ui/IslaSafe_Resident_Mobile_App.html at the repository root. Neither resouces/ui/mobile nor resources/ui/mobile exists here.

The native resident dashboard, drawer, SOS entry, alerts, and settings follow the reference layout, cards, rounded navigation, spacing, and colors. AWS screens and menu entries are excluded. Existing authentication, account security, SOS review/submission, offline records, and session notices remain. Shared components use StyleSheet, existing icons, and light/dark theme tokens; no dependencies were added.

## Preview

From mobile, run npx expo start --web --port 8083, then open http://localhost:8083/dashboard-preview without signing in. Use the header sun/moon button to switch themes, and the menu to inspect each screen. The preview's bottom tabs are static; its menu and sample controls work locally. The equivalent native development-build path is islasafe://dashboard-preview.

Signed-in residents see the same dashboard and reference components. Theme changes persist through existing app state. Settings > Edit Profile or Account Security opens the existing profile/password/Google controls.

## Map

The native map shares the admin portal's OSM streets and Esri World Imagery basemap sources, Map/Satellite selector, zoom/reset controls, and evacuation center legend. It retains existing GPS, center details, and loading behavior. Focus-area and center-visibility controls filter existing center records. Exposure selection opens the bundled hazard image; these reference images are not georeferenced overlays. Private admin operational layers are not exposed to residents. Tile attribution remains visible.

The browser design preview uses a map illustration to show controls. Actual MapLibre rendering and device safe areas require a native development build.

## Placeholders

- Weather, advisories, hazard levels, center distance/capacity, and the green household safety example are labeled sample content. They do not report current conditions or submit a household check-in.
- Household members and emergency contacts are visual samples.
- Notification preferences and language choices change preview state only.
- Privacy and About screens are presentation copy for review.
- SOS shortcut icons and preview navigation are visual elements. Signed-in SOS preparation retains the existing review and submission flow.
- Dashboard location artwork and the browser map are illustrations.

## Main files

- src/components/dashboard/: dashboard presentation and navigation.
- src/components/ResidentMenu.tsx: resident drawer without AWS.
- src/components/ResidentReferenceViews.tsx: SOS, alerts, and settings views.
- src/components/ResidentDesignPreview.tsx: isolated screen/theme preview.
- src/theme/colors.ts and src/data/residentDashboard.ts: tokens and fixtures.
- src/components/ui.tsx: shared resident header and existing session notices.
- src/screens/{SosScreen,AlertsScreen,ProfileScreen}.tsx: presentation adapters.
- src/app/resident/{home,map}.tsx: resident entry points and map controls.
- src/components/IslandMap.tsx and src/lib/basemaps.ts: native map presentation.

## Verification

Run npm run typecheck, npm run lint, and npm test. An Android Expo export checks native JavaScript bundling, but does not establish device behavior.

scripts/dashboard-design-review.mjs captures light/dark dashboards at 320, 390, and 768 pixels and checks overflow/runtime errors. scripts/reference-mobile-review.mjs checks the drawer, both themes, seven resident views, alert filters, SOS preview preparation, settings details, map selector, and AWS exclusion. These scripts use PLAYWRIGHT_MODULE to point to the existing Playwright installation. Reports and screenshots are written under artifacts/ and are not committed.
# Resident account bar

The signed-in resident layout now uses a Discord-inspired bottom account bar:
avatar/name on the left and a notification bell on the right. The existing
upper-left resident menu remains the navigation entry for dashboard, map, SOS,
advisories, and other resources. The Expo routes are retained.

Tapping the account opens the existing profile/settings screen in an animated
bottom sheet. The bell opens Notifications and Advisories tabs in the same sheet
pattern. Notifications currently have an unavailable state; advisories reuse
the clearly labelled sample content. This change does not enable push delivery
or connect a new advisory API. There is no invented unread count.

The sheets use the installed Reanimated version, respect reduced motion, close
with the backdrop/close button/Android Back, and reserve safe-area space.
The standalone dashboard preview renders a visual-only version of the bar.

References researched through Context7 and official documentation:
- https://docs.swmansion.com/react-native-reanimated/examples/bottomsheet/
- https://docs.expo.dev/router/advanced/tabs/
- https://support.discord.com/hc/en-us/articles/40953848660759-You-Bar-FAQ

