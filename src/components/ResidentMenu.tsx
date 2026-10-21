import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { DrawerActions } from "expo-router/react-navigation";
import { useDrawerStatus } from "expo-router/drawer";
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useApp } from "../state/AppState";
import { dashboardPalettes, type ThemeMode } from "../theme/colors";
import type { DashboardIcon } from "./dashboard/DashboardPrimitives";

export type ResidentDestination = "home" | "map" | "sos" | "alerts" | "household" | "guides" | "hazards" | "settings";
const destinations: { key: ResidentDestination; title: string; icon: DashboardIcon }[] = [
  { key: "home", title: "Dashboard", icon: "grid" },
  { key: "map", title: "Hazard Map", icon: "map" },
  { key: "sos", title: "Emergency SOS", icon: "radio" },
  { key: "alerts", title: "Alerts & Advisories", icon: "bell" },
  { key: "household", title: "My Household", icon: "users" },
  { key: "guides", title: "Preparedness Guides", icon: "book-open" },
  { key: "hazards", title: "Offline Hazard Maps", icon: "layers" },
];

function ResidentDrawer({ theme, onClose }: { theme: ThemeMode; onClose: (destination?: ResidentDestination) => void }) {
  const colors = dashboardPalettes[theme];
  const { width } = useWindowDimensions();
  const drawerWidth = width * 0.5;
  const progress = useSharedValue(0);
  const active = useRef(true);
  const closing = useRef(false);
  const destination = useRef<ResidentDestination | undefined>(undefined);
  const [closingNow, setClosingNow] = useState(false);
  const finishClose = useCallback(() => {
    if (active.current) onClose(destination.current);
  }, [onClose]);
  const close = useCallback((next?: ResidentDestination) => {
    if (closing.current) return;
    closing.current = true;
    destination.current = next;
    setClosingNow(true);
    // Keep the modal mounted until the drawer has left the screen.
    progress.set(withTiming(0, { duration: 220, easing: Easing.inOut(Easing.cubic), reduceMotion: ReduceMotion.System }, finished => {
      if (finished) scheduleOnRN(finishClose);
    }));
  }, [finishClose, progress]);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; cancelAnimation(progress); };
  }, [progress]);
  const show = () => {
    if (!closing.current) progress.set(withTiming(1, { duration: 320, easing: Easing.bezier(0.22, 1, 0.36, 1), reduceMotion: ReduceMotion.System }));
  };
  const drawerMotion = useAnimatedStyle(() => ({ transform: [{ translateX: (progress.get() - 1) * drawerWidth }] }));
  const backdropMotion = useAnimatedStyle(() => ({ opacity: progress.get() * 0.48 }));
  const linksMotion = useAnimatedStyle(() => ({ opacity: progress.get(), transform: [{ translateX: (1 - progress.get()) * -8 }] }));

  return <Modal visible transparent animationType="none" onShow={show} onRequestClose={() => close()}>
    <View style={styles.overlay}>
      <Animated.View testID="resident-menu-backdrop" pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, backdropMotion]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Close resident menu" style={StyleSheet.absoluteFill} onPress={() => close()} />
      <Animated.View testID="resident-menu-drawer" accessibilityViewIsModal onAccessibilityEscape={() => close()} pointerEvents={closingNow ? "none" : "auto"} style={[styles.drawer, { width: drawerWidth, backgroundColor: colors.bg, borderRightColor: colors.border }, drawerMotion]}>
        <SafeAreaView style={styles.drawerContent}>
          <View style={[styles.brand, { borderBottomColor: colors.border }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Minimize resident menu" onPress={() => close()} style={({ pressed }) => [styles.menuButton, { backgroundColor: pressed ? colors.tint : colors.card, borderColor: colors.border }]}><Feather name="x" size={21} color={colors.text} /></Pressable>
          </View>
          <Animated.View style={[styles.drawerContent, linksMotion]}>
            <ScrollView contentContainerStyle={styles.links}>
              {destinations.map((item) => <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => close(item.key)} style={({ pressed }) => [styles.link, { backgroundColor: pressed ? colors.tint : "transparent" }]}><Feather name={item.icon} color={item.key === "sos" ? colors.danger : colors.muted} size={18} /><Text style={[styles.linkLabel, styles.navigationLabel, { color: item.key === "sos" ? colors.danger : colors.text }]}>{item.title}</Text></Pressable>)}
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </View>
  </Modal>;
}

