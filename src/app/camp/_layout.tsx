import { Redirect, Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SessionLoading } from "../../components/SessionLoading";
import { useApp } from "../../state/AppState";
const screens = [
  { name: "overview", title: "Overview", icon: "grid" },
  { name: "center", title: "Center", icon: "home" },
  { name: "evacuees", title: "Evacuees", icon: "users" },
  { name: "alerts", title: "Alerts", icon: "bell" },
  { name: "profile", title: "Profile", icon: "user" },
] as const;
export default function CampLayout() {
  const { user, ready, verified, colors } = useApp();
  if (!ready) return <SessionLoading />;
  if (!user || !verified) return <Redirect href="/welcome" />;
  if (user.role !== "campmanager") return <Redirect href="/resident/home" />;
  return (
    <Tabs
      backBehavior="history"
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
      <Tabs.Screen name="register" options={{ href: null, title: "Register evacuee" }} />
      {screens.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            tabBarIcon: ({ color, size }) => (
              <Feather name={screen.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
