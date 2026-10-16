import { useState } from "react";
import { Image, Text, View } from "react-native";
import { dashboardPalettes, type ThemeMode } from "../theme/colors";
import type { User } from "../lib/contracts";

export function UserAvatar({ user, theme, size = 64, radius = size / 2 }: {
  user?: Pick<User, "name" | "avatar_url"> | null;
  theme: ThemeMode; size?: number; radius?: number;
}) {
  const c = dashboardPalettes[theme];
  const [failed, setFailed] = useState<string | null>(null);
  const initials = (user?.name || "User").trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: c.tint, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
    {user?.avatar_url && failed !== user.avatar_url
      ? <Image accessibilityLabel={`${user.name}'s profile photo`} source={{ uri: user.avatar_url }} onError={() => setFailed(user.avatar_url!)} style={{ width: size, height: size }} resizeMode="cover" />
      : <Text style={{ color: c.accent, fontSize: Math.max(14, size * 0.3), fontWeight: "700" }}>{initials}</Text>}
  </View>;
}
