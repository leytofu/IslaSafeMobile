export type Role = "residents" | "campmanager";
export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  contact_number?: string | null;
  office?: string | null;
  jurisdiction?: string | null;
  avatar_url?: string | null;
  has_local_password?: boolean;
  // Legacy backend identities still restrict email edits; no provider login is exposed.
  google_linked?: boolean;
  barangay?: string | null;
  address?: string | null;
  profile_complete?: boolean;
  resident_verified?: boolean;
};
export function supportedRole(role: unknown): role is Role {
  return role === "residents" || role === "campmanager";
}
export const categories = [
  "Medical",
  "Flood assistance",
  "Evacuation",
] as const;
export const priorities = ["Critical", "High", "Medium"] as const;
export type SosBody = {
  name: string;
  contact: string;
  location: string;
  latitude: number;
  longitude: number;
  type: string;
  category: (typeof categories)[number];
  priority: (typeof priorities)[number];
  description: string;
};
export type SosReceipt = SosBody & {
  id: string;
  status: "Pending" | "Coming" | "Resolved";
  received_at: string;
};
export type LocalSos = {
  localId: string;
  createdAt: string;
  phase: "pending" | "uncertain" | "received";
  body: SosBody;
  receipt?: SosReceipt;
};
export function validateSos(body: SosBody): string | null {
  for (const field of [
    "name",
    "contact",
    "location",
    "type",
    "description",
  ] as const) {
    const max = field === "contact" ? 32 : field === "description" ? 2000 : 255;
    if (!body[field].trim() || [...body[field]].length > max)
      return `${field}: required, maximum ${max} characters.`;
  }
  if (
    !Number.isFinite(body.latitude) ||
    Math.abs(body.latitude) > 90 ||
    !Number.isFinite(body.longitude) ||
    Math.abs(body.longitude) > 180
  )
    return "Enter valid latitude and longitude, or capture GPS coordinates.";
  if (
    !categories.includes(body.category) ||
    !priorities.includes(body.priority)
  )
    return "Choose a supported category and priority.";
  return null;
}
// Whitelist fields even when editing a stored receipt. Never transmit status or a local ID.
export function sosPayload(body: SosBody): SosBody {
  return {
    name: body.name.trim(),
    contact: body.contact.trim(),
    location: body.location.trim(),
    latitude: body.latitude,
    longitude: body.longitude,
    type: body.type.trim(),
    category: body.category,
    priority: body.priority,
    description: body.description.trim(),
  };
}
export function failurePhase(httpStatus?: number): "pending" | "uncertain" {
  // Laravel validation and rate-limiting happen before creation. Other failures may follow a committed write.
  return httpStatus === 422 || httpStatus === 429 ? "pending" : "uncertain";
}
