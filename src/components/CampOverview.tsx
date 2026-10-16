import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, ReduceMotion } from "react-native-reanimated";
import { Button, Card, Copy, Loading, Notice, Screen } from "./ui";
import { useCampContext } from "../hooks/useCampContext";
import { useApp } from "../state/AppState";
export function CampOverview({ centerOnly = false }: { centerOnly?: boolean }) {
  const { data, error, loading, refresh } = useCampContext();
  const { colors, user } = useApp();
  if (loading && !data) return <Loading text="Loading your assigned center…" />;
  return <Screen showBack={centerOnly} title={centerOnly ? "Assigned center" : "Camp dashboard"} subtitle={`Welcome, ${user?.name}`}>
    {!!error && <Notice error text={error} />}
    {!data ? <Card><Copy title="Center assignment required" /><Copy muted>Your administrator must assign your center and registration area before you can access evacuee records.</Copy><Button secondary title="Refresh assignment" onPress={() => void refresh()} /></Card> : <>
      <Animated.View entering={FadeInUp.duration(250).reduceMotion(ReduceMotion.System)} style={[styles.hero, { backgroundColor: colors.tint, borderColor: colors.border }]}>
        <Feather name="home" size={28} color="#a5b4fc" /><Copy title>{data.center.name}</Copy><Copy muted>{data.center.place.barangay} · {data.center.place.municipality}</Copy>
        <Copy>{data.event?.name ?? "No active evacuation event"}</Copy>
        <Button icon="user-plus" title="Register evacuee" disabled={!data.event || !!error} onPress={() => router.push("/camp/register")} />
      </Animated.View>
      <View style={styles.metrics}>{[["Registered this event", data.center.registered], ["First-time evacuees", data.center.first_time], ["Returning evacuees", data.center.returning], ["Checked in now", data.center.current]].map(([label, value]) => <View key={label} style={[styles.metric, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.value, { color: colors.text }]}>{value}</Text><Text style={[styles.label, { color: colors.muted }]}>{label}</Text></View>)}</View>
      <Card><Copy title="Capacity & occupancy" /><Copy>{data.center.current} people checked in · {data.center.capacity ?? "Capacity not configured"}</Copy><View accessibilityLabel={`Occupancy ${data.center.occupancy_percent ?? "unknown"} percent`} style={[styles.track, { backgroundColor: colors.border }]}><View style={[styles.fill, { width: `${Math.min(100, data.center.occupancy_percent ?? 0)}%` }]} /></View><Copy muted>{data.center.available === null ? "Available space cannot be calculated without capacity." : `${data.center.available} spaces available`} · {data.center.status}</Copy></Card>
      {centerOnly && <Card><Copy title="Current age breakdown" />{Object.entries(data.center.demographics.age).map(([group, count]) => <Copy key={group}>{group.replaceAll("_", " ")}: {count}</Copy>)}<Copy muted>Statistics represent people currently checked in.</Copy></Card>}
      <Card><Copy title="Recent registrations" />{data.recent.length === 0 ? <Copy muted>No registrations in this event yet.</Copy> : data.recent.map((item) => <View style={styles.recent} key={item.id}><Copy>{item.full_name}</Copy><Copy muted>{item.place.barangay} · {new Date(item.registered_at).toLocaleString()} · {item.status.replaceAll("_", " ")}</Copy></View>)}</Card>
      <Button secondary title="View center roster" icon="users" onPress={() => router.push("/camp/evacuees")} /><Button secondary title="Refresh statistics" onPress={() => void refresh()} />
    </>}
  </Screen>;
}
const styles = StyleSheet.create({ hero: { padding: 22, gap: 12, borderWidth: 1, borderRadius: 22 }, metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, metric: { flexBasis: "46%", flexGrow: 1, borderWidth: 1, borderRadius: 18, padding: 18, gap: 8 }, value: { fontSize: 30, fontWeight: "700" }, label: { fontSize: 12 }, track: { height: 8, borderRadius: 8, overflow: "hidden" }, fill: { height: 8, backgroundColor: "#4163ed" }, recent: { gap: 4, paddingVertical: 8 } });