export function ResidentMenuButton({ theme, onNavigate }: { theme: ThemeMode; onNavigate?: (destination: ResidentDestination) => void }) {
  return onNavigate ? <PreviewMenuButton theme={theme} onNavigate={onNavigate} /> : <DrawerMenuButton theme={theme} />;
}

function DrawerMenuButton({ theme }: { theme: ThemeMode }) {
  const navigation = useNavigation();
  const expanded = useDrawerStatus() === "open";
  const colors = dashboardPalettes[theme];
  return <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" accessibilityState={{ expanded }}
    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
    style={({ pressed }) => [styles.menuButton, { backgroundColor: pressed ? colors.tint : colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}>
    <Feather name="menu" size={21} color={colors.text} />
  </Pressable>;
}

function PreviewMenuButton({ theme, onNavigate }: { theme: ThemeMode; onNavigate: (destination: ResidentDestination) => void }) {
  const colors = dashboardPalettes[theme];
  const [open, setOpen] = useState(false);
  function navigate(destination: ResidentDestination) {
    setOpen(false);
    onNavigate(destination);
  }
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Open resident menu" accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} style={[styles.menuButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="menu" size={21} color={colors.text} /></Pressable>
    {open && <ResidentDrawer theme={theme} onClose={(destination) => { setOpen(false); if (destination) navigate(destination); }} />}
  </>;
}

export function HouseholdSheet({ theme, visible, onClose }: { theme: ThemeMode; visible: boolean; onClose: () => void }) {
  const { user } = useApp();
  const colors = dashboardPalettes[theme];
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}><View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.brandName, { color: colors.text }]}>My Household</Text><Text style={[styles.linkLabel, { color: colors.muted }]}>Household records preview</Text>
        <View style={[styles.householdCard, { backgroundColor: colors.tint }]}><Feather name="users" size={26} color={colors.accent} /><Text style={[styles.linkLabel, { color: colors.text }]}>{user?.name || "Juan Santos"}</Text><Text style={[styles.caption, { color: colors.muted }]}>{user?.barangay || "Poblacion"} · Household member</Text></View>
        <Text style={[styles.body, { color: colors.muted }]}>This screen previews the household design. Member management and household safety reporting are not connected.</Text>
        <Pressable accessibilityRole="button" onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.primary }]}><Text style={styles.closeText}>Close</Text></Pressable>
      </View></View>
    </Modal>;
}

const styles = StyleSheet.create({
  menuButton: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1 }, backdrop: { backgroundColor: "#000" }, drawer: { flex: 1, borderRightWidth: 1 }, drawerContent: { flex: 1 },
  brand: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  navigationLabel: { flex: 1, minWidth: 0 },
  brandName: { fontSize: 23, fontWeight: "700", letterSpacing: -0.6 },
  caption: { fontSize: 10, lineHeight: 17, letterSpacing: 0.6 }, links: { padding: 10, gap: 2 },
  link: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 10 }, linkLabel: { fontSize: 13, fontWeight: "500", lineHeight: 20 },
  sheetOverlay: { flex: 1, backgroundColor: "#0008", justifyContent: "flex-end" },
  sheet: { borderWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 15 },
  householdCard: { borderRadius: 15, padding: 20, gap: 8 }, body: { fontSize: 13, lineHeight: 21 },
  closeButton: { borderRadius: 12, padding: 15, alignItems: "center" }, closeText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
});
