import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, AppState, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import Animated, { cancelAnimation, Easing, interpolate, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { palettes, useApp } from "../state/AppState";
import type { Role } from "../lib/contracts";

const DURATION = 3300;
const navy = palettes.dark;
const ease = Easing.bezier(0.16, 0.84, 0.44, 1);

function phase(time: number, start: number, end: number) {
  "worklet";
  const value = interpolate(time, [start, end], [0, 1], "clamp");
  return value * value * (3 - 2 * value);
}

function BrandLetter({ letter, index, clock }: { letter: string; index: number; clock: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const reveal = phase(clock.get(), 100 + index * 40, 600 + index * 40);
    const morph = phase(clock.get(), 1050 + index * 25, 1400 + index * 25);
    const returnToBrand = phase(clock.get(), 1650, 2000);
    return {
      opacity: reveal * (1 - morph + morph * returnToBrand),
      transform: [{ translateY: (1 - reveal) * 12 - morph * (1 - returnToBrand) * 10 }, { scaleX: 1 - morph * (1 - returnToBrand) * 0.55 }],
    };
  });
  return <Animated.Text accessible={false} allowFontScaling={false} style={[styles.brandTitle, style]}>{letter}</Animated.Text>;
}

function YearDigit({ digit, index, clock }: { digit: string; index: number; clock: SharedValue<number> }) {
  const motion = useAnimatedStyle(() => {
    const reveal = phase(clock.get(), 1150 + index * 55, 1550 + index * 55);
    return { opacity: reveal, transform: [{ translateY: 14 * (1 - reveal) }, { scale: 0.5 + 0.5 * reveal }, { rotate: `${7 * (1 - reveal)}deg` }] };
  });
  return <Animated.Text allowFontScaling={false} style={[styles.yearDigit, motion]}>{digit}</Animated.Text>;
}

