import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { dashboardPalettes, type ThemeMode } from "../../theme/colors";
import { ResidentUserBar } from "../ResidentUserBar";

export const residentTabs = [
  { name: "home", title: "Home", icon: "home" },
  { name: "map", title: "Map", icon: "map" },
  { name: "sos", title: "SOS", icon: "radio" },
  { name: "alerts", title: "Alerts", icon: "bell" },
  { name: "profile", title: "Profile", icon: "user" },
] as const;
type Tab = (typeof residentTabs)[number];

export function ResidentTabIcon({ tab, focused, theme }: { tab: Tab; focused: boolean; theme: ThemeMode }) {
  const colors = dashboardPalettes[theme];
  const emergency = tab.name === "sos";
  return <View style={[styles.icon, emergency && styles.sos, focused && !emergency && { backgroundColor: colors.tint }]}>
    <Feather name={tab.icon} size={20} color={emergency ? "#ffffff" : focused ? colors.accent : colors.subtle} />
  </View>;
}

/** Static preview only. The app's existing Expo tabs retain their own events. */
export function DashboardPreviewNavigation({ theme, name = "Juan Santos" }: { theme: ThemeMode; active?: string; name?: string }) {
  return <ResidentUserBar theme={theme} user={{ name }} />;
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", borderWidth: 1, borderRadius: 24, marginHorizontal: 14, marginTop: 6, marginBottom: 10, paddingHorizontal: 5, paddingVertical: 8 },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, minHeight: 52 },
  icon: { width: 42, height: 30, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sos: { width: 40, height: 34, borderRadius: 13, backgroundColor: "#d83750" },
  label: { fontSize: 10, fontWeight: "600", lineHeight: 15 },
});
