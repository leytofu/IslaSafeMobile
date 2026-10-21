import { Card, Copy, Notice, Screen, Button } from "../../../../components/ui";
import { useCampContext } from "../../../../hooks/useCampContext";
import { AdvisoryInbox } from "../../../../components/AdvisoryInbox";
export default function CampAlerts() {
  const { data, error, refresh } = useCampContext();
  return <Screen title="Camp updates" subtitle="Evacuation operations">
    <AdvisoryInbox />
    {!!error && <Notice error text={error} />}
    <Card><Copy title={data ? data.event?.name ?? "No active evacuation event" : "Event information unavailable"} /><Copy muted>{data?.center.name ?? "Center assignment required"}</Copy><Copy>{data ? `${data.center.current} currently checked in` : "Registration statistics unavailable"}</Copy></Card>
    <Button secondary title="Refresh updates" onPress={() => void refresh()} />
  </Screen>;
}
