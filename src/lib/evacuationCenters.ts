import { publicApi } from './api';
export type MapCenter = {
  id: number;
  name: string;
  place: { id: number; barangay: string; municipality: string };
  capacity: number | null;
  current: number;
  available: number | null;
  latitude: number;
  longitude: number;
  status: string;
};
export type IslandMapProps = {
  compact?: boolean;
  centers: MapCenter[];
  selectedCenterId: number | null;
  onSelectCenter: (id: number) => void;
};
export async function evacuationCenters(signal?: AbortSignal): Promise<MapCenter[]> {
  return (await publicApi.get<{ data: MapCenter[] }>('/evacuation-centers', { signal })).data.data;
}
