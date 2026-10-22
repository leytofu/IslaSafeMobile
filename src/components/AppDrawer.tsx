import { useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { DrawerContentScrollView, type DrawerContentComponentProps } from "expo-router/drawer";
import { useApp } from "../state/AppState";
import { errorMessage } from "../lib/api";
import { campDestinations, residentDestinations, drawerTarget, type MenuDestination } from "../lib/navigation";
import { UserAvatar } from "./UserAvatar";
import { Button, Copy, Dialog, Notice } from "./ui";

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { user, verified, theme, logout } = useApp();
  const pathname = usePathname();
  const dark = theme === "dark";
  const palette = dark
    ? { bg: "#101f3d", text: "#ffffff", muted: "#b8c7e1", line: "#2a3b59", soft: "#1b2d4b", active: "#ffffff", activeText: "#101f3d" }
    : { bg: "#ffffff", text: "#17233c", muted: "#69758c", line: "#edf0f6", soft: "#f3f5fb", active: "#2946d8", activeText: "#ffffff" };
  const danger = dark ? "#ff8797" : "#b6223d";
  const dangerBackground = "#b6223d";
  const [dialog, setDialog] = useState<"about" | "signout" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const destinations = verified && user ? user.role === "campmanager" ? campDestinations : residentDestinations : [];
  const settings = destinations.find(item => item.key === "settings" || item.key === "profile");
  const main = destinations.filter(item => item !== settings && item.key !== "alerts");
  const account = destinations.filter(item => item === settings || item.key === "alerts");
  function navigate(item: MenuDestination) {
    if (!item.href || item.href === pathname) { props.navigation.closeDrawer(); return; }
    const target = drawerTarget(item.href);
    props.navigation.navigate(target.name, target.params);
  }
  function link(item: MenuDestination) {
    const selected = item.href === pathname;
    const emergency = item.key === "sos";
    const color = emergency ? selected ? "#ffffff" : danger : selected ? palette.activeText : palette.text;
    return <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={item.title} accessibilityState={{ selected }} onPress={() => navigate(item)}
      style={({ pressed }) => [styles.link, { backgroundColor: selected ? emergency ? dangerBackground : palette.active : pressed ? palette.soft : "transparent", opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.icon}><Feather name={item.icon} size={20} color={color} /></View>
      <Text style={[styles.label, { color, fontWeight: selected ? "700" : "500" }]}>{item.title}</Text>
      {selected && <Feather name="chevron-right" size={16} color={color} />}
    </Pressable>;
  }
  return <>
    <DrawerContentScrollView {...props} style={{ backgroundColor: palette.bg }} contentContainerStyle={styles.content}>
      <View style={styles.brand}>
        <View style={[styles.logoFrame, { backgroundColor: palette.soft }]}><Image source={require("../../assets/app-logo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="IslaSafe community seal" /></View>
        <View style={styles.flex}><Text style={[styles.brandName, { color: palette.text }]}>IslaSafe<Text style={{ color: dark ? "#b7ceff" : "#2946d8" }}>.</Text></Text><Text style={[styles.caption, { color: palette.muted }]}>Ready for what matters</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close navigation menu" onPress={() => props.navigation.closeDrawer()} style={({ pressed }) => [styles.close, { backgroundColor: pressed ? palette.soft : "transparent" }]}><Feather name="x" size={21} color={palette.muted} /></Pressable>
      </View>
      <View style={[styles.role, { backgroundColor: palette.soft, borderColor: palette.line }]}><Feather name={user?.role === "campmanager" ? "home" : "shield"} size={15} color={palette.text} /><Text style={[styles.roleLabel, { color: palette.text }]}>{user?.role === "campmanager" ? "CAMP MANAGER" : "RESIDENT SPACE"}</Text><View style={[styles.roleDot, { backgroundColor: dark ? "#a9f3cd" : "#21a16a" }]} /></View>
      <Text style={[styles.section, { color: palette.muted }]}>WORKSPACE</Text>
      <View style={styles.links}>{main.map(link)}</View>
      <View style={[styles.divider, { backgroundColor: palette.line }]} />
      <Text style={[styles.section, { color: palette.muted }]}>ACCOUNT</Text>
      <View style={styles.links}>
        {account.map(link)}
        <Pressable accessibilityRole="button" accessibilityLabel="About ISLA Safe" onPress={() => setDialog("about")} style={({ pressed }) => [styles.link, { backgroundColor: pressed ? palette.soft : "transparent" }]}><View style={styles.icon}><Feather name="info" size={20} color={palette.text} /></View><Text style={[styles.label, { color: palette.text }]}>About ISLA Safe</Text></Pressable>
      </View>
      <View style={styles.spacer} />
      {user && settings && <Pressable accessibilityRole="button" accessibilityLabel="Open account settings" onPress={() => navigate(settings)} style={({ pressed }) => [styles.account, { backgroundColor: pressed ? palette.soft : "transparent", borderColor: palette.line }]}>
        <UserAvatar user={user} theme={theme} size={42} radius={15} />
        <View style={styles.flex}><Text numberOfLines={1} style={[styles.accountName, { color: palette.text }]}>{user.name}</Text><Text numberOfLines={1} style={[styles.caption, { color: palette.muted }]}>{user.email}</Text></View><Feather name="more-horizontal" size={20} color={palette.muted} />
      </Pressable>}
      {user && <Pressable accessibilityRole="button" accessibilityLabel="Sign out" disabled={busy} onPress={() => setDialog("signout")} style={({ pressed }) => [styles.signout, { backgroundColor: dangerBackground, opacity: busy || pressed ? 0.65 : 1 }]}><Feather name="log-out" size={17} color="#ffffff" /><Text style={[styles.caption, { color: "#ffffff", fontWeight: "700" }]}>Sign out</Text></Pressable>}
    </DrawerContentScrollView>
    <Dialog visible={dialog === "about"} title="About ISLA Safe" onClose={() => setDialog(null)} closeLabel="Close about ISLA Safe">
      <Copy title="ISLA Safe - Version 1.0.0" /><Copy>A GIS-based disaster evacuation and emergency rescue system for President Carlos P. Garcia, Bohol. Supporting community preparedness and coordination with MDRRMO and BDRRMC.</Copy>
    </Dialog>
    <Dialog visible={dialog === "signout"} title="Sign out of ISLA Safe?" onClose={() => { if (!busy) setDialog(null); }}>
      {!!error && <Notice error text={error} />}<Copy>Saved SOS records remain on this device and are available through guest SOS. Offline sign-out cannot revoke the server token.</Copy>
      <Button danger title="Sign out of this device" loading={busy} onPress={() => {
        if (lock.current) return;
        lock.current = true; setBusy(true); setError("");
        void logout().catch(failure => setError(errorMessage(failure))).finally(() => { lock.current = false; setBusy(false); });
      }} />
    </Dialog>
  </>;
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 12 }, flex: { flex: 1, minWidth: 0 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 12, paddingBottom: 28 },
  logoFrame: { width: 42, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" }, logo: { width: 30, height: 34 }, brandName: { fontSize: 23, lineHeight: 30, fontWeight: "800", letterSpacing: -0.8 }, caption: { fontSize: 11, lineHeight: 18 },
  close: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  role: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, minHeight: 44, borderRadius: 14, borderWidth: 1, marginBottom: 24 }, roleLabel: { flex: 1, fontSize: 10, fontWeight: "700", letterSpacing: 1.2 }, roleDot: { width: 6, height: 6, borderRadius: 3 },
  section: { fontSize: 10, fontWeight: "600", letterSpacing: 1.6, marginBottom: 12, paddingHorizontal: 12 },
  links: { gap: 4 }, link: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 50, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12 }, icon: { width: 24, alignItems: "center" }, label: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 21 },
  divider: { height: 1, marginVertical: 24, marginHorizontal: 12 }, spacer: { flex: 1, minHeight: 32 },
  account: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 20, padding: 12 }, accountName: { fontSize: 12, lineHeight: 20, fontWeight: "700" }, signout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48, borderRadius: 14, marginTop: 12 },
});
