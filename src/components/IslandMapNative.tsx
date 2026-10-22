import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
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
import { Loading } from "./ui";
import { useMapLocation } from "../hooks/useMapLocation";
import { MapLocationControl } from "./MapLocationControl";
import { errorMessage } from "../lib/api";
import type { IslandMapProps } from "../lib/evacuationCenters";
import { basemaps, rasterStyle, type BasemapKey } from "../lib/basemaps";
import { dashboardPalettes } from "../theme/colors";
import { useApp } from "../state/AppState";
const municipality: LngLat = [124.562, 10.109]; // Existing frontend municipality map center, NOT a shelter or evacuation destination.
export default function IslandMap({ centers, selectedCenterId, onSelectCenter, compact = false, fullScreen = false }: IslandMapProps) {
  const { theme } = useApp();
  const reduceMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const compactControls = compact || height < 500;
  const colors = dashboardPalettes[theme];
  const map = useRef<MapRef>(null);
  const [basemap, setBasemap] = useState<BasemapKey>("map");
  const mapStyle = useMemo(() => rasterStyle(basemap), [basemap]);
  const camera = useRef<CameraRef>(null);
  const [ready, setReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const location = useMapLocation(mapLoaded, (latitude, longitude) => camera.current?.easeTo({ center: [longitude, latitude], zoom: 16, duration: reduceMotion ? 0 : 650 }));
  const coordinate: LngLat | null = location.position ? [location.position.coords.longitude, location.position.coords.latitude] : null;
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
  async function adjustZoom(amount: number) {
    if (!map.current || busy) return;
    try {
      const [center, zoom] = await Promise.all([map.current.getCenter(), map.current.getZoom()]);
      camera.current?.easeTo({ center, zoom: Math.min(19, Math.max(3, zoom + amount)), duration: 200 });
    } catch (failure) { setError(errorMessage(failure)); }
  }
  return (
    <View style={[styles.container, fullScreen && styles.fill]}>
      <View style={[styles.mapFrame, { borderColor: colors.border }, fullScreen && styles.fullFrame]}>
      {ready ? (
        <Map
          ref={map}
          key={generation}
          style={[styles.map, compact && styles.compactMap, fullScreen && styles.fill]}
          mapStyle={mapStyle}
          attribution={false}
          logo={false}
          onDidFinishLoadingMap={() => setMapLoaded(true)}
          onDidFailLoadingMap={() =>
            setError(
              "Map failed to load. Check connectivity; preparedness guides remain available offline.",
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
        <View style={[styles.map, compact && styles.compactMap, fullScreen && styles.fill]}>
          <Loading text="Preparing native map…" />
        </View>
      )}
      <View style={[styles.basemapSwitch, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(["map", "satellite"] as const).map((key) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: basemap === key }} accessibilityLabel={basemaps[key].label + " basemap"} onPress={() => setBasemap(key)} style={[styles.basemapOption, { backgroundColor: basemap === key ? colors.tint : "transparent" }]}><Feather name={key === "map" ? "map" : "globe"} size={13} color={basemap === key ? colors.accent : colors.muted} /><Text style={[styles.toolLabel, { color: basemap === key ? colors.accent : colors.muted }]}>{basemaps[key].label}</Text></Pressable>)}
      </View>
      {!compactControls && <View style={[styles.zoomControls, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {([["plus", 1], ["minus", -1]] as const).map(([icon, amount]) => <Pressable key={icon} accessibilityRole="button" accessibilityLabel={amount === 1 ? "Zoom in" : "Zoom out"} disabled={!mapLoaded} onPress={() => { void adjustZoom(amount); }} style={styles.mapTool}><Feather name={icon} color={colors.text} size={20} /></Pressable>)}
      </View>}
      <Pressable accessibilityRole="button" accessibilityLabel="Recenter on Pitogo Island" onPress={() => camera.current?.easeTo({ center: municipality, zoom: 11, duration: 250 })} style={[styles.resetTool, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="maximize" color={colors.text} size={18} /></Pressable>
      <MapLocationControl location={location} ready={mapLoaded} error={error} onReload={() => {
        setError(""); setMapLoaded(false); setGeneration(value => value + 1);
      }} />
      <Pressable accessibilityRole="link" accessibilityLabel={basemaps[basemap].attribution} onPress={() => { void Linking.openURL(basemaps[basemap].license).catch(() => setError("Unable to open map attribution.")); }} style={[styles.credit, { backgroundColor: colors.card }]}><Text style={[styles.toolLabel, { color: colors.text }]}>{basemaps[basemap].attribution}</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  fill: { flex: 1, height: undefined, minHeight: 0 },
  fullFrame: { flex: 1, borderRadius: 0, borderWidth: 0 },
  credit: { position: "absolute", bottom: 0, left: 0, right: 0, minHeight: 24, paddingHorizontal: 8, justifyContent: "center" },
  mapFrame: { borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  basemapSwitch: { position: "absolute", top: 12, left: 12, flexDirection: "row", padding: 4, borderRadius: 12, borderWidth: 1 },
  basemapOption: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 9 },
  toolLabel: { fontSize: 11, fontWeight: "600" }, zoomControls: { position: "absolute", right: 20, bottom: 104, borderRadius: 12, borderWidth: 1 },
  mapTool: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  resetTool: { position: "absolute", right: 12, top: 12, width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  legend: { position: "absolute", bottom: 16, left: 12, padding: 10, borderRadius: 10, flexDirection: "row", gap: 6, alignItems: "center" }, legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" },
  map: { height: 380, borderRadius: 16, overflow: "hidden" },
  compactMap: { height: 240 },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    borderWidth: 3,
    borderColor: "#fff",
  },
  centerMarker: { width: 44, height: 44, borderRadius: 14, borderBottomLeftRadius: 3, backgroundColor: '#15803d', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  fullMarker: { backgroundColor: '#b45309' },
  selectedMarker: { borderWidth: 4, borderColor: '#a5b4fc' },
});
