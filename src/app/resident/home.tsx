import { router } from "expo-router";
import { ResidentDashboard } from "../../components/dashboard/ResidentDashboard";
import { SessionNotices } from "../../components/ui";
import { ResidentMenuButton } from "../../components/ResidentMenu";
import { ResidentHomeMap } from "../../components/ResidentHomeMap";
import { useApp } from "../../state/AppState";

export default function Home() {
  const { user, theme, setTheme } = useApp();
  return <ResidentDashboard
    name={user?.name.split(" ")[0]}
    barangay={user?.barangay || "Poblacion"}
    theme={theme}
    menuControl={<ResidentMenuButton theme={theme} />}
    statusContent={<SessionNotices />}
    mapContent={<ResidentHomeMap />}
    onToggleTheme={() => { void setTheme(theme === "dark" ? "light" : "dark").catch(() => {}); }}
    onSos={() => router.push("/resident/sos")}
    onMap={() => router.push("/resident/map")}
    onGuides={() => router.push("/guides")}
    onHazards={() => router.push("/hazards")}
  />;
}
