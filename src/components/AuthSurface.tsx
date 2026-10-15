import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions, type TextInputProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { router } from "expo-router";
import { palettes } from "../state/AppState";
import type { Role } from "../lib/contracts";

const colors = palettes.dark;
type Mode = "login" | "register" | "recovery";
type Value = { value: string; onChangeText: (value: string) => void };

function AuthField({ label, icon, password = false, compact = false, ...props }: TextInputProps & { label: string; icon: "user" | "mail" | "lock" | "key"; password?: boolean; compact?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return <View style={[styles.field, compact && styles.fieldCompact]}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrap, compact && styles.inputWrapCompact, focused && styles.inputFocused]}>
      <Feather name={icon} size={18} color={colors.muted} />
      <TextInput {...props} accessibilityLabel={label} onFocus={(event) => { setFocused(true); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); props.onBlur?.(event); }} autoCapitalize={props.autoCapitalize ?? "none"} autoCorrect={false} placeholderTextColor="#7e8ea8" secureTextEntry={password && !visible} style={[styles.input, compact && styles.inputCompact]} />
      {password && <Pressable accessibilityRole="button" accessibilityLabel={visible ? "Hide password" : "Show password"} accessibilityState={{ checked: visible }} onPress={() => setVisible(!visible)} style={styles.eye}><Feather name={visible ? "eye-off" : "eye"} size={19} color={colors.muted} /></Pressable>}
    </View>
  </View>;
}

