import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button, Card, Notice } from "./ui";
import { UserAvatar } from "./UserAvatar";
import { selectProfilePhoto } from "../lib/select-profile-photo";
import type { ProfilePhoto } from "../lib/profile-photo";
import type { User } from "../lib/contracts";
import { errorMessage } from "../lib/api";
import { dashboardPalettes, type ThemeMode } from "../theme/colors";

export function ProfilePhotoEditor({ user, theme, disabled, canSave = true, onVerify, onSave, onBusyChange }: {
  user: User; theme: ThemeMode; disabled: boolean;
  canSave?: boolean; onVerify?: () => void;
  onSave: (photo: ProfilePhoto) => Promise<void>;
  onBusyChange: (busy: boolean) => void;
}) {
  const c = dashboardPalettes[theme];
  const [photo, setPhoto] = useState<ProfilePhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const mounted = useRef(true);
  const locked = useRef(false);
  const hasImage = Boolean(photo || user.avatar_url);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function run(action: () => Promise<void>) {
    if (locked.current || disabled) return;
    locked.current = true; setBusy(true); onBusyChange(true); setError(""); setMessage("");
    try { await action(); }
    catch (e) { if (mounted.current) setError(errorMessage(e)); }
    finally { locked.current = false; onBusyChange(false); if (mounted.current) setBusy(false); }
  }
  function choose(source: "library" | "camera") {
    void run(async () => {
      const selected = await selectProfilePhoto(source);
      if (selected && mounted.current) setPhoto(selected);
    });
  }
  return <Card>
    <View style={styles.identity}>
      <Pressable accessibilityRole="button" accessibilityLabel={hasImage ? "Edit profile image" : "Add profile image"} accessibilityHint="Choose and crop a photo from your gallery" accessibilityState={{ disabled: disabled || busy }} disabled={disabled || busy} onPress={() => choose("library")} style={({ pressed }) => [styles.avatarButton, { opacity: disabled || busy ? 0.5 : pressed ? 0.75 : 1 }]}>
        <UserAvatar theme={theme} size={96} user={{ name: user.name, avatar_url: photo?.uri || user.avatar_url }} />
        <View style={[styles.editBadge, { backgroundColor: c.primary, borderColor: c.card }]}><Feather name={hasImage ? "edit-2" : "plus"} size={16} color="#fff" /></View>
      </Pressable>
      <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>Profile photo</Text>
      <Text style={[styles.caption, { color: c.muted }]}>{photo ? "Preview · Save when you’re happy with your photo." : user.avatar_url ? "Your photo appears on your profile and account bar." : "Add a photo so your account is easy to recognize."}</Text>
    </View>
    {!!error && <Notice error text={error} />}
    {!!message && <Notice text={message} />}
    <Button secondary icon={hasImage ? "edit-2" : "image"} title={hasImage ? "Edit image" : "Add image"} disabled={disabled || busy} onPress={() => choose("library")} />
    <Button secondary icon="camera" title="Take a photo" disabled={disabled || busy} onPress={() => choose("camera")} />
    {photo && <>
      {!canSave && <>
        <Notice text="You can choose and preview your image now. Verify your session before saving it to your account." />
        {onVerify && <Button secondary title="Verify session to save photo" disabled={disabled || busy} onPress={onVerify} />}
      </>}
      <Button icon="check" title="Save profile photo" disabled={disabled || !canSave} loading={busy} onPress={() => void run(async () => {
        await onSave(photo);
        if (mounted.current) { setPhoto(null); setMessage("Profile photo saved."); }
      })} />
      <Button secondary title="Discard selected photo" disabled={busy} onPress={() => { setPhoto(null); setError(""); setMessage(""); }} />
    </>}
    {!photo && busy && <Text accessibilityLiveRegion="polite" style={[styles.caption, { color: c.muted }]}>Preparing your photo…</Text>}
    <Text style={[styles.caption, { color: c.muted }]}>Photos are resized for upload. Maximum saved size: 2 MB.</Text>
  </Card>;
}
const styles = StyleSheet.create({
  identity: { alignItems: "center", gap: 10, paddingVertical: 8 },
  avatarButton: { padding: 4 },
  editBadge: { position: "absolute", right: 1, bottom: 1, width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  caption: { fontSize: 12, lineHeight: 19, textAlign: "center" },
});
