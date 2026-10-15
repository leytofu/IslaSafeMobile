import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  Button,
  Card,
  Choices,
  Copy,
  Notice,
  Screen,
  Unavailable,
} from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { SosReceipt } from "../lib/contracts";
import { useApp } from "../state/AppState";
import { ReferenceAlerts } from "../components/ResidentReferenceViews";
export default function AlertsScreen() {
  const { user, verified, theme } = useApp();
  const manager = user?.role === "campmanager";
  const [items, setItems] = useState<SosReceipt[]>([]);
  const [loadedAt, setLoadedAt] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("All");
  const lock = useRef(false);
  const load = useCallback(async () => {
    if (!manager || !verified || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.get<{ data: SosReceipt[] }>("/sos-requests");
      setItems(data.data);
      setLoadedAt(new Date().toLocaleString());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, [manager, verified]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return (
    <Screen title="Alerts & Advisories" subtitle="Community warnings and preparedness updates">
      {!manager && <ReferenceAlerts theme={theme} />}
      <Unavailable
        title="Official warnings unavailable"
        detail="The backend has no verified official disaster-warning endpoint. No warning level or all-clear is inferred. Consult PAGASA, PHIVOLCS, and your local authorities."
      />
      <Unavailable
        title="Push notifications are not active"
        detail="Firebase Android configuration, backend token registration, and an authorized alert source are required."
      />
      {manager && (
        <>
          <Copy title="Reported emergency requests" />
          <Copy muted>
            These are caller-submitted SOS reports, not official disaster
            warnings.
          </Copy>
          <Button
            title="Refresh SOS reports"
            onPress={() => void load()}
            loading={busy}
            disabled={!verified}
          />
          {!!error && <Notice error text={error} />}
          {!!loadedAt && (
            <Copy muted>
              Last fetched: {loadedAt}. May be stale; refresh to check updates.
            </Copy>
          )}
          <Choices
            label="Filter by status"
            values={["All", "Pending", "Coming", "Resolved"]}
            value={filter}
            onChange={setFilter}
          />
          {loadedAt && items.length === 0 && (
            <Card>
              <Copy>No SOS requests returned by the backend.</Copy>
            </Card>
          )}
          {items
            .filter((item) => filter === "All" || item.status === filter)
            .map((item) => (
              <Card key={item.id}>
                <Copy title>{item.id}</Copy>
                <Copy>
                  {item.category} • {item.priority} • {item.status}
                </Copy>
                <Copy>
                  {item.name} • {item.contact}
                </Copy>
                <Copy>
                  {item.location} ({item.latitude}, {item.longitude})
                </Copy>
                <Copy>{item.description}</Copy>
                <Copy muted>Received: {item.received_at}</Copy>
              </Card>
            ))}
        </>
      )}
    </Screen>
  );
}
