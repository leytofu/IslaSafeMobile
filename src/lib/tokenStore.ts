type Storage = {
  read: () => Promise<string | null>;
  write: (token: string) => Promise<void>;
  remove: () => Promise<void>;
};

/** Only remembered tokens survive a new app process. Never stores passwords. */
export function createTokenStore(storage: Storage) {
  let current: string | null = null;
  return {
    async readToken() {
      return current ?? storage.read();
    },
    async saveToken(token: string, remember = true) {
      if (new TextEncoder().encode(token).length > 1800)
        throw new Error("Authentication token exceeds the secure storage budget.");
      if (remember) await storage.write(token);
      else await storage.remove();
      current = token;
    },
    async clearToken() {
      await storage.remove();
      current = null;
    },
  };
}
