import { useState } from "react";
import { StyleSheet, View } from "react-native";
import IslandMap from "./IslandMap";
import { Copy, Dialog, Notice } from "./ui";
import { useEvacuationCenters } from "../hooks/useEvacuationCenters";

/** The home map uses the same live center feed and basemaps as Hazard Map. */
export function ResidentHomeMap() {
  const { centers, error, loading, updatedAt } = useEvacuationCenters();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = centers.find(center => center.id === selectedId);
  return <View style={styles.content}>
    <IslandMap compact centers={centers} selectedCenterId={selectedId} onSelectCenter={setSelectedId} />
    {!!error && <Notice error text={error} />}
    <Copy muted>{loading ? "Loading evacuation centers…" : updatedAt ? `Center locations updated ${updatedAt}.` : "Center locations have not loaded yet."}</Copy>
    {!loading && !error && centers.length === 0 && <Copy muted>No operational evacuation centers with map locations are currently recorded.</Copy>}
    {selected && <Dialog visible title={selected.name} onClose={() => setSelectedId(null)} closeLabel="Close center details">
      <Copy>{selected.place.barangay} — {selected.place.municipality}</Copy>
      <Copy>Current occupancy: {selected.current}</Copy>
      <Copy>Maximum capacity: {selected.capacity ?? "Not configured"}</Copy>
      <Copy>Available spaces: {selected.available ?? "Unknown"}</Copy>
      {!!error && <Copy muted>Availability may have changed. Reconnect for the latest occupancy.</Copy>}
    </Dialog>}
  </View>;
}

const styles = StyleSheet.create({ content: { gap: 10, padding: 10 } });
