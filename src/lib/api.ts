import { create, isAxiosError } from "axios";
import Constants from "expo-constants";
import { NativeModules } from "react-native";
import { resolveApiBaseUrl } from "./api-address";

const developmentHost = __DEV__
  ? Constants.expoConfig?.hostUri ?? NativeModules.SourceCode?.scriptURL
  : undefined;
export const api = create({
  baseURL: resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL, developmentHost),
  timeout: 20000,
  headers: { Accept: "application/json" },
});
export const publicApi = create({
  baseURL: api.defaults.baseURL,
  timeout: 20000,
  headers: { Accept: "application/json" },
});
let accessToken: string | null = null;
export function setAccessToken(value: string | null) {
  accessToken = value;
}
api.interceptors.request.use((config) => {
  if (!accessToken) throw new Error("Sign in before using account actions.");
  config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});
export function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const errors = error.response?.data?.errors as
      Record<string, string[]> | undefined;
    if (errors) return Object.values(errors).flat().join("\n");
    if (error.response?.data?.message) return error.response.data.message;
    if (!error.response)
      return "Cannot reach the server. Check your connection and the local Laravel server.";
  }
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
export function invalidAuth(error: unknown) {
  return isAxiosError(error) && error.response?.status === 401;
}
export function isCurrentSessionRequest(error: unknown) {
  return isAxiosError(error) && Boolean(accessToken) && error.config?.headers.get("Authorization") === `Bearer ${accessToken}`;
}
