# Resident authentication setup and verification

## Current mobile signup

Mobile login and resident signup use email and an IslaSafe password. The
Continue with Google button and the new Google-linking entry have been removed.
Resident signup follows four steps: full name, email, password and confirmation,
then review. Only the final Create account action calls `/auth/register`.
Successful registration continues to the existing barangay/address profile screen.
Camp Managers still use administrator-issued email/password accounts.

Resident and Camp Manager login uses Sanctum personal access tokens, stored with
Expo SecureStore. Remember me is enabled by default, so reopening the app restores
and verifies the saved token with `/auth/me`. Users may uncheck it for an in-memory
login. Logout deletes the saved token and revokes it on the server. Admin web uses
HttpOnly session cookies instead; see [authentication setup](../../backend/docs/authentication.md).

The backend Google endpoints, provider identities, and existing account records
remain intact. The Google configuration below documents the existing integration
and the password-setup path for legacy linked accounts; it is not required for
the current email/password signup screens.

The native form follows React Native TextInput guidance retrieved through
Context7 and the question-page/check-answers approach:
- https://reactnative.dev/docs/textinput
- https://design-system.service.gov.uk/patterns/question-pages/
- https://design-system.service.gov.uk/patterns/check-answers/

## Existing authentication integration

The backend uses Laravel 13 / Sanctum. The mobile project uses Expo 57,
React Native 0.86, and React 19.2.3. Google sign-in uses
react-native-nitro-google-signin 2.3 (Android Credential Manager / iOS Google
Sign-In), react-native-nitro-modules 0.37, and google/auth 1.55 on Laravel.
The existing resident role identifier is **residents**, not a new role alias.
Admin and Camp Manager sign-in remains email/password only.

## Google Cloud configuration you must supply

Create OAuth clients in the same Google Cloud project and configure the OAuth
consent screen, test users (while in testing), support email, and application
privacy information. Basic identity scopes only; no Google API offline access
or Google password is requested.

1. Create a **Web application** OAuth client. Its client ID is the token
   audience. Set backend .env GOOGLE_WEB_CLIENT_ID and mobile .env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to this same ID.
2. Create an **Android** OAuth client for package ph.islasafe.mobile and
   register the SHA-1 fingerprints of every development / EAS signing
   certificate you will use. Register Play App Signing fingerprints before
   store testing. Android client IDs are registered in Google Cloud, not
   used as the Web client ID.
3. Create an **iOS** OAuth client for bundle ID ph.islasafe.mobile. Set
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID. Set GOOGLE_IOS_URL_SCHEME to its reversed
   client ID (com.googleusercontent.apps.<ios-client-prefix>). Supply these
   before enabling the native config plugin with the Web client ID.

Client IDs are public identifiers. **No OAuth client secret is needed** for
this native ID-token flow. Never place a client secret or service-account key
in EXPO_PUBLIC_ variables, app config, or source control. Local .env files are
ignored. No Firebase project or Google services files are required.

Backend (from backend):

~~~sh
composer install
php artisan migrate
php artisan config:clear
~~~

Set the normal MySQL connection variables in your backend environment. The
migration makes local passwords nullable, adds a unique Google subject,
self-reported barangay/address, a separate residency-verification timestamp,
and one-time nonce challenges. Migration rollback intentionally leaves
passwords nullable so existing Google-only accounts remain usable.

Mobile (from mobile):

~~~sh
npm ci
npx expo run:android
# Or build an iOS development client / configured EAS development build.
~~~

A **new native development build is required**; Metro reload and Expo Go do not
install the Google native module. The existing local-development-only build
restriction is preserved. Match the backend URL to your device and use HTTPS
outside local development. Configure real SMTP for existing OTP recovery.
For an iOS 27 / Xcode 27 build, follow the library's SDK 57 scene-lifecycle
guidance before device validation; the project currently targets its existing
Expo SDK defaults and has not been built against that toolchain here.

References:
- https://docs.expo.dev/guides/google-authentication/
- https://react-native-nitro-google-sign-in.github.io/docs/setup/expo/
- https://react-native-nitro-google-sign-in.github.io/docs/guide/usage/
- https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

## Account behavior

- Google sign-in obtains a five-minute server nonce, opens explicit Google UI,
  and submits the signed ID token with the challenge ID. The backend verifies
  Google's keys, audience, issuer, expiry, issuance time, verified email, subject,
  and nonce. Challenges are single-use and consumed transactionally.
- New Google accounts have **no local password**. Google email verification
  does not establish verified Pitogo residency. Profile completion asks for
  name, barangay, address, and optional contact number; address is self-reported.
- Returning users are found by Google subject, even if Google changes their
  email. Existing local email/profile/related records are preserved.
- A matching existing email never silently links. Sign in with the existing
  IslaSafe password, open Profile > Link Google, enter that current IslaSafe
  password, then choose the matching Google email. Both identities must be
  authenticated. An already-linked Google identity cannot move to another user.
- Profile > Set IslaSafe Password uses an authenticated, session-bound,
  purpose-bound nonce and new explicit Google authentication for the same subject.
  The token must be recent. The password is hashed by Laravel on the existing
  user. Password/confirmation are never sent to Google. Once set, both login
  methods use the same user ID. This endpoint cannot replace an existing password.
- Existing passwords use the existing OTP recovery flow. Email recovery cannot
  provision the first password on a Google-only account.
- The app persists only the Sanctum token in SecureStore and profile data in
  its existing encrypted vault. Google tokens are transient and native Google
  sign-in state is cleared after each attempt. Logout retains the existing
  local cleanup and current-token revocation behavior. Offline logout clears
  the device but cannot promise remote revocation until the API is reachable.

## Device acceptance checklist (requires your OAuth configuration)

1. New Google account: choose Resident > Continue with Google; complete profile.
   Confirm role stays residents and resident_verified remains false.
2. Logout and return with Google: same user ID, address, and related records.
3. Google-only: email/password login fails. Use Continue with Google.
4. Set IslaSafe Password: cancel Google UI (no change), choose wrong Google
   account (rejected), then choose the correct account (success). Logout and
   verify both login methods reach the same resident profile.
5. Existing email/password resident: Google sign-in reports the need to link.
   Authenticate normally, link in Profile with the existing IslaSafe password,
   then verify both login methods.
6. Try incorrect password, cancelled picker, no network, and expired session.
   Check safe messages, retry controls, and no duplicate submissions.
7. Confirm Admin and Camp Manager email/password flows still work and that
   Google options are absent from their sign-in screen.
8. Logout online: current backend token is revoked; another session remains.
   Logout offline: local protected screens are locked and the revocation
   limitation is shown.

Automated tests use locally generated RSA signing keys and fake Google JWKS,
not real Google credentials. They prove backend verification and account
invariants, but **do not constitute end-to-end Google provider verification**.

The backend also provides an isolated MySQL runner at
tests/run-google-mysql.php. It verifies Google flows and simultaneous signups
without resetting the application database.

The Expo dependency check reported existing SDK 57 patch updates available
for expo, expo-asset, expo-constants, expo-linking, expo-notifications, and
expo-router. These existing packages were preserved for this authentication
change; the newly installed native dependencies match React Native 0.86 and
Nitro Modules 0.37.
