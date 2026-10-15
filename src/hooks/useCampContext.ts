import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { campContext, type CampContext } from "../lib/camp";
import { errorMessage } from "../lib/api";
import { isAxiosError } from "axios";
import { useApp } from "../state/AppState";
export function useCampContext() {
  const { online, verified } = useApp();
  const [data, setData] = useState<CampContext | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const current = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (!online || !verified) { setLoading(false); setError("Reconnect to verify your center’s current registrations."); return; }
    current.current?.abort();
    const controller = new AbortController(); current.current = controller;
    try { const result = await campContext(controller.signal); if (!controller.signal.aborted) { setData(result); setError(""); } }
    catch (caught) { if (!controller.signal.aborted) { if (isAxiosError(caught) && [401, 403].includes(caught.response?.status ?? 0)) setData(null); setError(errorMessage(caught)); } }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [online, verified]);
  useFocusEffect(useCallback(() => {
    void refresh();
    const interval = setInterval(() => { if (AppState.currentState === "active") void refresh(); }, 20000);
    const listener = AppState.addEventListener("change", (state) => { if (state === "active") void refresh(); });
    return () => { clearInterval(interval); listener.remove(); current.current?.abort(); };
  }, [refresh]));
  return { data, error, loading, refresh };
}
