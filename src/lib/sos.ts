import { randomUUID } from "expo-crypto";
import { publicApi } from "./api";
import { LocalSos, SosReceipt } from "./contracts";
import { createSosWorkflow } from "./sos-workflow";
import { listSosIds, readSecret, removeSecret, writeSecret } from "./vault";
const workflow = createSosWorkflow(
  {
    read: (id) => readSecret<LocalSos>(id),
    write: writeSecret,
    remove: removeSecret,
    list: async () => {
      const records = await Promise.all(
        listSosIds().map((id) => readSecret<LocalSos>(id)),
      );
      return records
        .filter((item): item is LocalSos => !!item)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  },
  randomUUID,
  async (body) => {
    const response = await publicApi.post<{ data: SosReceipt }>(
      "/sos-requests",
      body,
    );
    if (response.status !== 201)
      throw new Error("Server response did not confirm receipt.");
    return response.data.data;
  },
);
export const { saveSos, sendSos, editPending, deleteSos, listSos } = workflow;
