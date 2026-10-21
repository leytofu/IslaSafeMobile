import { useRef, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { supportedRole } from "../lib/contracts";
import { dashboardFor } from "../lib/session";
import { SessionLoading } from "../components/SessionLoading";
import { Keyboard } from "react-native";
import { isAxiosError } from "axios";
import { AuthSurface } from "../components/AuthSurface";
import { errorMessage, publicApi } from "../lib/api";
import { useApp } from "../state/AppState";
export default function Auth() {
  const { user, ready, verified, introPending, authenticate, logout } = useApp();
  const params = useLocalSearchParams<{ role?: string; recovery?: string }>();
  const role = supportedRole(params.role) ? params.role : null;
  const [mode, setMode] = useState<"login" | "register" | "recovery">(params.recovery === "1" ? "recovery" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(params.recovery === "1" ? user?.email ?? "" : "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [phase, setPhase] = useState(0);
  const [registrationStep, setRegistrationStep] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const lock = useRef(false);
  const completed = useRef(false);
  if (!ready) return <SessionLoading />;
  if (user && verified && params.recovery !== "1")
    return (
      <Redirect
        href={dashboardFor(user.role)}
      />
    );
  if (!role || introPending) return <Redirect href="/welcome" />;
  function changeMode(next: typeof mode) {
    if (next === "register" && role !== "residents") return;
    setMode(next);
    completed.current = false;
    setError("");
    setMessage("");
    setPassword("");
    setConfirmation("");
    setPhase(0);
    setRegistrationStep(0);
    setChallenge("");
    setResetToken("");
    setOtp("");
  }
  async function run(task: () => Promise<void>) {
    if (lock.current || completed.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      if (mode === "register" && isAxiosError(e) && e.response?.status === 422) {
        const fields = e.response.data?.errors;
        if (fields?.name) setRegistrationStep(0);
        else if (fields?.email) setRegistrationStep(1);
        else if (fields?.password || fields?.password_confirmation) setRegistrationStep(2);
      }
      if (mode === "recovery" && isAxiosError(e) && (e.response?.status === 410 || (phase === 1 && e.response?.status === 429 && String(e.response.data?.message).includes("Too many attempts")) || (phase === 2 && e.response?.status === 422 && String(e.response.data?.message).includes("invalid or has expired")))) {
        setPhase(0);
        setChallenge("");
        setResetToken("");
        setOtp("");
        setPassword("");
        setConfirmation("");
        setMessage("");
      }
      setError(errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function submit() {
    void run(async () => {
      if (mode === "register") {
        if (!name.trim()) { setRegistrationStep(0); throw new Error("Enter your full name."); }
        if (registrationStep === 0) { setRegistrationStep(1); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setRegistrationStep(1); throw new Error("Enter a valid email address."); }
        if (registrationStep === 1) { setRegistrationStep(2); return; }
        if (password.length < 8) { setRegistrationStep(2); throw new Error("Choose a password with at least 8 characters."); }
        if (password !== confirmation) { setRegistrationStep(2); throw new Error("Your passwords don’t match. Please try again."); }
      }
      if (mode !== "recovery") {
        if (!email.trim() || !password)
          throw new Error("Enter your email address and password.");
        if (mode === "register" && (!name.trim() || password.length < 8 || password !== confirmation))
          throw new Error("Use matching passwords of at least 8 characters.");
        await authenticate(
          mode === "login" ? "/auth/login" : "/auth/register",
          mode === "login"
            ? { email: email.trim(), password }
            : {
                name: name.trim(),
                email: email.trim(),
                password,
                password_confirmation: confirmation,
              },
          role ?? undefined,
          mode === "login" ? rememberMe : true,
        );
        completed.current = true;
        setPassword("");
        setConfirmation("");
        return;
      }
      if (phase === 0) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error("Enter your registered email address.");
        const { data } = await publicApi.post("/forgot-password", {
          email: email.trim(),
        }, { timeout: 45000 });
        setMessage(data.message);
        setChallenge(data.data.challenge_id);
        setPhase(1);
        setResendAt(Date.now() + data.data.resend_available_in * 1000);
      } else if (phase === 1) {
        if (!/^\d{6}$/.test(otp)) throw new Error("Enter the six-digit code from your email.");
        const { data } = await publicApi.post("/forgot-password/verify-otp", {
          challenge_id: challenge,
          otp,
        });
        setResetToken(data.data.reset_token);
        setMessage(data.message);
        setOtp("");
        setPhase(2);
      } else {
        if (password.length < 8 || password !== confirmation)
          throw new Error("Use matching passwords of at least 8 characters.");
        const { data } = await publicApi.post("/forgot-password/reset", {
          reset_token: resetToken,
          password,
          password_confirmation: confirmation,
        });
        if (user) await logout();
        changeMode("login");
        setMessage(data.message);
      }
    });
  }
  return (
    <AuthSurface
      role={role}
      mode={mode}
      phase={phase}
      registrationStep={registrationStep}
      busy={busy}
      rememberMe={rememberMe}
      onRememberMeChange={setRememberMe}
      error={error}
      message={message}
      name={{ value: name, onChangeText: value => { setName(value); setError(""); } }}
      email={{ value: email, onChangeText: value => { setEmail(value); setError(""); } }}
      password={{ value: password, onChangeText: value => { setPassword(value); setError(""); } }}
      confirmation={{ value: confirmation, onChangeText: value => { setConfirmation(value); setError(""); } }}
      otp={{ value: otp, onChangeText: value => { setOtp(value); setError(""); } }}
      onSubmit={submit}
      onModeChange={changeMode}
      onBack={() => {
        Keyboard.dismiss();
        if (params.recovery === "1" && user) {
          router.replace("/resident/profile");
          return;
        }
        if (mode === 'register' && registrationStep === 2) {
          changeMode('login');
        } else if (mode === 'register' && registrationStep > 0) {
          setRegistrationStep(registrationStep - 1);
          setError('');
        } else if (mode !== 'login') changeMode('login');
        else router.replace('/welcome');
      }}
      onResend={() => void run(async () => {
        if (Date.now() < resendAt)
          throw new Error(`Wait ${Math.ceil((resendAt - Date.now()) / 1000)} seconds before resending.`);
        const { data } = await publicApi.post('/forgot-password/resend-otp', { challenge_id: challenge }, { timeout: 45000 });
        setOtp('');
        setMessage(data.message);
        setResendAt(Date.now() + data.data.resend_available_in * 1000);
      })}
    />
  );
}
