import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "./ui";
import { palettes } from "../state/AppState";

/** No protected content while validating, and no waiting to reach public SOS. */
export function SessionLoading() {
  return <SafeAreaView style={styles.root}>
    <View style={styles.status}><ActivityIndicator color="#a5b4fc" /><Text accessibilityLiveRegion="polite" style={styles.text}>Checking your secure session…</Text></View>
    <Button danger icon="alert-circle" title="Emergency SOS · Continue as guest" onPress={() => router.push("/guest-sos")} />
    <Button secondary title="Offline preparedness guides" onPress={() => router.push("/guides")} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palettes.dark.bg, padding: 24, gap: 16 },
  status: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  text: { color: palettes.dark.muted, fontSize: 15 },
});
