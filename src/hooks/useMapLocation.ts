import { useEffect, useRef } from "react";
import { useDeviceLocation } from "../state/DeviceLocation";

/** Reuse the foreground watcher; recenter once, without following every GPS fix. */
export function useMapLocation(ready: boolean, onLocate: (latitude: number, longitude: number) => void) {
  const location = useDeviceLocation();
  const centered = useRef(false);
  const requested = useRef(false);
  const busy = location.status === "requesting" || location.status === "locating";
  useEffect(() => {
    if (!ready) centered.current = false;
    if (!location.position) centered.current = false;
    if (ready && location.status === "ready" && location.position && (!centered.current || requested.current)) {
      const { latitude, longitude } = location.position.coords;
      onLocate(latitude, longitude);
      centered.current = true;
      requested.current = false;
    }
  }, [ready, location.position, location.status, onLocate]);
  async function recenter() {
    if (!ready || busy || requested.current) return;
    const fix = location.position;
    if (location.status === "ready" && fix && Date.now() - fix.timestamp >= 0 && Date.now() - fix.timestamp <= 30000) {
      onLocate(fix.coords.latitude, fix.coords.longitude);
      centered.current = true;
      return;
    }
    requested.current = true;
    try { await location.refresh(); } finally { requested.current = false; }
  }
  return { ...location, busy, recenter };
}
