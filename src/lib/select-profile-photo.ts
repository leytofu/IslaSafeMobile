import type { ImagePickerOptions } from "expo-image-picker";
import type { ProfilePhoto } from "./profile-photo";

function photoTools() {
  try {
    // Load only on tap: older custom builds must still be able to open the app.
    // Synchronous loading also preserves the browser's file-picker user gesture.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const picker = require("expo-image-picker") as typeof import("expo-image-picker");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manipulator = require("expo-image-manipulator") as typeof import("expo-image-manipulator");
    return { picker, manipulator };
  } catch {
    throw new Error("Photo tools are missing from this app build. Open the project in Expo Go, or install the updated IslaSafe development build.");
  }
}

export async function selectProfilePhoto(source: "library" | "camera"): Promise<ProfilePhoto | null> {
  const { picker: ImagePicker, manipulator: { ImageManipulator, SaveFormat } } = photoTools();
  const options: ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 1 };
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error("Allow camera access in your device settings, or choose a photo from your gallery.");
  }
  const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset?.uri) throw new Error("No image was selected. Please choose a photo again.");
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 1024) context.resize(asset.width >= asset.height ? { width: 1024 } : { height: 1024 });
  const image = await context.renderAsync();
  const photo = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true });
  if (!photo.base64) throw new Error("The selected photo could not be prepared. Try another image.");
  const bytes = photo.base64.length * 3 / 4 - (photo.base64.endsWith("==") ? 2 : photo.base64.endsWith("=") ? 1 : 0);
  if (bytes > 2 * 1024 * 1024) throw new Error("This photo is still larger than 2 MB. Please choose a smaller image.");
  return { uri: photo.uri, width: photo.width, height: photo.height };
}
