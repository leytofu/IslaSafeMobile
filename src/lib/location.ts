import * as Location from "expo-location";
let permissionRequest: Promise<Location.LocationPermissionResponse> | null = null;

/** Permission only: never reads, stores, or uploads the user's coordinates. */
export function requestLocationPermission() {
  if (!permissionRequest) {
    permissionRequest = (async () => {
      const current = await Location.getForegroundPermissionsAsync();
      if (current.granted || !current.canAskAgain) return current;
      return Location.requestForegroundPermissionsAsync();
    })().finally(() => { permissionRequest = null; });
  }
  return permissionRequest;
}

export async function captureLocation() {
  const permission = await requestLocationPermission();
  if (!permission.granted)
    throw new Error(
      "Location permission was denied. Enter known coordinates and a location description manually, or allow location in Android settings.",
    );
  if (!(await Location.hasServicesEnabledAsync()))
    throw new Error(
      "Turn on Android location services, or enter known coordinates manually.",
    );
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "GPS took too long. Try again outdoors, or enter known coordinates.",
              ),
            ),
          20000,
        );
      }),
    ]);
    return position;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
