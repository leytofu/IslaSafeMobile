import { usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useWindowDimensions } from "react-native";
import { NotificationProvider } from "../../components/NotificationCenter";
import { AppDrawerContent } from "../../components/AppDrawer";
import { useApp } from "../../state/AppState";
import { dashboardPalettes } from "../../theme/colors";
import { isMainNavigationPath } from "../../lib/navigation";

export default function MainLayout() {
  const { theme, user, verified } = useApp();
  const colors = dashboardPalettes[theme];
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  return <NotificationProvider><Drawer backBehavior="history" detachInactiveScreens={false}
    drawerContent={props => <AppDrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
      drawerType: "front",
      drawerPosition: "left",
      swipeEnabled: Boolean(user && verified && isMainNavigationPath(pathname)),
      drawerStyle: { width: Math.min(width * 0.88, 352), backgroundColor: theme === "dark" ? "#101f3d" : colors.card, borderTopRightRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" },
      overlayColor: "rgba(0,0,0,0.46)",
      sceneStyle: { backgroundColor: colors.bg },
    }}>
    <Drawer.Screen name="resident" options={{ title: "Resident" }} />
    <Drawer.Screen name="camp" options={{ title: "Camp Manager" }} />
    <Drawer.Screen name="guides" options={{ title: "Preparedness Guides" }} />
    <Drawer.Screen name="hazards" options={{ drawerItemStyle: { display: "none" } }} />
  </Drawer></NotificationProvider>;
}
