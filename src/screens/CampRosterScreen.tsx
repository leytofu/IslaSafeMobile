import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { isAxiosError } from "axios";
import { router, useFocusEffect } from "expo-router";
import { Button, Card, Choices, Copy, Field, Notice, Screen } from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { type Registration } from "../lib/camp";
import { useApp } from "../state/AppState";
export default function CampRosterScreen() {
  const { online, verified } = useApp();
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("All"); const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Registration[]>([]); const [lastPage, setLastPage] = useState(1); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [loading, setLoading] = useState(true);
  const current = useRef<AbortController | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!online || !verified) { setError("Reconnect and verify your session before accessing the current roster."); setLoading(false); return; }
    current.current?.abort();
    const controller = new AbortController(); current.current = controller;
    const cancel = () => controller.abort(); signal?.addEventListener("abort", cancel, { once: true });
    setLoading(true);
    try { const response = await api.get<{ data: Registration[]; last_page: number }>("/camp/registrations", { params: { q: query, page, status: status === "All" ? undefined : status === "Checked in" ? "checked_in" : "checked_out" }, signal: controller.signal }); if (!controller.signal.aborted) { setRows(response.data.data); setLastPage(response.data.last_page); setError(""); } }
    catch (caught) { if (!controller.signal.aborted) { if (isAxiosError(caught) && [401, 403].includes(caught.response?.status ?? 0)) setRows([]); setError(errorMessage(caught)); } }
    finally { signal?.removeEventListener("abort", cancel); if (!controller.signal.aborted) setLoading(false); }
  }, [query, status, page, online, verified]);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => void load(controller.signal), 350);
    const poll = setInterval(() => { if (AppState.currentState === "active") void load(controller.signal); }, 20000);
    const listener = AppState.addEventListener("change", (state) => { if (state === "active") void load(controller.signal); });
    return () => { clearTimeout(timer); clearInterval(poll); listener.remove(); controller.abort(); current.current?.abort(); };
  }, [load]));
  async function changeStatus(row: Registration) {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { await api.patch(`/camp/registrations/${row.id}`, { action: row.status === "checked_in" ? "check_out" : "check_in" }); await load(); }
    catch (caught) { setError(errorMessage(caught)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Screen title="Center roster" subtitle="Current evacuation event"><Button title="Register evacuee" icon="user-plus" onPress={() => router.push("/camp/register")} /><Field label="Search current registrations" value={query} onChangeText={(value) => { setQuery(value); setPage(1); }} /><Choices label="Evacuation status" values={["All", "Checked in", "Checked out"]} value={status} onChange={(value) => { setStatus(value); setPage(1); }} />{!!error && <Notice error text={error} />}{loading && <Copy muted>Loading current registrations...</Copy>}{rows.length === 0 && !loading && !error && <Copy muted>No matching registrations.</Copy>}{rows.map((row) => <Card key={row.id}><Copy title={row.full_name} /><Copy muted>ID {row.evacuee_id} · {row.place.barangay} · {row.purok ?? "Purok unspecified"}</Copy><Copy>Age {row.age ?? "unknown"} · {row.age_group} · {row.gender.replaceAll("_", " ")}</Copy><Copy>{row.status.replaceAll("_", " ")} · {new Date(row.registered_at).toLocaleString()}</Copy><Button secondary title={row.status === "checked_in" ? "Check out" : "Check in again"} disabled={busy || loading || !online || !verified || !!error} onPress={() => void changeStatus(row)} /></Card>)}<Copy muted>Page {page} of {lastPage}</Copy><Button secondary title="Previous page" disabled={page <= 1} onPress={() => setPage(page - 1)} /><Button secondary title="Next page" disabled={page >= lastPage} onPress={() => setPage(page + 1)} /><Button secondary title="Refresh roster" onPress={() => void load()} /></Screen>;
}
