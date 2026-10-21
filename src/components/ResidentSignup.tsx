import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { useApp } from "../state/AppState";
import { authPalettes } from "../theme/colors";
import { AuthField } from "./AuthField";

type Value = { value: string; onChangeText: (value: string) => void };
type Props = {
  step: number; busy: boolean; error: string;
  name: Value; email: Value; password: Value; confirmation: Value;
  onSubmit: () => void; onBack: () => void; onLogin: () => void;
};
const stages = [
  { title: "What should we call you?", detail: "Start with your full name so your community can recognize you.", label: "Name", icon: "user" },
  { title: "Your email address", detail: "Use an email you can access. You will need it to sign in and recover your account.", label: "Email", icon: "mail" },
  { title: "Create your password", detail: "One last step. Choose a password to protect your IslaSafe account.", label: "Password", icon: "lock" },
] as const;

export function ResidentSignup({ step, busy, error, name, email, password, confirmation, onSubmit, onBack, onLogin }: Props) {
  const { theme } = useApp();
  const colors = authPalettes[theme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { height, fontScale } = useWindowDimensions();
  const [keyboard, setKeyboard] = useState(false);
  const [availableHeight, setAvailableHeight] = useState(height);
  const compact = keyboard || availableHeight < 680 || fontScale > 1.2;
  const scroll = useRef<ScrollView>(null);
  const confirmInput = useRef<TextInput>(null);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [step]);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboard(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const stage = stages[step];
  const submit = () => { Keyboard.dismiss(); onSubmit(); };
  return <SafeAreaView style={styles.root}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.viewport} onLayout={event => setAvailableHeight(event.nativeEvent.layout.height)}>
        <View style={styles.topbar}>
          <Pressable accessibilityRole="button" accessibilityLabel={step === 2 ? "Back to sign in" : "Back"} disabled={busy} onPress={() => { Keyboard.dismiss(); onBack(); }} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Feather name="arrow-left" size={21} color={colors.text} /></Pressable>
          <View style={styles.brand}><Image source={require("../../assets/app-logo.png")} resizeMode="contain" style={styles.logo} accessibilityLabel="Municipality of President Carlos P. Garcia seal" /><Text style={styles.brandName}>IslaSafe</Text></View>
          <View style={styles.back} />
        </View>
        <View style={[styles.progressArea, compact && styles.progressCompact]}>
          <View style={styles.progressCopy}><Text style={styles.eyebrow}>CREATE YOUR ACCOUNT</Text><Text accessibilityLiveRegion="polite" style={styles.stepText}>Step {step + 1} of 3</Text></View>
          <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 3, now: step + 1, text: `Step ${step + 1} of 3: ${stage.label}` }} accessibilityLabel="Registration progress" style={styles.progress}>
            {stages.map((item, index) => <View key={item.label} style={styles.progressItem}>
              <View style={[styles.progressTrack, { backgroundColor: index <= step ? colors.accent : colors.border }]} />
              {!compact && <View style={styles.progressLabel}><Feather name={index < step ? "check-circle" : index === step ? item.icon : "circle"} size={13} color={index <= step ? colors.accent : colors.muted} /><Text style={[styles.progressName, index === step && { color: colors.accent, fontWeight: "600" }]}>{item.label}</Text></View>}
            </View>)}
          </View>
        </View>
        <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
          <Animated.View key={step} entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)} style={[styles.stepContent, compact && styles.stepContentCompact]}>
            <View style={styles.headingArea}><Text accessibilityRole="header" style={[styles.heading, compact && styles.headingCompact]}>{stage.title}</Text>{!compact && <Text style={styles.description}>{stage.detail}</Text>}</View>
            {step === 0 && <AuthField label="Full name" icon="user" placeholder="Enter your full name" {...name} autoCapitalize="words" autoComplete="name" maxLength={255} editable={!busy} compact={compact} returnKeyType="next" onSubmitEditing={submit} />}
            {step === 1 && <AuthField label="Email address" icon="mail" placeholder="you@example.com" {...email} keyboardType="email-address" autoComplete="email" maxLength={255} editable={!busy} compact={compact} returnKeyType="next" onSubmitEditing={submit} />}
            {step === 2 && <>
              <AuthField label="Password" icon="lock" placeholder="At least 8 characters" {...password} password autoComplete="new-password" maxLength={255} editable={!busy} compact={compact} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => confirmInput.current?.focus()} />
              <AuthField label="Confirm password" icon="lock" placeholder="Enter your password again" {...confirmation} inputRef={confirmInput} password autoComplete="new-password" maxLength={255} editable={!busy} compact={compact} returnKeyType="go" onSubmitEditing={submit} />
              <View style={styles.passwordChecks}>
                {[
                  { valid: password.value.length >= 8, touched: password.value.length > 0, text: "At least 8 characters" },
                  { valid: !!confirmation.value && password.value === confirmation.value, touched: confirmation.value.length > 0, text: "Passwords match" },
                ].map(item => {
                  const color = item.valid ? colors.success : item.touched ? colors.dangerLink : colors.muted;
                  const status = item.valid ? "Requirement met" : item.touched ? "Requirement not met" : "Not yet checked";
                  return <View key={item.text} style={styles.hint} accessible accessibilityLabel={`${item.text}. ${status}`}>
                    <Feather name={item.valid ? "check-circle" : item.touched ? "x-circle" : "circle"} size={14} color={color} />
                    <Text style={[styles.hintText, { color }]}>{item.text}</Text>
                  </View>;
                })}
              </View>
            </>}
            {!!error && <View accessibilityRole="alert" accessibilityLiveRegion="assertive" onLayout={() => scroll.current?.scrollToEnd({ animated: true })} style={styles.error}><Feather name="alert-circle" size={18} color={colors.error} /><Text style={styles.errorText}>{error}</Text></View>}
            <Pressable accessibilityRole="button" accessibilityLabel={step === 2 ? "Create account" : "Continue"} accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={submit} style={({ pressed }) => [styles.primary, (pressed || busy) && styles.pressed]}>
              {busy && <ActivityIndicator color="#fff" />}<Text style={styles.primaryText}>{busy ? "Creating your account..." : step === 2 ? "Create account" : "Continue"}</Text>{!busy && <Feather name="arrow-right" size={18} color="#fff" />}
            </Pressable>
            {step === 2 && !compact && <Text style={styles.disclosure}>Next, add your barangay and address to complete your profile. Account creation does not verify residency.</Text>}
            <Pressable accessibilityRole="button" accessibilityLabel="Already have an account? Sign in" disabled={busy} onPress={() => { Keyboard.dismiss(); onLogin(); }} style={({ pressed }) => [styles.login, pressed && styles.pressed]}><Text style={styles.loginText}>Already have an account? <Text style={styles.linkText}>Sign in</Text></Text></Pressable>
          </Animated.View>
        </ScrollView>
        {!keyboard && <View style={styles.footer}><Pressable accessibilityRole="button" accessibilityLabel="Emergency SOS. Continue without signing in" onPress={() => { Keyboard.dismiss(); router.push({ pathname: "/guest-sos", params: { prepare: "1" } }); }} style={({ pressed }) => [styles.sos, pressed && styles.pressed]}><Feather name="alert-circle" size={17} color={colors.emergency} /><Text style={styles.sosText}>Emergency SOS</Text><Text style={styles.guest}>No account needed</Text></Pressable></View>}
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const createStyles = (colors: typeof authPalettes.dark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg }, flex: { flex: 1 }, viewport: { flex: 1, width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 24 },
  topbar: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 48, minHeight: 48, alignItems: "center", justifyContent: "center" }, brand: { flexDirection: "row", alignItems: "center", gap: 8 }, logo: { width: 30, height: 30 }, brandName: { color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.6 },
  progressArea: { gap: 15, paddingTop: 20, paddingBottom: 24 }, progressCompact: { paddingTop: 8, paddingBottom: 12 }, progressCopy: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  eyebrow: { fontSize: 9, fontWeight: "700", letterSpacing: 1.4, color: colors.muted }, stepText: { fontSize: 11, fontWeight: "600", color: colors.accent }, progress: { flexDirection: "row", gap: 10 }, progressItem: { flex: 1, gap: 9 }, progressTrack: { height: 3, borderRadius: 2 }, progressLabel: { flexDirection: "row", gap: 5, alignItems: "center" }, progressName: { color: colors.muted, fontSize: 11 },
  content: { flexGrow: 1, paddingTop: 18, paddingBottom: 12 }, stepContent: { gap: 20 }, stepContentCompact: { gap: 13 }, headingArea: { gap: 10, marginBottom: 8 }, heading: { color: colors.text, fontSize: 30, fontWeight: "700", letterSpacing: -1, lineHeight: 37 }, headingCompact: { fontSize: 26, lineHeight: 32 }, description: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  hint: { flexDirection: "row", alignItems: "center", gap: 7 }, hintText: { color: colors.muted, flexShrink: 1, fontSize: 11, lineHeight: 17 }, passwordChecks: { gap: 6 },
  primary: { minHeight: 54, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 14, backgroundColor: colors.primary }, primaryText: { fontSize: 16, fontWeight: "700", color: "#fff", flexShrink: 1 }, pressed: { opacity: 0.72 },
  login: { minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }, loginText: { color: colors.muted, fontSize: 12, textAlign: "center", lineHeight: 20 }, linkText: { color: colors.accent, fontWeight: "700" }, disclosure: { color: colors.muted, fontSize: 11, lineHeight: 18, textAlign: "center" },
  error: { borderWidth: 1, borderColor: colors.errorBorder, borderRadius: 12, padding: 12, backgroundColor: colors.errorBg, flexDirection: "row", alignItems: "flex-start", gap: 9 }, errorText: { flex: 1, color: colors.error, fontSize: 13, lineHeight: 20 },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 3 }, sos: { minHeight: 48, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8 }, sosText: { color: colors.emergency, fontSize: 12, fontWeight: "600" }, guest: { color: colors.muted, fontSize: 10 },
});
