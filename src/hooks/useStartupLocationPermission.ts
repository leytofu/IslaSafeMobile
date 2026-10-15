import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { requestLocationPermission } from "../lib/location";

/** Show the phone's foreground permission prompt once per app launch. */
export function useStartupLocationPermission() {
  const requested = useRef(false);
  useEffect(() => {
    if (Platform.OS === "web") return;
    const request = () => {
      if (requested.current) return;
      requested.current = true;
      // A denied or unavailable permission must not block launch or sign-in.
      void requestLocationPermission().catch(() => {});
    };
    const subscription = AppState.addEventListener("change", state => { if (state === "active") request(); });
    if (AppState.currentState === "active") request();
    return () => subscription.remove();
  }, []);
}
