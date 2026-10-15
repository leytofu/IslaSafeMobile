import { useEffect, useRef, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  Camera,
  CameraRef,
  LngLat,
  Map,
  Marker,
  StyleSpecification,
  TransformRequestManager,
} from "@maplibre/maplibre-react-native";
import { Button, Copy, Loading, Notice } from "./ui";
import { captureLocation } from "../lib/location";
import { errorMessage } from "../lib/api";
import type { IslandMapProps } from "../lib/evacuationCenters";
const municipality: LngLat = [124.562, 10.109]; // Existing frontend municipality map center, NOT a shelter or evacuation destination.
const mapStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};
export default function IslandMap({ centers, selectedCenterId, onSelectCenter }: IslandMapProps) {
  const camera = useRef<CameraRef>(null);
  const [ready, setReady] = useState(false);
  const [coordinate, setCoordinate] = useState<LngLat | null>(null);
  const [capturedAt, setCapturedAt] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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
    })().catch((e) => setError(errorMessage(e)));
    return () => {
      mounted = false;
    };
  }, []);
  async function recenter() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const position = await captureLocation();
      const next: LngLat = [
        position.coords.longitude,
        position.coords.latitude,
      ];
      setCoordinate(next);
      setCapturedAt(new Date(position.timestamp).toLocaleTimeString());
      camera.current?.easeTo({ center: next, zoom: 15, duration: 350 });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={styles.container}>
      {ready ? (
        <Map
          key={generation}
          style={styles.map}
          mapStyle={mapStyle}
          attribution={false}
          logo={false}
          onDidFailLoadingMap={() =>
            setError(
              "Map failed to load. Check connectivity; reference maps remain available offline.",
            )
          }
        >
          <Camera
            ref={camera}
            initialViewState={{ center: municipality, zoom: 11 }}
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
                accessibilityLabel="Your captured current location"
                style={styles.marker}
              />
            </Marker>
          )}
        </Map>
      ) : (
        <View style={styles.map}>
          <Loading text="Preparing native map…" />
        </View>
      )}
      {!!error && <Notice error text={error} />}
      <Button
        icon="crosshair"
        title="Locate me & recenter"
        onPress={() => void recenter()}
        loading={busy}
      />
      <Button
        secondary
        title="Return to Pitogo Island"
        onPress={() =>
          camera.current?.easeTo({
            center: municipality,
            zoom: 11,
            duration: 350,
          })
        }
      />
      <Button
        secondary
        title="Reload map"
        onPress={() => {
          setError("");
          setGeneration((value) => value + 1);
        }}
      />
      <Copy muted>
        {coordinate
          ? `GPS captured at ${capturedAt}: ${coordinate[1].toFixed(5)}, ${coordinate[0].toFixed(5)}. Tap Locate me to update.`
          : "Location permission is requested when you choose Locate me."}
      </Copy>
      <Button
        secondary
        title="© OpenStreetMap contributors • License"
        onPress={() =>
          void Linking.openURL("https://www.openstreetmap.org/copyright")
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12 },
  map: { height: 380, borderRadius: 16, overflow: "hidden" },
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
