import { isAxiosError } from "axios";
import {
  failurePhase,
  LocalSos,
  SosBody,
  SosReceipt,
  sosPayload,
  validateSos,
} from "./contracts";
export type SosStorage = {
  read: (id: string) => Promise<LocalSos | null>;
  write: (id: string, record: LocalSos) => Promise<void>;
  list: () => Promise<LocalSos[]>;
  remove: (id: string) => void;
};
export function createSosWorkflow(
  storage: SosStorage,
  uuid: () => string,
  transmit: (body: SosBody) => Promise<SosReceipt>,
) {
  const inFlight = new Set<string>();
  async function saveSos(body: SosBody): Promise<LocalSos> {
    const error = validateSos(body);
    if (error) throw new Error(error);
    const entry: LocalSos = {
      localId: `sos-${uuid()}`,
      createdAt: new Date().toISOString(),
      phase: "pending",
      body: sosPayload(body),
    };
    await storage.write(entry.localId, entry);
    return entry;
  }
  async function sendSos(localId: string): Promise<LocalSos> {
    if (inFlight.has(localId))
      throw new Error("This request is already being sent.");
    inFlight.add(localId);
    try {
      const entry = await storage.read(localId);
      if (!entry || entry.phase !== "pending")
        throw new Error("Only a reviewed pending request can be sent.");
      const validation = validateSos(entry.body);
      if (validation) throw new Error(validation);
      // Persist uncertainty BEFORE network I/O, including termination between send and response.
      await storage.write(localId, { ...entry, phase: "uncertain" });
      let receipt: SosReceipt;
      try {
        receipt = await transmit(sosPayload(entry.body));
        if (!receipt?.id || !receipt.received_at)
          throw new Error("Server response did not confirm receipt.");
      } catch (error) {
        const phase = failurePhase(
          isAxiosError(error) ? error.response?.status : undefined,
        );
        if (phase === "pending")
          await storage.write(localId, { ...entry, phase });
        throw error;
      }
      const received: LocalSos = { ...entry, phase: "received", receipt };
      try {
        await storage.write(localId, received);
      } catch {
        throw new Error(
          `Server confirmed ${receipt.id}, but saving the local receipt failed. Note this ID. Do not resend this request.`,
        );
      }
      return received;
    } finally {
      inFlight.delete(localId);
    }
  }
  async function editPending(localId: string, body: SosBody) {
    if (inFlight.has(localId))
      throw new Error("Wait for the current submission to finish.");
    const entry = await storage.read(localId);
    if (!entry || entry.phase !== "pending")
      throw new Error("This request cannot be edited or retried.");
    const error = validateSos(body);
    if (error) throw new Error(error);
    await storage.write(localId, { ...entry, body: sosPayload(body) });
  }
  function deleteSos(localId: string) {
    if (inFlight.has(localId))
      throw new Error("Wait for submission to finish.");
    storage.remove(localId);
  }
  return { saveSos, sendSos, editPending, deleteSos, listSos: storage.list };
}
