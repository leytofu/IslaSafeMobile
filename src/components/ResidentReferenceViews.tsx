import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { dashboardPalettes, type ThemeMode } from "../theme/colors";
import { Badge, Surface, type DashboardIcon } from "./dashboard/DashboardPrimitives";
import type { User } from "../lib/contracts";
import { UserAvatar } from "./UserAvatar";

export function ReferenceSosHero({ theme, onPrepare, disabled = false }: { theme: ThemeMode; onPrepare?: () => void; disabled?: boolean }) {
  const c = dashboardPalettes[theme];
  return <View style={styles.sosHero}>
    <View style={[styles.sosOuter, { borderColor: c.dangerBorder, backgroundColor: c.dangerSoft }]}><View style={[styles.sosMiddle, { borderColor: c.dangerBorder }]}><Pressable accessibilityRole="button" accessibilityLabel="Prepare Emergency SOS" disabled={disabled || !onPrepare} onPress={onPrepare} style={styles.sosCircle}><Text style={styles.sosTitle}>SOS</Text><Text style={styles.sosHint}>TAP TO PREPARE</Text></Pressable></View></View>
    <Text style={[styles.heading, { color: c.text, textAlign: "center" }]}>Send Emergency Distress Signal</Text>
    <Text style={[styles.body, { color: c.muted, textAlign: "center" }]}>Share your GPS location and emergency details with local responders. Review your request before sending.</Text>
    <View style={styles.sosShortcuts}>{[["phone", "Call Hotline"], ["map", "Hazard Map"], ["shield", "MDRRMO"]].map(([icon, label]) => <View key={label} style={styles.sosShortcut}><View style={[styles.shortcutIcon, { backgroundColor: c.tint }]}><Feather name={icon as DashboardIcon} size={20} color={c.accent} /></View><Text style={[styles.caption, { color: c.muted }]}>{label}</Text></View>)}</View>
  </View>;
}

const advisoryExamples = [
  { level: "Critical", icon: "alert-triangle", title: "Typhoon advisory: prepare your household", detail: "Example evacuation advisory for coastal communities. Follow official instructions when issued.", time: "Sample · All barangays", color: "danger" },
  { level: "Warning", icon: "cloud-rain", title: "Heavy rainfall preparedness reminder", detail: "Keep essential supplies ready and avoid crossing flooded roads.", time: "Sample · Weather advisory", color: "warning" },
  { level: "Info", icon: "home", title: "Know your nearest evacuation center", detail: "Review your household meeting point and the items in your go bag.", time: "Sample · Community information", color: "accent" },
] as const;

export function ReferenceAlerts({ theme }: { theme: ThemeMode }) {
  const c = dashboardPalettes[theme];
  const [filter, setFilter] = useState("All");
  return <View style={styles.stack}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      {["All", "Critical", "Warning", "Info"].map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={[styles.filter, { backgroundColor: filter === item ? c.primary : c.card, borderColor: filter === item ? c.primary : c.border }]}><Text style={[styles.filterText, { color: filter === item ? "#ffffff" : c.muted }]}>{item}</Text></Pressable>)}
    </ScrollView>
    <Text style={[styles.caption, { color: c.subtle }]}>DESIGN PREVIEW · SAMPLE ADVISORIES</Text>
    {advisoryExamples.filter((item) => filter === "All" || filter === item.level).map((item) => <Surface key={item.title} colors={c} style={{ borderLeftWidth: 3, borderLeftColor: c[item.color] }}>
      <View style={styles.row}><Badge label={item.level} color={c[item.color]} background={item.color === "danger" ? c.dangerSoft : item.color === "warning" ? c.warningSoft : c.tint} /><Feather name={item.icon} size={20} color={c[item.color]} /></View>
      <Text style={[styles.itemTitle, { color: c.text, marginTop: 12 }]}>{item.title}</Text><Text style={[styles.body, { color: c.muted, marginTop: 7 }]}>{item.detail}</Text><Text style={[styles.caption, { color: c.subtle, marginTop: 12 }]}>{item.time}</Text>
    </Surface>)}
  </View>;
}

