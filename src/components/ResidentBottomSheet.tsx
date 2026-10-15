import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { dashboardPalettes, type ThemeMode } from "../theme/colors";

export function ResidentBottomSheet({ title, theme, onClose, children }: {
  title: string; theme: ThemeMode; onClose: () => void; children: ReactNode;
}) {
  const c = dashboardPalettes[theme];
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const active = useRef(true);
  const closing = useRef(false);
  const [closingNow, setClosingNow] = useState(false);
  const finishClose = useCallback(() => { if (active.current) onClose(); }, [onClose]);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setClosingNow(true);
    progress.set(withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic), reduceMotion: ReduceMotion.System }, done => {
      if (done) scheduleOnRN(finishClose);
    }));
  }, [finishClose, progress]);
  useEffect(() => {
    active.current = true;
    progress.set(0);
    progress.set(withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
    return () => { active.current = false; cancelAnimation(progress); };
  }, [progress]);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.get()) * height }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() * .62 }));
  const sheetHeight = Math.min(height * .9, height - insets.top - 12);
  return <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
    <View style={styles.overlay}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }, backdropStyle]} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Dismiss ${title}`} onPress={close} style={StyleSheet.absoluteFill} />
      <Animated.View testID="resident-bottom-sheet" accessibilityViewIsModal onAccessibilityEscape={close} pointerEvents={closingNow ? "none" : "auto"} style={[styles.sheet, { height: sheetHeight, width: Math.min(width - insets.left - insets.right, 640), backgroundColor: c.bg, borderColor: c.border, paddingBottom: insets.bottom }, sheetStyle]}>
        <View accessible={false} style={[styles.handle, { backgroundColor: c.border }]} />
        <View style={[styles.header, { borderBottomColor: c.border }]}><Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Close ${title}`} onPress={close} style={[styles.close, { backgroundColor: c.card }]}><Feather name="x" size={20} color={c.text} /></Pressable></View>
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: { borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  handle: { width: 38, height: 4, borderRadius: 4, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  header: { minHeight: 66, paddingHorizontal: 20, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1 },
  title: { flex: 1, fontSize: 18, fontWeight: "700", letterSpacing: -.4 }, close: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" }, content: { flex: 1 },
});
