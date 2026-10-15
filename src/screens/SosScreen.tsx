import { useCallback, useRef, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import { Platform } from "react-native";
import {
  Button,
  Card,
  Choices,
  Copy,
  Dialog,
  Field,
  Notice,
  Screen,
} from "../components/ui";
import {
  categories,
  LocalSos,
  priorities,
  SosBody,
  validateSos,
} from "../lib/contracts";
import { deleteSos, editPending, listSos, saveSos, sendSos } from "../lib/sos";
import { errorMessage } from "../lib/api";
import { captureLocation } from "../lib/location";
import { useApp } from "../state/AppState";
import { ReferenceSosHero } from "../components/ResidentReferenceViews";
export default function SosScreen({ guest = false }: { guest?: boolean }) {
  const { user, online, offlineSaving, theme } = useApp();
  const [showDetails, setShowDetails] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [contact, setContact] = useState(user?.contact_number || "");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SosBody["category"]>("Medical");
  const [priority, setPriority] = useState<SosBody["priority"]>("High");
  const [records, setRecords] = useState<LocalSos[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [review, setReview] = useState<LocalSos | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const reload = useCallback(async () => {
    setRecords(await listSos());
  }, []);
  useFocusEffect(
    useCallback(() => {
      void reload().catch((e) =>
        setError(`Secure records could not be read: ${errorMessage(e)}`),
      );
    }, [reload]),
  );
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      try {
        await reload();
      } catch (e) {
        setError(`Secure records could not be read: ${errorMessage(e)}`);
      }
      lock.current = false;
      setBusy(false);
    }
  }
  function load(entry: LocalSos) {
    setShowDetails(true);
    setEditing(entry.localId);
    setName(entry.body.name);
    setContact(entry.body.contact);
    setLocation(entry.body.location);
    setLatitude(String(entry.body.latitude));
    setLongitude(String(entry.body.longitude));
    setType(entry.body.type);
    setDescription(entry.body.description);
    setCategory(entry.body.category);
    setPriority(entry.body.priority);
    setMessage(
      "Editing locally saved request. Review it again before sending.",
    );
  }
  function save() {
    void run(async () => {
      if (!online && !offlineSaving)
        throw new Error(
          "Offline saving is disabled in Profile. Enable it to save an emergency request securely.",
        );
      if (!latitude.trim() || !longitude.trim())
        throw new Error(
          "Coordinates are required by the backend. Capture GPS or enter known coordinates.",
        );
      const body: SosBody = {
        name,
        contact,
        location,
        latitude: Number(latitude),
        longitude: Number(longitude),
        type,
        category,
        priority,
        description,
      };
      const validation = validateSos(body);
      if (validation) throw new Error(validation);
      if (editing) {
        await editPending(editing, body);
        setReview({
          ...records.find((record) => record.localId === editing)!,
          body,
        });
      } else {
        const entry = await saveSos(body);
        setEditing(entry.localId);
        setReview(entry);
      }
      setMessage(
        Platform.OS === "web"
          ? "Saved in browser memory only. It has NOT been transmitted."
          : "Saved securely on this device. It has NOT been transmitted.",
      );
    });
  }
  return (
    <Screen
      title={guest ? "Guest emergency SOS" : "Emergency SOS"}
      subtitle="Tell responders where you are and what you need"
    >
      {guest && (
        <Button
          secondary
          title="Back to sign in"
          onPress={() => router.replace("/auth")}
          disabled={busy}
        />
      )}
      {!showDetails && <ReferenceSosHero theme={theme} disabled={busy} onPrepare={() => setShowDetails(true)} />}
      <Notice text="Sending an SOS does not guarantee immediate rescue. A local draft is not received by responders. If the send is interrupted, contact local responders before considering another request." />
      {!!error && <Notice error text={error} />}
      {!!message && <Notice text={message} />}
      {showDetails && <Card>
        <Copy title>
          {editing ? "Review saved details" : "Emergency details"}
        </Copy>
        <Field
          label="Your full name"
          value={name}
          onChangeText={setName}
          maxLength={255}
          autoCapitalize="words"
          editable={!busy}
        />
        <Field
          label="Contact number"
          value={contact}
          onChangeText={setContact}
          maxLength={32}
          keyboardType="phone-pad"
          editable={!busy}
        />
        <Field
          label="Location / landmark / barangay"
          value={location}
          onChangeText={setLocation}
          maxLength={255}
          autoCapitalize="sentences"
          editable={!busy}
        />
        <Button
          secondary
          icon="crosshair"
          title="Capture current GPS coordinates"
          loading={busy}
          onPress={() =>
            void run(async () => {
              const position = await captureLocation();
              setLatitude(String(position.coords.latitude));
              setLongitude(String(position.coords.longitude));
              setMessage(
                `GPS captured at ${new Date(position.timestamp).toLocaleTimeString()}. Accuracy: ${position.coords.accuracy == null ? "unknown" : Math.round(position.coords.accuracy) + " m"}. Check your location before sending.`,
              );
            })
          }
        />
        <Field
          label="Latitude (−90 to 90)"
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numbers-and-punctuation"
          editable={!busy}
        />
        <Field
          label="Longitude (−180 to 180)"
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numbers-and-punctuation"
          editable={!busy}
        />
        <Choices
          label="Emergency category"
          values={categories}
          value={category}
          onChange={setCategory}
        />
        <Choices
          label="Priority"
          values={priorities}
          value={priority}
          onChange={setPriority}
        />
        <Field
          label="Emergency type (e.g. injury, trapped by flood)"
          value={type}
          onChangeText={setType}
          maxLength={255}
          editable={!busy}
        />
        <Field
          label="Describe the emergency and assistance needed"
          value={description}
          onChangeText={setDescription}
          maxLength={2000}
          multiline
          autoCapitalize="sentences"
          editable={!busy}
        />
        <Button
          danger
          title="Save details & review before sending"
          onPress={save}
          loading={busy}
        />
        {editing && (
          <Button
            secondary
            title="Start a different request"
            disabled={busy}
            onPress={() => {
              setEditing(null);
              setType("");
              setDescription("");
              setMessage("");
            }}
          />
        )}
      </Card>}
      <Copy title>On this device</Copy>
      <Copy muted>
        Saved details remain here until you delete them. Pending requests never
        send automatically after reconnecting.
      </Copy>
      {records.length === 0 && (
        <Card>
          <Copy muted>No locally saved emergency requests.</Copy>
        </Card>
      )}
      {records.map((entry) => (
        <Card key={entry.localId}>
          <Copy title>
            {entry.phase === "received"
              ? `Received • ${entry.receipt?.id}`
              : entry.phase === "uncertain"
                ? "Uncertain • Check with responders"
                : "Saved locally • NOT SENT"}
          </Copy>
          <Copy>
            {entry.body.category} • {entry.body.priority}
          </Copy>
          <Copy muted>
            {entry.body.location} • {new Date(entry.createdAt).toLocaleString()}
          </Copy>
          {entry.phase === "received" && (
            <Copy>
              Backend receipt: {entry.receipt?.received_at}. Server status at
              submission: {entry.receipt?.status}. This is not live tracking.
            </Copy>
          )}
          {entry.phase === "uncertain" && (
            <Notice text="The server may have received this request. Automatic and one-tap retries are blocked because the backend has no idempotency or public receipt lookup. Keep these details and contact responders." />
          )}
          {entry.phase === "pending" && (
            <>
              <Button
                secondary
                title="Edit saved details"
                onPress={() => load(entry)}
                disabled={busy}
              />
              <Button
                danger
                title="Review & manually send"
                onPress={() => setReview(entry)}
                disabled={busy || !online}
              />
            </>
          )}
          <Button
            secondary
            title="Delete from this device"
            onPress={() => setDeleting(entry.localId)}
            disabled={busy}
          />
        </Card>
      ))}
      <Dialog
        visible={!!review}
        title="Confirm emergency details"
        onClose={() => {
          if (!busy) setReview(null);
        }}
      >
        {review && (
          <>
            <Copy>
              {review.body.name} • {review.body.contact}
            </Copy>
            <Copy>{review.body.location}</Copy>
            <Copy>
              GPS: {review.body.latitude}, {review.body.longitude}
            </Copy>
            <Copy>
              {review.body.category} • {review.body.priority} •{" "}
              {review.body.type}
            </Copy>
            <Copy>{review.body.description}</Copy>
            <Copy muted>
              Send only once. An interrupted send will be marked uncertain.
              Review stale details after reconnecting.
            </Copy>
            <Button
              danger
              title="Send this SOS now"
              loading={busy}
              disabled={!online}
              onPress={() => {
                const id = review.localId;
                setReview(null);
                void run(async () => {
                  const result = await sendSos(id);
                  setEditing(null);
                  setMessage(
                    `Backend confirmed receipt ${result.receipt?.id}. Rescue dispatch is not confirmed.`,
                  );
                });
              }}
            />
          </>
        )}
      </Dialog>
      <Dialog
        visible={!!deleting}
        title="Delete local emergency details?"
        onClose={() => setDeleting(null)}
      >
        <Copy>
          This removes the local record only. It does not cancel a transmitted
          request or remove it from the server.
        </Copy>
        <Button
          danger
          title="Delete local record"
          onPress={() => {
            const id = deleting!;
            setDeleting(null);
            void run(async () => {
              deleteSos(id);
              if (editing === id) setEditing(null);
            });
          }}
        />
      </Dialog>
    </Screen>
  );
}
