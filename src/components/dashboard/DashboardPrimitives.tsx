import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { DashboardColors } from "../../theme/colors";

export type DashboardIcon = ComponentProps<typeof Feather>["name"];

export function Surface({ colors, children, style }: { colors: DashboardColors; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.surface, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
}

export function IconButton({ colors, icon, label, onPress }: { colors: DashboardColors; icon: DashboardIcon; label: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !onPress }} disabled={!onPress} onPress={onPress}
    style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
    <Feather name={icon} size={19} color={colors.text} />
  </Pressable>;
}

export function SectionTitle({ colors, title, action, onPress }: { colors: DashboardColors; title: string; action?: string; onPress?: () => void }) {
  return <View style={styles.sectionHeading}>
    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    {action && <Pressable disabled={!onPress} accessibilityRole={onPress ? "button" : undefined} onPress={onPress} hitSlop={8} style={styles.sectionAction}>
      <Text style={[styles.actionText, { color: colors.accent }]}>{action}</Text>{onPress && <Feather name="arrow-up-right" size={13} color={colors.accent} />}
    </Pressable>}
  </View>;
}

export function Badge({ label, color, background }: { label: string; color: string; background: string }) {
  return <View style={[styles.badge, { backgroundColor: background }]}><Text style={[styles.badgeText, { color }]}>{label}</Text></View>;
}

export const dashboardType = StyleSheet.create({
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.3, lineHeight: 16 },
  body: { fontSize: 12, lineHeight: 19 },
  title: { fontSize: 18, lineHeight: 25, fontWeight: "700", letterSpacing: -0.45 },
});

const styles = StyleSheet.create({
  surface: { borderWidth: 1, borderRadius: 20, padding: 18 },
  iconButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 7, marginBottom: 11 },
  sectionTitle: { fontSize: 15, lineHeight: 22, fontWeight: "700", letterSpacing: -0.25, flexShrink: 1 },
  sectionAction: { flexDirection: "row", gap: 4, alignItems: "center", minHeight: 32 },
  actionText: { fontSize: 11, fontWeight: "600" },
  badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start" },
  badgeText: { fontSize: 10, fontWeight: "600", lineHeight: 14 },
});
