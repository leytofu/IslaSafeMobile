import { Redirect } from "expo-router";
import { SessionLoading } from "../components/SessionLoading";
import { Onboarding } from "../components/Onboarding";
import { useApp } from "../state/AppState";
import { canEnterDashboard, dashboardFor } from "../lib/session";

export default function Welcome() {
  const { ready, user, verified, introPending, introCycle } = useApp();
  if (!ready) return <SessionLoading />;
  if (canEnterDashboard(user, verified) && user) return <Redirect href={dashboardFor(user.role)} />;
  return <Onboarding key={introCycle} playIntro={introPending} />;
}
