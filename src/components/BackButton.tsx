import { Keyboard, Pressable, StyleSheet, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { palettes, type ThemeMode } from "../theme/colors";

export function BackButton({ theme, onPress, fallback = "/welcome", disabled = false, label = "Back" }: {
  theme: ThemeMode;
  onPress?: () => void;
  fallback?: Href;
  disabled?: boolean;
  label?: string;
}) {
  const c = palettes[theme];
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Return to the previous screen or step" accessibilityState={{ disabled }} disabled={disabled}
    onPress={() => {
      Keyboard.dismiss();
      if (onPress) onPress();
      else if (router.canGoBack()) router.back();
      else router.replace(fallback);
    }}
    style={({ pressed }) => [styles.button, { backgroundColor: c.card, borderColor: c.border, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}>
    <Feather name="arrow-left" size={20} color={c.text} />
    <Text style={[styles.label, { color: c.text }]}>Back</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { minWidth: 86, minHeight: 48, alignSelf: "flex-start", paddingHorizontal: 12, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  label: { fontSize: 14, fontWeight: "600" },
});
