import { forwardRef, useImperativeHandle } from "react";
import { isRunningInExpoGo } from "expo";
import { StyleSheet, Text, TurboModuleRegistry, View } from "react-native";
import type { MapCommand } from "../lib/mapDocument";

export type MapDocumentHandle = { send: (command: MapCommand) => void; reload: () => void };
export type MapDocumentViewProps = { html: string; onMessage: (message: unknown) => void; onError: () => void };

// WebView enforces its native module during import. Older development binaries
// must still be able to open routes that import the map, including public SOS.
const NativeMapDocumentView: typeof import("./MapDocumentViewNative").MapDocumentView | null = (() => {
  if (TurboModuleRegistry.get("RNCWebViewModule") == null) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Probe before importing the native entry point.
    return require("./MapDocumentViewNative").MapDocumentView;
  } catch {
    return null;
  }
})();

const UnavailableMap = forwardRef<MapDocumentHandle>(function UnavailableMap(_props, ref) {
  useImperativeHandle(ref, () => ({ send: () => {}, reload: () => {} }), []);
  return <View style={styles.unavailable} accessibilityRole="text">
    <Text style={styles.title}>Map unavailable in this app version</Text>
    <Text style={styles.message}>{isRunningInExpoGo()
      ? "Update Expo Go to the version for SDK 57, then reopen IslaSafe."
      : "Rebuild and reinstall the Android development app to enable maps."}</Text>
  </View>;
});

export const MapDocumentView = forwardRef<MapDocumentHandle, MapDocumentViewProps>(function MapDocumentView(props, ref) {
  return NativeMapDocumentView
    ? <NativeMapDocumentView {...props} ref={ref} />
    : <UnavailableMap ref={ref} />;
});

const styles = StyleSheet.create({
  unavailable: { flex: 1, justifyContent: "center", padding: 20, gap: 10, backgroundColor: "#f5f7fb" },
  title: { color: "#101d35", fontSize: 16, fontWeight: "700" },
  message: { color: "#52627a", fontSize: 14, lineHeight: 21 },
});
