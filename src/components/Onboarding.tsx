import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import Animated, { FadeIn, FadeInDown, ReduceMotion } from "react-native-reanimated";
import { useApp } from "../state/AppState";
import type { Role } from "../lib/contracts";
import { authPalettes } from "../theme/colors";

export function Onboarding({ playIntro }: { playIntro: boolean }) {
  const { theme, completeIntro, sessionMessage, online, refresh } = useApp();
  const colors = authPalettes[theme];
  const styles = useMemo(() => createStyles(colors, theme === "dark"), [colors, theme]);
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 900 || fontScale > 1.2;
  const [selected, setSelected] = useState<Role | null>(null);
  const [retrying, setRetrying] = useState(false);
  const navigating = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    // The welcome screen is usable immediately; animation never gates navigation.
    completeIntro();
    return () => { mounted.current = false; };
  }, [completeIntro]);

  useFocusEffect(useCallback(() => {
    navigating.current = false;
    setSelected(null);
  }, []));

  function select(role: Role) {
    if (navigating.current) return;
    navigating.current = true;
    setSelected(role);
    router.push({ pathname: "/auth", params: { role } });
  }

  return <SafeAreaView style={styles.root}>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.viewport}>
        <Animated.View entering={playIntro ? FadeIn.duration(450).reduceMotion(ReduceMotion.System) : undefined} style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logoFrame}><Image source={require("../../assets/app-logo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="Municipality of President Carlos P. Garcia seal" /></View>
            <View style={styles.brandCopy}><Text style={styles.brandName}>IslaSafe<Text style={styles.brandDot}>.</Text></Text><Text style={styles.brandLocation}>Pitogo Island, Bohol</Text></View>
          </View>
          <View style={styles.communityMark} accessible accessibilityLabel="Community safety"><Feather name="shield" size={19} color={colors.accent} /></View>
        </Animated.View>

        <View style={[styles.hero, compact && styles.heroCompact]}>
          <View pointerEvents="none" style={styles.heroAura} />
          <Animated.View entering={playIntro ? FadeInDown.duration(420).reduceMotion(ReduceMotion.System) : undefined} style={styles.eyebrowRow}><View style={styles.eyebrowLine} /><Text style={styles.eyebrow}>YOUR ISLAND. YOUR COMMUNITY.</Text></Animated.View>
          <View accessible accessibilityRole="header" accessibilityLabel="Prepared today. Safer together.">
            <Animated.Text entering={playIntro ? FadeInDown.delay(90).duration(620).reduceMotion(ReduceMotion.System) : undefined} style={[styles.heading, compact && styles.headingCompact]}>Prepared today.</Animated.Text>
            <Animated.Text entering={playIntro ? FadeInDown.delay(210).duration(620).reduceMotion(ReduceMotion.System) : undefined} style={[styles.heading, compact && styles.headingCompact, styles.headingAccent]}>Safer together.</Animated.Text>
          </View>
          <Animated.Text entering={playIntro ? FadeInDown.delay(320).duration(540).reduceMotion(ReduceMotion.System) : undefined} style={styles.description}>Stay informed, find a safe place, and get help when it matters most.</Animated.Text>
          <Animated.View entering={playIntro ? FadeIn.delay(430).duration(480).reduceMotion(ReduceMotion.System) : undefined} style={styles.features}>
            <View style={styles.feature}><Feather name="bell" size={14} color={colors.accent} /><Text style={styles.featureText}>Local advisories</Text></View>
            <View style={styles.feature}><Feather name="map-pin" size={14} color={colors.accent} /><Text style={styles.featureText}>Evacuation maps</Text></View>
          </Animated.View>
        </View>

        <View style={styles.roles}>
          <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Get started</Text><Text style={styles.sectionHint}>Choose your role</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Resident. Sign in or create an account" accessibilityHint="Opens resident sign in" accessibilityState={{ disabled: selected !== null, busy: selected === "residents" }} disabled={selected !== null} onPress={() => select("residents")} style={({ pressed }) => [styles.residentCard, pressed && styles.pressed]}>
            <View style={styles.residentTop}>
              <View style={styles.residentIcon}><Feather name="user" size={23} color="#ffffff" /></View>
              <View style={styles.flex}><Text style={styles.residentTitle}>I&apos;m a Resident</Text><Text style={styles.residentDetail}>Stay connected. Keep your family ready.</Text></View>
            </View>
            <View style={styles.residentAction}><Text style={styles.residentActionText}>Sign in or create an account</Text><View style={styles.residentArrow}>{selected === "residents" ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="arrow-up-right" size={20} color="#ffffff" />}</View></View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Camp Manager. Sign in with your assigned account" accessibilityHint="Opens camp manager sign in" accessibilityState={{ disabled: selected !== null, busy: selected === "campmanager" }} disabled={selected !== null} onPress={() => select("campmanager")} style={({ pressed }) => [styles.managerCard, pressed && styles.pressed]}>
            <View style={styles.managerIcon}><Feather name="home" size={22} color={colors.accent} /></View>
            <View style={styles.flex}><Text style={styles.managerTitle}>Camp Manager</Text><Text style={styles.managerDetail}>Sign in with your assigned account</Text></View>
            {selected === "campmanager" ? <ActivityIndicator size="small" color={colors.accent} /> : <Feather name="arrow-right" size={19} color={colors.muted} />}
          </Pressable>
        </View>

        {!!sessionMessage && <View style={styles.notice}>
          <Text accessibilityLiveRegion="polite" style={styles.noticeText}>{sessionMessage}</Text>
          <Pressable accessibilityRole="button" disabled={retrying} onPress={() => { setRetrying(true); void refresh().finally(() => { if (mounted.current) setRetrying(false); }); }} style={styles.retry}><Text style={styles.link}>{retrying ? "Verifying session..." : "Retry session verification"}</Text></Pressable>
        </View>}

        <View style={[styles.helpArea, compact && styles.helpAreaCompact]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Emergency SOS. Continue without signing in" onPress={() => { completeIntro(); router.push({ pathname: "/guest-sos", params: { prepare: "1" } }); }} style={({ pressed }) => [styles.emergencyButton, pressed && styles.pressed]}>
            <View style={styles.emergencyIcon}><Feather name="alert-circle" size={23} color={colors.emergency} /></View>
            <View style={styles.flex}><Text style={styles.emergencyText}>Need help now?</Text><Text style={styles.emergencyHint}>{online ? "Emergency SOS · No account needed" : "Offline · Prepare and save an SOS"}</Text></View>
            <Feather name="arrow-right" size={19} color={colors.emergency} />
          </Pressable>
          <View style={styles.resources}>
            <Pressable accessibilityRole="button" accessibilityLabel="Preparedness guides" accessibilityHint="Opens offline preparedness guides" onPress={() => { completeIntro(); router.push("/guides"); }} style={({ pressed }) => [styles.guidesCard, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
              <View style={[styles.guidesIcon, { backgroundColor: colors.tint }]}><Feather name="book-open" size={19} color={colors.accent} /></View>
              <View style={styles.flex}>
                <View style={styles.guidesTitleRow}>
                  <Text style={[styles.guidesTitle, { color: colors.text }]}>Guides</Text>
                  <View style={[styles.offlinePill, { backgroundColor: colors.tint }]}><Feather name="download-cloud" size={9} color={colors.accent} /><Text style={[styles.offlinePillText, { color: colors.accent }]}>Offline</Text></View>
                </View>
                <Text style={[styles.guidesDetail, { color: colors.muted }]}>Practical safety &amp; preparedness guides</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>© 2026 IslaSafe. All rights reserved.</Text>
            <Text style={styles.footerTagline}>Developed by Four Sisters and a wedding.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const createStyles = (colors: typeof authPalettes.dark, dark: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  viewport: { width: "100%", maxWidth: 480, alignSelf: "center", flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 18 },
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  brand: { flexDirection: "row", alignItems: "center", gap: 11, flex: 1 },
  logoFrame: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  logo: { width: 38, height: 38 },
  brandCopy: { gap: 3 }, brandName: { fontSize: 23, fontWeight: "800", letterSpacing: -1, color: colors.text },
  brandDot: { color: colors.accent }, brandLocation: { fontSize: 11, color: colors.muted, letterSpacing: 0.2 },
  communityMark: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: colors.tint },
  hero: { paddingTop: 72, paddingBottom: 42, overflow: "hidden" }, heroCompact: { paddingTop: 48, paddingBottom: 30 },
  heroAura: { position: "absolute", width: 220, height: 220, borderRadius: 110, right: -120, top: 0, backgroundColor: colors.tint, opacity: dark ? 0.5 : 0.9 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  eyebrowLine: { width: 19, height: 2, backgroundColor: colors.accent, borderRadius: 1 },
  eyebrow: { flexShrink: 1, fontSize: 9, fontWeight: "700", letterSpacing: 1.5, color: colors.muted, lineHeight: 15 },
  heading: { color: colors.text, fontSize: 38, lineHeight: 45, fontWeight: "800", letterSpacing: -1.7 },
  headingCompact: { fontSize: 34, lineHeight: 41, letterSpacing: -1.4 }, headingAccent: { color: colors.accent },
  description: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 16, maxWidth: 325 },
  features: { flexDirection: "row", flexWrap: "wrap", columnGap: 18, rowGap: 12, marginTop: 21 },
  feature: { flexDirection: "row", alignItems: "center", gap: 6 }, featureText: { color: colors.muted, fontSize: 11, fontWeight: "500" },
  roles: { gap: 12 }, sectionHeading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text }, sectionHint: { fontSize: 11, color: colors.muted },
  residentCard: { padding: 20, borderRadius: 22, backgroundColor: dark ? "#314bd6" : "#2946d8", borderWidth: 1, borderColor: dark ? "#5269ed" : "#2946d8" },
  residentTop: { flexDirection: "row", gap: 13, alignItems: "center" }, residentIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#ffffff1f", alignItems: "center", justifyContent: "center" },
  residentTitle: { color: "#fff", fontSize: 19, fontWeight: "700", letterSpacing: -0.4 }, residentDetail: { color: "#e1e7ff", fontSize: 12, lineHeight: 18, marginTop: 5 },
  residentAction: { marginTop: 19, paddingTop: 13, borderTopWidth: 1, borderTopColor: "#ffffff30", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  residentActionText: { color: "#fff", fontSize: 12, fontWeight: "600", flex: 1, lineHeight: 19 }, residentArrow: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  managerCard: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 17, borderRadius: 20, minHeight: 88 },
  managerIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", backgroundColor: colors.tint, borderRadius: 13 },
  managerTitle: { color: colors.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.3 }, managerDetail: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  pressed: { opacity: 0.78 },
  notice: { marginTop: 18, padding: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.notice, borderRadius: 14 },
  noticeText: { color: colors.muted, fontSize: 12, lineHeight: 19 }, retry: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }, link: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  helpArea: { marginTop: "auto", paddingTop: 28 }, helpAreaCompact: { paddingTop: 22 },
  emergencyButton: { flexDirection: "row", alignItems: "center", gap: 11, minHeight: 78, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorBg },
  emergencyIcon: { width: 34, alignItems: "center" }, emergencyText: { color: colors.emergency, fontSize: 14, fontWeight: "700" },
  emergencyHint: { color: colors.emergency, opacity: 0.9, fontSize: 10, lineHeight: 16, marginTop: 4 },
  resources: { marginTop: 13 },
  guidesCard: { flexDirection: "row", alignItems: "center", gap: 11, minHeight: 64, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 16, borderWidth: 1 },
  guidesIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  guidesTitleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7 },
  guidesTitle: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  guidesDetail: { fontSize: 11, lineHeight: 17, marginTop: 3 },
  offlinePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20 },
  offlinePillText: { fontSize: 8, fontWeight: "700", letterSpacing: 0.2 },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 16, alignItems: "center", gap: 4 },
  footerBrand: { color: colors.muted, fontSize: 10, fontWeight: "600", lineHeight: 16 },
  footerTagline: { color: colors.muted, fontSize: 9, lineHeight: 16 },
});
