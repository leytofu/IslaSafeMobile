import { test } from "node:test";
import assert from "node:assert/strict";
import { createSosWorkflow, SosStorage } from "../src/lib/sos-workflow";
import { LocalSos, SosBody, SosReceipt } from "../src/lib/contracts";
const body: SosBody = {
  name: "DEMO ONLY",
  contact: "00000000000",
  location: "Known landmark",
  latitude: 10.109,
  longitude: 124.562,
  type: "TEST",
  category: "Medical",
  priority: "High",
  description: "No real emergency. Unit test only.",
};
function fixture() {
  const records = new Map<string, LocalSos>();
  const storage: SosStorage = {
    read: async (id) => records.get(id) || null,
    write: async (id, record) => {
      records.set(id, structuredClone(record));
    },
    list: async () => [...records.values()],
    remove: (id) => {
      records.delete(id);
    },
  };
  return { storage, records };
}
test("submission waits for durable uncertainty and returns a receipt only after confirmation", async () => {
  const { storage, records } = fixture();
  let count = 0;
  const workflow = createSosWorkflow(
    storage,
    () => "1",
    async (payload) => {
      count++;
      assert.equal(records.get("sos-1")?.phase, "uncertain");
      assert.equal("status" in payload, false);
      return {
        ...payload,
        id: "TEST-1",
        status: "Pending",
        received_at: "2026-10-14T00:00:00Z",
      };
    },
  );
  const draft = await workflow.saveSos(body);
  assert.equal(count, 0);
  await workflow.sendSos(draft.localId);
  assert.equal(records.get(draft.localId)?.phase, "received");
  await assert.rejects(workflow.sendSos(draft.localId));
  assert.equal(count, 1);
});
test("failed secure persistence prevents sending", async () => {
  const { storage } = fixture();
  let count = 0;
  const workflow = createSosWorkflow(
    storage,
    () => "2",
    async (payload) => {
      count++;
      return payload as SosReceipt;
    },
  );
  const entry = await workflow.saveSos(body);
  storage.write = async () => {
    throw new Error("Storage full");
  };
  await assert.rejects(workflow.sendSos(entry.localId), /Storage full/);
  assert.equal(count, 0);
});
test("interrupted request survives workflow restart as uncertain and cannot retry", async () => {
  const { storage, records } = fixture();
  let count = 0;
  const send = async () => {
    count++;
    throw new Error("Network interrupted");
  };
  const workflow = createSosWorkflow(storage, () => "3", send);
  const entry = await workflow.saveSos(body);
  await assert.rejects(workflow.sendSos(entry.localId));
  assert.equal(records.get(entry.localId)?.phase, "uncertain");
  const restarted = createSosWorkflow(storage, () => "4", send);
  await assert.rejects(restarted.sendSos(entry.localId), /reviewed pending/);
  assert.equal(count, 1);
});
test("rapid double-send is blocked and deleting an in-flight request is refused", async () => {
  const { storage } = fixture();
  let finish!: (receipt: SosReceipt) => void;
  let count = 0;
  const workflow = createSosWorkflow(
    storage,
    () => "5",
    async () => {
      count++;
      return new Promise<SosReceipt>((resolve) => {
        finish = resolve;
      });
    },
  );
  const entry = await workflow.saveSos(body);
  const first = workflow.sendSos(entry.localId);
  await assert.rejects(workflow.sendSos(entry.localId), /already being sent/);
  assert.throws(() => workflow.deleteSos(entry.localId), /submission/);
  await new Promise((resolve) => setImmediate(resolve));
  finish({
    ...body,
    id: "TEST-5",
    status: "Pending",
    received_at: "2026-10-14T00:00:00Z",
  });
  await first;
  assert.equal(count, 1);
});
test("confirmed server receipt with failed local save remains uncertain and gives the server ID", async () => {
  const { storage, records } = fixture();
  const original = storage.write;
  storage.write = async (id, record) => {
    if (record.phase === "received") throw new Error("Disk full");
    await original(id, record);
  };
  const workflow = createSosWorkflow(
    storage,
    () => "6",
    async () => ({
      ...body,
      id: "TEST-6",
      status: "Pending",
      received_at: "2026-10-14T00:00:00Z",
    }),
  );
  const entry = await workflow.saveSos(body);
  await assert.rejects(
    workflow.sendSos(entry.localId),
    /Server confirmed TEST-6/,
  );
  assert.equal(records.get(entry.localId)?.phase, "uncertain");
});
