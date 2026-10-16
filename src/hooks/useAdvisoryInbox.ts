import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { api, errorMessage } from "../lib/api";
import { useApp } from "../state/AppState";

export type InboxAdvisory = {
  id: number; title: string; message: string; priority: "Critical" | "Warning" | "Info";
  target: string; published_at: string; version: string; is_read: boolean;
};

export function useAdvisoryInbox() {
  const { user, verified, online } = useApp();
  const userId = verified ? user?.id : undefined;
  const [state, setState] = useState<{ userId?: number; items: InboxAdvisory[]; loaded: boolean; error: string }>({ items: [], loaded: false, error: "" });
  const [revision, setRevision] = useState(0);
  const [reading, setReading] = useState<number | null>(null);
  const currentUser = useRef(userId);
  const readLock = useRef(false);
  currentUser.current = userId;
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!userId || !online) return;
    let live = true;
    let pending = false;
    async function load() {
      if (pending || AppState.currentState === "background") return;
      pending = true;
      try {
        const response = await api.get<{ data: InboxAdvisory[] }>("/advisories");
        if (live) setState({ userId, items: response.data.data, loaded: true, error: "" });
      } catch (error) {
        if (live) setState(previous => ({ userId, items: previous.userId === userId ? previous.items : [], loaded: true, error: errorMessage(error) }));
      } finally { pending = false; }
    }
    void load();
    const timer = setInterval(() => void load(), 30000);
    const subscription = AppState.addEventListener("change", value => { if (value === "active") void load(); });
    return () => { live = false; clearInterval(timer); subscription.remove(); };
  }, [userId, online, revision]);

  async function markRead(item: InboxAdvisory) {
    if (readLock.current || !userId || !online) return;
    const owner = userId;
    readLock.current = true; setReading(item.id);
    try {
      await api.post(`/advisories/${item.id}/read`, { version: item.version });
      if (currentUser.current === owner) { refresh(); }
    } catch (error) {
      if (currentUser.current === owner) setState(previous => ({ ...previous, error: errorMessage(error) }));
    } finally { readLock.current = false; setReading(null); }
  }
  const current = state.userId === userId && userId ? state : { items: [], loaded: false, error: "" };
  return { ...current, online, verified, refresh, markRead, reading, unread: current.items.filter(item => !item.is_read).length };
}
