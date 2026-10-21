import type { ComponentType } from "react";
import { isRunningInExpoGo } from "expo";
import { TurboModuleRegistry } from "react-native";
import type { IslandMapProps } from "../lib/evacuationCenters";

// Expo Go and older development builds cannot import MapLibre: its entry point
// calls getEnforcing immediately, before a screen or error boundary can render.
const MapRenderer: ComponentType<IslandMapProps> = (() => {
  const embedded = (): ComponentType<IslandMapProps> =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo Go uses its bundled WebView instead.
    require("./EmbeddedIslandMap").default;
  const nativeReady =
    !isRunningInExpoGo() &&
    TurboModuleRegistry.get("MLRNCameraModule") != null &&
    TurboModuleRegistry.get("MLRNMapViewModule") != null;
  if (!nativeReady) return embedded();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Native checks must run before MapLibre loads.
    return require("./IslandMapNative").default;
  } catch {
    // Probes can pass while MapLibre still lacks a module it enforces on import.
    return embedded();
  }
})();

export default function IslandMap(props: IslandMapProps) {
  return <MapRenderer {...props} />;
}
