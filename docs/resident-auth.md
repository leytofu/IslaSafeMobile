# Resident authentication setup and verification

## Current mobile signup

Mobile login and resident signup use email and an IslaSafe password. The
Continue with Google button and the new Google-linking entry have been removed.
Resident signup follows three steps: full name, email, then password and
confirmation. The final password-step Create account action validates all fields
and calls `/auth/register` directly. There is no review screen or Edit action.
Back from the password step returns to sign in. Backend field errors can reopen
the invalid step for correction while keeping entered values. Network/server
failures keep the password step and all values available for an explicit retry.
An immediate request lock and a completed-authentication guard prevent repeated
taps from issuing duplicate submissions during the request or before redirect.
Successful registration continues to the existing barangay/address profile screen.
Camp Managers still use administrator-issued email/password accounts.

Sign in places Remember Me and Forgot Password on one row below the password,
with the full-width Sign In action directly below. Shared inputs use focus
borders, appropriate autofill/keyboard types and password visibility controls.
Both forms scroll when space is limited, compact their layout when the Android
keyboard is visible, and respect reduced motion for entrance transitions.

Documentation researched through Context7 before implementation:
[React Native form UX](https://reactnative.dev/docs/improvingux),
[accessibility](https://reactnative.dev/docs/accessibility),
[Expo keyboard handling](https://docs.expo.dev/guides/keyboard-handling), and
[Expo Router redirects](https://docs.expo.dev/router/reference/redirects/).
The existing SDK 57 modules and Expo Router were retained; no dependencies or
backend endpoints were added.

Resident and Camp Manager login uses Sanctum personal access tokens, stored with
Expo SecureStore. Remember me is enabled by default, so reopening the app restores
and verifies the saved token with `/auth/me`. Users may uncheck it for an in-memory
login. Logout deletes the saved token and revokes it on the server. Admin web uses
HttpOnly session cookies instead; see [authentication setup](../../backend/docs/authentication.md).

Google sign-in, signup, account linking, and provider reauthentication have been
removed from the mobile app, together with the native Google/Nitro dependencies
and OAuth configuration. Existing account records and backend endpoints are
unchanged. Accounts without a local password need administrator assistance;
mobile does not offer a provider-based password setup flow.

Password changes for existing password accounts use the email OTP recovery flow.
The backend uses Laravel 13 / Sanctum; supported mobile roles remain `residents`
and `campmanager`.

## Authentication UI verification (2026-10-19)

- Typecheck, lint and all 65 automated tests passed, including the actual auth
  screen's final submission, duplicate-tap lock, server field correction, retry
  preservation and Remember Me behavior (`tests/auth-flow.test.ts`).
- `scripts/auth-ui-review.mjs` checked light/dark themes at 320, 390, 430 and
  768 px widths, option-row alignment, password visibility, login errors,
  recovery entry, all three registration steps, loading, repeated taps, 503 and
  422 retries, and successful navigation to the existing profile-completion flow.
  Browser API requests were mocked; no real account was created.
- Playwright MCP was attempted but its configured Chrome executable was absent.
  The same browser checks used the installed Microsoft Edge through Playwright.
  Screenshots and the report are in ignored `artifacts/auth-ui/`.
- Android Expo Go on Pixel_6 confirmed the real native input focus border,
  keyboard-visible Sign In/option-row layout, and progression through name,
  email and password. Native screenshots/XML are in `artifacts/native/auth-*`.
  No new backend account or database change was used for this verification.
