import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { DrawerContentScrollView, type DrawerContentComponentProps } from "expo-router/drawer";
import { useState } from "react";
import { useApp } from "../state/AppState";
import { dashboardPalettes } from "../theme/colors";
import { campDestinations, residentDestinations, drawerTarget, type MenuDestination } from "../lib/navigation";
import { HouseholdSheet } from "./ResidentMenu";

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { user, verified, theme } = useApp();
  const colors = dashboardPalettes[theme];
  const pathname = usePathname();
  const [household, setHousehold] = useState(false);
  const destinations = verified && user ? user.role === "campmanager" ? campDestinations : residentDestinations : [];
  function navigate(item: MenuDestination) {
    if (item.key === "household") { props.navigation.closeDrawer(); setHousehold(true); return; }
    if (!item.href || item.href === pathname) { props.navigation.closeDrawer(); return; }
    // The drawer's NAVIGATE action selects the nested screen and closes the
    // drawer in one state transition. It never pushes a section onto a stack.
    const target = drawerTarget(item.href);
    props.navigation.navigate(target.name, target.params);
  }
  return <>
    <DrawerContentScrollView {...props} contentContainerStyle={styles.content}>
      <View style={[styles.brand, { borderBottomColor: colors.border }]}>
        <Image source={require("../../assets/reference-brand.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="IslaSafe community seal" />
        <View style={styles.flex}><Text style={[styles.brandName, { color: colors.text }]}>IslaSafe.</Text><Text style={[styles.caption, { color: colors.muted }]}>{user?.role === "campmanager" ? "Camp Manager" : "Your island. Your community."}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close navigation menu" onPress={() => props.navigation.closeDrawer()}
          style={({ pressed }) => [styles.close, { backgroundColor: pressed ? colors.tint : colors.card, borderColor: colors.border }]}>
          <Feather name="x" size={21} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.links}>
        {destinations.map(item => {
          const selected = item.href === pathname;
          const color = selected ? colors.accent : item.key === "sos" ? colors.danger : colors.text;
          return <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={item.title} accessibilityState={{ selected }}
            onPress={() => navigate(item)}
            style={({ pressed }) => [styles.link, { backgroundColor: selected || pressed ? colors.tint : "transparent", borderColor: selected ? colors.border : "transparent", opacity: pressed ? 0.75 : 1 }]}>
            <Feather name={item.icon} size={21} color={color} />
            <Text style={[styles.label, { color, fontWeight: selected ? "700" : "500" }]}>{item.title}</Text>
            {selected && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
          </Pressable>;
        })}
      </View>
    </DrawerContentScrollView>
    <HouseholdSheet theme={theme} visible={household} onClose={() => setHousehold(false)} />
  </>;
}
const styles = StyleSheet.create({
  content: { flexGrow: 1 }, flex: { flex: 1, minWidth: 0 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 18, borderBottomWidth: 1 },
  logo: { width: 38, height: 42 }, brandName: { fontSize: 22, lineHeight: 29, fontWeight: "700", letterSpacing: -0.6 }, caption: { fontSize: 11, lineHeight: 17 },
  close: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  links: { padding: 12, gap: 5 }, link: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  label: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 21 }, activeDot: { width: 6, height: 6, borderRadius: 3 },
});