const settingsItems: { key: string; icon: DashboardIcon; title: string; detail: string }[] = [
  { key: "profile", icon: "user", title: "Edit Profile", detail: "Name, contact, address" },
  { key: "security", icon: "lock", title: "Account Security", detail: "Email & IslaSafe password" },
  { key: "contacts", icon: "phone", title: "Emergency Contacts", detail: "Family & neighbor contacts" },
  { key: "notifications", icon: "bell", title: "Notification Settings", detail: "Alerts, advisories, SOS updates" },
  { key: "offline", icon: "download-cloud", title: "Offline Map Settings", detail: "Hazard maps & emergency guides" },
  { key: "language", icon: "globe", title: "Language", detail: "Filipino / English" },
  { key: "privacy", icon: "shield", title: "Privacy Policy", detail: "Your data & privacy" },
  { key: "about", icon: "info", title: "About IslaSafe", detail: "v1.0.0 · MDRRMO-CPG" },
];

export function ReferenceSettings({ theme, user, onToggleTheme, onEditProfile, onOffline }: { theme: ThemeMode; user?: Partial<User> | null; onToggleTheme: () => void; onEditProfile?: () => void; onOffline?: () => void }) {
  const c = dashboardPalettes[theme];
  const [detail, setDetail] = useState<string | null>(null);
  const [language, setLanguage] = useState("English");
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  function choose(key: string) {
    if ((key === "profile" || key === "security") && onEditProfile) { onEditProfile(); return; }
    if (key === "offline" && onOffline) { onOffline(); return; }
    setDetail(key);
  }
  const selected = settingsItems.find((item) => item.key === detail);
  return <View style={styles.stack}>
    <Surface colors={c} style={styles.profileCard}>
      <UserAvatar user={user?.name ? { name: user.name, avatar_url: user.avatar_url } : undefined} theme={theme} size={52} />
      <View style={styles.flex}><Text style={[styles.heading, { color: c.text }]}>{user?.name || "Juan Santos"}</Text><Text style={[styles.caption, { color: c.muted }]}>{user?.barangay || "Poblacion"} · Resident</Text><Text style={[styles.caption, { color: c.subtle }]}>{user?.email || "juan@example.com"}</Text></View>
    </Surface>
    <Surface colors={c}><Text style={[styles.caption, { color: c.subtle, marginBottom: 12 }]}>APPEARANCE</Text><View style={styles.row}><View style={styles.inline}><Feather name={theme === "dark" ? "moon" : "sun"} size={20} color={c.accent} /><Text style={[styles.itemTitle, { color: c.text }]}>Dark Mode</Text></View><Switch accessibilityLabel="Dark Mode" value={theme === "dark"} onValueChange={onToggleTheme} trackColor={{ false: c.border, true: c.primary }} thumbColor="#ffffff" /></View></Surface>
    <Surface colors={c} style={{ padding: 0, overflow: "hidden" }}>
      {settingsItems.map((item, index) => <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => choose(item.key)} style={({ pressed }) => [styles.settingsRow, { borderTopWidth: index ? 1 : 0, borderColor: c.border, backgroundColor: pressed ? c.tint : "transparent" }]}><View style={[styles.settingIcon, { backgroundColor: c.tint }]}><Feather name={item.icon} size={17} color={c.accent} /></View><View style={styles.flex}><Text style={[styles.itemTitle, { color: c.text }]}>{item.title}</Text><Text style={[styles.caption, { color: c.subtle }]}>{item.detail}</Text></View><Feather name="chevron-right" size={17} color={c.subtle} /></Pressable>)}
    </Surface>
    <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
      <View style={styles.modalBackdrop}><View style={[styles.modal, { backgroundColor: c.bg, borderColor: c.border }]}><View style={styles.row}><Text style={[styles.heading, { color: c.text }]}>{selected?.title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close settings details" onPress={() => setDetail(null)} style={styles.close}><Feather name="x" size={22} color={c.text} /></Pressable></View>
        <ScrollView contentContainerStyle={styles.stack}>
          {detail === "contacts" ? <><Text style={[styles.caption, { color: c.subtle }]}>SAMPLE CONTACTS · NOT NOTIFIED AUTOMATICALLY</Text>{[["Maria Santos", "Spouse · 0917-555-0142"], ["Pedro Santos", "Father · 0918-555-0187"]].map(([name, phone]) => <Surface key={name} colors={c}><Text style={[styles.itemTitle, { color: c.text }]}>{name}</Text><Text style={[styles.body, { color: c.muted }]}>{phone}</Text></Surface>)}</>
          : detail === "notifications" ? <><Text style={[styles.body, { color: c.muted }]}>Preview preferences only. Push notifications are not connected.</Text>{["Critical Alerts", "Advisory Updates", "SOS Status Updates", "Evacuation Center Capacity", "Sound & Vibration"].map((item) => <View key={item} style={styles.row}><Text style={[styles.itemTitle, { color: c.text, flex: 1 }]}>{item}</Text><Switch value={preferences[item] ?? true} onValueChange={(value) => setPreferences((current) => ({ ...current, [item]: value }))} trackColor={{ false: c.border, true: c.primary }} thumbColor="#ffffff" /></View>)}</>
          : detail === "language" ? <><Text style={[styles.body, { color: c.muted }]}>Language selection preview. Existing content remains in English.</Text>{["English", "Filipino", "Cebuano / Binisaya"].map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: language === item }} onPress={() => setLanguage(item)} style={[styles.languageRow, { borderColor: c.border, backgroundColor: language === item ? c.tint : c.card }]}><Text style={[styles.itemTitle, { color: c.text }]}>{item}</Text>{language === item && <Feather name="check" color={c.accent} size={18} />}</Pressable>)}</>
          : detail === "privacy" ? <><Text style={[styles.itemTitle, { color: c.text }]}>Your information</Text><Text style={[styles.body, { color: c.muted }]}>IslaSafe uses profile details and the location you choose to include in an emergency request. Review details before submitting. Contact your local administrator about access, correction, or deletion of your records.</Text><Text style={[styles.body, { color: c.muted }]}>This is a presentation of the privacy screen. The final policy must reflect the deployed system.</Text></>
          : detail === "about" ? <><View style={[styles.aboutIcon, { backgroundColor: c.tint }]}><Feather name="shield" size={38} color={c.accent} /></View><Text style={[styles.heading, { color: c.text }]}>IslaSafe</Text><Text style={[styles.caption, { color: c.muted }]}>Version 1.0.0 · Pitogo Island</Text><Text style={[styles.body, { color: c.muted }]}>A GIS-based disaster evacuation and emergency rescue system for President Carlos P. Garcia, Bohol. Developed for community preparedness and coordination with MDRRMO and BDRRMC.</Text></>
          : <Text style={[styles.body, { color: c.muted }]}>Design preview. Use the signed-in resident account to edit your profile, manage sign-in, and view bundled offline resources.</Text>}
        </ScrollView>
      </View></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  stack: { gap: 14 }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, inline: { flexDirection: "row", alignItems: "center", gap: 10 }, flex: { flex: 1 },
  heading: { fontSize: 20, lineHeight: 28, letterSpacing: -0.5, fontWeight: "700" }, body: { fontSize: 13, lineHeight: 21 }, itemTitle: { fontSize: 13, lineHeight: 20, fontWeight: "600" }, caption: { fontSize: 10, lineHeight: 17 },
  sosHero: { alignItems: "center", paddingVertical: 24, gap: 18 }, sosOuter: { width: 224, height: 224, borderRadius: 112, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  sosMiddle: { width: 194, height: 194, borderRadius: 97, borderWidth: 8, alignItems: "center", justifyContent: "center" }, sosCircle: { width: 174, height: 174, borderRadius: 87, backgroundColor: "#f5495e", alignItems: "center", justifyContent: "center", gap: 9 },
  sosTitle: { color: "#210608", fontSize: 46, fontWeight: "800", letterSpacing: 1 }, sosHint: { color: "#4d1720", fontSize: 9, fontWeight: "700", letterSpacing: 2 },
  sosShortcuts: { flexDirection: "row", justifyContent: "center", gap: 22, marginTop: 6 }, sosShortcut: { alignItems: "center", gap: 8 }, shortcutIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  filters: { flexDirection: "row", gap: 8 }, filter: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 }, filterText: { fontSize: 12, fontWeight: "600" },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 13 }, avatar: { width: 52, height: 52, borderRadius: 27, alignItems: "center", justifyContent: "center" }, avatarText: { fontSize: 24, fontWeight: "700" },
  settingsRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 15, paddingVertical: 14 }, settingIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#0008" }, modal: { borderWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 36, maxHeight: "88%", gap: 18 },
  close: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, languageRow: { borderWidth: 1, borderRadius: 13, padding: 16, flexDirection: "row", justifyContent: "space-between" }, aboutIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
