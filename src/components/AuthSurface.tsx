import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { router } from "expo-router";
import { useApp } from "../state/AppState";
import { authPalettes } from "../theme/colors";
import type { Role } from "../lib/contracts";
import { ResidentSignup } from "./ResidentSignup";
import { AuthField } from "./AuthField";

function useAuthStyles() {
  const { theme } = useApp();
  const colors = authPalettes[theme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  return { colors, styles };
}
type Mode = "login" | "register" | "recovery";
type Value = { value: string; onChangeText: (value: string) => void };

export function AuthSurface({ role, mode, phase, registrationStep, busy, rememberMe, onRememberMeChange, error, message, name, email, password, confirmation, otp, onSubmit, onModeChange, onBack, onResend }: {
  role: Role; mode: Mode; phase: number; registrationStep: number; busy: boolean; error: string; message: string;
  name: Value; email: Value; password: Value; confirmation: Value; otp: Value;
  onSubmit: () => void; onModeChange: (mode: Mode) => void; onBack: () => void; onResend: () => void;
  rememberMe: boolean; onRememberMeChange: (value: boolean) => void;
}) {
  const { colors, styles } = useAuthStyles();
  const { height, fontScale } = useWindowDimensions();
  const [availableHeight, setAvailableHeight] = useState(height);
  const [keyboard, setKeyboard] = useState(false);
  const lastHeight = useRef(height);
  const passwordInput = useRef<TextInput>(null);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboard(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const compact = keyboard || availableHeight < 740 || Boolean(error || message) || fontScale > 1.2;
  const tight = keyboard || availableHeight < 560 || fontScale > 1.5;
  const resident = role === "residents";
  if (resident && mode === "register") return <ResidentSignup step={registrationStep} busy={busy} error={error} name={name} email={email} password={password} confirmation={confirmation} onSubmit={onSubmit} onBack={onBack} onLogin={() => onModeChange("login")} />;
  const heading = mode === "login" ? "Welcome back" : phase === 0 ? "Reset your password" : phase === 1 ? "Check your email" : "Choose a new password";
  const subtitle = mode === "login" ? (resident ? "Sign in to stay informed and prepared." : "Your workspace for coordinated care.") : phase === 0 ? "We’ll send a code to your registered email." : phase === 1 ? "Enter your six-digit code. It expires in 5 minutes." : "Use at least 8 characters to protect your account.";
  const submitTitle = mode === "login" ? "Sign in" : phase === 0 ? "Send verification code" : phase === 1 ? "Verify code" : "Save new password";
  const notice = error || message;
  const dismissAndSubmit = () => { Keyboard.dismiss(); onSubmit(); };
  return <SafeAreaView style={styles.root}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.viewport, compact && styles.viewportCompact]} onLayout={(event) => {
        const next = event.nativeEvent.layout.height;
        if (Math.abs(lastHeight.current - next) > 1) { lastHeight.current = next; setAvailableHeight(next); }
      }}>
        <View style={styles.topbar}>
          <Pressable accessibilityRole="button" accessibilityLabel={mode === "login" ? "Choose a different role" : "Back"} disabled={busy} onPress={() => { Keyboard.dismiss(); onBack(); }} style={styles.back}><Feather name="arrow-left" size={20} color={colors.text} /><Text style={styles.backText}>{mode === "login" ? "Roles" : "Back"}</Text></Pressable>
          <View style={styles.roleBadge}><Feather name={resident ? "user" : "home"} size={12} color={colors.accent} /><Text style={styles.roleName}>{resident ? "Resident" : "Camp Manager"}</Text></View>
          {keyboard && <Pressable accessibilityRole="button" accessibilityLabel="Dismiss keyboard" onPress={Keyboard.dismiss} style={styles.done}><Feather name="chevron-down" size={20} color={colors.text} /></Pressable>}
        </View>
        {!compact && <View style={styles.brand}><Image source={require("../../assets/app-logo.png")} resizeMode="contain" style={styles.logo} accessibilityLabel="Municipality of President Carlos P. Garcia emblem" /><View style={styles.brandCopy}><Text style={styles.brandName}>IslaSafe</Text><Text style={styles.brandTag}>CONNECTED. PREPARED. PROTECTED.</Text></View></View>}
        <ScrollView style={styles.flex} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
        <Animated.View entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)} style={[styles.form, compact && styles.formCompact]}>
          <View style={styles.headingArea}><Text accessibilityRole="header" style={[styles.heading, compact && styles.headingCompact]}>{heading}</Text>{!compact && <Text style={styles.subtitle}>{subtitle}</Text>}</View>
          <View style={[styles.fields, tight && styles.fieldsCompact]}>
            {(mode === "login" || (mode === "recovery" && phase === 0)) && <AuthField compact={tight} label="Email address" icon="mail" placeholder="you@example.com" {...email} keyboardType="email-address" autoComplete="email" maxLength={255} editable={!busy} returnKeyType={mode === "login" ? "next" : "go"} submitBehavior="submit" onSubmitEditing={() => mode === "login" ? passwordInput.current?.focus() : dismissAndSubmit()} />}
            {(mode === "login" || (mode === "recovery" && phase === 2)) && <AuthField compact={tight} inputRef={passwordInput} label={mode === "recovery" ? "New password" : "Password"} icon="lock" password placeholder={mode === "login" ? "Enter your password" : "At least 8 characters"} {...password} autoComplete={mode === "login" ? "current-password" : "new-password"} editable={!busy} returnKeyType={mode === "login" ? "go" : "next"} onSubmitEditing={mode === "login" ? dismissAndSubmit : undefined} />}
            {mode === "recovery" && phase === 2 && <AuthField compact={tight} label="Confirm password" icon="lock" password placeholder="Re-enter your password" {...confirmation} autoComplete="new-password" editable={!busy} returnKeyType="go" onSubmitEditing={dismissAndSubmit} />}
            {mode === "recovery" && phase === 1 && <AuthField compact={tight} label="Verification code" icon="key" placeholder="6-digit code" {...otp} autoComplete="one-time-code" keyboardType="number-pad" maxLength={6} editable={!busy} />}
          </View>
          {mode === "login" && <View style={styles.optionsRow}>
            <Pressable accessibilityRole="checkbox" aria-checked={rememberMe} accessibilityLabel="Remember me" accessibilityHint="Keep me signed in after reopening the app" accessibilityState={{ checked: rememberMe, disabled: busy }} disabled={busy} onPress={() => onRememberMeChange(!rememberMe)} style={({ pressed }) => [styles.remember, pressed && styles.pressed]}><Feather name={rememberMe ? "check-square" : "square"} size={21} color={rememberMe ? colors.accent : colors.muted} /><Text style={styles.rememberText}>Remember me</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => { Keyboard.dismiss(); onModeChange("recovery"); }} style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}><Text style={[styles.link, styles.forgotText]}>Forgot password?</Text></Pressable>
          </View>}
          {!!notice && <Pressable accessibilityRole="button" accessibilityLabel={`${notice}. Tap for full details.`} onPress={() => Alert.alert(error ? "Unable to continue" : "IslaSafe", notice)} style={[styles.notice, error ? styles.noticeError : undefined]}><Feather name={error ? "alert-circle" : "check-circle"} size={18} color={error ? colors.error : colors.focusBorder} /><Text accessibilityLiveRegion="polite" style={styles.noticeText}>{notice}</Text></Pressable>}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={submitTitle} accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={dismissAndSubmit} style={({ pressed }) => [styles.submit, (pressed || busy) && styles.pressed]}>{busy ? <><ActivityIndicator color="#fff" /><Text style={styles.submitText}>{mode === "login" ? "Signing in..." : "Please wait..."}</Text></> : <><Text style={styles.submitText}>{submitTitle}</Text><Feather name="arrow-right" size={18} color="#fff" /></>}</Pressable>
          </View>
          {resident && mode === "login" && <Pressable accessibilityRole="button" accessibilityLabel="Create new account" disabled={busy} onPress={() => { Keyboard.dismiss(); onModeChange("register"); }} style={styles.createAccount}><Text style={styles.createAccountText}>Create new account</Text></Pressable>}
          {mode !== "login" && <View style={styles.secondary}>
            {mode === "recovery" && phase === 1 ? <Pressable accessibilityRole="button" disabled={busy} onPress={onResend} style={styles.linkButton}><Text style={styles.link}>Resend verification code</Text></Pressable> : <View style={styles.lockNote}><Feather name="lock" size={12} color={colors.muted} /><Text style={styles.note}>Secure account recovery</Text></View>}
          </View>}
          {!resident && mode === "login" && !compact && <Text style={styles.assigned}>Accounts are assigned by your administrator.</Text>}
        </Animated.View>
        </ScrollView>
        <View style={[styles.footer, compact && styles.footerCompact]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Emergency SOS. Continue without signing in" onPress={() => { Keyboard.dismiss(); router.push({ pathname: "/guest-sos", params: { prepare: "1" } }); }} style={({ pressed }) => [styles.emergency, pressed && { opacity: 0.75 }]}><Feather name="alert-circle" size={18} color={colors.error} /><Text style={styles.emergencyText}>Emergency SOS</Text>{!compact && <Text style={styles.guest}>No account needed</Text>}</Pressable>
          {!compact && <Text style={styles.municipality}>President Carlos P. Garcia · Bohol</Text>}
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const createStyles = (colors: typeof authPalettes.dark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg }, flex: { flex: 1 },
  viewport: { flex: 1, paddingHorizontal: 24, paddingBottom: 8, width: "100%", maxWidth: 480, alignSelf: "center" },
  viewportCompact: { paddingHorizontal: 20, paddingBottom: 4 },
  topbar: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  back: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 7, paddingRight: 12 },
  backText: { color: colors.muted, fontSize: 13 },
  roleBadge: { flexDirection: "row", flexShrink: 1, alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.badge, borderWidth: 1, borderColor: colors.badgeBorder },
  roleName: { flexShrink: 1, color: colors.accent, fontSize: 11, fontWeight: "600" },
  done: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  brand: { flexDirection: "row", alignItems: "center", paddingTop: 12, paddingBottom: 24, gap: 11 },
  brandCopy: { gap: 4 }, logo: { width: 44, height: 44 },
  brandName: { color: colors.text, fontSize: 25, fontWeight: "800", letterSpacing: -0.8 },
  brandTag: { color: colors.muted, fontSize: 8, letterSpacing: 1, fontWeight: "600" },
  form: { gap: 16, paddingTop: 14, paddingBottom: 24 }, formCompact: { gap: 12, paddingTop: 12, paddingBottom: 16 },
  headingArea: { gap: 8, marginBottom: 8 }, heading: { color: colors.text, fontSize: 32, fontWeight: "700", letterSpacing: -1.1 },
  headingCompact: { fontSize: 27 }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  fields: { gap: 18 }, fieldsCompact: { gap: 12 },
  optionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: -8 },
  remember: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 7, flexShrink: 1 }, rememberText: { color: colors.muted, fontSize: 12, flexShrink: 1 },
  forgotButton: { minHeight: 48, alignItems: "flex-end", justifyContent: "center", flexShrink: 1 },
  forgotText: { color: colors.dangerLink },
  actions: { gap: 8 }, submit: { minHeight: 54, borderRadius: 15, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 14 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 }, pressed: { opacity: 0.72 },
  createAccount: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 15, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.card },
  createAccountText: { color: colors.accent, fontSize: 14, fontWeight: "600" }, secondary: { alignItems: "center" },
  linkButton: { minHeight: 48, justifyContent: "center", paddingHorizontal: 12 }, link: { color: colors.accent, fontSize: 12, fontWeight: "600", lineHeight: 18 },
  lockNote: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 6 }, note: { color: colors.muted, fontSize: 11 }, assigned: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.notice },
  noticeError: { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }, noticeText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20 },
  footer: { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, gap: 4 }, footerCompact: { paddingTop: 2, gap: 0 },
  emergency: { minHeight: 48, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8 },
  emergencyText: { color: colors.emergency, fontSize: 13, fontWeight: "600" }, guest: { color: colors.muted, fontSize: 10 }, municipality: { textAlign: "center", color: colors.muted, fontSize: 10 },
});
