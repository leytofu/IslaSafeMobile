import type { LocationObject, LocationPermissionResponse, LocationSubscription } from "expo-location";

export type DeviceLocationState = {
  position: LocationObject | null;
  status: "idle" | "requesting" | "locating" | "ready" | "denied" | "disabled" | "paused" | "error";
  error: string;
};
export const initialDeviceLocation: DeviceLocationState = { position: null, status: "idle", error: "" };

export function createForegroundLocation(ports: {
  permission: (prompt: boolean) => Promise<LocationPermissionResponse>;
  servicesEnabled: () => Promise<boolean>;
  enableServices: () => Promise<void>;
  watch: (next: (position: LocationObject) => void, error: (reason: string) => void) => Promise<LocationSubscription>;
  publish: (state: DeviceLocationState) => void;
}) {
  let epoch = 0;
  let subscription: LocationSubscription | null = null;
  let state = initialDeviceLocation;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let servicesPrompted = false;
  let servicesRequest: Promise<void> | null = null;
  function publish(next: DeviceLocationState) { state = next; if (!disposed) ports.publish(next); }
  function cancel() {
    epoch++;
    subscription?.remove(); subscription = null;
    if (timer) clearTimeout(timer);
    timer = undefined;
  }
  return {
    async start(prompt: boolean) {
      if (disposed) return;
      cancel();
      const run = epoch;
      const current = () => !disposed && run === epoch;
      publish({ position: null, status: "requesting", error: "" });
      try {
        const permission = await ports.permission(prompt);
        if (!current()) return;
        if (!permission.granted) {
          publish({ position: null, status: "denied", error: "Allow location access in your phone settings to show your position on the map." }); return;
        }
        let enabled = await ports.servicesEnabled();
        if (!current()) return;
        if (!enabled && (servicesRequest || prompt || !servicesPrompted)) {
          if (!servicesRequest) {
            servicesPrompted = true;
            const request = ports.enableServices().catch(() => { /* The user may decline the system dialog. */ });
            servicesRequest = request;
            void request.finally(() => { if (servicesRequest === request) servicesRequest = null; });
          }
          await servicesRequest;
          if (!current()) return;
          enabled = await ports.servicesEnabled();
        }
        if (!current()) return;
        if (!enabled) {
          publish({ position: null, status: "disabled", error: "Turn on your phone's Location services, then tap Enable location." }); return;
        }
        publish({ position: null, status: "locating", error: "" });
        timer = setTimeout(() => {
          if (current() && !state.position) publish({ position: null, status: "error", error: "Waiting for a GPS fix. Move outdoors or tap Enable location to retry." });
        }, 20000);
        const nextSubscription = await ports.watch(position => {
          if (!current()) return;
          const { latitude, longitude } = position.coords;
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || !Number.isFinite(position.timestamp)) return;
          if (timer) clearTimeout(timer);
          publish({ position, status: "ready", error: "" });
        }, reason => {
          if (current()) {
            if (timer) clearTimeout(timer);
            publish({ position: null, status: "error", error: `Location unavailable: ${reason}. Check your phone's Location settings.` });
          }
        });
        if (!current()) nextSubscription.remove();
        else subscription = nextSubscription;
      } catch (error) {
        if (current()) {
          if (timer) clearTimeout(timer);
          publish({ position: null, status: "error", error: error instanceof Error ? error.message : "Unable to access your location. Check your phone's Location settings." });
        }
      }
    },
    pause() { cancel(); publish({ position: null, status: "paused", error: "" }); },
    dispose() { disposed = true; cancel(); },
  };
}
