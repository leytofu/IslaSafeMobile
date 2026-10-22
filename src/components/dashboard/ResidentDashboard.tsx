import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { residentDashboardPreview as sample } from "../../data/residentDashboard";
import { dashboardPalettes, type ThemeMode } from "../../theme/colors";
import { Badge, dashboardType as type, SectionTitle, Surface, type DashboardIcon } from "./DashboardPrimitives";

export interface ResidentDashboardProps {
  theme: ThemeMode; name?: string; barangay?: string;
  statusContent?: ReactNode;
  menuControl?: ReactNode;
  headerContent?: ReactNode;
  mapContent?: ReactNode;
  onSos?: () => void; onMap?: () => void; onGuides?: () => void;
}

/** Presentation only: fixture cards never request data or dispatch emergencies. */
export function ResidentDashboard({
  theme, name = sample.name, barangay = sample.barangay,
  statusContent, menuControl, headerContent, mapContent, onSos, onMap, onGuides,
}: ResidentDashboardProps) {
  const colors = dashboardPalettes[theme];
  const actions: { title: string; icon: DashboardIcon; onPress?: () => void }[] = [
    { title: "Safety guides", icon: "book-open", onPress: onGuides },
    { title: "Evacuation", icon: "home", onPress: onMap },
  ];
  return <SafeAreaView edges={["top", "bottom", "left", "right"]} style={[styles.root, { backgroundColor: colors.bg }]}>
    <StatusBar style={theme === "dark" ? "light" : "dark"} />
    {headerContent}
    <ScrollView testID="resident-dashboard-scroll" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        {!headerContent && <View style={styles.header}>
          <View style={styles.greetingGroup}>
            {menuControl || <View style={[styles.brand, { backgroundColor: colors.tint }]}><Feather name="menu" size={23} color={colors.accent} /></View>}
            <View style={styles.greetingCopy}><Text style={[styles.greeting, { color: colors.muted }]}>Your community</Text><Text accessibilityRole="header" numberOfLines={1} style={[styles.name, { color: colors.text }]}>Dashboard</Text></View>
          </View>
        </View>}
        <View style={styles.location}><Feather name="map-pin" color={colors.subtle} size={12} /><Text style={[styles.locationText, { color: colors.muted }]}>{sample.location}</Text></View>
        <View style={[styles.previewNote, { borderColor: colors.border }]}><View style={[styles.previewDot, { backgroundColor: colors.accent }]} /><Text style={[styles.previewText, { color: colors.muted }]}>Design preview · Weather, advisories & center details are sample data</Text></View>
        {statusContent}
        <Surface colors={colors} style={{ backgroundColor: colors.weather, borderColor: colors.weatherBorder }}>
          <View style={styles.spread}><Text style={[type.eyebrow, { color: colors.muted }]}>WEATHER OVERVIEW</Text><Badge label="Sample weather" color={colors.accent} background={colors.tint} /></View>
          <View style={styles.weatherMain}>
            <Feather name="cloud-rain" size={45} color={colors.accent} />
            <Text style={[styles.temperature, { color: colors.text }]}>{sample.weather.temperature}</Text>
            <View style={styles.flex}><Text style={[styles.weatherCondition, { color: colors.text }]}>{sample.weather.condition}</Text><Text style={[type.body, { color: colors.muted }]}>{sample.weather.detail}</Text></View>
          </View>
          <View style={[styles.weatherMetrics, { borderTopColor: colors.weatherBorder }]}>
            {[
              { icon: "wind", value: sample.weather.wind, label: "Wind speed" },
              { icon: "droplet", value: sample.weather.waterLevel, label: "Water level" },
            ].map((item) => <View key={item.label} style={styles.metric}><View style={styles.metricValue}><Feather name={item.icon as DashboardIcon} size={13} color={colors.accent} /><Text style={[styles.metricNumber, { color: colors.text }]}>{item.value}</Text></View><Text style={[styles.metricLabel, { color: colors.muted }]}>{item.label}</Text></View>)}
          </View>
        </Surface>
        <Surface colors={colors} style={[styles.sosCard, { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder }]}>
          <View style={styles.flex}><Text style={[type.eyebrow, { color: colors.danger }]}>EMERGENCY ASSISTANCE</Text><Text style={[type.title, styles.cardTitle, { color: colors.text }]}>Need help now?</Text><Text style={[type.body, { color: colors.muted }]}>Open SOS to prepare an emergency request.</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={onSos ? "Open Emergency SOS" : "Emergency SOS preview"} accessibilityState={{ disabled: !onSos }} disabled={!onSos} onPress={onSos} style={({ pressed }) => [styles.sosRing, { borderColor: colors.dangerBorder, opacity: pressed ? 0.7 : 1 }]}><View style={styles.sosButton}><Feather name="radio" size={19} color="#ffffff" /><Text style={styles.sosText}>SOS</Text></View></Pressable>
        </Surface>

        <View>
          <SectionTitle colors={colors} title={"Your Location — " + barangay} action="Full map" onPress={onMap} />
          <View style={[styles.mapCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            {mapContent ?? <>
            <View accessibilityLabel="Decorative illustrated island overview. Not a navigational map." style={[styles.mapCanvas, { backgroundColor: colors.ocean }]} accessible>
              {(["0%", "16%", "32%", "48%", "64%", "80%", "96%"] as const).map((left) => <View key={left} style={[styles.gridVertical, { left, backgroundColor: colors.landBorder, opacity: 0.16 }]} />)}
              {(["0%", "30%", "60%", "90%"] as const).map((top) => <View key={top} style={[styles.gridHorizontal, { top, backgroundColor: colors.landBorder, opacity: 0.16 }]} />)}
              <View style={[styles.island, { backgroundColor: colors.land, borderColor: colors.landBorder }]} /><View style={[styles.islet, { backgroundColor: colors.land, borderColor: colors.landBorder }]} />
              <View style={[styles.road, { backgroundColor: colors.road }]} /><View style={[styles.roadBranch, { backgroundColor: colors.road }]} />
              <Text style={[styles.mapIslandLabel, { color: colors.muted }]}>PITOGO ISLAND</Text>
              <View style={[styles.mapMarker, styles.mapMarkerNorth]}><Feather name="home" size={12} color="#ffffff" /></View><View style={[styles.mapMarker, styles.mapMarkerSouth]}><Feather name="home" size={12} color="#ffffff" /></View>
              <View style={[styles.youRing, { borderColor: colors.accent }]}><View style={[styles.youDot, { backgroundColor: colors.accent }]} /></View>
              <View style={[styles.mapLabel, { backgroundColor: colors.card }]}><Feather name="layers" size={11} color={colors.accent} /><Text style={[styles.mapLabelText, { color: colors.text }]}>Illustrated overview</Text></View>
              <View style={[styles.mapCompass, { backgroundColor: colors.card }]}><Feather name="navigation" size={15} color={colors.text} /><Text style={[styles.north, { color: colors.muted }]}>N</Text></View>
            </View>
            <View style={styles.mapFooter}><View style={styles.inline}><View style={styles.legendDot} /><Text style={[styles.caption, { color: colors.muted }]}>Sample evacuation centers</Text></View><Feather name="maximize-2" size={13} color={colors.subtle} /></View>
            </>}
          </View>
        </View>
        <View>
          <SectionTitle colors={colors} title="Recent Advisory" action="Sample" />
          <Surface colors={colors} style={styles.advisoryCard}><View style={[styles.advisoryIcon, { backgroundColor: colors.warningSoft }]}><Feather name="info" size={19} color={colors.warning} /></View><View style={styles.flex}><Text style={[styles.itemTitle, { color: colors.text }]}>{sample.advisory.title}</Text><Text style={[type.body, { color: colors.muted }]}>{sample.advisory.detail}</Text><Text style={[styles.caption, styles.source, { color: colors.subtle }]}>{sample.advisory.source}</Text></View></Surface>
        </View>
        <View>
          <SectionTitle colors={colors} title="Nearest Evacuation Center" action="View all" onPress={onMap} />
          <Surface colors={colors}><View style={styles.centerHeading}><View style={[styles.quickIcon, { backgroundColor: colors.tint }]}><Feather name="home" size={21} color={colors.accent} /></View><View style={styles.flex}><Text style={[styles.itemTitle, { color: colors.text }]}>{sample.center.name}</Text><Text style={[type.body, { color: colors.muted }]}>{sample.center.location}</Text></View></View><View style={[styles.capacityTrack, { backgroundColor: colors.tint }]}><View style={[styles.capacityFill, { width: "60%", backgroundColor: colors.accent }]} /></View><View style={styles.spread}><Text style={[styles.caption, { color: colors.muted }]}>{sample.center.capacity} · Sample occupancy</Text><Badge label="Sample center" color={colors.success} background={colors.successSoft} /></View></Surface>
        </View>
        <View>
          <SectionTitle colors={colors} title={"Hazard Status — " + barangay} action="Sample" />
          <Surface colors={colors} style={styles.hazardCard}>{sample.hazards.map((hazard, index) => <View key={hazard.name} style={[styles.hazardRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}><View style={styles.inline}><Feather name={hazard.icon} size={16} color={colors.muted} /><Text style={[type.body, { color: colors.text }]}>{hazard.name}</Text></View><Badge label={hazard.status} color={hazard.tone === "success" ? colors.success : colors.warning} background={hazard.tone === "success" ? colors.successSoft : colors.warningSoft} /></View>)}</Surface>
        </View>
        <View style={styles.quickActions}>
          {actions.map((action) => <Pressable key={action.title} disabled={!action.onPress} accessibilityRole="button" accessibilityState={{ disabled: !action.onPress }} accessibilityLabel={action.title + (!action.onPress ? " preview" : "")} onPress={action.onPress} style={({ pressed }) => [styles.quickAction, { width: "47%", backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><View style={[styles.quickIcon, { backgroundColor: colors.tint }]}><Feather name={action.icon} size={19} color={colors.accent} /></View><Text style={[styles.quickLabel, { color: colors.text }]}>{action.title}</Text></Pressable>)}
        </View>
        <View style={styles.offlineFootnote}><Feather name="download-cloud" size={14} color={colors.subtle} /><Text style={[styles.caption, { color: colors.subtle }]}>Your preparedness guides are available offline.</Text></View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, flex: { flex: 1, minWidth: 0 },
  scroll: { flexGrow: 1 }, page: { width: "100%", maxWidth: 640, alignSelf: "center", paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  greetingGroup: { flex: 1, flexDirection: "row", alignItems: "center", gap: 11 }, greetingCopy: { flex: 1 },
  brand: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  greeting: { fontSize: 11, lineHeight: 18 }, name: { fontSize: 21, fontWeight: "700", letterSpacing: -0.7, lineHeight: 28 },
  headerActions: { flexDirection: "row", gap: 8 }, location: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: -4 },
  locationText: { fontSize: 11, lineHeight: 17, flexShrink: 1 },
  previewNote: { flexDirection: "row", gap: 7, alignItems: "center", paddingVertical: 10, borderTopWidth: 1 },
  previewDot: { width: 5, height: 5, borderRadius: 3 }, previewText: { fontSize: 10, lineHeight: 16, flex: 1 },
  spread: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  weatherMain: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 17 },
  temperature: { fontSize: 42, fontWeight: "700", lineHeight: 52, letterSpacing: -2 }, weatherCondition: { fontSize: 13, lineHeight: 21, fontWeight: "500" },
  weatherMetrics: { borderTopWidth: 1, paddingTop: 14, flexDirection: "row", gap: 8 },
  metric: { flex: 1, alignItems: "center", gap: 4 }, metricValue: { flexDirection: "row", gap: 5, alignItems: "center", flexWrap: "wrap", justifyContent: "center" },
  metricNumber: { fontSize: 12, fontWeight: "600" }, metricLabel: { fontSize: 10, lineHeight: 15 },
  sosCard: { flexDirection: "row", alignItems: "center", gap: 14 }, cardTitle: { marginTop: 4, marginBottom: 5 },
  sosRing: { width: 79, height: 79, borderRadius: 40, borderWidth: 5, alignItems: "center", justifyContent: "center" },
  sosButton: { width: 65, height: 65, borderRadius: 33, backgroundColor: "#d83750", alignItems: "center", justifyContent: "center", gap: 2 },
  sosText: { color: "#ffffff", fontSize: 18, fontWeight: "800", letterSpacing: 1 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  quickAction: { borderWidth: 1, borderRadius: 17, paddingHorizontal: 3, paddingVertical: 12, alignItems: "center", gap: 8, minHeight: 90 },
  quickIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" }, quickLabel: { fontSize: 10, fontWeight: "600", lineHeight: 15, textAlign: "center" },
  mapCard: { borderWidth: 1, borderRadius: 20, overflow: "hidden" }, mapCanvas: { height: 178, overflow: "hidden" },
  gridVertical: { position: "absolute", top: 0, bottom: 0, width: 1 }, gridHorizontal: { position: "absolute", left: 0, right: 0, height: 1 },
  island: { position: "absolute", width: "64%", height: 107, top: 28, left: "20%", borderRadius: 58, borderTopLeftRadius: 88, borderBottomRightRadius: 80, borderWidth: 1, transform: [{ rotate: "-28deg" }] },
  islet: { position: "absolute", width: 25, height: 16, top: 34, left: "17%", borderRadius: 12, borderWidth: 1, transform: [{ rotate: "-28deg" }] },
  road: { position: "absolute", width: "46%", height: 3, top: 88, left: "30%", borderRadius: 2, transform: [{ rotate: "-28deg" }] },
  roadBranch: { position: "absolute", width: "17%", height: 2, top: 110, left: "43%", transform: [{ rotate: "45deg" }] },
  mapIslandLabel: { position: "absolute", top: 51, left: "32%", fontSize: 8, fontWeight: "700", letterSpacing: 2 },
  mapMarker: { position: "absolute", width: 26, height: 26, borderRadius: 9, backgroundColor: "#2946d8", borderWidth: 2, borderColor: "#ffffff", justifyContent: "center", alignItems: "center" },
  mapMarkerNorth: { top: 48, left: "67%" }, mapMarkerSouth: { top: 108, left: "36%" },
  youRing: { position: "absolute", top: 82, left: "51%", width: 25, height: 25, borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  youDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: "#ffffff" },
  mapLabel: { position: "absolute", left: 12, bottom: 12, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, flexDirection: "row", gap: 5, alignItems: "center" },
  mapLabelText: { fontSize: 9, fontWeight: "500" }, mapCompass: { position: "absolute", top: 12, right: 12, width: 30, paddingVertical: 6, borderRadius: 9, alignItems: "center", gap: 2 },
  north: { fontSize: 8, fontWeight: "700" }, mapFooter: { paddingHorizontal: 13, paddingVertical: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 }, legendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2946d8" },
  caption: { fontSize: 10, lineHeight: 16 }, readinessCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  readinessIcon: { width: 55, height: 55, borderWidth: 1, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  advisoryCard: { flexDirection: "row", alignItems: "flex-start", gap: 12 }, advisoryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 13, lineHeight: 20, fontWeight: "600", letterSpacing: -0.15 }, source: { marginTop: 6 },
  centerHeading: { flexDirection: "row", alignItems: "center", gap: 11 }, capacityTrack: { height: 5, borderRadius: 3, marginTop: 16, marginBottom: 11, overflow: "hidden" },
  capacityFill: { height: 5, borderRadius: 3 }, hazardCard: { paddingVertical: 3, paddingHorizontal: 16 },
  hazardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, gap: 8 },
  offlineFootnote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9 },
});
