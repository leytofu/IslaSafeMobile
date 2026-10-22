import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { Easing, interpolateColor, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

/** Theme control stays mounted so both directions animate without remounting the screen. */
export function ThemeSwitch({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const progress = useSharedValue(dark ? 1 : 0);
  useEffect(() => {
    progress.set(withTiming(dark ? 1 : 0, { duration: 240, easing: Easing.inOut(Easing.cubic), reduceMotion: ReduceMotion.System }));
  }, [dark, progress]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(progress.get(), [0, 1], ["#cbd5e1", "#4569d4"]) }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: progress.get() * 22 }] }));
  return <Pressable accessibilityRole="switch" accessibilityLabel="Dark Mode" accessibilityState={{ checked: dark }} onPress={onToggle}
    hitSlop={4} style={({ pressed }) => [styles.touch, { opacity: pressed ? 0.8 : 1 }]}>
    <Animated.View style={[styles.track, track]}><Animated.View style={[styles.thumb, thumb]} /></Animated.View>
  </Pressable>;
}

const styles = StyleSheet.create({
  touch: { minWidth: 52, minHeight: 48, alignItems: "center", justifyContent: "center" },
  track: { width: 52, height: 30, borderRadius: 15, padding: 3 },
  thumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#ffffff", elevation: 2 },
});
