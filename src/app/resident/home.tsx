import { router } from "expo-router";
import { Button, Card, Copy, Screen, Unavailable } from "../../components/ui";
import { useApp } from "../../state/AppState";
export default function Home() {
  const { user } = useApp();
  return (
    <Screen
      title={`Hello, ${user?.name.split(" ")[0]}`}
      subtitle="Pitogo Island • President Carlos P. Garcia, Bohol"
    >
      <Card>
        <Copy title="Your safety starts with preparedness" />
        <Copy muted>
          Keep your household ready and know where to seek help.
        </Copy>
        <Button
          danger
          icon="alert-circle"
          title="Emergency SOS"
          onPress={() => router.push("/resident/sos")}
        />
      </Card>
      <Copy title="Quick access" />
      <Button
        icon="map"
        title="Explore the island map"
        onPress={() => router.push("/resident/map")}
      />
      <Button
        secondary
        icon="book-open"
        title="Offline preparedness guides"
        onPress={() => router.push("/guides")}
      />
      <Button
        secondary
        icon="layers"
        title="Offline hazard reference maps"
        onPress={() => router.push("/hazards")}
      />
      <Unavailable
        title="Official warning information unavailable"
        detail="The current API does not supply official alerts or evacuation instructions. Check local authorities and official agency advisories."
      />
      <Card>
        <Copy title="Prepared, even when disconnected" />
        <Copy muted>
          English guides and all six original hazard reference maps are bundled
          with the app. Online map tiles require connectivity. Saved SOS
          requests wait for your review and manual sending.
        </Copy>
      </Card>
    </Screen>
  );
}
