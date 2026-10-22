import { useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "../state/AppState";
import { dashboardPalettes, type DashboardColors } from "../theme/colors";
import { guides } from "../data/preparedness";
import { NavigationHeader } from "./NavigationHeader";
import { SessionNotices } from "./ui";
import type { DashboardIcon } from "./dashboard/DashboardPrimitives";
export function GuidesExperience() {
  const { theme } = useApp();
  const colors = dashboardPalettes[theme];
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.2;
  const styles = useMemo(() => createStyles(colors, compact), [colors, compact]);
  return <SafeAreaView edges={["top", "left", "right", "bottom"]} style={[styles.root, { backgroundColor: colors.bg }]}>
    <NavigationHeader title="Preparedness Guides" subtitle="Prepare with confidence" backFallback="/welcome" />
    <ScrollView contentContainerStyle={styles.scroll}><View style={styles.page}><SessionNotices /><SafetyGuidesTab colors={colors} styles={styles} /></View></ScrollView>
  </SafeAreaView>;
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

const createStyles = (colors: DashboardColors, compact: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1, minWidth: 0 },
    pressed: { opacity: 0.72 },
    scroll: { flexGrow: 1 },
    page: {
      gap: 16,
      width: "100%",
      maxWidth: 640,
      alignSelf: "center",
      paddingHorizontal: compact ? 16 : 20,
      paddingTop: 16,
      paddingBottom: 36,
    },
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
    }
});
