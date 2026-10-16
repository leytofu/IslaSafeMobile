import { useDeviceLocation } from "../state/DeviceLocation";
import { Button, Copy, Notice } from "./ui";

export function DeviceLocationNotice() {
  const location = useDeviceLocation();
  const busy = location.status === "requesting" || location.status === "locating";
  return <>
    {busy && <Copy muted>{location.status === "requesting" ? "Checking location permission..." : "Finding your current position..."}</Copy>}
    {!!location.error && <Notice error text={location.error} />}
    {location.position && <Copy muted>Current location: {location.position.coords.latitude.toFixed(5)}, {location.position.coords.longitude.toFixed(5)}{location.position.coords.accuracy != null ? ` (accuracy about ${Math.round(location.position.coords.accuracy)} m)` : ""}. Updated {new Date(location.position.timestamp).toLocaleTimeString()}.</Copy>}
    {!location.position && !busy && <Button secondary title="Enable location" onPress={location.refresh} />}
    {location.status === "denied" && <Button secondary title="Open location permission settings" onPress={location.openSettings} />}
    {location.status === "disabled" && <Button secondary title="Open phone settings" onPress={location.openSettings} />}
    <Copy muted>Your position updates while the app is open. It is not shared with Admin by the map.</Copy>
  </>;
}
