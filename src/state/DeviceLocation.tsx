import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, Linking, Platform } from "react-native";
import * as Location from "expo-location";
import { requestLocationPermission } from "../lib/location";
import { createForegroundLocation, initialDeviceLocation, type DeviceLocationState } from "../lib/foreground-location";

type DeviceLocationContext = DeviceLocationState & { refresh: () => Promise<void>; openSettings: () => void };
const Context = createContext<DeviceLocationContext | null>(null);

export function DeviceLocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialDeviceLocation);
  const controller = useRef<ReturnType<typeof createForegroundLocation> | null>(null);
  useEffect(() => {
    const location = createForegroundLocation({
      permission: prompt => prompt ? requestLocationPermission() : Location.getForegroundPermissionsAsync(),
      servicesEnabled: Location.hasServicesEnabledAsync,
      enableServices: async () => {
        if (Platform.OS === "android") await Location.enableNetworkProviderAsync();
      },
      watch: (next, error) => Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 5000, mayShowUserSettingsDialog: false }, next, error),
      publish: setState,
    });
    controller.current = location;
    let asked = false;
    let backgrounded = false;
    const activate = () => {
      if (Platform.OS === "web") return;
      void location.start(!asked);
      asked = true;
    };
    const subscription = AppState.addEventListener("change", value => {
      if (value === "active" && (backgrounded || !asked)) { backgrounded = false; activate(); }
      // Permission/system dialogs can briefly make iOS inactive; wait for real background.
      else if (value === "background") { backgrounded = true; location.pause(); }
    });
    if (AppState.currentState === "active") activate();
    return () => { subscription.remove(); location.dispose(); controller.current = null; };
  }, []);
  return <Context.Provider value={{ ...state, refresh: () => controller.current?.start(true) ?? Promise.resolve(), openSettings: () => { void Linking.openSettings().catch(() => setState(previous => ({ ...previous, error: "Open your phone's settings and allow location access for this app." }))); } }}>{children}</Context.Provider>;
}

export function useDeviceLocation() {
  const state = useContext(Context);
  if (!state) throw new Error("Location must be used inside DeviceLocationProvider.");
  return state;
}
