import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAdvisoryInbox } from "../hooks/useAdvisoryInbox";
import { useApp } from "../state/AppState";
import { dashboardPalettes } from "../theme/colors";
import { AdvisoryFeed } from "./AdvisoryInbox";
import { ResidentBottomSheet } from "./ResidentBottomSheet";

const NotificationContext = createContext<{ unread: number; open: () => void } | null>(null);

/** One inbox subscription for all mounted main-section headers. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, verified, theme } = useApp();
  const inbox = useAdvisoryInbox();
  const c = dashboardPalettes[theme];
  const [visible, setVisible] = useState(false);
  const [feed, setFeed] = useState<"Notifications" | "Advisories">("Notifications");
  const refreshInbox = inbox.refresh;
  const open = useCallback(() => { refreshInbox(); setFeed("Notifications"); setVisible(true); }, [refreshInbox]);
  const close = useCallback(() => setVisible(false), []);
  const value = useMemo(() => ({ unread: inbox.unread, open }), [inbox.unread, open]);
  return <NotificationContext.Provider value={value}>
    {children}
    {visible && user && verified && <ResidentBottomSheet title="Notifications & advisories" theme={theme} onClose={close}>
      <View accessibilityRole="tablist" style={[styles.tabs, { borderBottomColor: c.border }]}>
        {(["Notifications", "Advisories"] as const).map(tab => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: feed === tab }} onPress={() => setFeed(tab)} style={[styles.tab, { borderBottomColor: feed === tab ? c.accent : "transparent" }]}><Text style={[styles.tabText, { color: feed === tab ? c.accent : c.muted }]}>{tab}</Text></Pressable>)}
      </View>
      <ScrollView contentContainerStyle={styles.feed}><AdvisoryFeed inbox={inbox} unreadOnly={feed === "Notifications"} /></ScrollView>
    </ResidentBottomSheet>}
  </NotificationContext.Provider>;
}

export function NotificationBell() {
  const center = useContext(NotificationContext);
  const { theme } = useApp();
  const c = dashboardPalettes[theme];
  if (!center) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel="Open notifications and advisories" accessibilityHint={center.unread ? `${center.unread} unread advisories` : "No unread advisories"} onPress={center.open}
    style={({ pressed }) => [styles.bell, { backgroundColor: pressed ? c.tint : c.card, borderColor: c.border, opacity: pressed ? 0.75 : 1 }]}>
    <Feather name="bell" size={22} color={c.text} />
    {center.unread > 0 && <View style={[styles.badge, { backgroundColor: c.primary, borderColor: c.bg }]}><Text style={styles.count}>{center.unread > 99 ? "99+" : center.unread}</Text></View>}
  </Pressable>;
}

const styles = StyleSheet.create({
  bell: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" }, count: { color: "#fff", fontSize: 9, fontWeight: "700" },
  tabs: { flexDirection: "row", paddingHorizontal: 20, gap: 20, borderBottomWidth: 1 }, tab: { flex: 1, minHeight: 52, borderBottomWidth: 2, alignItems: "center", justifyContent: "center" }, tabText: { fontSize: 13, fontWeight: "600" }, feed: { padding: 20, paddingBottom: 32 },
});
