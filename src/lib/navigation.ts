import type { Href } from "expo-router";
import type { ComponentProps } from "react";
import type { Feather } from "@expo/vector-icons";

export type ResidentDestination = "home" | "map" | "sos" | "alerts" | "household" | "guides" | "hazards" | "settings";
export type MenuDestination = {
  key: string; title: string; icon: ComponentProps<typeof Feather>["name"]; href?: Href;
};
export const residentDestinations: (MenuDestination & { key: ResidentDestination })[] = [
  { key: "home", title: "Dashboard", icon: "grid", href: "/resident/home" },
  { key: "map", title: "Hazard Map", icon: "map", href: "/resident/map" },
  { key: "sos", title: "Emergency SOS", icon: "radio", href: "/resident/sos" },
  { key: "alerts", title: "Alerts & Advisories", icon: "bell", href: "/resident/alerts" },
  { key: "household", title: "My Household", icon: "users" },
  { key: "guides", title: "Preparedness Guides", icon: "book-open", href: "/guides" },
  { key: "hazards", title: "Offline Hazard Maps", icon: "layers", href: "/hazards" },
  { key: "settings", title: "Settings", icon: "settings", href: "/resident/profile" },
];
export const campDestinations: MenuDestination[] = [
  { key: "overview", title: "Camp dashboard", icon: "grid", href: "/camp/overview" },
  { key: "center", title: "Assigned center", icon: "home", href: "/camp/center" },
  { key: "evacuees", title: "Center roster", icon: "users", href: "/camp/evacuees" },
  { key: "alerts", title: "Alerts & Advisories", icon: "bell", href: "/camp/alerts" },
  { key: "profile", title: "Your profile", icon: "user", href: "/camp/profile" },
  { key: "guides", title: "Preparedness Guides", icon: "book-open", href: "/guides" },
  { key: "hazards", title: "Offline Hazard Maps", icon: "layers", href: "/hazards" },
];
export function isMainNavigationPath(pathname: string) {
  return [...residentDestinations, ...campDestinations].some(item => item.href === pathname);
}
/** Targets follow the actual Drawer → Tabs / Stack → Tabs layout hierarchy. */
export function drawerTarget(href: Href) {
  const [section, screen] = String(href).split("/").filter(Boolean);
  if (section === "camp") return { name: section, params: { screen: "(sections)", params: { screen } } };
  if (section === "resident") return { name: section, params: { screen } };
  return { name: section, params: undefined };
}
export function headerNavigation(pathname: string, authenticated: boolean, detail: boolean, showBack = true) {
  if (authenticated && isMainNavigationPath(pathname) && !detail) return "menu";
  return showBack ? "back" : "none";
}
