import { useEffect, useRef, useState, type RefObject } from "react";
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { palettes, useApp } from "../state/AppState";

type Value = { value: string; onChangeText: (value: string) => void };
type Props = {
  step: number; busy: boolean; error: string;
  name: Value; email: Value; password: Value; confirmation: Value;
  onSubmit: () => void; onBack: () => void; onLogin: () => void;
  onEdit: (step: number) => void;
};

const stages = [
  { title: "What’s your name?", detail: "Use the name you go by so your community can recognize you.", icon: "user", label: "Your name" },
  { title: "What’s your email?", detail: "You’ll use this email to log in and recover your account.", icon: "mail", label: "Email address" },
  { title: "Create a password", detail: "Choose a password to keep your IslaSafe account secure.", icon: "lock", label: "Account security" },
  { title: "Ready to join?", detail: "Take a moment to check your details before creating your account.", icon: "check-circle", label: "Review details" },
] as const;

function SignupField({ label, secret = false, inputRef, ...props }: TextInputProps & {
  label: string; secret?: boolean; inputRef?: RefObject<TextInput | null>;
}) {
  const { theme } = useApp();
  const colors = palettes[theme];
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}>
    <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
    <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: focused ? (theme === "dark" ? "#a1b2ff" : colors.primary) : colors.border }]}>
      <TextInput {...props} ref={inputRef} accessibilityLabel={label} autoCorrect={false} autoCapitalize={props.autoCapitalize ?? "none"}
        placeholderTextColor={colors.muted} secureTextEntry={secret && !visible}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={[styles.input, { color: colors.text }]} />
      {secret && <Pressable accessibilityRole="button" accessibilityLabel={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} accessibilityState={{ disabled: props.editable === false }} disabled={props.editable === false} onPress={() => setVisible(!visible)} style={styles.eye}>
        <Feather name={visible ? "eye-off" : "eye"} size={20} color={colors.muted} />
      </Pressable>}
    </View>
  </View>;
}

