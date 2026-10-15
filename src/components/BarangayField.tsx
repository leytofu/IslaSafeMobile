import { SelectField } from './ui';
import { barangayKey, barangayLabel, barangayOptions } from '../data/barangays';

export function BarangayField({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  // Retain a previously saved spelling until the resident chooses a replacement.
  const known = barangayOptions.some((item) => barangayKey(item.value) === barangayKey(value));
  const options = known ? barangayOptions.map((item) => barangayKey(item.value) === barangayKey(value) ? { ...item, value } : item)
    : value ? [{ value, label: barangayLabel(value) }, ...barangayOptions] : barangayOptions;
  return <SelectField label="Barangay" value={value} onChange={onChange} disabled={disabled} options={options} />;
}
