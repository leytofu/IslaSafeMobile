import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useApp } from "../state/AppState";
import { dashboardPalettes } from "../theme/colors";
import ProfileScreen from "../screens/ProfileScreen";
import { AdvisoryFeed } from "./AdvisoryInbox";
import { useAdvisoryInbox } from "../hooks/useAdvisoryInbox";
import { ResidentBottomSheet } from "./ResidentBottomSheet";
import { ResidentUserBar } from "./ResidentUserBar";

export function ResidentAccountBar() {
  const { user, theme } = useApp();
  const inbox = useAdvisoryInbox();
  const c = dashboardPalettes[theme];
  const [sheet, setSheet] = useState<"profile" | "notifications" | null>(null);
  const [feed, setFeed] = useState<"Notifications" | "Advisories">("Notifications");
  const close = useCallback(() => setSheet(null), []);
  return <>
    <ResidentUserBar theme={theme} user={user} unread={inbox.unread} onProfile={() => setSheet("profile")} onNotifications={() => { inbox.refresh(); setFeed("Notifications"); setSheet("notifications"); }} />
    {sheet && <ResidentBottomSheet title={sheet === "profile" ? "Profile & settings" : "Notifications & advisories"} theme={theme} onClose={close}>
      {sheet === "profile" ? <ProfileScreen embedded /> : <>
        <View accessibilityRole="tablist" style={[styles.tabs, { borderBottomColor: c.border }]}>{(["Notifications", "Advisories"] as const).map(tab => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: feed === tab }} onPress={() => setFeed(tab)} style={[styles.tab, { borderBottomColor: feed === tab ? c.accent : "transparent" }]}><Text style={[styles.tabText, { color: feed === tab ? c.accent : c.muted }]}>{tab}</Text></Pressable>)}</View>
        <ScrollView contentContainerStyle={styles.feed}>
          <AdvisoryFeed inbox={inbox} unreadOnly={feed === "Notifications"} />
        </ScrollView>
      </>}
    </ResidentBottomSheet>}
  </>;
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", paddingHorizontal: 20, gap: 20, borderBottomWidth: 1 }, tab: { flex: 1, minHeight: 52, borderBottomWidth: 2, alignItems: "center", justifyContent: "center" }, tabText: { fontSize: 13, fontWeight: "600" },
  feed: { padding: 20, paddingBottom: 32 },
});
