import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  Camera,
  CameraRef,
  LngLat,
  Map,
  MapRef,
  Marker,
  TransformRequestManager,
} from "@maplibre/maplibre-react-native";
import { Button, Loading, Notice } from "./ui";
import { useDeviceLocation } from "../state/DeviceLocation";
import { DeviceLocationNotice } from "./DeviceLocationNotice";
import { errorMessage } from "../lib/api";
import type { IslandMapProps } from "../lib/evacuationCenters";
import { basemaps, rasterStyle, type BasemapKey } from "../lib/basemaps";
import { dashboardPalettes } from "../theme/colors";
import { useApp } from "../state/AppState";
const municipality: LngLat = [124.562, 10.109]; // Existing frontend municipality map center, NOT a shelter or evacuation destination.
export default function IslandMap({ centers, selectedCenterId, onSelectCenter, compact = false }: IslandMapProps) {
  const { theme } = useApp();
  const colors = dashboardPalettes[theme];
  const map = useRef<MapRef>(null);
  const [basemap, setBasemap] = useState<BasemapKey>("map");
  const mapStyle = useMemo(() => rasterStyle(basemap), [basemap]);
  const camera = useRef<CameraRef>(null);
  const [ready, setReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const location = useDeviceLocation();
  const coordinate: LngLat | null = location.position ? [location.position.coords.longitude, location.position.coords.latitude] : null;
  const centered = useRef(false);
  const [error, setError] = useState("");
  const busy = location.status === "requesting" || location.status === "locating";
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    let mounted = true;
    (async () => {
      await TransformRequestManager.addHeader({
        id: "islasafe-osm-agent",
        match: "^https://tile\\.openstreetmap\\.org/",
        name: "User-Agent",
        value:
          "IslaSafe-Capstone/1.0 (ph.islasafe.mobile; local Android demonstration)",
      });
      if (mounted) setReady(true);
    })().catch((e) => { if (mounted) setError(errorMessage(e)); });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!location.position) { centered.current = false; return; }
    if (mapLoaded && camera.current && !centered.current) {
      camera.current.easeTo({ center: [location.position.coords.longitude, location.position.coords.latitude], zoom: 15, duration: 350 });
      centered.current = true;
    }
  }, [mapLoaded, location.position]);
  function recenter() { centered.current = false; location.refresh(); }
  async function adjustZoom(amount: number) {
    if (!map.current || busy) return;
    try {
      const [center, zoom] = await Promise.all([map.current.getCenter(), map.current.getZoom()]);
      camera.current?.easeTo({ center, zoom: Math.min(19, Math.max(3, zoom + amount)), duration: 200 });
    } catch (failure) { setError(errorMessage(failure)); }
  }
  return (
    <View style={styles.container}>
      <View style={[styles.mapFrame, { borderColor: colors.border }]}>
      {ready ? (
        <Map
          ref={map}
          key={generation}
          style={[styles.map, compact && styles.compactMap]}
          mapStyle={mapStyle}
          attribution={false}
          logo={false}
          onDidFinishLoadingMap={() => setMapLoaded(true)}
          onDidFailLoadingMap={() =>
            setError(
              "Map failed to load. Check connectivity; reference maps remain available offline.",
            )
          }
        >
          <Camera
            ref={camera}
            initialViewState={{ center: coordinate ?? municipality, zoom: coordinate ? 15 : 11 }}
          />
          {centers.map((center) => (
            <Marker
              key={center.id}
              id={`evacuation-center-${center.id}`}
              lngLat={[center.longitude, center.latitude]}
              anchor="bottom"
              selected={center.id === selectedCenterId}
              onPress={() => onSelectCenter(center.id)}
            >
              <View
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${center.name}, ${center.place.barangay}. ${center.current} of ${center.capacity ?? 'unknown'} places occupied. Tap for details.`}
                style={[styles.centerMarker, center.available === 0 && styles.fullMarker, center.id === selectedCenterId && styles.selectedMarker]}
              >
                <Feather name="home" size={23} color="#fff" />
              </View>
            </Marker>
          ))}
          {coordinate && (
            <Marker id="current-location" lngLat={coordinate}>
              <View
                accessibilityLabel="Your current location"
                style={styles.marker}
              />
            </Marker>
          )}
        </Map>
      ) : (
        <View style={[styles.map, compact && styles.compactMap]}>
          <Loading text="Preparing native map…" />
        </View>
      )}
      <View style={[styles.basemapSwitch, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(["map", "satellite"] as const).map((key) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: basemap === key }} accessibilityLabel={basemaps[key].label + " basemap"} onPress={() => setBasemap(key)} style={[styles.basemapOption, { backgroundColor: basemap === key ? colors.tint : "transparent" }]}><Feather name={key === "map" ? "map" : "globe"} size={13} color={basemap === key ? colors.accent : colors.muted} /><Text style={[styles.toolLabel, { color: basemap === key ? colors.accent : colors.muted }]}>{basemaps[key].label}</Text></Pressable>)}
      </View>
      <View style={[styles.zoomControls, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {([["plus", 1], ["minus", -1]] as const).map(([icon, amount]) => <Pressable key={icon} accessibilityRole="button" accessibilityLabel={amount === 1 ? "Zoom in" : "Zoom out"} disabled={!ready} onPress={() => { void adjustZoom(amount); }} style={styles.mapTool}><Feather name={icon} color={colors.text} size={20} /></Pressable>)}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Recenter on Pitogo Island" onPress={() => camera.current?.easeTo({ center: municipality, zoom: 11, duration: 250 })} style={[styles.resetTool, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="maximize" color={colors.text} size={18} /></Pressable>
      <View pointerEvents="none" style={[styles.legend, { backgroundColor: colors.card }]}><View style={styles.legendDot} /><Text style={[styles.toolLabel, { color: colors.text }]}>Evacuation centers</Text></View>
      </View>
      {!!error && <Notice error text={error} />}
      <Button
        icon="crosshair"
        title="Locate me & recenter"
        onPress={() => void recenter()}
        loading={busy}
      />
      {!compact && <Button
        secondary
        title="Return to Pitogo Island"
        onPress={() =>
          camera.current?.easeTo({
            center: municipality,
            zoom: 11,
            duration: 350,
          })
        }
      />}
      {!compact && <Button
        secondary
        title="Reload map"
        onPress={() => {
          setError("");
          setMapLoaded(false);
          centered.current = false;
          setGeneration((value) => value + 1);
        }}
      />}
      <DeviceLocationNotice />
      <Button
        secondary
        title={basemaps[basemap].attribution}
        onPress={() =>
          void Linking.openURL(basemaps[basemap].license)
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12 },
  mapFrame: { borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  basemapSwitch: { position: "absolute", top: 12, left: 12, flexDirection: "row", padding: 4, borderRadius: 12, borderWidth: 1 },
  basemapOption: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 9 },
  toolLabel: { fontSize: 11, fontWeight: "600" }, zoomControls: { position: "absolute", right: 12, bottom: 16, borderRadius: 12, borderWidth: 1 },
  mapTool: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  resetTool: { position: "absolute", right: 12, top: 12, width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  legend: { position: "absolute", bottom: 16, left: 12, padding: 10, borderRadius: 10, flexDirection: "row", gap: 6, alignItems: "center" }, legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" },
  map: { height: 380, borderRadius: 16, overflow: "hidden" },
  compactMap: { height: 240 },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2946d8",
    borderWidth: 3,
    borderColor: "#fff",
  },
  centerMarker: { width: 44, height: 44, borderRadius: 14, borderBottomLeftRadius: 3, backgroundColor: '#15803d', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  fullMarker: { backgroundColor: '#b45309' },
  selectedMarker: { borderWidth: 4, borderColor: '#a5b4fc' },
});
