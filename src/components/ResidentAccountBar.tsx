import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "../state/AppState";
import { dashboardPalettes } from "../theme/colors";
import ProfileScreen from "../screens/ProfileScreen";
import { ReferenceAlerts } from "./ResidentReferenceViews";
import { ResidentBottomSheet } from "./ResidentBottomSheet";
import { ResidentUserBar } from "./ResidentUserBar";

export function ResidentAccountBar() {
  const { user, theme } = useApp();
  const c = dashboardPalettes[theme];
  const [sheet, setSheet] = useState<"profile" | "notifications" | null>(null);
  const [feed, setFeed] = useState<"Notifications" | "Advisories">("Notifications");
  const close = useCallback(() => setSheet(null), []);
  return <>
    <ResidentUserBar theme={theme} user={user} onProfile={() => setSheet("profile")} onNotifications={() => { setFeed("Notifications"); setSheet("notifications"); }} />
    {sheet && <ResidentBottomSheet title={sheet === "profile" ? "Profile & settings" : "Notifications & advisories"} theme={theme} onClose={close}>
      {sheet === "profile" ? <ProfileScreen embedded /> : <>
        <View accessibilityRole="tablist" style={[styles.tabs, { borderBottomColor: c.border }]}>{(["Notifications", "Advisories"] as const).map(tab => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: feed === tab }} onPress={() => setFeed(tab)} style={[styles.tab, { borderBottomColor: feed === tab ? c.accent : "transparent" }]}><Text style={[styles.tabText, { color: feed === tab ? c.accent : c.muted }]}>{tab}</Text></Pressable>)}</View>
        <ScrollView contentContainerStyle={styles.feed}>
          {feed === "Advisories" ? <ReferenceAlerts theme={theme} /> : <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: c.tint }]}><Feather name="bell" size={28} color={c.accent} /></View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>Your updates, all in one place</Text>
            <Text style={[styles.body, { color: c.muted }]}>Notifications aren’t available yet. You can browse sample preparedness updates in Advisories.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="View sample advisories" onPress={() => setFeed("Advisories")} style={[styles.advisories, { backgroundColor: c.primary }]}><Text style={styles.buttonText}>View sample advisories</Text><Feather name="arrow-right" size={17} color="#fff" /></Pressable>
          </View>}
        </ScrollView>
      </>}
    </ResidentBottomSheet>}
  </>;
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", paddingHorizontal: 20, gap: 20, borderBottomWidth: 1 }, tab: { flex: 1, minHeight: 52, borderBottomWidth: 2, alignItems: "center", justifyContent: "center" }, tabText: { fontSize: 13, fontWeight: "600" },
  feed: { padding: 20, paddingBottom: 32 }, empty: { alignItems: "center", gap: 18, paddingVertical: 32 }, emptyIcon: { width: 74, height: 74, borderRadius: 25, alignItems: "center", justifyContent: "center" }, emptyTitle: { fontSize: 19, fontWeight: "700", textAlign: "center" }, body: { fontSize: 13, lineHeight: 22, textAlign: "center", maxWidth: 360 },
  advisories: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, minHeight: 48 }, buttonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
