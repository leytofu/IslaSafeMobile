import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useApp } from "../state/AppState";
import {
  dashboardPalettes,
  type DashboardColors,
} from "../theme/colors";
import { guides } from "../data/preparedness";
import { hazards } from "../data/hazards";
import { NavigationHeader } from "./NavigationHeader";
import { SessionNotices } from "./ui";
import type { DashboardIcon } from "./dashboard/DashboardPrimitives";

export type GuidesTab = "safety" | "hazards";

type Tone = "accent" | "warning" | "danger";

const tabs: { key: GuidesTab; label: string; icon: DashboardIcon }[] = [
  { key: "safety", label: "Safety Guides", icon: "shield" },
  { key: "hazards", label: "Hazard References", icon: "layers" },
];

function tonePalette(colors: DashboardColors, tone: Tone) {
  if (tone === "danger")
    return { color: colors.danger, soft: colors.dangerSoft };
  if (tone === "warning")
    return { color: colors.warning, soft: colors.warningSoft };
  return { color: colors.accent, soft: colors.tint };
}

export function GuidesExperience({
  initialTab = "safety",
}: {
  initialTab?: GuidesTab;
}) {
  const { theme } = useApp();
  const colors = dashboardPalettes[theme];
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.2;
  const twoColumns = width >= 620;
  const styles = useMemo(
    () => createStyles(colors, compact),
    [colors, compact],
  );
  const [activeTab, setActiveTab] = useState<GuidesTab>(initialTab);
  const [barWidth, setBarWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const progress = useSharedValue(initialTab === "hazards" ? 1 : 0);
  const scrollRef = useRef<ScrollView>(null);
  const headerPadding = compact ? 16 : 20;
  // Use the known screen width until onLayout reports the tab bar's exact width.
  // This keeps the active pill visible on the very first frame.
  const measuredBarWidth =
    barWidth > 10 ? barWidth : Math.max(0, Math.min(width, 640) - headerPadding * 2);
  const tabTravel = measuredBarWidth > 10 ? (measuredBarWidth - 10) / 2 : 0;
  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: progress.get() * tabTravel }],
    }),
    [tabTravel],
  );
  const activeHazard = selected !== null ? hazards[selected] : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeTab]);

  function selectTab(next: GuidesTab) {
    if (next === activeTab) return;
    setActiveTab(next);
    progress.set(
      withTiming(next === "safety" ? 0 : 1, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      }),
    );
  }

  function openHazard(index: number) {
    setSelected(index);
    setZoom(1);
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={[styles.root, { backgroundColor: colors.bg }]}
    >
      <NavigationHeader title={initialTab === "hazards" ? "Offline Hazard Maps" : "Preparedness Guides"} subtitle="Safety guides & hazard references" backFallback="/welcome" />
      <View style={styles.headerWrap}>
        <View
          accessibilityRole="tablist"
          accessibilityLabel="Guide categories"
          onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
          style={[
            styles.tabBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              { width: tabTravel, backgroundColor: colors.primary },
              indicatorStyle,
            ]}
          />
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityLabel={`${tab.label} tab`}
                accessibilityState={{ selected: active }}
                onPress={() => selectTab(tab.key)}
                style={({ pressed }) => [
                  styles.tab,
                  pressed && styles.pressed,
                ]}
              >
                <Feather
                  name={tab.icon}
                  size={16}
                  color={active ? "#ffffff" : colors.muted}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? "#ffffff" : colors.muted },
                    active && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.page}>
          <SessionNotices />
          <Animated.View
            key={activeTab}
            entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
            style={styles.tabContent}
          >
            {activeTab === "safety" ? (
              <SafetyGuidesTab colors={colors} styles={styles} />
            ) : (
              <HazardReferencesTab
                colors={colors}
                styles={styles}
                twoColumns={twoColumns}
                onOpen={openHazard}
              />
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <Modal
        visible={activeHazard !== null}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelected(null)}
      >
        <SafeAreaView
          edges={["top", "left", "right", "bottom"]}
          style={[styles.viewer, { backgroundColor: colors.bg }]}
        >
          <View
            style={[styles.viewerHeader, { borderBottomColor: colors.border }]}
          >
            <View style={styles.flex}>
              <Text style={[styles.viewerEyebrow, { color: colors.accent }]}>
                HAZARD REFERENCE MAP
              </Text>
              <Text
                accessibilityRole="header"
                style={[styles.viewerTitle, { color: colors.text }]}
              >
                {activeHazard?.title ?? ""}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close reference"
              onPress={() => setSelected(null)}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.viewerControls}>
            <Text style={[styles.viewerLabel, { color: colors.muted }]}>
              Zoom
            </Text>
            <View
              style={[
                styles.zoomGroup,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {[1, 2, 3].map((level) => {
                const active = zoom === level;
                return (
                  <Pressable
                    key={level}
                    accessibilityRole="button"
                    accessibilityLabel={`Zoom ${level} times`}
                    accessibilityState={{ selected: active }}
                    onPress={() => setZoom(level)}
                    style={[
                      styles.zoomButton,
                      active && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.zoomText,
                        { color: active ? "#ffffff" : colors.muted },
                      ]}
                    >
                      {level}×
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ScrollView
            style={styles.viewerScroll}
            bounces={false}
            showsVerticalScrollIndicator
            contentContainerStyle={styles.viewerCanvas}
          >
            <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator>
              {activeHazard && (
                <Image
                  source={activeHazard.source}
                  accessibilityLabel={`${activeHazard.title} original map and legend`}
                  resizeMode="contain"
                  style={{
                    width: 380 * zoom,
                    height: 500 * zoom,
                  }}
                />
              )}
            </ScrollView>
          </ScrollView>

          <Text style={[styles.viewerHint, { color: colors.subtle }]}>
            Scroll to read the original legend. Geographic alignment and
            currency are not verified.
          </Text>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function SafetyGuidesTab({
  colors,
  styles,
}: {
  colors: DashboardColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <>
      <View
        style={[
          styles.intro,
          {
            backgroundColor: colors.tint,
            borderColor: colors.weatherBorder,
          },
        ]}
      >
        <Feather name="shield" size={16} color={colors.accent} />
        <Text style={[styles.introText, { color: colors.muted }]}>
          General preparedness guidance, paraphrased from official sources.
          These guides are not live warnings or evacuation orders.
        </Text>
      </View>

      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Preparedness guides
        </Text>
        <Text style={[styles.sectionCount, { color: colors.subtle }]}>
          {guides.length} guides
        </Text>
      </View>

      {guides.map((guide) => (
        <View
          key={guide.title}
          style={[
            styles.guideCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.guideTop}>
            <View style={[styles.guideIcon, { backgroundColor: colors.tint }]}>
              <Feather
                name={guide.icon as DashboardIcon}
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {guide.title}
              </Text>
              <Text style={[styles.sourceLine, { color: colors.subtle }]}>
                {guide.source}
              </Text>
            </View>
          </View>

          <View style={[styles.steps, { borderTopColor: colors.border }]}>
            {guide.steps.map((step, index) => (
              <View key={step} style={styles.step}>
                <View
                  style={[styles.stepNumber, { backgroundColor: colors.tint }]}
                >
                  <Text
                    style={[styles.stepNumberText, { color: colors.accent }]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.stepText, { color: colors.muted }]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.guideFooter, { borderTopColor: colors.border }]}>
            <Text style={[styles.reviewed, { color: colors.subtle }]}>
              Reviewed 14 Oct 2026
            </Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open ${guide.source} source online`}
              accessibilityHint="Opens the official source in a browser and requires an internet connection"
              onPress={() => void Linking.openURL(guide.url)}
              style={({ pressed }) => [
                styles.sourceLinkButton,
                pressed && styles.pressed,
              ]}
            >
              <Feather
                name="external-link"
                size={13}
                color={colors.accent}
              />
              <Text style={[styles.sourceLink, { color: colors.accent }]}>
                Official source
              </Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={styles.footnote}>
        <Feather name="download-cloud" size={13} color={colors.subtle} />
        <Text style={[styles.footnoteText, { color: colors.subtle }]}>
          Guides are bundled with the app and remain available offline.
        </Text>
      </View>
    </>
  );
}

function HazardReferencesTab({
  colors,
  styles,
  twoColumns,
  onOpen,
}: {
  colors: DashboardColors;
  styles: ReturnType<typeof createStyles>;
  twoColumns: boolean;
  onOpen: (index: number) => void;
}) {
  return (
    <>
      <View
        style={[
          styles.intro,
          {
            backgroundColor: colors.warningSoft,
            borderColor: colors.border,
          },
        ]}
      >
        <Feather name="info" size={16} color={colors.warning} />
        <Text style={[styles.introText, { color: colors.muted }]}>
          These supplied images retain their original legends. Their geographic
          alignment and currency are not verified. They are reference documents
          and are not overlaid on the basemap.
        </Text>
      </View>

      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Hazard references
        </Text>
        <Text style={[styles.sectionCount, { color: colors.subtle }]}>
          {hazards.length} maps
        </Text>
      </View>

      <View style={[styles.grid, twoColumns && styles.gridWide]}>
        {hazards.map((hazard, index) => {
          const tone = tonePalette(colors, hazard.tone);
          return (
            <View
              key={hazard.title}
              style={[
                styles.hazardCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                twoColumns && styles.hazardCardWide,
              ]}
            >
              <View style={styles.hazardTop}>
                <View
                  style={[styles.hazardIcon, { backgroundColor: tone.soft }]}
                >
                  <Feather
                    name={hazard.icon as DashboardIcon}
                    size={19}
                    color={tone.color}
                  />
                </View>
                <View style={styles.flex}>
                  <Text
                    style={[styles.hazardCategory, { color: tone.color }]}
                  >
                    {hazard.category.toUpperCase()}
                  </Text>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {hazard.title}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${hazard.title} exposure map and legend`}
                onPress={() => onOpen(index)}
                style={({ pressed }) => [
                  styles.previewWrap,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Image
                  source={hazard.source}
                  resizeMode="contain"
                  accessibilityLabel={`${hazard.title} exposure map with original legend`}
                  style={styles.preview}
                />
              </Pressable>

              <Text style={[styles.body, { color: colors.muted }]}>
                {hazard.description}
              </Text>

              <View style={[styles.precaution, { backgroundColor: tone.soft }]}>
                <Feather name="shield" size={14} color={tone.color} />
                <Text style={[styles.precautionText, { color: colors.text }]}>
                  {hazard.precaution}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${hazard.title} map and legend`}
                onPress={() => onOpen(index)}
                style={({ pressed }) => [
                  styles.cardButton,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Feather name="map" size={15} color={colors.accent} />
                <Text style={[styles.cardButtonText, { color: colors.accent }]}>
                  Open map & legend
                </Text>
                <Feather name="chevron-right" size={15} color={colors.subtle} />
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.footnote}>
        <Feather name="download-cloud" size={13} color={colors.subtle} />
        <Text style={[styles.footnoteText, { color: colors.subtle }]}>
          Reference maps are bundled with the app and remain available offline.
        </Text>
      </View>
    </>
  );
}

const createStyles = (colors: DashboardColors, compact: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1, minWidth: 0 },
    headerWrap: {
      width: "100%",
      maxWidth: 640,
      alignSelf: "center",
      paddingHorizontal: compact ? 16 : 20,
      paddingTop: 8,
      gap: 14,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    themeButton: {
      width: 48,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    titleIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: compact ? 24 : 27,
      lineHeight: compact ? 31 : 35,
      fontWeight: "800",
      letterSpacing: -0.8,
    },
    subtitle: { fontSize: 12, lineHeight: 18, marginTop: 2 },
    offlineBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 20,
      alignSelf: "flex-start",
    },
    offlineText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.2 },
    tabBar: {
      flexDirection: "row",
      padding: 4,
      borderRadius: 16,
      borderWidth: 1,
      position: "relative",
      overflow: "hidden",
    },
    indicator: {
      position: "absolute",
      left: 4,
      top: 4,
      bottom: 4,
      borderRadius: 12,
    },
    tab: {
      flex: 1,
      minHeight: 46,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      zIndex: 1,
      paddingHorizontal: 4,
    },
    tabText: { fontSize: compact ? 11 : 12.5, lineHeight: 17, fontWeight: "600" },
    tabTextActive: { fontWeight: "700" },
    pressed: { opacity: 0.72 },
    scroll: { flexGrow: 1 },
    page: {
      width: "100%",
      maxWidth: 640,
      alignSelf: "center",
      paddingHorizontal: compact ? 16 : 20,
      paddingTop: 16,
      paddingBottom: 36,
    },
    tabContent: { gap: 14, marginTop: 14 },
    intro: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      padding: 13,
      borderRadius: 14,
      borderWidth: 1,
    },
    introText: { flex: 1, fontSize: 12, lineHeight: 19 },
    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "700",
      letterSpacing: -0.25,
      flexShrink: 1,
    },
    sectionCount: { fontSize: 11, lineHeight: 17, fontWeight: "500" },
    guideCard: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 14 },
    guideTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    guideIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontSize: 16,
      lineHeight: 23,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    sourceLine: { fontSize: 10.5, lineHeight: 16, marginTop: 2 },
    steps: { borderTopWidth: 1, paddingTop: 13, gap: 11 },
    step: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    stepNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    stepNumberText: { fontSize: 10, lineHeight: 14, fontWeight: "700" },
    stepText: { flex: 1, fontSize: 13, lineHeight: 21 },
    guideFooter: {
      borderTopWidth: 1,
      paddingTop: 9,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    reviewed: { fontSize: 10, lineHeight: 16, flexShrink: 1 },
    sourceLinkButton: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingLeft: 8,
    },
    sourceLink: { fontSize: 11, fontWeight: "600" },
    grid: { gap: 14 },
    gridWide: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-start",
      columnGap: 14,
      rowGap: 14,
    },
    hazardCard: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 12 },
    hazardCardWide: { width: "48.4%" },
    hazardTop: { flexDirection: "row", alignItems: "center", gap: 11 },
    hazardIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    hazardCategory: {
      fontSize: 9,
      lineHeight: 14,
      fontWeight: "700",
      letterSpacing: 1.1,
      marginBottom: 1,
    },
    previewWrap: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 6,
      overflow: "hidden",
    },
    preview: { width: "100%", height: compact ? 140 : 160 },
    body: { fontSize: 12.5, lineHeight: 20 },
    precaution: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      padding: 11,
      borderRadius: 12,
    },
    precautionText: { flex: 1, fontSize: 12, lineHeight: 19, fontWeight: "500" },
    cardButton: {
      minHeight: 46,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cardButtonText: { flex: 1, fontSize: 12, fontWeight: "600" },
    footnote: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 6,
    },
    footnoteText: {
      fontSize: 10,
      lineHeight: 16,
      flexShrink: 1,
      textAlign: "center",
    },
    viewer: { flex: 1 },
    viewerHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    viewerEyebrow: {
      fontSize: 9,
      lineHeight: 14,
      fontWeight: "700",
      letterSpacing: 1.2,
    },
    viewerTitle: {
      fontSize: 20,
      lineHeight: 27,
      fontWeight: "700",
      letterSpacing: -0.4,
      marginTop: 1,
    },
    closeButton: {
      width: 48,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    viewerControls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 18,
      paddingTop: 14,
    },
    viewerLabel: { fontSize: 12, fontWeight: "600" },
    zoomGroup: {
      flexDirection: "row",
      borderWidth: 1,
      borderRadius: 12,
      padding: 3,
      gap: 2,
    },
    zoomButton: {
      minWidth: 48,
      minHeight: 38,
      paddingHorizontal: 10,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    zoomText: { fontSize: 12, fontWeight: "700" },
    viewerScroll: { flex: 1 },
    viewerCanvas: { padding: 12, alignItems: "flex-start" },
    viewerHint: {
      fontSize: 10,
      lineHeight: 16,
      textAlign: "center",
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 8,
    },
  });
