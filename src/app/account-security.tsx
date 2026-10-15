import { useRef, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Button, Card, Copy, Field, Notice, Screen } from "../components/ui";
import { SessionLoading } from "../components/SessionLoading";
import { api, errorMessage } from "../lib/api";
import { googleProof } from "../lib/google";
import { useApp } from "../state/AppState";

export default function AccountSecurity() {
  const { user, ready, verified, refresh } = useApp();
  const { action } = useLocalSearchParams<{ action?: string }>();
  const linking = action === "link";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  if (!ready) return <SessionLoading />;
  if (!user || !verified) return <Redirect href="/welcome" />;
  if (user.role !== "residents") return <Redirect href="/camp/overview" />;
  async function submit() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (!password || (!linking && (password.length < 8 || password !== confirmation)))
        throw new Error(linking ? "Enter your current IslaSafe password." : "Use matching passwords of at least 8 characters.");
      const proof = await googleProof(linking ? "link" : "password");
      const { data } = await api.post<{ message: string }>(
        linking ? "/auth/google/link" : "/auth/password/set",
        linking ? { ...proof, current_password: password } : { ...proof, password, password_confirmation: confirmation },
      );
      setPassword("");
      setConfirmation("");
      setMessage(data.message);
      await refresh();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return <Screen title={linking ? "Link Google" : "Set IslaSafe Password"} subtitle={user.email}>
    {!!error && <Notice error text={error} />}
    {!!message && <Notice text={message} />}
    <Card>
      <Copy muted>Your IslaSafe password is separate from your Google password. Never enter your Google password into IslaSafe.</Copy>
      {message ? null : !linking && user.has_local_password ? <>
        <Copy>You already have an IslaSafe password. Use email verification to change it securely.</Copy>
        <Button title="Change IslaSafe password" onPress={() => router.push({ pathname: "/auth", params: { role: "residents", recovery: "1" } })} />
      </> : <>
        <Copy muted>{linking ? "Enter your existing IslaSafe password, then choose the Google account with the same email. Your account and records will stay together." : "Choose your IslaSafe password, then sign in with your linked Google account again to confirm this change."}</Copy>
        <Field label={linking ? "Current IslaSafe password" : "New IslaSafe password"} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete={linking ? "current-password" : "new-password"} maxLength={255} editable={!busy} />
        {!linking && <Field label="Confirm IslaSafe password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" autoComplete="new-password" maxLength={255} editable={!busy} />}
        <Button title={linking ? "Authenticate and link Google" : "Reauthenticate with Google and set password"} onPress={() => void submit()} loading={busy} />
      </>}
    </Card>
    <Button secondary title="Back to profile" disabled={busy} onPress={() => router.replace("/resident/profile")} />
  </Screen>;
}
