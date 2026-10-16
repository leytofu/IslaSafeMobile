import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import type { User } from "../lib/contracts";
import { dashboardPalettes, type ThemeMode } from "../theme/colors";
import { UserAvatar } from "./UserAvatar";

export function ResidentUserBar({ theme, user, onProfile, onNotifications, unread = 0 }: {
  theme: ThemeMode; user?: Pick<User, "name" | "avatar_url"> | null;
  onProfile?: () => void; onNotifications?: () => void;
  unread?: number;
}) {
  const c = dashboardPalettes[theme];
  const name = user?.name || "Resident";
  return <SafeAreaView edges={["bottom", "left", "right"]} style={{ backgroundColor: c.bg }}>
    <View testID="resident-user-bar" style={[styles.bar, { backgroundColor: c.card, borderColor: c.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open profile and settings for ${name}`} accessibilityHint="Opens a panel from the bottom" accessibilityState={{ disabled: !onProfile }} disabled={!onProfile} onPress={onProfile} style={({ pressed }) => [styles.account, pressed && { backgroundColor: c.tint }]}>
        <UserAvatar user={user} theme={theme} size={40} radius={15} />
        <View style={styles.copy}><Text numberOfLines={1} style={[styles.name, { color: c.text }]}>{name}</Text><Text numberOfLines={1} style={[styles.caption, { color: c.muted }]}>Profile & settings</Text></View>
        <Feather name="chevron-up" size={17} color={c.subtle} />
      </Pressable>
      <View style={[styles.divider, { backgroundColor: c.border }]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Open notifications and advisories" accessibilityState={{ disabled: !onNotifications }} disabled={!onNotifications} onPress={onNotifications} style={({ pressed }) => [styles.bell, pressed && { backgroundColor: c.tint }]}>
        <Feather name="bell" size={23} color={c.text} />
        {unread > 0 && <Text accessibilityLabel={`${unread} unread advisories`} style={{ position: "absolute", top: 0, right: 0, minWidth: 20, borderRadius: 10, padding: 3, textAlign: "center", backgroundColor: c.primary, color: "#fff", fontSize: 10 }}>{unread > 99 ? "99+" : unread}</Text>}
      </Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 22, marginHorizontal: 12, marginTop: 6, marginBottom: 8, padding: 5 },
  account: { flex: 1, minWidth: 0, minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8, borderRadius: 17 },
  avatar: { width: 40, height: 40, borderRadius: 15, alignItems: "center", justifyContent: "center", overflow: "hidden" }, avatarImage: { width: 40, height: 40 }, initials: { fontSize: 15, fontWeight: "700" },
  copy: { flex: 1, minWidth: 0, gap: 4 }, name: { fontSize: 13, fontWeight: "700" }, caption: { fontSize: 10 },
  divider: { width: 1, height: 28, marginHorizontal: 5 }, bell: { width: 52, minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 17 },
});
