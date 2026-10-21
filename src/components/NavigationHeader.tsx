import { useCallback } from "react";
import { useFocusEffect, usePathname, type Href } from "expo-router";
import { BackHandler, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "../state/AppState";
import { dashboardPalettes } from "../theme/colors";
import { headerNavigation } from "../lib/navigation";
import { BackButton } from "./BackButton";
import { ResidentMenuButton } from "./ResidentMenu";

export type NavigationBackProps = {
  showBack?: boolean; onBack?: () => void; backDisabled?: boolean; backLabel?: string; backFallback?: Href;
};

/** Inline detail steps consume Back; section history stays with the navigator. */
export function useDetailBack(onBack?: () => void, disabled = false) {
  useFocusEffect(useCallback(() => {
    if (!onBack) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!disabled) { Keyboard.dismiss(); onBack(); }
      return true;
    });
    return () => subscription.remove();
  }, [onBack, disabled]));
}

export function NavigationHeader({ title, subtitle, showBack = true, onBack, backDisabled, backLabel = "Back", backFallback }: NavigationBackProps & { title: string; subtitle?: string }) {
  const { theme, user, verified, setTheme } = useApp();
  const pathname = usePathname();
  const colors = dashboardPalettes[theme];
  const mode = headerNavigation(pathname, Boolean(verified && user), Boolean(onBack), showBack);
  const fallback = backFallback ?? (verified && user ? user.role === "residents" ? "/resident/home" : "/camp/overview" : "/welcome");
  return <View testID="navigation-header" style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
    {mode === "menu" && <ResidentMenuButton theme={theme} />}
    {mode === "back" && <BackButton theme={theme} onPress={onBack} fallback={fallback} disabled={backDisabled} label={backLabel} />}
    <View style={styles.copy}>
      <Text accessibilityRole="header" numberOfLines={1} style={[styles.title, { color: colors.text }]}>{title}</Text>
      {!!subtitle && <Text numberOfLines={2} style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      onPress={() => { void setTheme(theme === "dark" ? "light" : "dark").catch(() => {}); }}
      style={({ pressed }) => [styles.icon, { backgroundColor: pressed ? colors.tint : colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}>
      <Feather name={theme === "dark" ? "sun" : "moon"} size={21} color={colors.text} />
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72, paddingVertical: 10, paddingHorizontal: 18, borderBottomWidth: 1, width: "100%", maxWidth: 640, alignSelf: "center" },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontSize: 20, lineHeight: 25, fontWeight: "700", letterSpacing: -0.4 },
  subtitle: { fontSize: 12, lineHeight: 17 },
  icon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
