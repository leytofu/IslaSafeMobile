import type { ExpoConfig } from "expo/config";

if (process.env.ISLASAFE_BUILD === "production") {
  throw new Error("IslaSafe is restricted to local development builds.");
}

const config: ExpoConfig = {
  name: "IslaSafe",
  icon: "./assets/app-logo.png",
  slug: "islasafe-mobile",
  version: "1.0.0",
  scheme: "islasafe",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  android: {
    package: "ph.islasafe.mobile",
    predictiveBackGestureEnabled: true,
  },
  ios: { bundleIdentifier: "ph.islasafe.mobile", supportsTablet: true },
  plugins: [
    "./plugins/withShortNativePaths",
    "expo-router",
    "expo-secure-store",
    "expo-font",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#050810",
        image: "./assets/app-logo.png",
        imageWidth: 96,
      },
    ],
    "expo-system-ui",
    ["expo-asset", { assets: ["./assets/hazards"] }],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "IslaSafe uses your location to place you on the map and include coordinates in an SOS you choose to send.",
      },
    ],
    "@maplibre/maplibre-react-native",
    ["expo-build-properties", { android: { usesCleartextTraffic: true } }],
  ],
  experiments: { typedRoutes: true },
  web: { bundler: "metro" },
  extra: { development: true },
};
export default config;