function RoleCard({ role, title, detail, icon, clock, delay, selected, disabled, reduceMotion, onSelect }: {
  role: Role; title: string; detail: string; icon: "user" | "home"; clock: SharedValue<number>; delay: number;
  selected: boolean; disabled: boolean; reduceMotion: boolean; onSelect: (role: Role) => void;
}) {
  const pressed = useSharedValue(1);
  const style = useAnimatedStyle(() => {
    const reveal = phase(clock.get(), delay, delay + 450);
    return { opacity: reveal, transform: [{ translateY: (1 - reveal) * 22 }, { scale: pressed.get() }] };
  });
  const press = (scale: number) => {
    pressed.set(withTiming(scale, { duration: reduceMotion ? 0 : 130, reduceMotion: ReduceMotion.System }));
  };
  useEffect(() => () => cancelAnimation(pressed), [pressed]);
  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${detail}`}
        accessibilityHint="Opens the authentication form for this role"
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        onPressIn={() => press(0.975)}
        onPressOut={() => press(1)}
        onPress={() => onSelect(role)}
        style={[styles.roleCard, selected && styles.roleCardSelected]}
      >
        <View style={[styles.roleIcon, selected && styles.roleIconSelected]}><Feather name={icon} size={23} color="#b5c1ff" /></View>
        <View style={styles.flex}>
          <Text style={styles.roleTitle}>{title}</Text>
          <Text style={styles.roleDetail}>{detail}</Text>
          <Text style={styles.roleAccess}>{role === "residents" ? "SIGN IN OR CREATE AN ACCOUNT" : "SIGN IN WITH YOUR ASSIGNED ACCOUNT"}</Text>
        </View>
        <Feather name={selected ? "check-circle" : "arrow-right"} size={20} color={selected ? "#b5c1ff" : navy.muted} />
      </Pressable>
    </Animated.View>
  );
}

/** The logo and role layout share one mounted surface and one UI-thread clock. */
export function Onboarding({ playIntro }: { playIntro: boolean }) {
  const { completeIntro, sessionMessage, online, refresh } = useApp();
  const { height } = useWindowDimensions();
  const initialReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(initialReducedMotion);
  const [selectable, setSelectable] = useState(!playIntro || initialReducedMotion);
  const [selected, setSelected] = useState<Role | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [shouldPlay] = useState(() => playIntro && !initialReducedMotion);
  const clock = useSharedValue(shouldPlay ? 0 : DURATION);
  const exit = useSharedValue(0);
  const selecting = useRef(false);
  const finished = useRef(!shouldPlay);
  const mounted = useRef(true);

  const finish = useCallback(() => {
    if (!mounted.current) return;
    finished.current = true;
    setSelectable(true);
    completeIntro();
  }, [completeIntro]);

  const settle = useCallback(() => {
    cancelAnimation(clock);
    clock.set(DURATION);
    finish();
  }, [clock, finish]);

  useEffect(() => {
    mounted.current = true;
    if (shouldPlay) {
      clock.set(withTiming(DURATION, { duration: DURATION, easing: Easing.linear, reduceMotion: ReduceMotion.System }, (done) => {
        if (done) scheduleOnRN(finish);
      }));
    } else {
      finish();
    }
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      setReduceMotion(enabled);
      if (enabled) settle();
    });
    const screenReader = AccessibilityInfo.addEventListener("screenReaderChanged", (enabled) => {
      if (enabled) settle();
    });
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (mounted.current && enabled) settle();
    }).catch(() => {});
    const lifecycle = AppState.addEventListener("change", (state) => {
      // Finish when interrupted; resuming never restarts or replays the intro.
      if (state !== "active" && !finished.current) settle();
      if (state !== "active" && selecting.current) {
        cancelAnimation(exit);
        exit.set(0);
        selecting.current = false;
        setSelected(null);
      }
    });
    return () => {
      mounted.current = false;
      cancelAnimation(clock);
      cancelAnimation(exit);
      motion.remove();
      screenReader.remove();
      lifecycle.remove();
    };
  }, [clock, exit, finish, settle, shouldPlay]);

  useFocusEffect(useCallback(() => {
    selecting.current = false;
    setSelected(null);
    exit.set(0);
    return () => {
      cancelAnimation(exit);
      if (!finished.current) settle();
    };
  }, [exit, settle]));

  const brandMotion = useAnimatedStyle(() => {
    const dock = phase(clock.get(), 1850, 2550);
    const reveal = phase(clock.get(), 80, 650);
    return {
      opacity: reveal,
      transform: [{ translateY: Math.max(100, height * 0.36 - 125) * (1 - dock) }, { scale: 1.3 - dock * 0.3 }],
    };
  });
  const yearMotion = useAnimatedStyle(() => ({
    opacity: phase(clock.get(), 1150, 1500) * (1 - phase(clock.get(), 1650, 1900)),
    transform: [{ translateY: 14 * (1 - phase(clock.get(), 1150, 1650)) }, { scale: 0.75 + phase(clock.get(), 1150, 1650) * 0.25 }],
  }));
  const lineMotion = useAnimatedStyle(() => ({ transform: [{ scaleX: phase(clock.get(), 1100, 1800) }] }));
  const headingMotion = useAnimatedStyle(() => {
    const reveal = phase(clock.get(), 2350, 2800);
    return { opacity: reveal, transform: [{ translateY: 18 * (1 - reveal) }] };
  });
  const subtitleMotion = useAnimatedStyle(() => {
    const reveal = phase(clock.get(), 2450, 2900);
    return { opacity: reveal, transform: [{ translateY: 14 * (1 - reveal) }] };
  });
  const surfaceMotion = useAnimatedStyle(() => ({ opacity: 1 - exit.get(), transform: [{ translateY: -8 * exit.get() }] }));

  const openAuth = useCallback((role: Role) => {
    if (!mounted.current) return;
    router.push({ pathname: "/auth", params: { role } });
  }, []);
  const select = (role: Role) => {
    if (selecting.current || !selectable) return;
    selecting.current = true;
    setSelected(role);
    if (reduceMotion) openAuth(role);
    else exit.set(withTiming(1, { duration: 220, easing: ease }, (done) => {
      if (done) scheduleOnRN(openAuth, role);
    }));
  };
  const emergency = () => {
    settle();
    router.push("/guest-sos");
  };

  return (
    <SafeAreaView style={styles.root}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.glowOne} /><View style={styles.glowTwo} />
      </View>
      <View style={styles.topBar}>
        <Text style={styles.eyebrow}>PITOGO ISLAND · BOHOL</Text>
        {!selectable && <Pressable accessibilityRole="button" accessibilityLabel="Skip intro" onPress={settle} style={styles.skip}><Text style={styles.skipText}>Skip intro</Text><Feather name="chevrons-right" size={16} color={navy.muted} /></Pressable>}
      </View>
      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={selectable}>
        <Animated.View style={[styles.content, surfaceMotion]}>
          <Animated.View style={[styles.brand, brandMotion]} accessible accessibilityLabel="IslaSafe. Pitogo Island Emergency System">
            <View style={styles.logoHalo}><Image source={require("../../assets/app-logo.png")} style={styles.logo} resizeMode="contain" /></View>
            <View style={styles.titleStage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.letters}>{"IslaSafe".split("").map((letter, index) => <BrandLetter key={`${letter}-${index}`} letter={letter} index={index} clock={clock} />)}</View>
              <Animated.View style={[styles.year, yearMotion]}>{new Date().getFullYear().toString().split("").map((digit, index) => <YearDigit key={index} digit={digit} index={index} clock={clock} />)}</Animated.View>
            </View>
            <View style={styles.lineTrack}><Animated.View style={[styles.lineFill, lineMotion]} /></View>
            <Text style={styles.brandTag}>CONNECTED. PREPARED. PROTECTED.</Text>
          </Animated.View>
          <View accessibilityElementsHidden={!selectable} importantForAccessibility={selectable ? "auto" : "no-hide-descendants"} pointerEvents={selectable ? "auto" : "none"}>
            <Animated.Text accessibilityRole="header" style={[styles.heading, headingMotion]}>Welcome to IslaSafe</Animated.Text>
            <Animated.Text style={[styles.subtitle, subtitleMotion]}>Your community. Your safety.{"\n"}Choose how you’ll connect.</Animated.Text>
            <View style={styles.cards}>
              <RoleCard role="residents" title="Resident" detail="Stay informed, find safety, and request help." icon="user" clock={clock} delay={2650} selected={selected === "residents"} disabled={!selectable || Boolean(selected)} reduceMotion={reduceMotion} onSelect={select} />
              <RoleCard role="campmanager" title="Camp Manager" detail="Coordinate your center and support evacuees." icon="home" clock={clock} delay={2800} selected={selected === "campmanager"} disabled={!selectable || Boolean(selected)} reduceMotion={reduceMotion} onSelect={select} />
            </View>
            {!!sessionMessage && <Text accessibilityLiveRegion="polite" style={styles.notice}>{sessionMessage}</Text>}
            {!!sessionMessage && <Pressable accessibilityRole="button" disabled={retrying} onPress={() => { setRetrying(true); void refresh().finally(() => { if (mounted.current) setRetrying(false); }); }} style={styles.retry}><Text style={styles.link}>{retrying ? "Verifying session…" : "Retry session verification"}</Text></Pressable>}
          </View>
        </Animated.View>
      </ScrollView>
      <View style={styles.emergencyArea}>
        <Pressable accessibilityRole="button" accessibilityLabel="Emergency SOS. Continue without signing in" onPress={emergency} style={({ pressed }) => [styles.emergencyButton, pressed && { opacity: 0.8 }]}>
          <Feather name="alert-circle" size={21} color="#ff9dad" /><Text style={styles.emergencyText}>Emergency SOS</Text><Feather name="arrow-right" size={18} color="#ff9dad" />
        </Pressable>
        <Text style={styles.emergencyHint}>{online ? "No account needed to request help" : "Offline · Save a request and review it when connected"}</Text>
        <View style={styles.resources}>
          <Pressable accessibilityRole="button" onPress={() => { settle(); router.push("/guides"); }} style={styles.resourceLink}><Text style={styles.link}>Preparedness guides</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => { settle(); router.push("/hazards"); }} style={styles.resourceLink}><Text style={styles.link}>Hazard references</Text></Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: navy.bg },
  flex: { flex: 1 },
  glowOne: { position: "absolute", top: -100, left: -100, width: 380, height: 380, borderRadius: 200, backgroundColor: "#4338ca", opacity: 0.055 },
  glowTwo: { position: "absolute", bottom: -80, right: -130, width: 360, height: 360, borderRadius: 200, backgroundColor: "#0e7490", opacity: 0.055 },
  topBar: { minHeight: 48, paddingHorizontal: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { fontSize: 10, fontWeight: "600", letterSpacing: 1.8, color: navy.muted },
  skip: { minHeight: 48, flexDirection: "row", gap: 6, alignItems: "center", paddingLeft: 12 },
  skipText: { fontSize: 13, color: navy.muted },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20 },
  content: { width: "100%", maxWidth: 480, alignSelf: "center" },
  brand: { alignItems: "center", paddingTop: 14, paddingBottom: 30 },
  logoHalo: { width: 84, height: 84, alignItems: "center", justifyContent: "center", borderRadius: 42, backgroundColor: "#111a34", borderWidth: 1, borderColor: "#27315b" },
  logo: { width: 68, height: 68 },
  titleStage: { height: 56, marginTop: 12, alignItems: "center", justifyContent: "center" },
  letters: { flexDirection: "row" },
  brandTitle: { color: navy.text, fontSize: 40, fontWeight: "700", letterSpacing: -2, lineHeight: 52 },
  year: { position: "absolute", flexDirection: "row", gap: 3 },
  yearDigit: { color: navy.text, fontSize: 40, fontWeight: "700" },
  lineTrack: { height: 2, width: 120, backgroundColor: "#202943", marginTop: 10, marginBottom: 14, overflow: "hidden" },
  lineFill: { width: "100%", height: "100%", backgroundColor: "#a5b4fc" },
  brandTag: { color: navy.muted, fontSize: 9, fontWeight: "600", letterSpacing: 1.6 },
  heading: { color: navy.text, fontWeight: "700", fontSize: 26, textAlign: "center", letterSpacing: -0.7 },
  subtitle: { color: navy.muted, fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 10 },
  cards: { gap: 14, marginTop: 28 },
  roleCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: navy.border, backgroundColor: navy.card, minHeight: 120 },
  roleCardSelected: { borderColor: "#a5b4fc", backgroundColor: "#141e3a" },
  roleIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#172341", alignItems: "center", justifyContent: "center" },
  roleIconSelected: { backgroundColor: "#29355b" },
  roleTitle: { color: navy.text, fontSize: 18, fontWeight: "700" },
  roleDetail: { color: navy.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  roleAccess: { color: "#b5c1ff", fontSize: 9, fontWeight: "600", letterSpacing: 0.5, lineHeight: 14, marginTop: 10 },
  notice: { color: navy.muted, lineHeight: 20, fontSize: 13, marginTop: 20 },
  retry: { minHeight: 48, justifyContent: "center", alignItems: "center" },
  link: { color: "#b5c1ff", fontSize: 12, fontWeight: "600" },
  emergencyArea: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 6, borderTopWidth: 1, borderTopColor: "#1a2538" },
  emergencyButton: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", minHeight: 52, borderWidth: 1, borderColor: "#683042", backgroundColor: "#24131f", borderRadius: 14 },
  emergencyText: { color: "#ffc3cd", fontSize: 15, fontWeight: "700" },
  emergencyHint: { color: navy.muted, fontSize: 11, textAlign: "center", marginTop: 9 },
  resources: { flexDirection: "row", justifyContent: "center", gap: 18, flexWrap: "wrap" },
  resourceLink: { minHeight: 44, justifyContent: "center" },
});
