import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInDown, ReduceMotion } from "react-native-reanimated";
import { useApp } from "../state/AppState";

/** Branded opening while the stored session is checked. Public help stays reachable. */
export function SessionLoading() {
  const { theme } = useApp();
  const light = theme === "light";
  return (
    <SafeAreaView style={[styles.root, light && styles.rootLight]}>
      <View pointerEvents="none" style={[styles.glowTop, light && styles.glowLight]} />
      <View pointerEvents="none" style={[styles.glowBottom, light && styles.glowLight]} />

      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(550).reduceMotion(ReduceMotion.System)} style={[styles.orbit, light && styles.orbitLight]}>
          <View style={[styles.orbitInner, light && styles.orbitInnerLight]}>
            <View style={styles.logoFrame}>
              <Image source={require("../../assets/reference-brand.png")} resizeMode="contain" style={styles.logo} accessibilityLabel="IslaSafe logo" />
            </View>
          </View>
          <View style={styles.orbitDot} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(650).reduceMotion(ReduceMotion.System)} style={styles.copy}>
          <Text style={[styles.eyebrow, light && styles.eyebrowLight]}>PITOGO ISLAND · BOHOL</Text>
          <Text accessibilityRole="header" style={[styles.title, light && styles.titleLight]}>IslaSafe<Text style={styles.period}>.</Text></Text>
          <Text style={[styles.tagline, light && styles.taglineLight]}>Ready for what matters.</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(250).duration(500).reduceMotion(ReduceMotion.System)} style={styles.footer}>
        <View style={[styles.progressTrack, light && styles.progressTrackLight]}><View style={styles.progressFill} /></View>
        <Text accessibilityLiveRegion="polite" style={[styles.status, light && styles.statusLight]}>Preparing your safe space</Text>
        <View style={styles.quickActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Emergency SOS, continue as guest" onPress={() => router.push({ pathname: "/guest-sos", params: { prepare: "1" } })} style={[styles.quickAction, light && styles.quickActionLight]}>
            <Feather name="alert-circle" size={17} color={light ? "#b6223d" : "#ffb7c4"} />
            <Text style={[styles.quickText, light && styles.quickTextLight]}>Emergency SOS</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open offline preparedness guides" onPress={() => router.push("/guides")} style={[styles.quickAction, light && styles.quickActionLight]}>
            <Feather name="book-open" size={17} color={light ? "#2946d8" : "#b5c1ff"} />
            <Text style={[styles.quickText, light && styles.quickTextLight]}>Offline guides</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080d17", overflow: "hidden" },
  rootLight: { backgroundColor: "#f5f7fb" },
  glowTop: { position: "absolute", width: 360, height: 360, borderRadius: 180, backgroundColor: "#1b3571", opacity: 0.32, top: -185, right: -180 },
  glowBottom: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "#164152", opacity: 0.23, bottom: -150, left: -150 },
  glowLight: { backgroundColor: "#b3c7ff", opacity: 0.3 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  orbit: { width: 216, height: 216, borderRadius: 108, borderWidth: 1, borderColor: "#53689c55", alignItems: "center", justifyContent: "center" },
  orbitLight: { borderColor: "#a4b9ec" },
  orbitInner: { width: 172, height: 172, borderRadius: 86, borderWidth: 1, borderColor: "#859cdd66", alignItems: "center", justifyContent: "center", backgroundColor: "#182a4c66" },
  orbitInnerLight: { borderColor: "#c1d0f6", backgroundColor: "#e7edff" },
  orbitDot: { position: "absolute", top: 26, right: 23, width: 8, height: 8, borderRadius: 4, backgroundColor: "#b5c1ff" },
  logoFrame: { width: 116, height: 116, borderRadius: 35, backgroundColor: "#f7f9ff", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#ffffff" },
  logo: { width: 96, height: 96 },
  copy: { alignItems: "center", marginTop: 36 },
  eyebrow: { color: "#9fb3d5", fontSize: 10, fontWeight: "700", letterSpacing: 2.3 },
  eyebrowLight: { color: "#536684" },
  title: { color: "#f7f9ff", fontSize: 49, fontWeight: "800", letterSpacing: -2.5, marginTop: 10 },
  titleLight: { color: "#101d35" },
  period: { color: "#91a8ff" },
  tagline: { color: "#b5c1d4", fontSize: 15, marginTop: 3, letterSpacing: 0.3 },
  taglineLight: { color: "#52627a" },
  footer: { paddingHorizontal: 24, paddingBottom: 20, alignItems: "center" },
  progressTrack: { width: 86, height: 2, borderRadius: 1, backgroundColor: "#354361" },
  progressTrackLight: { backgroundColor: "#cbd5ea" },
  progressFill: { width: 35, height: 2, borderRadius: 1, backgroundColor: "#a9baff" },
  status: { color: "#8fa0b9", fontSize: 11, letterSpacing: 0.7, marginTop: 13 },
  statusLight: { color: "#52627a" },
  quickActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 27 },
  quickAction: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#34445f", borderRadius: 14, paddingHorizontal: 14, backgroundColor: "#142039" },
  quickActionLight: { borderColor: "#d5def0", backgroundColor: "#ffffff" },
  quickText: { color: "#e6ecf7", fontSize: 12, fontWeight: "600" },
  quickTextLight: { color: "#263650" },
});
