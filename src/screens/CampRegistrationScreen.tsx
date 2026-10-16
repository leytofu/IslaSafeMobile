import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import { isAxiosError } from "axios";
import { Button, Card, Choices, Copy, Field, Loading, Notice, Screen, SelectField } from "../components/ui";
import { useCampContext } from "../hooks/useCampContext";
import { useApp } from "../state/AppState";
import { api, errorMessage } from "../lib/api";
import { ageFromBirthDate, ageGroup, type Person, type PersonHint, type RegistrationResult } from "../lib/camp";
import { readSecret, removeSecret, writeSecret } from "../lib/vault";

type Draft = { client_request_id: string; evacuee_id: number | null; full_name: string; date_of_birth: string; reported_age: string; gender: string; place_id: number | null; purok: string; submitted: boolean };
const emptyDraft = (): Draft => ({ client_request_id: Crypto.randomUUID(), evacuee_id: null, full_name: "", date_of_birth: "", reported_age: "", gender: "unspecified", place_id: null, purok: "", submitted: false });
const label = (value: string) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

export default function CampRegistrationScreen() {
  const { user, colors, online, verified } = useApp();
  const { data, loading, error: contextError } = useCampContext();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [restored, setRestored] = useState(false);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<PersonHint[]>([]);
  const [person, setPerson] = useState<Person | null>(null);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const lock = useRef(false);
  const alive = useRef(true);
  const selection = useRef(0);
  const key = `camp-registration-draft-${user?.id}`;
  useEffect(() => {
    let active = true; alive.current = true;
    void readSecret<Draft>(key).then((saved) => { if (active && saved) setDraft(saved); }).catch(() => { if (active) setError("Your saved draft could not be read. Existing records have not been deleted."); }).finally(() => { if (active) setRestored(true); });
    return () => { active = false; alive.current = false; };
  }, [key]);
  useEffect(() => {
    if (!restored || result) return;
    const timer = setTimeout(() => { void writeSecret(key, draft).catch(() => { if (alive.current) setError("The draft could not be saved securely. Keep this form open until registration is confirmed."); }); }, 500);
    return () => clearTimeout(timer);
  }, [draft, key, restored, result]);
  useEffect(() => {
    if (query.trim().length < 2 || draft.evacuee_id || !online || !verified) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      void api.get<{ data: PersonHint[] }>("/camp/people", { params: { q: query.trim() }, signal: controller.signal }).then(({ data: response }) => { if (!controller.signal.aborted) setMatches(response.data); }).catch((caught) => { if (!controller.signal.aborted) setError(errorMessage(caught)); }).finally(() => { if (!controller.signal.aborted) setSearching(false); });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, draft.evacuee_id, online, verified]);
  useEffect(() => {
    if (!restored || !draft.evacuee_id || person?.id === draft.evacuee_id) return;
    const controller = new AbortController();
    void api.get<{ data: Person }>(`/camp/people/${draft.evacuee_id}`, { signal: controller.signal }).then(({ data: response }) => { if (!controller.signal.aborted) setPerson(response.data); }).catch((caught) => { if (!controller.signal.aborted) setError(errorMessage(caught)); });
    return () => controller.abort();
  }, [draft.evacuee_id, restored, person?.id]);
  const change = <K extends keyof Draft>(field: K, value: Draft[K]) => { if (!draft.submitted && !lock.current && !busy) setDraft((current) => ({ ...current, [field]: value })); };
  async function choose(id: number) {
    const generation = ++selection.current;
    setBusy(true); setError("");
    try {
      const response = (await api.get<{ data: Person }>(`/camp/people/${id}`)).data.data;
      if (!alive.current || generation !== selection.current) return;
      setPerson(response); setMatches([]);
      setDraft({ ...emptyDraft(), evacuee_id: response.id, full_name: response.full_name, date_of_birth: response.date_of_birth?.slice(0, 10) ?? "", reported_age: response.reported_age?.toString() ?? "", gender: response.gender, place_id: response.place_id, purok: response.purok ?? "" });
    } catch (caught) { if (alive.current) setError(errorMessage(caught)); }
    finally { if (alive.current && generation === selection.current) setBusy(false); }
  }
  async function register() {
    if (lock.current || !data?.event) return;
    if (!draft.full_name.trim() || !draft.place_id) { setError("Enter the full name and select an authorized barangay."); return; }
    if (draft.date_of_birth && ageFromBirthDate(draft.date_of_birth) === null) { setError("Enter a valid date of birth as YYYY-MM-DD, or leave it blank and use a reported age."); return; }
    if (draft.reported_age && (!/^\d{1,3}$/.test(draft.reported_age) || Number(draft.reported_age) > 125)) { setError("Age must be between 0 and 125, or left unknown."); return; }
    lock.current = true; setBusy(true); setError("");
    const pending = { ...draft, submitted: true };
    try {
      // Durable identity and payload are saved before sending. Retrying an
      // interrupted request uses the same identifier and unchanged identity.
      await writeSecret(key, pending);
      if (alive.current) setDraft(pending);
      const { data: response } = await api.post<{ data: RegistrationResult }>("/camp/registrations", {
        client_request_id: pending.client_request_id, ...(pending.evacuee_id ? { evacuee_id: pending.evacuee_id } : {}),
        full_name: pending.full_name.trim(), date_of_birth: pending.date_of_birth || null, reported_age: pending.reported_age === "" ? null : Number(pending.reported_age),
        gender: pending.gender, place_id: pending.place_id, purok: pending.purok.trim() || null,
      });
      if (alive.current) setResult(response.data);
      await removeSecret(key);
    } catch (caught) {
      if (!alive.current) return;
      if (isAxiosError(caught) && caught.response && caught.response.status < 500) setDraft({ ...pending, submitted: false });
      setError(errorMessage(caught));
    } finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  const age = draft.date_of_birth ? ageFromBirthDate(draft.date_of_birth) : draft.reported_age === "" ? null : Number(draft.reported_age);
  if (!restored || (loading && !data)) return <Loading text="Preparing secure registration…" />;
  return <Screen backDisabled={busy} title="Register evacuee" subtitle={data?.center.name ?? "Assigned center"}>
    {!!contextError && <Notice error text={contextError} />}{!!error && <Notice error text={error} />}
    {result ? <Card><Copy title>{result.already_registered ? "Already registered" : "Registration successful"}</Copy><Copy>{result.registration.full_name}</Copy><Copy>{result.registration.center.name} · {result.registration.event.name}</Copy><Copy muted>{result.registration.status.replaceAll("_", " ")} · Registration #{result.registration.id}</Copy><Copy title={`Total recorded evacuations: ${result.person.total_evacuations}`} /><Button title="Register another evacuee" onPress={() => { setResult(null); setDraft(emptyDraft()); setQuery(""); setPerson(null); setError(""); }} /><Button secondary title="Back to dashboard" onPress={() => router.replace("/camp/overview")} /></Card> : data && <>
      <Card><Copy title="Evacuation information" /><Copy>{data.center.name}</Copy><Copy muted>{data.event?.name ?? "No active event · Registration is unavailable"}</Copy><Copy muted>Date, event, and center are confirmed by the server.</Copy></Card>
      {!draft.evacuee_id && !draft.submitted && <Card><Copy title="Find the correct person" /><Field label="Search resident or evacuee name" value={query} onChangeText={(value) => { setQuery(value); setMatches([]); setSearching(value.trim().length >= 2 && online && verified); }} placeholder="Type at least two characters" editable={!busy} />{searching && online && verified && <Copy muted>Searching authorized records…</Copy>}{matches.map((item) => <Pressable key={item.id} accessibilityRole="button" disabled={busy} onPress={() => void choose(item.id)} style={[styles.match, { borderColor: colors.border }]}><Copy>{item.full_name}</Copy><Copy muted>{item.place.barangay} · Age {item.age ?? "unknown"} · ID {item.id}{item.user_id ? " · Linked resident" : ""}</Copy></Pressable>)}{online && verified && query.trim().length >= 2 && !searching && matches.length === 0 && <Copy muted>No matching authorized records. Enter a new evacuee below if this is a different person.</Copy>}</Card>}
      {person && <Card><Copy title={`${person.full_name} · ID ${person.id}`} /><Copy>Previous evacuations: {person.previous_evacuations}</Copy><Copy muted>{person.latest_evacuation ? `Most recent: ${new Date(person.latest_evacuation.registered_at).toLocaleDateString()} · ${person.latest_evacuation.center.name}` : "No previous evacuation recorded"}</Copy>{person.active_registration && <Notice text={`Already registered at ${person.active_registration.center.name} · ${person.active_registration.status.replaceAll("_", " ")}`} />}{person.history.slice(0, 5).map((item) => <Copy muted key={item.id}>{item.event.name} · {item.center.name} · {new Date(item.registered_at).toLocaleDateString()}</Copy>)}{!draft.submitted && <Button secondary title="Choose a different person" disabled={busy} onPress={() => { setDraft(emptyDraft()); setPerson(null); setQuery(""); }} />}</Card>}
      <Card><Copy title="Personal information" /><Field label="Full name" value={draft.full_name} onChangeText={(value) => change("full_name", value)} editable={!busy && !draft.submitted} autoCapitalize="words" maxLength={180} />
        <Field label="Date of birth (YYYY-MM-DD, optional)" value={draft.date_of_birth} onChangeText={(value) => change("date_of_birth", value)} editable={!busy && !draft.submitted} maxLength={10} placeholder="Leave blank if unknown" />
        {!draft.date_of_birth && <Field label="Reported current age (optional)" value={draft.reported_age} onChangeText={(value) => change("reported_age", value)} editable={!busy && !draft.submitted} keyboardType="number-pad" maxLength={3} />}
        <Copy muted>{ageGroup(age)}{person?.age_recorded_at && !draft.date_of_birth ? " · Confirm the reported age is still current" : ""}</Copy>
        {!draft.submitted && <Choices label="Gender" values={data.genders.map(label)} value={label(draft.gender)} onChange={(value) => change("gender", data.genders.find((item) => label(item) === value) ?? "unspecified")} />}
        {draft.submitted && <Copy>Gender: {label(draft.gender)}</Copy>}
        <SelectField label="Barangay" value={draft.place_id?.toString() ?? ""} disabled={busy || draft.submitted} options={data.places.map((place) => ({ value: String(place.id), label: `${place.barangay} - ${place.municipality}` }))} onChange={(value) => change("place_id", Number(value))} />
        <Field label="Purok / Sitio (optional)" value={draft.purok} onChangeText={(value) => change("purok", value)} editable={!busy && !draft.submitted} maxLength={120} autoCapitalize="words" />
      </Card>
      {draft.submitted && <Notice text="This draft was submitted but confirmation may have been interrupted. Retry the unchanged request to retrieve its result; the server prevents duplicate registration." />}
      <Button title={draft.submitted ? "Retry and confirm registration" : "Confirm registration"} icon="user-check" loading={busy} disabled={!online || !verified || !data.event || !!contextError} onPress={() => void register()} />
      <Button secondary title="Back to dashboard · Keep draft" onPress={() => router.back()} disabled={busy} />
    </>}
  </Screen>;
}
const styles = StyleSheet.create({ match: { borderTopWidth: 1, paddingVertical: 14, gap: 4, minHeight: 64 }, place: { padding: 14, borderWidth: 1, borderRadius: 12, minHeight: 48 } });
