import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "../state/AppState";
import { dashboardPalettes } from "../theme/colors";
import type { useMapLocation } from "../hooks/useMapLocation";

export function MapLocationControl({ location, ready, error, onReload }: {
  location: ReturnType<typeof useMapLocation>; ready: boolean; error?: string; onReload: () => void;
}) {
  const { theme } = useApp();
  const c = dashboardPalettes[theme];
  const message = error || location.error;
  return <>
    {!!message && <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.message, { color: c.text }]}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={error ? onReload : location.status === "denied" ? location.openSettings : location.recenter} style={styles.retry}>
        <Text style={{ color: c.accent, fontWeight: "700" }}>{error ? "Retry map" : location.status === "denied" ? "Open settings" : "Retry location"}</Text>
      </Pressable>
    </View>}
    <Pressable testID="map-current-location" accessibilityRole="button" accessibilityLabel="Current location" accessibilityHint="Center and zoom the map on your GPS position" accessibilityState={{ disabled: !ready || location.busy, busy: location.busy }} disabled={!ready || location.busy} onPress={location.recenter}
      style={({ pressed }) => [styles.button, { backgroundColor: pressed ? c.tint : c.card, borderColor: c.border, opacity: !ready ? 0.5 : pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
      {location.busy ? <ActivityIndicator accessibilityLabel="Finding your location" color={c.accent} /> : <Feather name="crosshair" size={24} color={location.position ? "#2563eb" : c.text} />}
    </Pressable>
  </>;
}

const styles = StyleSheet.create({
  button: { position: "absolute", right: 16, bottom: 32, width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: "center", justifyContent: "center", elevation: 5, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  notice: { position: "absolute", left: 12, right: 84, bottom: 32, padding: 12, borderRadius: 16, borderWidth: 1 },
  message: { fontSize: 12, lineHeight: 18 }, retry: { minHeight: 44, justifyContent: "center" },
});
