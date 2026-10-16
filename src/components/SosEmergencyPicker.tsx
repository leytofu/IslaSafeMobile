import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { BackButton } from "./BackButton";
import { dashboardPalettes, type ThemeMode } from "../theme/colors";

// Matches the emergency selection step in resources/ui/IslaSafe_Resident_Mobile_App.html.
const emergencyTypes = [
  { label: "Medical Emergency", emoji: "🚑" },
  { label: "Trapped / Rescue", emoji: "🚨" },
  { label: "Need Evacuation", emoji: "🏃" },
  { label: "Stranded Family", emoji: "👪" },
  { label: "Missing Person", emoji: "🔍" },
  { label: "Other", emoji: "⚠️" },
] as const;

export function SosEmergencyPicker({ theme, initialType, initialDetails, onClose, onContinue }: {
  theme: ThemeMode;
  initialType: string;
  initialDetails: string;
  onClose: () => void;
  onContinue: (type: string, details: string) => void;
}) {
  const c = dashboardPalettes[theme];
  const [type, setType] = useState(initialType);
  const [details, setDetails] = useState(initialDetails);
  const selected = emergencyTypes.some(item => item.label === type);
  const close = () => { Keyboard.dismiss(); onClose(); };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <SafeAreaView style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss emergency selection" style={StyleSheet.absoluteFill} onPress={close} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboard}>
          <View accessibilityViewIsModal style={[styles.panel, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.header, { borderBottomColor: c.border }]}>
              <BackButton theme={theme} onPress={close} label="Back to SOS" />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>What&#39;s the Emergency?</Text>
              <Text style={[styles.subtitle, { color: c.muted }]}>Select the type that best describes your situation.</Text>
              <View accessibilityRole="radiogroup" style={styles.grid}>
                {emergencyTypes.map(item => <Pressable key={item.label} accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{ checked: type === item.label }} aria-checked={type === item.label} onPress={() => setType(item.label)} style={({ pressed }) => [styles.option, { backgroundColor: type === item.label ? c.dangerSoft : c.bg, borderColor: type === item.label ? c.danger : c.border, opacity: pressed ? 0.75 : 1 }]}>
                  <Text accessible={false} style={styles.emoji}>{item.emoji}</Text>
                  <Text style={[styles.optionLabel, { color: type === item.label ? c.danger : c.text }]}>{item.label}</Text>
                </Pressable>)}
              </View>
              <Text style={[styles.label, { color: c.muted }]}>Additional Details <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput accessibilityLabel="Additional emergency details" placeholder="Number of people, condition, landmark…" placeholderTextColor={c.subtle} value={details} onChangeText={setDetails} maxLength={2000} multiline textAlignVertical="top" autoCapitalize="sentences" style={[styles.input, { color: c.text, backgroundColor: c.bg, borderColor: c.border }]} />
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: !selected }} disabled={!selected} onPress={() => { Keyboard.dismiss(); onContinue(type, details); }} style={({ pressed }) => [styles.continue, { backgroundColor: theme === "dark" ? "#f5495e" : "#c81f34", opacity: !selected ? 0.45 : pressed ? 0.8 : 1 }]}>
                <Text style={styles.continueText}>{selected ? `Continue — ${type}` : "Select a type to continue"}</Text>
                {selected && <Feather name="arrow-right" size={17} color="#fff" />}
              </Pressable>
              <Text style={[styles.footnote, { color: c.muted }]}>Next, check your location and contact details before sending.</Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "rgba(0,0,0,0.7)" },
  keyboard: { width: "100%", maxWidth: 440, maxHeight: "100%" },
  panel: { borderRadius: 22, borderWidth: 1, overflow: "hidden", flexShrink: 1 },
  content: { padding: 20 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: "700", letterSpacing: -0.4 },
  subtitle: { fontSize: 12, lineHeight: 19, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  option: { width: "48%", flexGrow: 1, minHeight: 90, paddingVertical: 14, paddingHorizontal: 7, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 7 },
  emoji: { fontSize: 25 },
  optionLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  label: { fontSize: 12, fontWeight: "600", marginTop: 18, marginBottom: 8 },
  optional: { fontWeight: "400" },
  input: { borderRadius: 10, borderWidth: 1, minHeight: 80, maxHeight: 150, padding: 12, fontSize: 13, lineHeight: 20 },
  continue: { marginTop: 16, minHeight: 50, borderRadius: 11, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  continueText: { color: "#fff", fontSize: 13, fontWeight: "700", flexShrink: 1, textAlign: "center" },
  footnote: { fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 10 },
});
