import * as Location from "expo-location";
export async function captureLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
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
