import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAdvisoryInbox } from "../hooks/useAdvisoryInbox";
import { useApp } from "../state/AppState";
import { dashboardPalettes } from "../theme/colors";
import { Badge, Surface } from "./dashboard/DashboardPrimitives";

export function AdvisoryFeed({ inbox, unreadOnly = false }: { inbox: ReturnType<typeof useAdvisoryInbox>; unreadOnly?: boolean }) {
  const { theme } = useApp();
  const c = dashboardPalettes[theme];
  const [filter, setFilter] = useState("All");
  const items = inbox.items.filter(item => (!unreadOnly || !item.is_read) && (filter === "All" || item.priority === filter));
  return <View style={styles.stack}>
    <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>{unreadOnly ? `Unread notifications (${inbox.unread})` : "Community advisories"}</Text>
    <Text style={[styles.body, { color: c.muted }]}>Notices for your barangay and all CPG barangays.</Text>
    <View style={styles.filters}>{["All", "Critical", "Warning", "Info"].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={[styles.filter, { backgroundColor: filter === value ? c.primary : c.card, borderColor: c.border }]}><Text style={{ color: filter === value ? "#fff" : c.text }}>{value}</Text></Pressable>)}</View>
    {!inbox.online && <Text style={[styles.body, { color: c.muted }]}>Offline. Reconnect to check for new notices.</Text>}
    {!!inbox.error && <Text accessibilityRole="alert" style={[styles.body, { color: c.danger }]}>{inbox.error}</Text>}
    <Pressable accessibilityRole="button" accessibilityLabel="Refresh advisories" disabled={!inbox.online || !inbox.verified} onPress={inbox.refresh} style={[styles.filter, { borderColor: c.border, backgroundColor: c.card }]}><Text style={{ color: c.accent }}>Refresh advisories</Text></Pressable>
    {!inbox.loaded && inbox.online && <Text style={[styles.body, { color: c.muted }]}>Loading advisories...</Text>}
    {inbox.loaded && !inbox.error && items.length === 0 && <Text style={[styles.body, { color: c.muted }]}>{unreadOnly ? "No unread advisories match this filter." : "No active advisories match this filter."}</Text>}
    {items.map(item => {
      const color = item.priority === "Critical" ? c.danger : item.priority === "Warning" ? c.warning : c.accent;
      return <Surface key={item.id} colors={c} style={{ borderLeftWidth: 3, borderLeftColor: color }}>
        <Badge label={`${item.priority}${!item.is_read ? " - Unread" : ""}`} color={color} background={c.tint} />
        <Text style={[styles.title, { color: c.text, marginTop: 12 }]}>{item.title}</Text>
        <Text style={[styles.body, { color: c.muted, marginTop: 8 }]}>{item.message}</Text>
        <Text style={[styles.body, { color: c.subtle, marginVertical: 12 }]}>{item.target} - {new Date(item.published_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })} (PH)</Text>
        {!item.is_read && <Pressable accessibilityRole="button" accessibilityLabel={`Mark ${item.title} as read`} disabled={inbox.reading !== null || !inbox.online} onPress={() => void inbox.markRead(item)} style={[styles.filter, { borderColor: c.border }]}><Text style={{ color: c.accent }}>{inbox.reading === item.id ? "Saving..." : "Mark as read"}</Text></Pressable>}
      </Surface>;
    })}
  </View>;
}

export function AdvisoryInbox() { const inbox = useAdvisoryInbox(); return <AdvisoryFeed inbox={inbox} />; }
const styles = StyleSheet.create({
  stack: { gap: 12 }, title: { fontSize: 16, fontWeight: "700", lineHeight: 23 }, body: { fontSize: 13, lineHeight: 21 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, filter: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
});
