import { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { mapCommandScript, type MapCommand } from "../lib/mapDocument";

export type MapDocumentHandle = { send: (command: MapCommand) => void; reload: () => void };
export type MapDocumentViewProps = { html: string; onMessage: (message: unknown) => void; onError: () => void };
export const MapDocumentView = forwardRef<MapDocumentHandle, MapDocumentViewProps>(function MapDocumentView({ html, onMessage, onError }, ref) {
  const view = useRef<WebView>(null);
  useImperativeHandle(ref, () => ({ send: command => view.current?.injectJavaScript(mapCommandScript(command)), reload: () => view.current?.reload() }), []);
  return <WebView ref={view} source={{ html, baseUrl: "https://islasafe.local/" }}
    style={styles.frame} originWhitelist={["*"]} javaScriptEnabled domStorageEnabled={false}
    scrollEnabled={false} nestedScrollEnabled mixedContentMode="never" setSupportMultipleWindows={false} androidLayerType="hardware"
    allowFileAccess={false} geolocationEnabled={false}
    onShouldStartLoadWithRequest={request => request.url === "about:blank" || request.url === "https://islasafe.local/"}
    onMessage={event => { try { onMessage(JSON.parse(event.nativeEvent.data)); } catch { /* Ignore malformed bridge messages. */ } }}
    onError={onError}
    onHttpError={event => { if (event.nativeEvent.url.startsWith("https://islasafe.local/")) onError(); }}
    onContentProcessDidTerminate={() => { onError(); view.current?.reload(); }}
    onRenderProcessGone={() => { onError(); view.current?.reload(); }} />;
});
const styles = StyleSheet.create({ frame: { flex: 1, backgroundColor: "transparent" } });
