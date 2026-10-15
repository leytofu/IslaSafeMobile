// Browser preview deliberately has no persistent credentials or emergency payloads.
const memory = new Map<string, unknown>();
export async function writeSecret(name: string, value: unknown) {
  memory.set(name, value);
}
export async function readSecret<T>(name: string): Promise<T | null> {
  return (memory.get(name) as T) || null;
}
export async function removeSecret(name: string) {
  memory.delete(name);
}
export function listSosIds() {
  return [...memory.keys()].filter((name) => name.startsWith("sos-"));
}
