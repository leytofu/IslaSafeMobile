import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { View, StyleSheet, useColorScheme } from "react-native";
import { enableScreens } from "react-native-screens";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "../state/AppState";
import { DeviceLocationProvider } from "../state/DeviceLocation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// Plain navigation views avoid the Android native-screen teardown path during development reloads.
enableScreens(false);
function Navigation() {
  const { theme, colors } = useApp();
  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(main)" options={{ animation: "none" }} />
        </Stack>
      </View>
    </>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
export default function RootLayout() {
  const systemTheme = useColorScheme();
  const [splashReleased, setSplashReleased] = useState(false);
  useEffect(() => {
    // Release Android's pre-draw splash gate before mounting UI-thread animations.
    // Otherwise onboarding can wait on a UI frame that the native splash blocks.
    let mounted = true;
    const released = () => { if (mounted) setSplashReleased(true); };
    void SplashScreen.hideAsync().then(released, released);
    return () => { mounted = false; };
  }, []);
  if (!splashReleased) return <View style={[styles.root, { backgroundColor: systemTheme === "dark" ? "#050810" : "#f5f7fb" }]} />;
  return (
    <GestureHandlerRootView style={styles.root}><SafeAreaProvider>
      <AppProvider>
        <DeviceLocationProvider><Navigation /></DeviceLocationProvider>
      </AppProvider>
    </SafeAreaProvider></GestureHandlerRootView>
  );
}
