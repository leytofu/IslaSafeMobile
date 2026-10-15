import { Redirect } from "expo-router";
import { SessionLoading } from "../components/SessionLoading";
import { useApp } from "../state/AppState";
import { canEnterDashboard, dashboardFor } from "../lib/session";
export default function Index() {
  const { user, ready, verified } = useApp();
  if (!ready) return <SessionLoading />;
  return (
    <Redirect
      href={
        canEnterDashboard(user, verified) && user ? dashboardFor(user.role) : "/welcome"
      }
    />
  );
}
