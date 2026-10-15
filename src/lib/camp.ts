import { api } from "./api";
export type Place = { id: number; barangay: string; municipality: string };
export type EvacuationEvent = { id: number; name: string; status: string };
export type Registration = { id: number; full_name: string; age: number | null; age_group: string; gender: string; place: Place; purok: string | null; status: string; registered_at: string; center: { id: number; name: string }; event: EvacuationEvent; evacuee_id: number };
export type PersonHint = { id: number; user_id: number | null; full_name: string; age: number | null; place: Place };
export type Person = PersonHint & { date_of_birth: string | null; reported_age: number | null; age_recorded_at: string | null; gender: string; place_id: number; purok: string | null; total_evacuations: number; previous_evacuations: number; history: Registration[]; latest_evacuation: Registration | null; active_registration: Registration | null };
export type CenterSummary = { id: number; name: string; place: Place; capacity: number | null; current: number; registered: number; first_time: number; returning: number; available: number | null; occupancy_percent: number | null; status: string; latest_activity: { action: string; occurred_at: string } | null; total_recorded_events: number; event: EvacuationEvent | null; demographics: { age: Record<string, number>; gender: Record<string, number>; places: { place: Place; total: number }[]; puroks: { place: Place; purok: string | null; total: number }[] } };
export type CampContext = { center: CenterSummary; event: EvacuationEvent | null; places: Place[]; genders: string[]; recent: Registration[] };
export type RegistrationResult = { registration: Registration; person: Person; center: CenterSummary; already_registered: boolean };
export { ageGroup, ageFromBirthDate } from "./demographics";
export async function campContext(signal?: AbortSignal) {
  return (await api.get<{ data: CampContext }>("/camp/context", { signal })).data.data;
}
