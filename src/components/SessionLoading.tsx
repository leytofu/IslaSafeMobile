import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "./ui";
import { useApp } from "../state/AppState";

/** No protected content while validating, and no waiting to reach public SOS. */
export function SessionLoading() {
  const { colors } = useApp();
  return <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
    <View style={styles.status}><ActivityIndicator color={colors.primary} /><Text accessibilityLiveRegion="polite" style={[styles.text, { color: colors.muted }]}>Checking your secure session…</Text></View>
    <Button danger icon="alert-circle" title="Emergency SOS · Continue as guest" onPress={() => router.push("/guest-sos")} />
    <Button secondary title="Offline preparedness guides" onPress={() => router.push("/guides")} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, gap: 16 },
  status: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  text: { fontSize: 15 },
});
