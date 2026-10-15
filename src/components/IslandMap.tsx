import type { ComponentType } from "react";
import { TurboModuleRegistry } from "react-native";
import type { IslandMapProps } from "../lib/evacuationCenters";

// Expo Go and older development builds cannot import MapLibre: its entry point
// calls getEnforcing immediately, before a screen or error boundary can render.
const MapRenderer: ComponentType<IslandMapProps> =
  TurboModuleRegistry.get("MLRNCameraModule") &&
  TurboModuleRegistry.get("MLRNMapViewModule")
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Native checks must run before MapLibre loads.
    ? require("./IslandMapNative").default
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo Go uses its bundled WebView instead.
    : require("./EmbeddedIslandMap").default;

export default function IslandMap(props: IslandMapProps) {
  return <MapRenderer {...props} />;
}
