import { useEffect, useRef, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useApp } from "../state/AppState";
import type { IslandMapProps } from "../lib/evacuationCenters";
import { useDeviceLocation } from "../state/DeviceLocation";
import { DeviceLocationNotice } from "./DeviceLocationNotice";
import { createMapDocument, mapCredit } from "../lib/mapDocument";
import { MapDocumentView, type MapDocumentHandle } from "./MapDocumentView";
import { Button, Copy, Notice } from "./ui";

/** Expo Go uses its bundled WebView without importing MapLibre's native module. */
export default function EmbeddedIslandMap({ centers, selectedCenterId, onSelectCenter, compact = false }: IslandMapProps) {
  const { theme, colors } = useApp();
  const [html] = useState(() => createMapDocument(theme));
  const frame = useRef<MapDocumentHandle>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const location = useDeviceLocation();
  const coordinate: [number, number] | null = location.position ? [location.position.coords.latitude, location.position.coords.longitude] : null;
  const locating = location.status === "requesting" || location.status === "locating";
  const centered = useRef(false);
  useEffect(() => {
    const position = location.position;
    const coordinate: [number, number] | null = position ? [position.coords.latitude, position.coords.longitude] : null;
    if (!position) centered.current = false;
    if (!ready) return;
    frame.current?.send({ type: "update", state: { centers, selectedCenterId, theme, coordinate, locating } });
    if (position && !centered.current) {
      frame.current?.send({ type: "locate", latitude: position.coords.latitude, longitude: position.coords.longitude });
      centered.current = true;
    }
  }, [ready, centers, selectedCenterId, theme, location.position, locating]);
  function receive(message: unknown) {
    if (!message || typeof message !== "object" || !("type" in message)) return;
    if (message.type === "ready") { centered.current = false; setReady(true); setError(""); }
    if (message.type === "map-error") setError("MapLibre could not start. Update Expo Go and your phone’s browser/WebView, then reload the map.");
    if (message.type === "locate") { centered.current = false; location.refresh(); }
    if (message.type === "center" && "id" in message && typeof message.id === "number" && centers.some(center => center.id === message.id)) onSelectCenter(message.id);
    if (message.type === "tile-error") setError("Some map tiles could not load. Check your internet connection and tap Reload map.");
    if (message.type === "tiles-ready") setError(current => current.startsWith("Some map tiles") ? "" : current);
    if (message.type === "credit" && "basemap" in message) {
      const url = mapCredit(message.basemap);
      if (url) void Linking.openURL(url).catch(() => setError("Unable to open map attribution."));
    }
  }
  return <View style={styles.content}>
    <View style={[styles.frame, { height: compact ? 240 : 380, borderColor: colors.border }]}>
      <MapDocumentView ref={frame} html={html} onMessage={receive} onError={() => { setReady(false); setError("The map could not open. Tap Reload map to retry."); }} />
    </View>
    {!!error && <Notice error text={error} />}
    <DeviceLocationNotice />
    {!compact && !coordinate && <Copy muted>Allow location access to show your position automatically. Streets and satellite tiles require internet access.</Copy>}
    {(!compact || !!error) && <Button secondary title="Reload map" onPress={() => { setError(""); if (ready) frame.current?.send({ type: "reload" }); else frame.current?.reload(); }} />}
  </View>;
}
const styles = StyleSheet.create({ content: { gap: 10 }, frame: { borderWidth: 1, borderRadius: 18, overflow: "hidden" } });
