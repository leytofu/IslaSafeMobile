import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { ResidentDashboard } from "./dashboard/ResidentDashboard";
import { dashboardPalettes, type ThemeMode } from "../theme/colors";
import { Surface } from "./dashboard/DashboardPrimitives";
import { ResidentMenuButton, type ResidentDestination } from "./ResidentMenu";
import { ReferenceAlerts, ReferenceSettings, ReferenceSosHero } from "./ResidentReferenceViews";
import { SelectField } from "./ui";
import { barangayOptions } from "../data/barangays";
import { guides } from "../data/preparedness";

const titles: Record<ResidentDestination, string> = { home: "Dashboard", map: "CPG hazard map", sos: "Emergency SOS", alerts: "Alerts & Advisories", settings: "Settings", guides: "Preparedness Guides" };

export default function ResidentDesignPreview() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [screen, setScreen] = useState<ResidentDestination>("home");
  const [sosForm, setSosForm] = useState(false);
  const [focus, setFocus] = useState("All CPG barangays");
  const [basemap, setBasemap] = useState("Map");
  const c = dashboardPalettes[theme];
  const toggle = () => setTheme((current) => current === "dark" ? "light" : "dark");
  const menu = <ResidentMenuButton theme={theme} onNavigate={setScreen} />;
  if (screen === "home") return <ResidentDashboard theme={theme} menuControl={menu} onMap={() => setScreen("map")} onSos={() => setScreen("sos")} onGuides={() => setScreen("guides")} />;
  return <SafeAreaView edges={["top", "left", "right"]} style={[styles.root, { backgroundColor: c.bg }]}>
    <StatusBar style={theme === "dark" ? "light" : "dark"} />
    <View style={styles.header}>{menu}<Text style={[styles.heading, { color: c.text }]}>{titles[screen]}</Text></View>
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={[styles.caption, { color: c.subtle }]}>REFERENCE DESIGN PREVIEW · SAMPLE CONTENT</Text>
      {screen === "alerts" && <ReferenceAlerts theme={theme} />}
      {screen === "settings" && <><ReferenceSettings theme={theme} onToggleTheme={toggle} /><View style={[styles.signout, { borderColor: c.dangerBorder }]}><Feather name="log-out" size={18} color={c.danger} /><Text style={[styles.body, { color: c.danger }]}>Log Out · Preview</Text></View></>}
      {screen === "sos" && <><ReferenceSosHero theme={theme} onPrepare={() => setSosForm(true)} />{sosForm && <Surface colors={c}><Text style={[styles.heading, { color: c.text }]}>Emergency details</Text>{["Full name", "Contact number", "Location / landmark", "Describe the emergency"].map((label) => <View key={label} style={styles.field}><Text style={[styles.caption, { color: c.muted }]}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={c.subtle} placeholder={label} style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.bg }]} /></View>)}<Text style={[styles.caption, { color: c.subtle }]}>Visual form only. No SOS can be submitted from this preview.</Text></Surface>}</>}
      {screen === "map" && <>
        <Surface colors={c}><SelectField themeOverride={theme} label="Focus area" value={focus} onChange={setFocus} options={[{ value: "All CPG barangays", label: "All CPG barangays" }, ...barangayOptions]} /><Text style={[styles.caption, { color: c.subtle }]}>URBAN EXPOSURE MAP</Text><View style={styles.selectRow}><Text style={[styles.body, { color: c.text }]}>Flooding</Text><Feather name="chevron-down" color={c.muted} size={15} /></View></Surface>
        <View style={[styles.map, { borderColor: c.border, backgroundColor: basemap === "Map" ? c.ocean : "#203b31" }]}>
          <View style={[styles.land, { backgroundColor: c.land, borderColor: c.landBorder }]} />
          <View style={[styles.mapSwitch, { backgroundColor: c.card }]}>{["Map", "Satellite"].map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: basemap === item }} onPress={() => setBasemap(item)} style={[styles.mapSwitchOption, { backgroundColor: basemap === item ? c.tint : "transparent" }]}><Text style={[styles.caption, { color: basemap === item ? c.accent : c.muted }]}>{item}</Text></Pressable>)}</View>
          <View style={[styles.mapPin, { left: "40%", top: "45%" }]}><Feather name="home" size={18} color="#ffffff" /></View><View style={[styles.mapPin, { left: "65%", top: "28%" }]}><Feather name="home" size={18} color="#ffffff" /></View>
          <View style={[styles.mapZoom, { backgroundColor: c.card }]}><Feather name="plus" size={19} color={c.text} /><View style={[styles.line, { backgroundColor: c.border }]} /><Feather name="minus" size={19} color={c.text} /></View>
          <View style={[styles.mapLegend, { backgroundColor: c.card }]}><View style={styles.greenDot} /><Text style={[styles.caption, { color: c.text }]}>Evacuation centers</Text></View>
        </View><Text style={[styles.caption, { color: c.subtle }]}>Control layout preview. The native app uses the admin portal’s OSM streets / Esri satellite basemaps and real evacuation center records.</Text>
        <Surface colors={c}><Text style={[styles.heading, { color: c.text }]}>Map layers</Text>{["Hazard zones", "Evacuation centers", "Barangay labels"].map((label) => <View key={label} style={styles.selectRow}><Feather name={label === "Evacuation centers" ? "check-square" : "square"} color={c.accent} size={16} /><Text style={[styles.body, { color: c.text, flex: 1 }]}>{label}</Text></View>)}</Surface>
      </>}
      {screen === "guides" && guides.map((guide) => <Surface key={guide.title} colors={c}><Text style={[styles.heading, { color: c.text }]}>{guide.title}</Text>{guide.steps.map((step, index) => <Text key={step} style={[styles.body, { color: c.muted, marginTop: 8 }]}>{index + 1}. {step}</Text>)}</Surface>)}
      <Pressable accessibilityRole="button" onPress={() => setScreen("home")} style={[styles.back, { borderColor: c.border }]}><Feather name="arrow-left" size={17} color={c.accent} /><Text style={[styles.body, { color: c.accent }]}>Back to Dashboard</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 18, flexDirection: "row", alignItems: "center", gap: 10, width: "100%", maxWidth: 640, alignSelf: "center" }, heading: { fontSize: 18, lineHeight: 25, fontWeight: "700", letterSpacing: -0.4, flex: 1 },
  page: { padding: 18, paddingTop: 0, paddingBottom: 30, gap: 14, width: "100%", maxWidth: 640, alignSelf: "center" }, caption: { fontSize: 10, lineHeight: 17 }, body: { fontSize: 13, lineHeight: 21 },
  signout: { borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: "row", justifyContent: "center", gap: 9 }, selectRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 12 },
  field: { gap: 6, marginTop: 13 }, input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 }, back: { minHeight: 46, borderWidth: 1, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  map: { height: 380, borderRadius: 18, borderWidth: 1, overflow: "hidden" }, land: { position: "absolute", top: 70, left: "17%", width: "70%", height: 230, borderWidth: 1, borderRadius: 90, transform: [{ rotate: "-25deg" }] },
  mapSwitch: { position: "absolute", top: 12, left: 12, flexDirection: "row", padding: 4, borderRadius: 12 }, mapSwitchOption: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 9 },
  mapPin: { position: "absolute", width: 36, height: 36, borderRadius: 12, backgroundColor: "#15803d", borderColor: "#ffffff", borderWidth: 2, alignItems: "center", justifyContent: "center" },
  mapZoom: { position: "absolute", bottom: 12, right: 12, width: 40, alignItems: "center", paddingVertical: 10, gap: 12, borderRadius: 12 }, line: { width: "100%", height: 1 }, greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" },
  mapLegend: { position: "absolute", bottom: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 10 }, member: { flexDirection: "row", alignItems: "center", gap: 12 }, memberAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }, hazardImage: { width: "100%", height: 240, marginTop: 10 },
});
