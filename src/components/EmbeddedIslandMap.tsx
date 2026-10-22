import { useEffect, useRef, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useApp } from "../state/AppState";
import type { IslandMapProps } from "../lib/evacuationCenters";
import { useMapLocation } from "../hooks/useMapLocation";
import { MapLocationControl } from "./MapLocationControl";
import { createMapDocument, mapCredit } from "../lib/mapDocument";
import { MapDocumentView, type MapDocumentHandle } from "./MapDocumentView";

/** Expo Go uses its bundled WebView without importing MapLibre's native module. */
export default function EmbeddedIslandMap({ centers, selectedCenterId, onSelectCenter, compact = false, fullScreen = false }: IslandMapProps) {
  const { theme, colors } = useApp();
  const [html] = useState(() => createMapDocument(theme));
  const frame = useRef<MapDocumentHandle>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const location = useMapLocation(ready, (latitude, longitude) => frame.current?.send({ type: "locate", latitude, longitude }));
  const locating = location.status === "requesting" || location.status === "locating";
  useEffect(() => {
    const position = location.position;
    const coordinate: [number, number] | null = position ? [position.coords.latitude, position.coords.longitude] : null;
    if (!ready) return;
    frame.current?.send({ type: "update", state: { centers, selectedCenterId, theme, coordinate, locating } });
  }, [ready, centers, selectedCenterId, theme, location.position, locating]);
  function receive(message: unknown) {
    if (!message || typeof message !== "object" || !("type" in message)) return;
    if (message.type === "ready") { setReady(true); setError(""); }
    if (message.type === "map-error") { setReady(false); setError("MapLibre could not start. Update Expo Go and your phone’s browser/WebView, then retry the map."); }
    if (message.type === "locate") location.recenter();
    if (message.type === "center" && "id" in message && typeof message.id === "number" && centers.some(center => center.id === message.id)) onSelectCenter(message.id);
    if (message.type === "tile-error") setError("Some map tiles could not load. Check your internet connection and tap Retry map.");
    if (message.type === "tiles-ready") setError(current => current.startsWith("Some map tiles") ? "" : current);
    if (message.type === "credit" && "basemap" in message) {
      const url = mapCredit(message.basemap);
      if (url) void Linking.openURL(url).catch(() => setError("Unable to open map attribution."));
    }
  }
  function reload() {
    setError("");
    if (ready) frame.current?.send({ type: "reload" });
    else frame.current?.reload();
  }
  return <View style={[styles.content, fullScreen && styles.fill]}>
    <View style={[styles.frame, fullScreen ? styles.fill : { height: compact ? 240 : 380 }, { borderColor: colors.border }, fullScreen && styles.fullFrame]}>
      <MapDocumentView ref={frame} html={html} onMessage={receive} onError={() => { setReady(false); setError("The map could not open. Tap Retry map to retry."); }} />
      <MapLocationControl ready={ready} location={location} error={error} onReload={reload} />
    </View>
  </View>;
}
const styles = StyleSheet.create({ content: {}, fill: { flex: 1, minHeight: 0 }, frame: { borderWidth: 1, borderRadius: 18, overflow: "hidden" }, fullFrame: { borderWidth: 0, borderRadius: 0 } });
