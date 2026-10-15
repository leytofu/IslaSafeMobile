# IslaSafe mobile onboarding implementation

Date: 2026-10-14

## Delivered behavior

- A single navy onboarding surface connects the cinematic introduction and role selection. The existing municipality emblem, web title-to-year motif, staggered letters/digits, progress line, and design tokens are reused.
- A 3.3-second Reanimated timeline reveals the brand, morphs to the current year, restores the title, moves and scales the brand upward, then reveals the welcome heading, subtitle, Resident card, and Camp Manager card in sequence.
- Cards provide native animated press scaling, a selected border, duplicate-tap protection, and a coordinated fade into the role-specific authentication screen.
- Residents can sign in or register. Camp Managers can sign in with assigned accounts and recover passwords. The returned backend role must match the selected role before a new session is saved.
- The first launch plays the intro. Completion or skipping stores a non-sensitive onboarding marker. Ordinary returns to role selection do not replay it. Logout queues a replay, including across an app restart.
- Native tokens remain in Expo SecureStore. Startup validates `/auth/me` before any dashboard can render. Supported verified roles go directly to their own dashboards.
- Invalid tokens are cleared. Network or server failures retain tokens for verification retry but keep dashboards locked. Guest SOS, encrypted saved emergency records, bundled guides, and hazard references remain accessible.
- Logout invalidates pending account responses, clears the token and account cache, then starts server revocation without waiting for the network. Existing SOS records remain intact.
- Skip Intro and guest SOS are available during the introduction. Guest SOS is also available during startup validation and while a sign-in request is pending.
- Reduced motion bypasses the cinematic sequence. Screen readers also bypass it. Backgrounding settles the intro instead of replaying it; interrupted role navigation is cancelled. Animated values and listeners are cleaned up on unmount.

## Verification

| Check | Result |
| --- | --- |
| Expo compatibility | Installed Reanimated 4.5.1 and Worklets 0.10.1 match SDK 57's bundled versions; no new dependencies |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test` | 18 tests passed |
| `npm run bundle:android` | Android Hermes bundle and worklets compiled successfully |
| Local backend smoke test | Resident and Camp Manager login, exact role, `/auth/me`, and logout passed |
| Android visual interaction and frame-rate profiling | Pending; emulator connected, but the UI tool exposes no controllable surface |

Session tests cover absent credentials, delayed backend validation, role routing, expired tokens, unsupported roles, offline/timeouts/server failures, secure storage errors, local logout ordering, and revocation outages. Existing SOS tests cover durable records, uncertain sends, duplicate submission prevention, and persistence failures.

The SDK compatibility reference is [Expo SDK 57 Reanimated documentation](https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/). Compiler-compatible shared value access follows [Reanimated useSharedValue documentation](https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/).

## Remaining device acceptance checks

1. Fresh install: observe the complete title/year/brand docking sequence and staggered cards; check for clipping, flashes, and abrupt layout changes on a small Android screen.
2. Skip Intro at several stages. Open guest SOS before the intro finishes. Return from SOS or a guide and confirm the intro does not restart.
3. Verify Resident sign-in and registration, Camp Manager sign-in only, recovery, and a mismatched-role account rejection.
4. Restart with a valid secure token for each role and confirm direct dashboard entry without a role/login flash.
5. Logout online and offline; confirm the cinematic replay and retained SOS records. Restart immediately after logout and confirm the replay marker survives.
6. Launch with an expired token or unavailable backend; confirm protected content never appears and public emergency resources remain usable. Reconnect and verify a retained session.
7. Enable reduced motion and TalkBack. Increase text size. Background during the intro and during a card transition, then resume.
8. Profile the native animation on a mid-range Android device. The implementation uses UI-thread transforms/opacity and no JavaScript frame timer; 60 FPS has not been measured in this session.

Android bundle compilation and API tests do not establish visual quality, physical-device frame rate, or complete navigation acceptance. Those checks remain explicitly pending.
