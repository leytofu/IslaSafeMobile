import {
  AESEncryptionKey,
  AESSealedData,
  aesEncryptAsync,
  aesDecryptAsync,
} from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";

const keyName = "islasafe.vault-key";
let keyTask: Promise<AESEncryptionKey> | undefined;
function key(): Promise<AESEncryptionKey> {
  if (!keyTask)
    keyTask = (async () => {
      const stored = await SecureStore.getItemAsync(keyName);
      if (stored) return AESEncryptionKey.import(stored, "hex");
      const next = await AESEncryptionKey.generate();
      await SecureStore.setItemAsync(keyName, await next.encoded("hex"));
      return next;
    })().catch((error) => {
      keyTask = undefined;
      throw error;
    });
  return keyTask;
}
function directory() {
  const dir = new Directory(Paths.document, "islasafe-vault");
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}
function file(name: string) {
  if (!/^[a-z0-9-]+$/.test(name))
    throw new Error("Invalid secure record name.");
  return new File(directory(), `${name}.bin`);
}
const writes = new Map<string, Promise<void>>();
export function writeSecret(name: string, value: unknown): Promise<void> {
  const previous = writes.get(name) || Promise.resolve();
  const next = previous.catch(() => {}).then(() => writeSecretNow(name, value));
  writes.set(name, next);
  void next
    .finally(() => {
      if (writes.get(name) === next) writes.delete(name);
    })
    .catch(() => {});
  return next;
}
async function writeSecretNow(name: string, value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  if (bytes.length > 65536) throw new Error("Secure record is too large.");
  const encrypted = await aesEncryptAsync(bytes, await key());
  const destination = file(name);
  const temporary = new File(directory(), `${name}.tmp`);
  temporary.create({ overwrite: true });
  await temporary.write(await encrypted.combined());
  // Read back and authenticate before replacing the previous record.
  await aesDecryptAsync(
    AESSealedData.fromCombined(await temporary.bytes()),
    await key(),
  );
  await temporary.move(destination, { overwrite: true });
}
export async function readSecret<T>(name: string): Promise<T | null> {
  await writes.get(name);
  const record = file(name);
  if (!record.exists) return null;
  // Missing key / damaged ciphertext raises an error; never silently discard an SOS.
  if (!(await SecureStore.getItemAsync(keyName)))
    throw new Error(
      "Secure storage key is unavailable. Stored details cannot be read.",
    );
  const bytes = await aesDecryptAsync(
    AESSealedData.fromCombined(await record.bytes()),
    await key(),
  );
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
export async function removeSecret(name: string) {
  // A late cache write must finish before logout removes the account record.
  await writes.get(name)?.catch(() => {});
  const record = file(name);
  if (record.exists) record.delete();
}
export function listSosIds() {
  return directory()
    .list()
    .filter(
      (item) => item.name.startsWith("sos-") && item.name.endsWith(".bin"),
    )
    .map((item) => item.name.slice(0, -4));
}
