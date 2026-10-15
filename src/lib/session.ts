import { supportedRole, type Role, type User } from "./contracts";

export const INTRO_SEEN_KEY = "islasafe.onboarding.v1";

export function dashboardFor(role: Role) {
  return role === "residents" ? "/resident/home" : "/camp/overview";
}

export function canEnterDashboard(user: User | null, verified: boolean) {
  return Boolean(verified && user && supportedRole(user.role));
}

/** Local cleanup and replay state finish before revocation starts on the network. */
export async function signOutSession(ports: {
  readToken: () => Promise<string | null>;
  invalidate: () => void;
  clearToken: () => Promise<void>;
  clearAccount: () => Promise<void>;
  queueIntro: () => Promise<void>;
  complete: () => void;
  revoke: (token: string) => Promise<unknown>;
  revokeFailed: (error: unknown) => void;
}) {
  const token = await ports.readToken();
  ports.invalidate();
  await ports.clearToken();
  await ports.clearAccount();
  await ports.queueIntro();
  ports.complete();
  if (token) void ports.revoke(token).catch(ports.revokeFailed);
}

/** A cached account is never sufficient to unlock a protected screen. */
export async function restoreSession(ports: {
  readToken: () => Promise<string | null>;
  activate: (token: string | null) => void;
  validate: () => Promise<User>;
  clear: () => Promise<void>;
  invalid: (error: unknown) => boolean;
}): Promise<
  | { status: "verified"; user: User }
  | { status: "signed-out" | "expired" | "unavailable"; user: null }
> {
  const token = await ports.readToken();
  if (!token) return { status: "signed-out", user: null };
  ports.activate(token);
  let user: User;
  try {
    user = await ports.validate();
  } catch (error) {
    if (ports.invalid(error)) {
      ports.activate(null);
      await ports.clear();
      return { status: "expired", user: null };
    }
    // Keep the token for a later retry, but do not expose the cached dashboard.
    return { status: "unavailable", user: null };
  }
  if (!supportedRole(user.role)) {
    ports.activate(null);
    await ports.clear();
    return { status: "expired", user: null };
  }
  return { status: "verified", user };
}
