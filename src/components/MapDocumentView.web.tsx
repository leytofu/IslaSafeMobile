import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { MapDocumentHandle, MapDocumentViewProps } from "./MapDocumentView";
export const MapDocumentView = forwardRef<MapDocumentHandle, MapDocumentViewProps>(function MapDocumentView({ html, onMessage, onError }, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  useImperativeHandle(ref, () => ({ send: command => frame.current?.contentWindow?.postMessage({ islaSafeCommand: command }, "*"), reload: () => { if (frame.current) frame.current.srcdoc = html; } }), [html]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow && event.data?.islaSafeMap) onMessage(event.data.islaSafeMap);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onMessage]);
  return <iframe ref={frame} title="Interactive Pitogo Island map" srcDoc={html} onError={onError} style={{ width: "100%", height: "100%", border: 0 }} />;
});
