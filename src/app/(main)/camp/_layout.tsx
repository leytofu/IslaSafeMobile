import { Redirect, Stack } from "expo-router";
import { useApp } from "../../../state/AppState";
import { SessionLoading } from "../../../components/SessionLoading";

export const unstable_settings = { initialRouteName: "(sections)" };

export default function CampStack() {
  const { user, ready, verified, colors } = useApp();
  if (!ready) return <SessionLoading />;
  if (!user || !verified) return <Redirect href="/welcome" />;
  if (user.role !== "campmanager") return <Redirect href="/resident/home" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
    <Stack.Screen name="(sections)" />
    <Stack.Screen name="register" />
  </Stack>;
}
