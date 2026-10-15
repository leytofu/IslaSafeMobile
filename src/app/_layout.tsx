import { Slot } from "expo-router";
import { View, StyleSheet } from "react-native";
import { enableScreens } from "react-native-screens";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "../state/AppState";
// Plain navigation views avoid the Android native-screen teardown path during development reloads.
enableScreens(false);
function Navigation() {
  const { theme, verified, colors } = useApp();
  return (
    <>
      <StatusBar style={!verified || theme === "dark" ? "light" : "dark"} />
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <Slot />
      </View>
    </>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Navigation />
      </AppProvider>
    </SafeAreaProvider>
  );
}
