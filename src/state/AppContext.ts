import { createContext, useContext, type Context } from "react";
import type { User, Role } from "../lib/contracts";
import type { palettes } from "../theme/colors";

// This module has no runtime dependency on theme tokens or the provider.
// Fast Refresh can replace those modules without replacing context identity.
export type AppContextValue = {
  user: User | null;
  ready: boolean;
  verified: boolean;
  online: boolean;
  sessionMessage: string;
  theme: "dark" | "light";
  themePreference: "system" | "dark" | "light";
  colors: typeof palettes.dark;
  offlineSaving: boolean;
  introPending: boolean;
  introCycle: number;
  completeIntro: () => void;
  setTheme: (theme: "system" | "dark" | "light") => Promise<void>;
  setOfflineSaving: (value: boolean) => Promise<void>;
  authenticate: (
    path: "/auth/login" | "/auth/register",
    body: Record<string, string>,
    expectedRole?: Role,
    remember?: boolean,
  ) => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (body: Record<string, string> | FormData) => Promise<void>;
  logout: () => Promise<void>;
};
// Keep the context identity across Fast Refresh. A mounted provider and a
// refreshed route must continue reading the same context instance.
const contextStore = globalThis as typeof globalThis & {
  __islaSafeAppContext?: Context<AppContextValue | null>;
};
export const AppContext = contextStore.__islaSafeAppContext ?? createContext<AppContextValue | null>(null);
contextStore.__islaSafeAppContext = AppContext;

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("AppProvider is missing.");
  return value;
}
