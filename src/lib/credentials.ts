import * as SecureStore from "expo-secure-store";
export async function readToken() {
  return SecureStore.getItemAsync("islasafe.token");
}
export async function saveToken(token: string) {
  if (new TextEncoder().encode(token).length > 1800)
    throw new Error("Authentication token exceeds the secure storage budget.");
  await SecureStore.setItemAsync("islasafe.token", token);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync("islasafe.token");
}
