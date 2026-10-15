import { Platform } from "react-native";
import { api, publicApi } from "./api";

let inProgress = false;

/** Tokens live only for this request; only the Sanctum session is persisted. */
export async function googleProof(purpose: "login" | "link" | "password") {
  if (inProgress) throw new Error("Google sign-in is already in progress.");
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) throw new Error("Google sign-in is not configured. Use email and your IslaSafe password.");
  if (Platform.OS === "web") throw new Error("Google sign-in is available in the Android and iOS development builds.");
  inProgress = true;
  let native: typeof import("react-native-nitro-google-signin") | undefined;
  try {
    try {
      native = await import("react-native-nitro-google-signin");
    } catch {
      throw new Error("Google sign-in requires a rebuilt IslaSafe development app with the Google native module.");
    }
    const { data: challenge } = purpose === "login"
      ? await publicApi.post<{ challenge_id: string; nonce: string }>("/auth/google/challenge")
      : await api.post<{ challenge_id: string; nonce: string }>("/auth/google/reauth-challenge", { purpose });
    native.GoogleOneTapSignIn.configure({
      webClientId,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      nonce: challenge.nonce,
      offlineAccess: false,
      autoSelectOnSignIn: false,
    });
    await native.GoogleOneTapSignIn.signOut();
    await native.GoogleOneTapSignIn.checkPlayServices();
    const result = await native.GoogleOneTapSignIn.presentExplicitSignIn();
    if (native.isCancelledResponse(result)) throw new Error("Google sign-in was cancelled. You can try again or use your IslaSafe password.");
    if (!native.isSuccessResponse(result)) throw new Error("Google sign-in did not complete. Please try again.");
    return { challenge_id: challenge.challenge_id, id_token: result.data.idToken };
  } catch (error) {
    if (native?.isErrorWithCode(error)) {
      if (error.code === native.statusCodes.SIGN_IN_CANCELLED)
        throw new Error("Google sign-in was cancelled. Please try again when ready.");
      if (error.code === native.statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
        throw new Error("Google Play Services needs to be installed or updated.");
      if (error.code === native.statusCodes.DEVELOPER_ERROR)
        throw new Error("Google sign-in configuration needs attention. Use email and your IslaSafe password.");
    }
    throw error;
  } finally {
    await native?.GoogleOneTapSignIn.signOut().catch(() => {});
    inProgress = false;
  }
}
