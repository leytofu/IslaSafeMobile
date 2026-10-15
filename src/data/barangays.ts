// CPG barangays: https://en.wikipedia.org/wiki/President_Carlos_P._Garcia,_Bohol#Barangays
// Keep this offline list aligned with frontend/src/data/barangays.ts.
export const barangays = [
  'Aguining', 'Basiao', 'Baud', 'Bayog', 'Bogo', 'Bonbonon', 'Butan',
  'Campamanog', 'Canmangao', 'Gaus', 'Kabangkalan', 'Lapinig', 'Lipata',
  'Poblacion', 'Popoo', 'Saguise', 'San Jose', 'San Vicente', 'Santo Rosario',
  'Tilmobo', 'Tugas', 'Tugnao', 'Villa Milagrosa',
] as const;

export function barangayKey(value: string) {
  const key = value.trim().toLowerCase();
  if (['pitogo', 'poblacion (pitogo)'].includes(key)) return 'poblacion';
  if (['tawid', 'san jose (tawid)'].includes(key)) return 'san jose';
  return key;
}
export function barangayLabel(value: string) {
  if (barangayKey(value) === 'poblacion') return 'Poblacion (Pitogo)';
  if (barangayKey(value) === 'san jose') return 'San Jose (Tawid)';
  return value;
}
export const barangayOptions = barangays.map((value) => ({ value, label: barangayLabel(value) }));