export function ResidentSignup({ step, busy, error, name, email, password, confirmation, onSubmit, onBack, onLogin, onEdit }: Props) {
  const { theme } = useApp();
  const colors = palettes[theme];
  const scroll = useRef<ScrollView>(null);
  const confirmInput = useRef<TextInput>(null);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [step]);
  const stage = stages[step];
  const accent = theme === "dark" ? "#a1b2ff" : colors.primary;
  const submit = () => { Keyboard.dismiss(); onSubmit(); };
  const review = [
    { label: "Full name", value: name.value.trim(), icon: "user", step: 0 },
    { label: "Email address", value: email.value.trim(), icon: "mail", step: 1 },
    { label: "Password", value: "Password added", icon: "lock", step: 2 },
  ] as const;
  return <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
    <StatusBar style={theme === "dark" ? "light" : "dark"} />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.viewport}>
        <View style={styles.topbar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={busy} onPress={() => { Keyboard.dismiss(); onBack(); }} style={styles.back}>
            <Feather name="arrow-left" size={23} color={colors.text} />
          </Pressable>
          <View style={styles.brand}><Image source={require("../../assets/app-logo.png")} resizeMode="contain" style={styles.logo} accessibilityLabel="Municipality of President Carlos P. Garcia seal" /><Text style={[styles.brandName, { color: colors.text }]}>IslaSafe</Text></View>
          <View style={styles.back} />
        </View>
        <View style={styles.progressArea}>
          <View style={styles.progressCopy}><Text style={[styles.eyebrow, { color: colors.muted }]}>CREATE AN ACCOUNT</Text><Text accessibilityLiveRegion="polite" style={[styles.stepText, { color: accent }]}>Step {step + 1} of 4</Text></View>
          <View accessible accessibilityLabel={`Create account: step ${step + 1} of 4, ${stage.label}`} style={styles.progress}>
            {stages.map((item, index) => <View key={item.label} style={[styles.progressSegment, { backgroundColor: index <= step ? accent : colors.border }]} />)}
          </View>
        </View>
        <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View key={step} style={styles.stepContent}>
            <View style={[styles.stageIcon, { backgroundColor: colors.tint }]}><Feather name={stage.icon} size={27} color={accent} /></View>
            <View style={styles.headingArea}><Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{stage.title}</Text><Text style={[styles.description, { color: colors.muted }]}>{stage.detail}</Text></View>
            {step === 0 && <SignupField label="Full name" placeholder="Enter your full name" {...name} autoCapitalize="words" autoComplete="name" maxLength={255} editable={!busy} returnKeyType="next" onSubmitEditing={submit} />}
            {step === 1 && <>
              <SignupField label="Email address" placeholder="you@example.com" {...email} keyboardType="email-address" autoComplete="email" maxLength={255} editable={!busy} returnKeyType="next" onSubmitEditing={submit} />
              <View style={styles.hint}><Feather name="info" size={16} color={colors.muted} /><Text style={[styles.hintText, { color: colors.muted }]}>Use an email you can access. You’ll need it if you forget your password.</Text></View>
            </>}
            {step === 2 && <>
              <SignupField label="Password" placeholder="At least 8 characters" {...password} secret autoComplete="new-password" maxLength={255} editable={!busy} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => confirmInput.current?.focus()} />
              <SignupField label="Confirm password" placeholder="Enter your password again" {...confirmation} inputRef={confirmInput} secret autoComplete="new-password" maxLength={255} editable={!busy} returnKeyType="next" onSubmitEditing={submit} />
              <View style={styles.passwordChecks}>
                {[{ valid: password.value.length >= 8, text: "At least 8 characters" }, { valid: !!confirmation.value && password.value === confirmation.value, text: "Passwords match" }].map(item => <View key={item.text} style={styles.hint}><Feather name={item.valid ? "check-circle" : "circle"} size={15} color={item.valid ? accent : colors.muted} /><Text style={[styles.hintText, { color: item.valid ? accent : colors.muted }]}>{item.text}</Text></View>)}
              </View>
            </>}
            {step === 3 && <>
              <View style={[styles.review, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {review.map((item, index) => <View key={item.label} style={[styles.reviewRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Feather name={item.icon} size={19} color={colors.muted} /><View style={styles.reviewCopy}><Text style={[styles.reviewLabel, { color: colors.muted }]}>{item.label}</Text><Text style={[styles.reviewValue, { color: colors.text }]}>{item.value}</Text></View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.label.toLowerCase()}`} disabled={busy} onPress={() => onEdit(item.step)} style={styles.edit}><Text style={[styles.linkText, { color: accent }]}>Edit</Text></Pressable>
                </View>)}
              </View>
              <View style={[styles.nextCard, { backgroundColor: colors.tint }]}><Feather name="map-pin" size={21} color={accent} /><View style={styles.reviewCopy}><Text style={[styles.nextTitle, { color: colors.text }]}>Next, make it yours</Text><Text style={[styles.hintText, { color: colors.muted }]}>After signup, add your barangay and address to complete your resident profile.</Text></View></View>
              <Text style={[styles.disclosure, { color: colors.muted }]}>Creating an account does not verify your residency in Pitogo.</Text>
            </>}
            {!!error && <View accessibilityRole="alert" accessibilityLiveRegion="assertive" onLayout={() => scroll.current?.scrollToEnd({ animated: true })} style={[styles.error, { borderColor: theme === "dark" ? "#723342" : "#f3c5cc", backgroundColor: theme === "dark" ? "#291923" : "#fff0f2" }]}><Feather name="alert-circle" size={18} color={theme === "dark" ? "#ff9dad" : "#b6223d"} /><Text style={[styles.errorText, { color: theme === "dark" ? "#ffb7c4" : "#a42038" }]}>{error}</Text></View>}
            <Pressable accessibilityRole="button" accessibilityLabel={step === 3 ? "Create account" : "Next"} accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={submit} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (pressed || busy) && { opacity: .7 }]}>
              {busy ? <ActivityIndicator color="#fff" /> : <><Text style={styles.primaryText}>{step === 3 ? "Create account" : "Next"}</Text><Feather name={step === 3 ? "check" : "arrow-right"} size={19} color="#fff" /></>}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Already have an account? Log in" disabled={busy} onPress={() => { Keyboard.dismiss(); onLogin(); }} style={styles.login}><Text style={[styles.loginText, { color: colors.muted }]}>Already have an account? <Text style={[styles.linkText, { color: accent }]}>Log in</Text></Text></Pressable>
          </View>
        </ScrollView>
        <View style={[styles.footer, { borderTopColor: colors.border }]}><Pressable accessibilityRole="button" accessibilityLabel="Emergency SOS. Continue without signing in" onPress={() => { Keyboard.dismiss(); router.push("/guest-sos"); }} style={styles.sos}><Feather name="alert-circle" size={17} color={theme === "dark" ? "#ff9dad" : colors.danger} /><Text style={[styles.sosText, { color: theme === "dark" ? "#ffb7c4" : colors.danger }]}>Emergency SOS</Text><Text style={[styles.guest, { color: colors.muted }]}>No account needed</Text></Pressable></View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, flex: { flex: 1 },
  viewport: { flex: 1, width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 24 },
  topbar: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 }, logo: { width: 32, height: 32 },
  brandName: { fontSize: 19, fontWeight: "700", letterSpacing: -.6 },
  progressArea: { gap: 12, paddingTop: 16, paddingBottom: 16 }, progressCopy: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.6 }, stepText: { fontSize: 12, fontWeight: "600" },
  progress: { flexDirection: "row", gap: 6 }, progressSegment: { flex: 1, height: 4, borderRadius: 4 },
  content: { flexGrow: 1, paddingTop: 20, paddingBottom: 16 }, stepContent: { gap: 22 },
  stageIcon: { width: 62, height: 62, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  headingArea: { gap: 10 }, heading: { fontSize: 30, fontWeight: "700", letterSpacing: -1 },
  description: { fontSize: 15, lineHeight: 23 }, field: { gap: 8 }, fieldLabel: { fontSize: 13, fontWeight: "600" },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16 },
  input: { flex: 1, minWidth: 0, minHeight: 56, fontSize: 16, paddingHorizontal: 16, paddingVertical: 14 },
  eye: { width: 48, minHeight: 52, alignItems: "center", justifyContent: "center" },
  hint: { flexDirection: "row", alignItems: "flex-start", gap: 8 }, hintText: { flex: 1, fontSize: 12, lineHeight: 19 }, passwordChecks: { gap: 8 },
  primary: { minHeight: 54, borderRadius: 28, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 14 },
  primaryText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  login: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }, loginText: { fontSize: 13, textAlign: "center", lineHeight: 21 }, linkText: { fontSize: 13, fontWeight: "700" },
  review: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16 }, reviewRow: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 14 }, reviewCopy: { flex: 1, minWidth: 0, gap: 5 }, reviewLabel: { fontSize: 11 }, reviewValue: { fontSize: 14, lineHeight: 21 }, edit: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  nextCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 16 }, nextTitle: { fontSize: 13, fontWeight: "700" }, disclosure: { fontSize: 11, lineHeight: 18 },
  error: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 }, errorText: { flex: 1, fontSize: 13, lineHeight: 20 },
  footer: { borderTopWidth: 1, paddingVertical: 4 }, sos: { minHeight: 48, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8 }, sosText: { fontSize: 12, fontWeight: "600" }, guest: { fontSize: 10 },
});
