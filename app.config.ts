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
    ...(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      ? [["react-native-nitro-google-signin", {
          iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME,
        }] as [string, { iosUrlScheme: string | undefined }]]
      : []),
    "./plugins/withShortNativePaths",
    "expo-router",
    "expo-secure-store",
    "expo-font",
    ["expo-image-picker", {
      photosPermission: "Choose a photo for your IslaSafe profile.",
      cameraPermission: "Take a photo for your IslaSafe profile.",
      microphonePermission: false,
    }],
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
          "IslaSafe shows your current position on the map while the app is open. Coordinates are shared only when you choose to submit an SOS.",
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
