import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Platform } from "react-native";
import {
  Button,
  Card,
  Choices,
  Copy,
  Dialog,
  Field,
  Notice,
  Screen,
} from "../components/ui";
import { useApp } from "../state/AppState";
import { errorMessage } from "../lib/api";
import { ReferenceSettings } from "../components/ResidentReferenceViews";
import { BarangayField } from "../components/BarangayField";
import { ProfilePhotoEditor } from "../components/ProfilePhotoEditor";
import { UserAvatar } from "../components/UserAvatar";
import { avatarProfileForm } from "../lib/profile-photo";
export default function ProfileScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const {
    user,
    verified,
    theme,
    themePreference,
    setTheme,
    offlineSaving,
    setOfflineSaving,
    updateProfile,
    logout,
    refresh,
  } = useApp();
  const [fields, setFields] = useState({
    name: user?.name || "",
    email: user?.email || "",
    contact_number: user?.contact_number || "",
    office: user?.office || "",
    jurisdiction: user?.jurisdiction || "",
    barangay: user?.barangay || "",
    address: user?.address || "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const lock = useRef(false);
  const isResident = user?.role === "residents";
  const enterEdit = useCallback(() => {
    setFields({
      name: user?.name || "",
      email: user?.email || "",
      contact_number: user?.contact_number || "",
      office: user?.office || "",
      jurisdiction: user?.jurisdiction || "",
      barangay: user?.barangay || "",
      address: user?.address || "",
    });
    setMessage("");
    setError("");
    setEditProfile(true);
  }, [user]);
  useFocusEffect(useCallback(() => {
    if (edit === "1") {
      enterEdit();
      setShowOffline(false);
      router.setParams({ edit: "0" });
    }
  }, [edit, enterEdit]));
  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await task();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen
      embedded={embedded}
      backDisabled={busy}
      onBack={(editProfile || showOffline) ? () => { setEditProfile(false); setShowOffline(false); } : undefined}
      backLabel={editProfile || showOffline ? (isResident ? "Back to settings" : "Back to profile") : "Back"}
      title="Settings"
      subtitle={
        user?.role === "campmanager"
          ? "Camp Manager account"
          : "Resident account"
      }
    >
      {!!error && <Notice error text={error} />}
      {!!message && <Notice text={message} />}
      {user && editProfile && !showOffline && <ProfilePhotoEditor key={user.id} user={user} theme={theme} disabled={busy} canSave={verified} onVerify={() => { void run(refresh); }}
        onBusyChange={(value) => { lock.current = value; setBusy(value); }}
        onSave={async (photo) => { await updateProfile(await avatarProfileForm(user, photo, Platform.OS)); }} />}
      {isResident && !editProfile && !showOffline && <ReferenceSettings theme={theme} themePreference={themePreference} user={user}
        onToggleTheme={() => { void run(() => setTheme(theme === "dark" ? "light" : "dark")); }}
        onUseSystemTheme={() => { void run(() => setTheme("system")); }}
        onEditProfile={enterEdit}
        onOffline={() => setShowOffline((current) => !current)} />}
      {embedded && (editProfile || showOffline) && <Button secondary title={isResident ? "Back to settings" : "Back to profile"} onPress={() => { setEditProfile(false); setShowOffline(false); }} />}
      {user && (user.role !== "residents" || editProfile) && <>
      <Card>
        {!editProfile && <UserAvatar theme={theme} size={56} user={user} />}
        <Copy title>{user.name}</Copy>
        <Copy muted>{user.email}</Copy>
        <Copy>
          {verified
            ? "Session verified"
            : "Session retained • verification unavailable"}
        </Copy>
        <Button
          secondary
          title="Verify session now"
          onPress={() => void run(refresh)}
          loading={busy}
        />
        {!editProfile && <Button secondary title="Edit profile" onPress={enterEdit} />}
      </Card>
      <Card>
        <Copy title="Account information" />
        {isResident && <>
          <Copy muted>Sign in with your email address and IslaSafe password.</Copy>
          {user.has_local_password === false
            ? <Copy muted>Contact your administrator to set up password access for this account.</Copy>
            : <Button secondary title="Change IslaSafe password" disabled={!verified || busy}
              onPress={() => router.push({ pathname: "/auth", params: { role: "residents", recovery: "1" } })} />}
        </>}
      </Card>
      </>}
      {user && editProfile && <>
      <Card>
        {(Object.keys(fields) as (keyof typeof fields)[]).filter((key) => user?.role === "residents" || !["barangay", "address"].includes(key)).map((key) => (
          key === "barangay" ? <BarangayField key={key} value={fields.barangay} onChange={(value) => setFields((current) => ({ ...current, barangay: value }))} disabled={busy} /> : <Field
            key={key}
            label={
              {
                name: "Full name",
                email: "Email",
                contact_number: "Contact number",
                office: "Office (optional)",
                jurisdiction: "Jurisdiction (optional)",
                barangay: "Barangay",
                address: "Complete address",
              }[key]
            }
            value={fields[key]}
            onChangeText={(value) =>
              setFields((current) => ({ ...current, [key]: value }))
            }
            maxLength={key === "contact_number" ? 32 : 255}
            keyboardType={
              key === "email"
                ? "email-address"
                : key === "contact_number"
                  ? "phone-pad"
                  : "default"
            }
            editable={!busy && !(key === "email" && user?.google_linked)}
          />
        ))}
        <Button
          title="Save profile"
          disabled={!verified}
          loading={busy}
          onPress={() =>
            void run(async () => {
              const { barangay, address, ...common } = fields;
              await updateProfile(user?.role === "residents" ? { ...common, barangay, address } : common);
              setMessage("Profile updated successfully.");
            })
          }
        />
      </Card>
      </>}
      {user?.role !== "residents" && <>
      <Card>
        <Copy title="Appearance" />
        <Choices
          label="Theme preference"
          values={["system", "light", "dark"] as const}
          value={themePreference}
          onChange={(value) => void run(() => setTheme(value))}
        />
        <Copy muted>System follows your phone’s light or dark setting.</Copy>
      </Card>
      </>}
      {(user?.role !== "residents" || showOffline) && <>
      <Card>
        <Copy title="Offline preparedness" />
        <Choices
          label="Allow manually saved offline SOS drafts"
          values={["Enabled", "Disabled"]}
          value={offlineSaving ? "Enabled" : "Disabled"}
          onChange={(value) =>
            void run(() => setOfflineSaving(value === "Enabled"))
          }
        />
        <Copy muted>
          Preparedness guides are bundled. Online maps are not
          guaranteed offline. All submissions retain a secure local journal to
          prevent duplicate sends. Turning this setting off keeps existing
          records.
        </Copy>
        <Button
          secondary
          title="Review saved SOS records"
          onPress={() =>
            router.push(
              user?.role === "residents" ? "/resident/sos" : "/guest-sos",
            )
          }
        />
      </Card>
      </>}
      <Button
        danger
        title="Sign out"
        onPress={() => setConfirmLogout(true)}
        disabled={busy}
      />
      <Dialog
        visible={confirmLogout}
        title="Sign out of IslaSafe?"
        onClose={() => setConfirmLogout(false)}
      >
        <Copy>
          Your local SOS records will remain on this device. You can review them
          through guest SOS. Offline sign-out cannot revoke the server token.
        </Copy>
        <Button
          danger
          title="Sign out of this device"
          onPress={() => {
            setConfirmLogout(false);
            void run(async () => {
              await logout();
            });
          }}
          loading={busy}
        />
      </Dialog>
    </Screen>
  );
}
