import { useRef, useState } from "react";
import { Redirect, router } from "expo-router";
import { Button, Card, Copy, Field, Notice, Screen } from "../components/ui";
import { SessionLoading } from "../components/SessionLoading";
import { BarangayField } from "../components/BarangayField";
import { api, errorMessage } from "../lib/api";
import { useApp } from "../state/AppState";

export default function CompleteProfile() {
  const { user, ready, verified, refresh, logout } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [barangay, setBarangay] = useState(user?.barangay ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [contact, setContact] = useState(user?.contact_number ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  if (!ready) return <SessionLoading />;
  if (!user || !verified) return <Redirect href="/welcome" />;
  if (user.role !== "residents") return <Redirect href="/camp/overview" />;
  if (user.profile_complete) return <Redirect href="/resident/home" />;
  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (!name.trim() || !barangay.trim() || !address.trim()) throw new Error("Enter your name, barangay, and address.");
      await api.patch("/auth/resident-profile", { name: name.trim(), barangay: barangay.trim(), address: address.trim(), contact_number: contact.trim() });
      await refresh();
      router.replace("/resident/home");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return <Screen showBack={false} title="Complete your resident profile" subtitle="Tell us where you live so your profile is ready for IslaSafe.">
    <Card><Copy muted>Your barangay and address are self-reported. Creating an account does not verify that you are a resident of Pitogo.</Copy></Card>
    {!!error && <Notice error text={error} />}
    <Card>
      <Field label="Full name" value={name} onChangeText={setName} maxLength={255} editable={!busy} />
      <BarangayField value={barangay} onChange={setBarangay} disabled={busy} />
      <Field label="Complete address" value={address} onChangeText={setAddress} maxLength={500} editable={!busy} multiline />
      <Field label="Contact number (optional)" value={contact} onChangeText={setContact} maxLength={32} keyboardType="phone-pad" editable={!busy} />
      <Button title="Save and continue" onPress={() => void save()} loading={busy} />
    </Card>
    <Button secondary title="Sign out" disabled={busy} onPress={() => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      void logout().catch((failure) => setError(errorMessage(failure))).finally(() => { lock.current = false; setBusy(false); });
    }} />
  </Screen>;
}
