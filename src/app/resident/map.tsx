import { useState } from 'react';
import { router } from 'expo-router';
import IslandMap from '../../components/IslandMap';
import { Button, Card, Copy, Dialog, Loading, Notice, Screen, Unavailable } from '../../components/ui';
import { useEvacuationCenters } from '../../hooks/useEvacuationCenters';

export default function MapScreen() {
  const { centers, error, loading, updatedAt, refresh } = useEvacuationCenters();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = centers.find((center) => center.id === selectedId);
  return <Screen title="Island map" subtitle="Evacuation centers in President Carlos P. Garcia">
    {!!error && <Notice error text={`${error}${updatedAt ? ` Showing the last update at ${updatedAt}.` : ''}`} />}
    {loading && <Loading text="Loading evacuation centers..." />}
    <IslandMap centers={centers} selectedCenterId={selected?.id ?? null} onSelectCenter={setSelectedId} />
    <Copy muted>Tap a shelter icon for details. Green: available or capacity unknown. Amber: full.</Copy>
    {selected && <Dialog visible title={selected.name} onClose={() => setSelectedId(null)} closeLabel="Close center details">
      <Copy>{selected.place.barangay} - {selected.place.municipality}</Copy>
      <Copy>Maximum capacity: {selected.capacity ?? 'Not configured'}</Copy>
      <Copy>Current occupancy: {selected.current}</Copy>
      <Copy>{selected.available === 0 ? 'Full - no available spaces' : `Available spaces: ${selected.available ?? 'Unknown'}`}</Copy>
      {!!error && <Copy muted>Availability may have changed. Reconnect for the latest occupancy.</Copy>}
    </Dialog>}
    {!loading && !error && centers.length === 0 && <Notice text="No operational evacuation centers with map locations are currently recorded." />}
    <Copy muted>{updatedAt ? `Last updated ${updatedAt}. ` : ''}Centers refresh automatically every 15 seconds while this screen is active.</Copy>
    <Button secondary icon="refresh-cw" title="Refresh evacuation centers" onPress={() => void refresh()} />
    {centers.length > 0 && <Card><Copy title>Operational centers</Copy>{centers.map((center) => <Button key={center.id} secondary icon="home" title={`${center.name} - ${center.place.barangay}`} onPress={() => setSelectedId(center.id)} />)}</Card>}
    <Notice text="Online OpenStreetMap basemap. Tiles may be unavailable offline. Facility locations do not indicate a verified evacuation route." />
    <Unavailable title="Hazard overlays & evacuation routes unavailable" detail="The supplied hazard images have no verified georeferencing, and route guidance is not yet available." />
    <Button secondary title="Open six offline hazard reference maps" onPress={() => router.push('/hazards')} />
  </Screen>;
}
