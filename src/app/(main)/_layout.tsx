import { usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useWindowDimensions } from "react-native";
import { AppDrawerContent } from "../../components/AppDrawer";
import { useApp } from "../../state/AppState";
import { dashboardPalettes } from "../../theme/colors";
import { isMainNavigationPath } from "../../lib/navigation";

export default function MainLayout() {
  const { theme, user, verified } = useApp();
  const colors = dashboardPalettes[theme];
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  return <Drawer backBehavior="history" detachInactiveScreens={false}
    drawerContent={props => <AppDrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
      drawerType: "front",
      drawerPosition: "left",
      swipeEnabled: Boolean(user && verified && isMainNavigationPath(pathname)),
      drawerStyle: { width: Math.min(width * 0.86, 344), backgroundColor: colors.bg, borderRightColor: colors.border, borderRightWidth: 1 },
      overlayColor: "rgba(0,0,0,0.46)",
      sceneStyle: { backgroundColor: colors.bg },
    }}>
    <Drawer.Screen name="resident" options={{ title: "Resident" }} />
    <Drawer.Screen name="camp" options={{ title: "Camp Manager" }} />
    <Drawer.Screen name="guides" options={{ title: "Preparedness Guides" }} />
    <Drawer.Screen name="hazards" options={{ title: "Offline Hazard Maps" }} />
  </Drawer>;
}
