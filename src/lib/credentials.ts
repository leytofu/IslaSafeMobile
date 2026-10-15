import * as SecureStore from "expo-secure-store";
import { createTokenStore } from "./tokenStore";

export const { readToken, saveToken, clearToken } = createTokenStore({
  read: () => SecureStore.getItemAsync("islasafe.token"),
  write: (token) => SecureStore.setItemAsync("islasafe.token", token),
  remove: () => SecureStore.deleteItemAsync("islasafe.token"),
});
