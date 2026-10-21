import { router } from "expo-router";
import { ResidentDashboard } from "../../../components/dashboard/ResidentDashboard";
import { SessionNotices } from "../../../components/ui";
import { NavigationHeader } from "../../../components/NavigationHeader";
import { ResidentHomeMap } from "../../../components/ResidentHomeMap";
import { useApp } from "../../../state/AppState";

export default function Home() {
  const { user, theme, setTheme } = useApp();
  return <ResidentDashboard
    name={user?.name.split(" ")[0]}
    barangay={user?.barangay || "Poblacion"}
    theme={theme}
    headerContent={<NavigationHeader title="Dashboard" subtitle="Your community" />}
    statusContent={<SessionNotices />}
    mapContent={<ResidentHomeMap />}
    onToggleTheme={() => { void setTheme(theme === "dark" ? "light" : "dark").catch(() => {}); }}
    onSos={() => router.navigate({ pathname: "/resident/sos", params: { prepare: "1" } })}
    onMap={() => router.navigate("/resident/map")}
    onGuides={() => router.navigate("/guides")}
    onHazards={() => router.navigate("/hazards")}
  />;
}
