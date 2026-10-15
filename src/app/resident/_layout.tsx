import { Redirect, Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SessionLoading } from "../../components/SessionLoading";
import { useApp } from "../../state/AppState";
const screens = [
  { name: "home", title: "Home", icon: "home" },
  { name: "map", title: "Map", icon: "map" },
  { name: "sos", title: "SOS", icon: "alert-circle" },
  { name: "alerts", title: "Alerts", icon: "bell" },
  { name: "profile", title: "Profile", icon: "user" },
] as const;
export default function ResidentLayout() {
  const { user, ready, verified, colors } = useApp();
  if (!ready) return <SessionLoading />;
  if (!user || !verified) return <Redirect href="/welcome" />;
  if (user.role !== "residents") return <Redirect href="/camp/overview" />;
  return (
    <Tabs
      detachInactiveScreens={false}
      screenOptions={{
        animation: "fade",
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          minHeight: 70,
        },
        tabBarItemStyle: { minHeight: 48 },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      {screens.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            tabBarIcon: ({ color, size }) => (
              <Feather
                name={screen.icon}
                color={screen.name === "sos" ? colors.danger : color}
                size={size}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
