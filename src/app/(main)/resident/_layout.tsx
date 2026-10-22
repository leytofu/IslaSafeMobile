import { Redirect, Tabs } from "expo-router";
import { residentTabs } from "../../../components/dashboard/ResidentNavigation";
import { dashboardPalettes } from "../../../theme/colors";
import { SessionLoading } from "../../../components/SessionLoading";
import { useApp } from "../../../state/AppState";
export default function ResidentLayout() {
  const { user, ready, verified, theme } = useApp();
  const colors = dashboardPalettes[theme];
  if (!ready) return <SessionLoading />;
  if (!user || !verified) return <Redirect href="/welcome" />;
  if (user.role !== "residents") return <Redirect href="/camp/overview" />;
  if (user.profile_complete === false) return <Redirect href="/complete-profile" />;
  return (
    <Tabs
      backBehavior="history"
      detachInactiveScreens={false}
      tabBar={() => null}
      screenOptions={{
        animation: "fade",
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {residentTabs.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
          }}
        />
      ))}
    </Tabs>
  );
}
