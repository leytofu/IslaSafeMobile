import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import { AppState as NativeAppState } from "react-native";
import { api, invalidAuth, isCurrentSessionRequest, publicApi, setAccessToken } from "../lib/api";
import { supportedRole, User, type Role } from "../lib/contracts";
import { INTRO_SEEN_KEY, restoreSession, signOutSession } from "../lib/session";
import { clearToken, readToken, saveToken } from "../lib/credentials";
import { removeSecret, writeSecret } from "../lib/vault";
import { palettes } from "../theme/colors";
export { palettes } from "../theme/colors";

type AppContext = {
  user: User | null;
  ready: boolean;
  verified: boolean;
  online: boolean;
  sessionMessage: string;
  theme: "dark" | "light";
  colors: typeof palettes.dark;
  offlineSaving: boolean;
  introPending: boolean;
  introCycle: number;
  completeIntro: () => void;
  setTheme: (theme: "dark" | "light") => Promise<void>;
  setOfflineSaving: (value: boolean) => Promise<void>;
  authenticate: (
    path: "/auth/login" | "/auth/register" | "/auth/google",
    body: Record<string, string>,
    expectedRole?: Role,
    remember?: boolean,
  ) => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (body: Record<string, string> | FormData) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<AppContext | null>(null);
export function AppProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [verified, setVerified] = useState(false);
  const [online, setOnline] = useState(true);
  const [sessionMessage, setSessionMessage] = useState("");
  const [theme, changeTheme] = useState<"dark" | "light">("dark");
  const [offlineSaving, changeOfflineSaving] = useState(true);
  const [introPending, setIntroPending] = useState(false);
  const [introCycle, setIntroCycle] = useState(0);
  const completeIntro = useCallback(() => {
    setIntroPending(false);
    void AsyncStorage.setItem(INTRO_SEEN_KEY, "seen").catch(() => {});
  }, []);
  const active = useRef(false);
  const startupComplete = useRef(false);
  const refreshing = useRef(false);
  const generation = useRef(0);
  const expire = useCallback(async () => {
    generation.current++;
    active.current = false;
    setAccessToken(null);
    setUser(null);
    setVerified(false);
    setSessionMessage("Your session has expired. Please sign in again.");
    await clearToken();
    await removeSecret("account");
  }, []);
  const refresh = useCallback(async () => {
    if (!active.current || refreshing.current) return;
    refreshing.current = true;
    const current = generation.current;
    try {
      const { data } = await api.get<{ user: User }>("/auth/me");
      if (current !== generation.current) return;
      if (!supportedRole(data.user.role)) {
        await expire();
        throw new Error(
          "This account role is not supported by IslaSafe mobile.",
        );
      }
      setUser(data.user);
      setVerified(true);
      setSessionMessage("");
      try {
        await writeSecret("account", data.user);
      } catch {
        setSessionMessage(
          "Signed in, but the offline account cache could not be saved.",
        );
      }
    } catch (error) {
      if (current !== generation.current) return;
      if (invalidAuth(error)) await expire();
      else {
        setVerified(false);
        setSessionMessage(
          "Session verification is unavailable. Your stored session is retained; account actions require reconnection and verification.",
        );
      }
    } finally {
      refreshing.current = false;
    }
  }, [expire]);
  useEffect(() => {
    let mounted = true;
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (invalidAuth(error) && isCurrentSessionRequest(error) && active.current && startupComplete.current) await expire();
        return Promise.reject(error);
      },
    );
    (async () => {
      try {
        const preferenceKeys = [
          "islasafe.theme",
          "islasafe.offline-saving",
        ];
        const preferences = await AsyncStorage.multiGet(preferenceKeys).catch(() => preferenceKeys.map((key) => [key, null] as const));
        if (mounted) {
          changeTheme(preferences[0][1] === "light" ? "light" : "dark");
          changeOfflineSaving(preferences[1][1] !== "false");
          // Replay on each signed-out launch, even if a prior intro was seen.
          // A verified restored session still proceeds straight to its dashboard.
          setIntroPending(true);
        }
        const restored = await restoreSession({
          readToken,
          activate: (token) => {
            if (!mounted) return;
            setAccessToken(token);
            active.current = Boolean(token);
          },
          validate: async () => (await api.get<{ user: User }>("/auth/me")).data.user,
          clear: async () => { await clearToken(); await removeSecret("account"); },
          invalid: invalidAuth,
        });
        if (!mounted) return;
        if (restored.status === "verified") {
          setUser(restored.user);
          setVerified(true);
          setIntroPending(false);
          completeIntro();
          await writeSecret("account", restored.user).catch(() => {});
        } else if (restored.status === "expired") {
          setSessionMessage("Your session has expired. Please sign in again.");
        } else if (restored.status === "unavailable") {
          setSessionMessage("Session verification is unavailable. Emergency SOS, saved records, guides, and hazard references remain available. Reconnect to verify your account.");
          setIntroPending(false);
        }
      } catch {
        if (mounted) { active.current = false; setAccessToken(null); setIntroPending(false); }
        if (mounted)
          setSessionMessage(
            "Secure storage could not be read. Sign in again; existing emergency records have not been removed.",
          );
      } finally {
        if (mounted) { startupComplete.current = true; setReady(true); }
      }
    })();
    const checkNetwork = (state: Network.NetworkState) => {
      if (mounted)
        setOnline(
          state.isConnected !== false && state.isInternetReachable !== false,
        );
    };
    Network.getNetworkStateAsync()
      .then(checkNetwork)
      .catch(() => {});
    const network = Network.addNetworkStateListener((state) => {
      checkNetwork(state);
      if (state.isConnected && startupComplete.current) void refresh();
    });
    const foreground = NativeAppState.addEventListener("change", (state) => {
      if (state === "active" && startupComplete.current) void refresh();
    });
    return () => {
      mounted = false;
      network.remove();
      foreground.remove();
      api.interceptors.response.eject(interceptor);
    };
  }, [completeIntro, expire, refresh]);
  const authenticate: AppContext["authenticate"] = async (path, body, expectedRole, remember = true) => {
    if ((path === "/auth/register" || path === "/auth/google") && expectedRole === "campmanager")
      throw new Error("Camp Manager accounts are assigned by an administrator.");
    const { data } = await publicApi.post<{ token: string; user: User }>(
      path,
      body,
    );
    if (!supportedRole(data.user.role) || (expectedRole && data.user.role !== expectedRole)) {
      await publicApi
        .post(
          "/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${data.token}` } },
        )
        .catch(() => {});
      throw new Error(
        supportedRole(data.user.role)
          ? "This account belongs to a different role. Go back and choose the matching role."
          : "Only Resident and Camp Manager accounts can sign in to mobile.",
      );
    }
    try {
      await writeSecret("account", data.user);
      await saveToken(data.token, remember);
    } catch (error) {
      await publicApi
        .post(
          "/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${data.token}` } },
        )
        .catch(() => {});
      throw error;
    }
    generation.current++;
    active.current = true;
    setAccessToken(data.token);
    setUser(data.user);
    setVerified(true);
    setSessionMessage("");
    completeIntro();
  };
  const updateProfile = async (body: Record<string, string> | FormData) => {
    if (!user || !verified)
      throw new Error(
        "Reconnect and verify your session before changing your profile.",
      );
    const current = generation.current;
    // PHP parses multipart files on POST; Laravel's override routes this as PATCH.
    const { data } = body instanceof FormData
      ? await api.post<{ user: User }>("/auth/profile", body)
      : await api.patch<{ user: User }>("/auth/profile", body);
    if (current !== generation.current) return;
    setUser(data.user);
    try {
      await writeSecret("account", data.user);
    } catch {
      throw new Error(
        "Profile updated on the server, but saving its offline cache failed.",
      );
    }
  };
  const logout = async () => {
    let signedOutGeneration = generation.current;
    await signOutSession({
      readToken,
      invalidate: () => {
        generation.current++;
        signedOutGeneration = generation.current;
        active.current = false;
        setAccessToken(null);
      },
      clearToken,
      clearAccount: () => removeSecret("account"),
      queueIntro: () => AsyncStorage.setItem(INTRO_SEEN_KEY, "replay").catch(() => {}),
      complete: () => {
        setUser(null);
        setVerified(false);
        setSessionMessage("");
        setIntroPending(true);
        setIntroCycle((cycle) => cycle + 1);
      },
      revoke: (token) => publicApi.post("/auth/logout", {}, { headers: { Authorization: `Bearer ${token}` } }),
      revokeFailed: (error) => {
        if (!invalidAuth(error) && generation.current === signedOutGeneration && !active.current)
          setSessionMessage("Signed out on this device. The server could not be reached to revoke the token.");
      },
    });
  };
  const setTheme = async (value: "dark" | "light") => {
    await AsyncStorage.setItem("islasafe.theme", value);
    changeTheme(value);
  };
  const setOfflineSaving = async (value: boolean) => {
    await AsyncStorage.setItem("islasafe.offline-saving", String(value));
    changeOfflineSaving(value);
  };
  const value = {
    user,
    ready,
    verified,
    online,
    sessionMessage,
    theme,
    colors: palettes[theme],
    offlineSaving,
    introPending,
    introCycle,
    completeIntro,
    setTheme,
    setOfflineSaving,
    authenticate,
    refresh,
    updateProfile,
    logout,
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider is missing.");
  return value;
}