export function AuthSurface({ role, mode, phase, registrationStep, busy, error, message, name, email, password, confirmation, otp, onSubmit, onModeChange, onBack, onResend }: {
  role: Role; mode: Mode; phase: number; registrationStep: number; busy: boolean; error: string; message: string;
  name: Value; email: Value; password: Value; confirmation: Value; otp: Value;
  onSubmit: () => void; onModeChange: (mode: Mode) => void; onBack: () => void; onResend: () => void;
}) {
  const { height, fontScale } = useWindowDimensions();
  const [availableHeight, setAvailableHeight] = useState(height);
  const [keyboard, setKeyboard] = useState(false);
  const lastHeight = useRef(height);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboard(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const compact = keyboard || availableHeight < 740 || Boolean(error || message) || fontScale > 1.2;
  const tight = keyboard || availableHeight < 560 || fontScale > 1.5;
  const resident = role === "residents";
  const registeringIdentity = mode === "register" && registrationStep === 0;
  const heading = mode === "login" ? "Welcome back" : mode === "register" ? (registrationStep === 0 ? "Join your community" : "Secure your account") : phase === 0 ? "Reset your password" : phase === 1 ? "Check your email" : "Choose a new password";
  const subtitle = mode === "login" ? (resident ? "Sign in to stay informed and prepared." : "Your workspace for coordinated care.") : mode === "register" ? (registrationStep === 0 ? "Let’s start with your name and email." : "Use a password with at least 8 characters.") : phase === 0 ? "We’ll send a code to your registered email." : phase === 1 ? "Enter your six-digit code. It expires in 5 minutes." : "Use at least 8 characters to protect your account.";
  const submitTitle = mode === "login" ? "Sign in" : mode === "register" ? (registrationStep === 0 ? "Continue" : "Create account") : phase === 0 ? "Send verification code" : phase === 1 ? "Verify code" : "Save new password";
  const notice = error || message;
  const dismissAndSubmit = () => { Keyboard.dismiss(); onSubmit(); };
  return <SafeAreaView style={styles.root}>
    <View pointerEvents="none" style={styles.ambient} />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.viewport, compact && styles.viewportCompact]} onLayout={(event) => {
        const next = event.nativeEvent.layout.height;
        if (Math.abs(lastHeight.current - next) > 1) { lastHeight.current = next; setAvailableHeight(next); }
      }}>
        <View style={styles.topbar}>
          <Pressable accessibilityRole="button" accessibilityLabel={mode === "login" ? "Choose a different role" : "Back"} disabled={busy} onPress={() => { Keyboard.dismiss(); onBack(); }} style={styles.back}><Feather name="arrow-left" size={20} color={colors.text} /><Text style={styles.backText}>{mode === "login" ? "Roles" : "Back"}</Text></Pressable>
          <View style={styles.roleBadge}><Feather name={resident ? "user" : "home"} size={12} color="#b5c1ff" /><Text style={styles.roleName}>{resident ? "Resident" : "Camp Manager"}</Text></View>
          {keyboard && <Pressable accessibilityRole="button" accessibilityLabel="Dismiss keyboard" onPress={Keyboard.dismiss} style={styles.done}><Feather name="chevron-down" size={20} color={colors.text} /></Pressable>}
        </View>
        {!compact && <View style={styles.brand}><Image source={require("../../assets/app-logo.png")} resizeMode="contain" style={styles.logo} accessibilityLabel="Municipality of President Carlos P. Garcia emblem" /><View style={styles.brandCopy}><Text style={styles.brandName}>IslaSafe</Text><Text style={styles.brandTag}>CONNECTED. PREPARED. PROTECTED.</Text></View></View>}
        <Animated.View entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)} style={[styles.form, compact && styles.formCompact]}>
          <View style={styles.headingArea}><Text accessibilityRole="header" style={[styles.heading, compact && styles.headingCompact]}>{heading}</Text>{!compact && <Text style={styles.subtitle}>{subtitle}</Text>}</View>
          {resident && mode !== "recovery" && <View style={styles.tabs}>
            {(["login", "register"] as const).map((tab) => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: mode === tab, disabled: busy }} disabled={busy} onPress={() => { if (mode !== tab) { Keyboard.dismiss(); onModeChange(tab); } }} style={[styles.tab, mode === tab && styles.tabActive]}><Text style={[styles.tabText, mode === tab && styles.tabTextActive]}>{tab === "login" ? "Sign in" : "Sign up"}</Text></Pressable>)}
          </View>}
          {mode === "register" && !tight && <View style={styles.steps}><View style={styles.stepActive} /><View style={registrationStep === 1 ? styles.stepActive : styles.step} /><Text style={styles.stepLabel}>Step {registrationStep + 1} of 2</Text></View>}
          <View style={[styles.fields, tight && styles.fieldsCompact]}>
            {registeringIdentity && <AuthField compact={tight} label="Full name" icon="user" placeholder="Your full name" {...name} autoCapitalize="words" autoComplete="name" maxLength={255} editable={!busy} />}
            {(mode === "login" || registeringIdentity || (mode === "recovery" && phase === 0)) && <AuthField compact={tight} label="Email address" icon="mail" placeholder="you@example.com" {...email} keyboardType="email-address" autoComplete="email" maxLength={255} editable={!busy} />}
            {(mode === "login" || (mode === "register" && registrationStep === 1) || (mode === "recovery" && phase === 2)) && <AuthField compact={tight} label={mode === "recovery" ? "New password" : "Password"} icon="lock" password placeholder={mode === "login" ? "Enter your password" : "At least 8 characters"} {...password} autoComplete={mode === "login" ? "current-password" : "new-password"} editable={!busy} returnKeyType={mode === "login" ? "go" : "next"} onSubmitEditing={mode === "login" ? dismissAndSubmit : undefined} />}
            {((mode === "register" && registrationStep === 1) || (mode === "recovery" && phase === 2)) && <AuthField compact={tight} label="Confirm password" icon="lock" password placeholder="Re-enter your password" {...confirmation} autoComplete="new-password" editable={!busy} returnKeyType="go" onSubmitEditing={dismissAndSubmit} />}
            {mode === "recovery" && phase === 1 && <AuthField compact={tight} label="Verification code" icon="key" placeholder="6-digit code" {...otp} autoComplete="one-time-code" keyboardType="number-pad" maxLength={6} editable={!busy} />}
          </View>
          {!!notice && <Pressable accessibilityRole="button" accessibilityLabel={`${notice}. Tap for full details.`} onPress={() => Alert.alert(error ? "Unable to continue" : "IslaSafe", notice)} style={[styles.notice, error ? styles.noticeError : undefined]}><Feather name={error ? "alert-circle" : "check-circle"} size={16} color={error ? "#ff9dad" : "#a5b4fc"} /><Text accessibilityLiveRegion="polite" numberOfLines={tight ? 1 : 2} style={styles.noticeText}>{notice}</Text></Pressable>}
          <View style={[styles.actions, mode === "login" && styles.loginActions]}>
            <Pressable accessibilityRole="button" accessibilityLabel={submitTitle} accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={dismissAndSubmit} style={({ pressed }) => [styles.submit, mode === "login" && styles.loginSubmit, (pressed || busy) && { opacity: 0.7 }]}>{busy ? <ActivityIndicator color="#fff" /> : <><Text style={styles.submitText}>{submitTitle}</Text><Feather name="arrow-right" size={18} color="#fff" /></>}</Pressable>
            {mode === "login" && <Pressable accessibilityRole="button" disabled={busy} onPress={() => { Keyboard.dismiss(); onModeChange("recovery"); }} style={styles.linkButton}><Text style={styles.link}>Forgot password?</Text></Pressable>}
          </View>
          {mode !== "login" && <View style={styles.secondary}>
            {mode === "recovery" && phase === 1 ? <Pressable accessibilityRole="button" disabled={busy} onPress={onResend} style={styles.linkButton}><Text style={styles.link}>Resend verification code</Text></Pressable> : <View style={styles.lockNote}><Feather name="lock" size={12} color={colors.muted} /><Text style={styles.note}>{mode === "register" ? "Resident account · Secure sign-up" : "Secure account recovery"}</Text></View>}
          </View>}
          {!resident && mode === "login" && !compact && <Text style={styles.assigned}>Accounts are assigned by your administrator.</Text>}
        </Animated.View>
        <View style={[styles.footer, compact && styles.footerCompact]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Emergency SOS. Continue without signing in" onPress={() => { Keyboard.dismiss(); router.push("/guest-sos"); }} style={({ pressed }) => [styles.emergency, pressed && { opacity: 0.75 }]}><Feather name="alert-circle" size={18} color="#ff9dad" /><Text style={styles.emergencyText}>Emergency SOS</Text>{!compact && <Text style={styles.guest}>No account needed</Text>}</Pressable>
          {!compact && <Text style={styles.municipality}>President Carlos P. Garcia · Bohol</Text>}
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  ambient: { position: "absolute", top: -180, right: -130, width: 400, height: 400, borderRadius: 220, backgroundColor: "#4338ca", opacity: 0.07 },
  viewport: { flex: 1, paddingHorizontal: 24, paddingBottom: 12, width: "100%", maxWidth: 480, alignSelf: "center" },
  viewportCompact: { paddingHorizontal: 20, paddingBottom: 4 },
  topbar: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  back: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7, paddingRight: 12 },
  backText: { color: colors.muted, fontSize: 13 },
  roleBadge: { flexDirection: "row", flexShrink: 1, alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: "#111c35", borderWidth: 1, borderColor: "#283455" },
  roleName: { flexShrink: 1, color: "#b5c1ff", fontSize: 11, fontWeight: "600" },
  done: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  brand: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 12, paddingBottom: 20, gap: 14 },
  brandCopy: { gap: 6 },
  logo: { width: 56, height: 56 },
  brandName: { color: colors.text, fontSize: 28, fontWeight: "700", letterSpacing: -1 },
  brandTag: { color: colors.muted, fontSize: 8, letterSpacing: 1.5, fontWeight: "600" },
  form: { flex: 1, justifyContent: "center", gap: 12, paddingBottom: 12 },
  formCompact: { gap: 4, paddingBottom: 4 },
  headingArea: { gap: 6 },
  heading: { color: colors.text, fontSize: 28, fontWeight: "700", letterSpacing: -0.8 },
  headingCompact: { fontSize: 21 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  tabs: { flexDirection: "row", backgroundColor: "#0c1424", borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 4 },
  tab: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#25366a" },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#eef3f9" },
  steps: { flexDirection: "row", alignItems: "center", gap: 6 },
  step: { width: 24, height: 3, borderRadius: 3, backgroundColor: colors.border },
  stepActive: { width: 24, height: 3, borderRadius: 3, backgroundColor: "#a5b4fc" },
  stepLabel: { color: colors.muted, fontSize: 11, marginLeft: 4 },
  fields: { gap: 12 },
  fieldsCompact: { gap: 8 },
  field: { gap: 6 },
  fieldCompact: { gap: 3 },
  label: { color: "#d4deed", fontSize: 12, lineHeight: 16, fontWeight: "500" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 50, backgroundColor: "#0d1729", borderWidth: 1, borderColor: "#2b3952", borderRadius: 12, paddingLeft: 14 },
  inputFocused: { borderColor: "#a5b4fc", backgroundColor: "#121d34" },
  inputWrapCompact: { minHeight: 44 },
  input: { flex: 1, minHeight: 48, fontSize: 15, color: colors.text, paddingVertical: 10, paddingRight: 12 },
  inputCompact: { minHeight: 42, paddingVertical: 8 },
  eye: { width: 44, height: 48, alignItems: "center", justifyContent: "center" },
  submit: { minHeight: 50, borderRadius: 12, backgroundColor: "#334edb", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  actions: { gap: 8 },
  loginActions: { flexDirection: "row", alignItems: "center" },
  loginSubmit: { flex: 1 },
  secondary: { alignItems: "center" },
  linkButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  link: { color: "#b5c1ff", fontSize: 12, fontWeight: "600" },
  lockNote: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 6 },
  note: { color: colors.muted, fontSize: 11 },
  assigned: { color: colors.muted, fontSize: 11, textAlign: "center" },
  notice: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 9, backgroundColor: "#141e37" },
  noticeError: { backgroundColor: "#2a1523" },
  noticeText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 17 },
  footer: { paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 12 },
  footerCompact: { paddingTop: 4, gap: 0 },
  emergency: { minHeight: 48, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  emergencyText: { color: "#ffb7c4", fontSize: 13, fontWeight: "600" },
  guest: { color: colors.muted, fontSize: 10 },
  municipality: { textAlign: "center", color: "#8191a8", fontSize: 10 },
});
