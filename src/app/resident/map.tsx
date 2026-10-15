import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import IslandMap from '../../components/IslandMap';
import { Button, Card, Copy, Dialog, Loading, Notice, Screen, SelectField, Unavailable } from '../../components/ui';
import { useEvacuationCenters } from '../../hooks/useEvacuationCenters';
import { useApp } from '../../state/AppState';
import { hazards } from '../../data/hazards';
import { barangayKey, barangayLabel, barangayOptions } from '../../data/barangays';

export default function MapScreen() {
  const { centers, error, loading, updatedAt, refresh } = useEvacuationCenters();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { colors } = useApp();
  const [focus, setFocus] = useState('All CPG barangays');
  const [exposure, setExposure] = useState(0);
  const [picker, setPicker] = useState<'exposure' | 'reference' | null>(null);
  const [showCenters, setShowCenters] = useState(true);
  const focusedCenters = focus === 'All CPG barangays' ? centers : centers.filter((center) => barangayKey(center.place.barangay) === barangayKey(focus));
  const selected = centers.find((center) => center.id === selectedId);
  return <Screen title="CPG hazard map" subtitle="Focus areas, basemaps & evacuation centers">
    {!!error && <Notice error text={`${error}${updatedAt ? ` Showing the last update at ${updatedAt}.` : ''}`} />}
    {loading && <Loading text="Loading evacuation centers..." />}
    <View style={[mapStyles.controls, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SelectField label="Focus area" value={focus} onChange={(value) => { setFocus(value); setSelectedId(null); }} options={[{ value: 'All CPG barangays', label: 'All CPG barangays' }, ...barangayOptions, ...[...new Set(centers.map((center) => center.place.barangay))].filter((item) => !barangayOptions.some((option) => barangayKey(option.value) === barangayKey(item))).map((value) => ({ value, label: barangayLabel(value) }))]} />
      <Text style={[mapStyles.label, { color: colors.muted }]}>URBAN EXPOSURE REFERENCE</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Choose urban exposure reference" onPress={() => setPicker('exposure')} style={mapStyles.select}><View style={mapStyles.selectValue}><View style={mapStyles.exposureDot} /><Text style={{ color: colors.text }}>{hazards[exposure].title}</Text></View><Feather name="chevron-down" color={colors.muted} size={16} /></Pressable>
    </View>
    <View style={mapStyles.layerRow}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: showCenters }} onPress={() => setShowCenters((current) => !current)} style={[mapStyles.layer, { backgroundColor: showCenters ? colors.tint : colors.card, borderColor: colors.border }]}><Feather name={showCenters ? 'check-square' : 'square'} size={15} color={colors.primary} /><Text style={{ color: colors.text, fontSize: 11 }}>Evacuation centers</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setPicker('reference')} style={[mapStyles.layer, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="layers" color={colors.primary} size={15} /><Text style={{ color: colors.text, fontSize: 11 }}>Exposure reference</Text></Pressable>
    </View>
    <IslandMap centers={showCenters ? focusedCenters : []} selectedCenterId={selected?.id ?? null} onSelectCenter={setSelectedId} />
    <Dialog visible={picker === 'exposure'} title="Urban exposure reference" onClose={() => setPicker(null)}>
      {hazards.map((hazard, index) => <Button key={hazard.title} secondary title={hazard.title} onPress={() => { setExposure(index); setPicker(null); }} />)}
    </Dialog>
    <Dialog visible={picker === 'reference'} title={hazards[exposure].title + ' reference'} onClose={() => setPicker(null)}>
      <Image source={hazards[exposure].source} resizeMode="contain" accessibilityLabel={hazards[exposure].title + ' original exposure map and legend'} style={{ width: '100%', height: 320 }} />
      <Copy muted>Original reference image. Geographic alignment has not been verified; this is not overlaid on the basemap.</Copy>
    </Dialog>
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
    <Notice text="Map and Satellite use the same default basemap providers as the admin portal. Tiles need connectivity. Facility locations do not indicate a verified evacuation route." />
    <Unavailable title="Hazard overlays & evacuation routes unavailable" detail="The supplied hazard images have no verified georeferencing, and route guidance is not yet available." />
    <Button secondary title="Open six offline hazard reference maps" onPress={() => router.push('/hazards')} />
  </Screen>;
}

const mapStyles = StyleSheet.create({
  controls: { padding: 15, borderRadius: 16, borderWidth: 1, gap: 5 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  select: { paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  selectValue: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }, exposureDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#dc2626' },
  layerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, layer: { borderWidth: 1, borderRadius: 20, minHeight: 40, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
});
