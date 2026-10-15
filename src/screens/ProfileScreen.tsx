import { useRef, useState } from "react";
import { router } from "expo-router";
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
export default function ProfileScreen() {
  const {
    user,
    verified,
    theme,
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
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const lock = useRef(false);
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
      title="Your profile"
      subtitle={
        user?.role === "campmanager"
          ? "Camp Manager account"
          : "Resident account"
      }
    >
      {!!error && <Notice error text={error} />}
      {!!message && <Notice text={message} />}
      <Card>
        <Copy title>{user?.name}</Copy>
        <Copy muted>{user?.email}</Copy>
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
      </Card>
      <Card>
        <Copy title="Account information" />
      </Card>
      <Card>
        {(Object.keys(fields) as (keyof typeof fields)[]).map((key) => (
          <Field
            key={key}
            label={
              {
                name: "Full name",
                email: "Email",
                contact_number: "Contact number",
                office: "Office (optional)",
                jurisdiction: "Jurisdiction (optional)",
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
            editable={!busy}
          />
        ))}
        <Button
          title="Save profile"
          disabled={!verified}
          loading={busy}
          onPress={() =>
            void run(async () => {
              await updateProfile(fields);
              setMessage("Profile updated successfully.");
            })
          }
        />
      </Card>
      <Card>
        <Copy title="Appearance" />
        <Choices
          label="Theme preference"
          values={["dark", "light"]}
          value={theme}
          onChange={(value) => void run(() => setTheme(value))}
        />
      </Card>
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
          Guides and hazard reference images are bundled. Online maps are not
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
