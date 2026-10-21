import { Redirect } from "expo-router";
import { SessionLoading } from "../components/SessionLoading";
import { dashboardFor } from "../lib/session";
import { useApp } from "../state/AppState";

// Preserve old links without exposing the removed provider-linking workflow.
export default function AccountSecurity() {
  const { user, ready, verified } = useApp();
  if (!ready) return <SessionLoading />;
  if (!user || !verified) return <Redirect href="/welcome" />;
  return <Redirect href={user.role === "residents" ? "/resident/profile" : dashboardFor(user.role)} />;
}
