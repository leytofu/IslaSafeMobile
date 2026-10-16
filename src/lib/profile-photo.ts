import type { User } from "./contracts";

export type ProfilePhoto = { uri: string; width: number; height: number };

export async function avatarProfileForm(user: Pick<User, "name" | "email">, photo: ProfilePhoto, platform: string) {
  const body = new FormData();
  body.append("_method", "PATCH");
  body.append("name", user.name);
  body.append("email", user.email);
  if (platform === "web") {
    const response = await fetch(photo.uri);
    if (!response.ok) throw new Error("The selected photo could not be read. Choose it again.");
    body.append("avatar", await response.blob(), "profile.jpg");
  } else {
    // React Native FormData accepts a local-file descriptor instead of a Blob.
    body.append("avatar", { uri: photo.uri, name: "profile.jpg", type: "image/jpeg" } as unknown as Blob);
  }
  return body;
}
